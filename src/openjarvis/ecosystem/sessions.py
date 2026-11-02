"""SessionsSource — catálogo devmode-sessions somente leitura (F360-08).

GET /api/v1/devmode/projects + /api/v1/devmode/sessions?limit=N via
DEVMODE_SESSIONS_URL + DEVMODE_SESSIONS_API_KEY (x-api-key) ou JWT.
Catálogo não é atividade: existência de sessão não implica execução.
Projeção minimizada: ids/título/status/data — sem paths nem transcripts.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import httpx

TIMEOUT_S = float(os.getenv("DEVMODE_SESSIONS_TIMEOUT_S", "8"))
SESSION_LIMIT = int(os.getenv("DEVMODE_SESSIONS_LIMIT", "50"))


def _stamp(status: str, **kw) -> dict:
    base = {"status": status, "observedAt": None, "generatedAt": None,
            "version": None, "coverage": []}
    base.update(kw)
    return base


def _configured() -> tuple[str, dict[str, str]] | None:
    url = os.getenv("DEVMODE_SESSIONS_URL", "").strip()
    if not url:
        return None
    headers: dict[str, str] = {}
    key = os.getenv("DEVMODE_SESSIONS_API_KEY", "").strip()
    if key:
        headers["x-api-key"] = key
    bearer = os.getenv("DEVMODE_SESSIONS_JWT", "").strip()
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    return url.rstrip("/"), headers


def _items(payload: Any) -> list:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "sessions", "projects", "data"):
            if isinstance(payload.get(key), list):
                return payload[key]
    return []


async def sessions_snapshot() -> dict:
    """Retorna {stamp, sessions}."""
    now = datetime.now(timezone.utc).isoformat()
    cfg = _configured()
    if cfg is None:
        return {"stamp": _stamp("unavailable", reason="unconfigured"),
                "sessions": []}
    base, headers = cfg
    try:
        async with httpx.AsyncClient() as client:
            r_sessions = await client.get(
                f"{base}/api/v1/devmode/sessions",
                params={"limit": SESSION_LIMIT}, headers=headers, timeout=TIMEOUT_S)
            if r_sessions.status_code in (401, 403):
                return {"stamp": _stamp("unauthorized", observedAt=now), "sessions": []}
            r_sessions.raise_for_status()
            raw_sessions = _items(r_sessions.json())
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            return {"stamp": _stamp("unauthorized", observedAt=now), "sessions": []}
        return {"stamp": _stamp("unavailable", reason="unreachable",
                                observedAt=now), "sessions": []}
    except Exception:
        return {"stamp": _stamp("unavailable", reason="unreachable",
                                observedAt=now), "sessions": []}

    sessions = [{
        "id": str(s.get("id") or s.get("session_id") or "")[:80],
        "projectId": s.get("project_id") or s.get("projectId"),
        "workspaceId": s.get("workspace_id") or s.get("workspaceId"),
        "title": (s.get("title") or "")[:160] or None,
        "status": str(s.get("status", "unknown"))[:24],
        "updatedAt": s.get("updated_at") or s.get("updatedAt"),
    } for s in raw_sessions if isinstance(s, dict)]
    sessions = [s for s in sessions if s["id"]]
    stamp = _stamp("ready", observedAt=now, generatedAt=now,
                   version=f"n={len(sessions)}", coverage=["sessions"])
    return {"stamp": stamp, "sessions": sessions[:SESSION_LIMIT]}
