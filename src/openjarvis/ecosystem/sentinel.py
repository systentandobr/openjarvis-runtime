"""IntegritySource — findings do Sentinel MCP privado (F360-07).

Bridge autorizada server-side: SENTINEL_MCP_URL + SENTINEL_MCP_API_KEY
(x-api-key) ou SENTINEL_MCP_BEARER (JWT). GET nunca dispara run_audit
nem sync_backlog — apenas leitura de health/latest_report/list_findings.

Sem relatório persistido → 'unavailable' reason 'no_report' = Não verificado.
Credencial ausente → 'unavailable' reason 'unconfigured'.
401/403 → 'unauthorized'. Relatório antigo → 'stale'.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import httpx

from .registry import service_for_repo

TIMEOUT_S = float(os.getenv("SENTINEL_TIMEOUT_S", "8"))
STALE_S = float(os.getenv("SENTINEL_REPORT_STALE_S", str(48 * 3600)))
MAX_FINDINGS = 100


def _stamp(status: str, **kw) -> dict:
    base = {"status": status, "observedAt": None, "generatedAt": None,
            "version": None, "coverage": []}
    base.update(kw)
    return base


def _configured() -> tuple[str, dict[str, str]] | None:
    url = os.getenv("SENTINEL_MCP_URL", "").strip()
    if not url:
        return None
    headers: dict[str, str] = {"Content-Type": "application/json",
                               "Accept": "application/json, text/event-stream"}
    key = os.getenv("SENTINEL_MCP_API_KEY", "").strip()
    if key:
        headers["x-api-key"] = key
    bearer = os.getenv("SENTINEL_MCP_BEARER", "").strip()
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    return url.rstrip("/"), headers


async def _call(client: httpx.AsyncClient, url: str, headers: dict,
                tool: str, args: dict) -> Any:
    body = {"jsonrpc": "2.0", "id": tool,
            "method": "tools/call",
            "params": {"name": tool, "arguments": args}}
    resp = await client.post(url, json=body, headers=headers, timeout=TIMEOUT_S)
    if resp.status_code in (401, 403):
        raise PermissionError(resp.status_code)
    resp.raise_for_status()
    text = resp.text
    if "data:" in text and resp.headers.get("content-type", "").startswith("text/event-stream"):
        text = "\n".join(l[5:] for l in text.splitlines() if l.startswith("data:"))
    data = json.loads(text)
    if data.get("error"):
        raise RuntimeError(str(data["error"])[:200])
    result = data.get("result") or {}
    contents = result.get("content") or []
    if contents and isinstance(contents[0], dict) and contents[0].get("text"):
        return json.loads(contents[0]["text"])
    return result


def _map_finding(f: dict, audit_id: str, observed: str | None) -> dict:
    repo = f.get("repo") or ""
    fid = f.get("id") or f"{f.get('check','')}:{repo}:{(f.get('file') or '')[:40]}"
    return {
        "id": str(fid)[:120],
        "serviceId": service_for_repo(repo),
        "check": str(f.get("check", "unknown"))[:80],
        "severity": str(f.get("severity", "info"))[:16],
        "status": "open",
        "observedAt": observed,
        "auditId": str(audit_id)[:80],
        "evidenceRef": None,  # nunca path/segredo — evidência é autorizada à parte
    }


async def integrity_snapshot() -> dict:
    """Retorna {stamp, findings}."""
    now = datetime.now(timezone.utc).isoformat()
    cfg = _configured()
    if cfg is None:
        return {"stamp": _stamp("unavailable", reason="unconfigured"),
                "findings": []}
    url, headers = cfg
    try:
        async with httpx.AsyncClient() as client:
            report = await _call(client, url, headers, "sentinel_latest_report", {})
    except PermissionError:
        return {"stamp": _stamp("unauthorized", observedAt=now), "findings": []}
    except Exception:
        return {"stamp": _stamp("unavailable", reason="unreachable",
                                observedAt=now), "findings": []}

    if not isinstance(report, dict) or report.get("error"):
        return {"stamp": _stamp("unavailable", reason="no_report",
                                observedAt=now), "findings": []}

    generated = report.get("generated")
    audits = [a.get("audit", "") for a in report.get("audits", []) if isinstance(a, dict)]
    coverage = sorted({f.get("repo") for f in report.get("findings", [])
                       if f.get("repo")}) or audits
    stale = False
    if generated:
        try:
            gen_dt = datetime.fromisoformat(str(generated).replace("Z", "+00:00"))
            if gen_dt.tzinfo is None:
                gen_dt = gen_dt.replace(tzinfo=timezone.utc)
            stale = (datetime.now(timezone.utc) - gen_dt).total_seconds() > STALE_S
        except ValueError:
            pass
    audit_id = str(report.get("_id") or generated or "latest")
    findings = [_map_finding(f, audit_id, generated)
                for f in (report.get("findings") or [])[:MAX_FINDINGS]]
    stamp = _stamp("stale" if stale else "ready", observedAt=now,
                   generatedAt=generated, version=audit_id, coverage=coverage[:40])
    return {"stamp": stamp, "findings": findings}
