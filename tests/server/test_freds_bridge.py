from openjarvis.server.freds_bridge import cancellation_frame, upstream_url


def test_control_frame_whitelists_exact_run_scope():
    data = dict(type="execution:cancel", execution_id="r", agent_id="a", session_id="s", request_id="q", unit_id="victim", command="execute")
    assert cancellation_frame(data) == {k: data[k] for k in ("type", "execution_id", "agent_id", "session_id", "request_id")}
    assert cancellation_frame({"type":"dispatch_to_agent"}) is None
    assert cancellation_frame({**data,"session_id":""}) is None


def test_upstream_requires_server_credentials_and_secure_transport(monkeypatch):
    monkeypatch.delenv("FREDS_SUPERVISION_DEVICE_TOKEN", raising=False)
    monkeypatch.setenv("FREDS_SUPERVISION_WS_URL","wss://example.test/ws/unit")
    assert upstream_url() is None
    monkeypatch.setenv("FREDS_SUPERVISION_DEVICE_TOKEN","server-secret")
    assert "server-secret" in upstream_url()
    monkeypatch.setenv("FREDS_SUPERVISION_WS_URL","ws://example.test/ws/unit")
    assert upstream_url() is None
    monkeypatch.setenv("FREDS_SUPERVISION_WS_URL","ws://localhost/ws/unit?orchestration_enabled=true")
    assert "orchestration_enabled" not in upstream_url()
