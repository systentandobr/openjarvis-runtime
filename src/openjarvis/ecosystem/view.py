"""Composição do snapshot 360° — fontes independentes (F360-08).

Cada fonte falha isoladamente: grafo ausente não bloqueia atividade,
Sentinel fora não derruba sessões. Stamps tipados por fonte; snapshot
vazio é válido e não inventa nós nem eventos.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from . import graphify, sentinel, sessions
from .registry import AGENT_SERVICES


def _activity_stamp() -> dict:
    """A fonte 'activity' real flui pela WS de supervisão; aqui reportamos
    apenas se o upstream está configurado server-side."""
    try:
        from openjarvis.server.freds_bridge import upstream_url
        configured = upstream_url() is not None
    except Exception:
        configured = False
    return {
        "status": "ready" if configured else "unavailable",
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "generatedAt": None,
        "version": None,
        "coverage": ["ws-supervision"] if configured else [],
        **({} if configured else {"reason": "unconfigured"}),
    }


async def build_snapshot() -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()

    try:
        graph = graphify.graph_snapshot()
    except Exception:
        graph = {"stamp": {"status": "unavailable", "observedAt": None,
                           "generatedAt": None, "version": None,
                           "coverage": [], "reason": "error"},
                 "nodes": [], "relations": []}
    try:
        integrity = await sentinel.integrity_snapshot()
    except Exception:
        integrity = {"stamp": {"status": "unavailable", "observedAt": None,
                               "generatedAt": None, "version": None,
                               "coverage": [], "reason": "error"},
                     "findings": []}
    try:
        catalog = await sessions.sessions_snapshot()
    except Exception:
        catalog = {"stamp": {"status": "unavailable", "observedAt": None,
                             "generatedAt": None, "version": None,
                             "coverage": [], "reason": "error"},
                   "sessions": []}

    warnings = [
        f"{name}:{(src['stamp'].get('reason') or src['stamp']['status'])}"
        for name, src in (("graph", graph), ("integrity", integrity),
                          ("sessions", catalog))
        if src["stamp"]["status"] != "ready"
    ]

    fingerprint_src = json.dumps(
        {"g": graph["stamp"].get("version"),
         "i": integrity["stamp"].get("generatedAt"),
         "s": len(catalog["sessions"]),
         "n": len(graph["nodes"])},
        sort_keys=True)
    snapshot_id = hashlib.sha256(fingerprint_src.encode()).hexdigest()[:16]

    return {
        "schemaVersion": 1,
        "snapshotId": snapshot_id,
        "serverTime": now,
        "sources": {
            "graph": graph["stamp"],
            "activity": _activity_stamp(),
            "integrity": integrity["stamp"],
            "sessions": catalog["stamp"],
        },
        "nodes": graph["nodes"],
        "relations": graph["relations"],
        "executions": [],  # atividade real chega pela WS de supervisão
        "findings": integrity["findings"],
        "sessions": catalog["sessions"],
        "registry": {"agentServices": AGENT_SERVICES},
        "warnings": warnings,
    }
