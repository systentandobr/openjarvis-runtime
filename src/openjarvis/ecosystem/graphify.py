"""GraphSource — projeção browser-safe do Graphify (F360-05).

Lê o payload reduzido (ecosystem-payload.json + cross-repo-deps.json);
nunca envia merged-graph bruto nem caminhos privados ao browser.
Versão = mtime+size do arquivo; stale quando acima de GRAPH_STALE_S.
Cache por mtime — nenhuma regeneração de grafo em GET.
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .registry import SERVICES

GRAPH_STALE_S = int(os.getenv("ECOSYSTEM_GRAPH_STALE_S", str(7 * 86400)))
MAX_NODES = 80
MAX_RELATIONS = 160

_cache: dict[str, Any] = {"payload_key": None, "deps_key": None,
            "payload": None, "deps": None}


def _resolve(env: str, names: list[str]) -> Path | None:
    configured = os.getenv(env)
    if configured:
        p = Path(configured)
        return p if p.is_file() else None
    here = Path(__file__).resolve()
    for parent in here.parents[:8]:
        for name in names:
            c = parent / name
            if c.is_file():
                return c
    return None


def _load(path: Path, slot: str) -> dict | None:
    st = path.stat()
    key = (str(path), st.st_mtime_ns, st.st_size)
    if _cache.get(f"{slot}_key") == key and _cache.get(slot) is not None:
        return _cache[slot]
    data = json.loads(path.read_text(encoding="utf-8"))
    _cache[f"{slot}_key"] = key
    _cache[slot] = data
    return data


def _stamp(status: str, **kw) -> dict:
    base = {"status": status, "observedAt": None, "generatedAt": None,
            "version": None, "coverage": []}
    base.update(kw)
    return base


def graph_snapshot() -> dict:
    """Retorna {stamp, nodes, relations} para o overview agregado."""
    now = datetime.now(timezone.utc).isoformat()
    payload_path = _resolve("ECOSYSTEM_GRAPH_PATH",
                            ["graphify-out-merged/ecosystem-payload.json"])
    if payload_path is None:
        return {"stamp": _stamp("unavailable", reason="unconfigured"),
                "nodes": [], "relations": []}
    try:
        st = payload_path.stat()
        mtime = datetime.fromtimestamp(st.st_mtime, timezone.utc)
        version = hashlib.sha256(f"{st.st_mtime_ns}:{st.st_size}".encode()).hexdigest()[:16]
        data = _load(payload_path, "payload")
    except Exception:
        return {"stamp": _stamp("unavailable", reason="unreadable"),
                "nodes": [], "relations": []}

    age = (datetime.now(timezone.utc) - mtime).total_seconds()
    status = "stale" if age > GRAPH_STALE_S else "ready"
    stamp = _stamp(status, observedAt=now, generatedAt=mtime.isoformat(),
                   version=version, coverage=["graphify"])

    nodes, relations = [], []
    seen: set[str] = set()

    # 1 nó 'service' por serviço do registry — existência ≠ disponibilidade
    for sid, meta in SERVICES.items():
        nodes.append({"id": sid, "label": meta["label"], "kind": "service",
                      "capabilities": [meta["orbit"]],
                      "sourceRefs": ["registry"]})
        seen.add(sid)

    # 1 nó 'repository' por repo agregado do payload Graphify
    repos = sorted(set(data.get("repositories") or
                       {n.get("repo") for n in data.get("nodes", []) if n.get("repo")}))
    for repo in repos:
        rid = f"repo:{repo}"
        if rid in seen or len(nodes) >= MAX_NODES:
            continue
        nodes.append({"id": rid, "label": repo, "kind": "repository",
                      "capabilities": [], "sourceRefs": ["graphify"]})
        seen.add(rid)

    # Relações service→repo (registry) + repo→repo (cross-repo-deps)
    deps_path = _resolve("ECOSYSTEM_DEPS_PATH",
                         ["graphify-out-merged/cross-repo-deps.json"])
    service_repo = {sid: m["repo"] for sid, m in SERVICES.items() if m["repo"]}
    for sid, repo in service_repo.items():
        target = f"repo:{repo}"
        if target in seen:
            relations.append({"id": f"reg:{sid}->{target}", "source": sid,
                              "target": target, "kind": "hosted_in",
                              "origin": "registry", "verifiedAt": None})
    if deps_path is not None:
        try:
            deps = _load(deps_path, "deps")
            seen_edges: set[tuple] = set()
            for dep in (deps.get("declared_deps") or []) + (deps.get("service_urls") or []):
                if len(relations) >= MAX_RELATIONS:
                    break
                src_repo, tgt_repo = dep.get("from_repo"), dep.get("to_repo")
                s, t = f"repo:{src_repo}", f"repo:{tgt_repo}"
                edge = (s, t)
                if edge in seen_edges:
                    continue
                if src_repo and tgt_repo and s in seen and t in seen and s != t:
                    seen_edges.add(edge)
                    relations.append({"id": f"dep:{s}->{t}:{dep.get('package', dep.get('url', ''))[:40]}",
                                      "source": s, "target": t,
                                      "kind": dep.get("type", "depends"),
                                      "origin": "graphify",
                                      "verifiedAt": mtime.isoformat()})
        except Exception:
            pass

    return {"stamp": stamp, "nodes": nodes[:MAX_NODES],
            "relations": relations[:MAX_RELATIONS]}
