"""F360-05/07/08 — projeção /v1/ecosystem: stamps tipados, fontes
independentes, nunca fallback fictício nem GET que dispara auditoria."""
from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from openjarvis.ecosystem import view
from openjarvis.server.ecosystem_router import router


def _app() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def _unavailable(reason: str):
    return {"status": "unavailable", "observedAt": None, "generatedAt": None,
            "version": None, "coverage": [], "reason": reason}


def test_snapshot_shape_and_independent_sources(monkeypatch):
    monkeypatch.delenv("SENTINEL_MCP_URL", raising=False)
    monkeypatch.delenv("DEVMODE_SESSIONS_URL", raising=False)
    monkeypatch.delenv("FREDS_SUPERVISION_WS_URL", raising=False)
    monkeypatch.delenv("FREDS_SUPERVISION_DEVICE_TOKEN", raising=False)
    monkeypatch.setattr(view.graphify, "graph_snapshot", lambda: {
        "stamp": {"status": "ready", "observedAt": "t", "generatedAt": "g",
                  "version": "v", "coverage": ["graphify"]},
        "nodes": [{"id": "svc", "label": "Svc", "kind": "service",
                   "capabilities": [], "sourceRefs": ["registry"]}],
        "relations": []})
    monkeypatch.setattr(view.sentinel, "integrity_snapshot", lambda: _async({
        "stamp": _unavailable("unreachable"), "findings": []}))
    monkeypatch.setattr(view.sessions, "sessions_snapshot", lambda: _async({
        "stamp": _unavailable("unconfigured"), "sessions": []}))
    import asyncio
    snap = asyncio.run(view.build_snapshot())
    assert snap["schemaVersion"] == 1
    assert snap["sources"]["graph"]["status"] == "ready"
    assert snap["sources"]["integrity"]["status"] == "unavailable"
    assert snap["sources"]["sessions"]["reason"] == "unconfigured"
    # Grafo disponível mesmo com Sentinel/sessions fora — fontes isoladas
    assert snap["nodes"] and snap["nodes"][0]["id"] == "svc"
    # Atividade nunca vem de fixtures: executions vazio é honesto
    assert snap["executions"] == []


def _async(value):
    async def _coro():
        return value
    return _coro()


def test_endpoints_return_projection(monkeypatch):
    client = _app()
    r = client.get("/v1/ecosystem/snapshot")
    assert r.status_code == 200
    body = r.json()
    assert body["schemaVersion"] == 1
    for key in ("graph", "activity", "integrity", "sessions"):
        assert body["sources"][key]["status"] in (
            "loading", "ready", "stale", "unavailable", "unauthorized")
    assert "ETag" in r.headers

    r2 = client.get("/v1/ecosystem/findings")
    assert r2.status_code == 200
    assert isinstance(r2.json()["findings"], list)
    assert r2.json()["stamp"]["status"] in ("unavailable", "unauthorized", "ready", "stale")


def test_graph_projection_caps_and_kinds(monkeypatch, tmp_path):
    import json
    payload = {"nodes": [], "links": [], "repositories": [f"repo-{i}" for i in range(200)]}
    f = tmp_path / "payload.json"
    f.write_text(__import__("json").dumps(payload))
    monkeypatch.setenv("ECOSYSTEM_GRAPH_PATH", str(f))
    monkeypatch.delenv("ECOSYSTEM_DEPS_PATH", raising=False)
    from openjarvis.ecosystem import graphify
    result = graphify.graph_snapshot()
    kinds = {n["kind"] for n in result["nodes"]}
    assert kinds <= {"service", "repository"}
    assert len(result["nodes"]) <= 80
    assert all("source_file" not in n and "sourceRefs" in n for n in result["nodes"])
    assert result["stamp"]["status"] in ("ready", "stale")


def test_sentinel_unconfigured_is_not_conforme(monkeypatch):
    monkeypatch.delenv("SENTINEL_MCP_URL", raising=False)
    import asyncio
    from openjarvis.ecosystem import sentinel
    result = asyncio.run(sentinel.integrity_snapshot())
    # Sem fonte: 'unavailable' — nunca 'ready' nem findings inventados
    assert result["stamp"]["status"] == "unavailable"
    assert result["stamp"]["reason"] == "unconfigured"
    assert result["findings"] == []


def test_sessions_unconfigured(monkeypatch):
    monkeypatch.delenv("DEVMODE_SESSIONS_URL", raising=False)
    import asyncio
    from openjarvis.ecosystem import sessions
    result = asyncio.run(sessions.sessions_snapshot())
    assert result["stamp"]["status"] == "unavailable"
    assert result["sessions"] == []
