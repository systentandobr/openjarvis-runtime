from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
import pytest
from openjarvis.server.freds_bridge import router


def app(key):
    instance = FastAPI()
    instance.state.api_key = key
    instance.include_router(router)
    return instance


def test_bridge_rejects_keyless_and_invalid_clients():
    for key in ("", "private-key"):
        with TestClient(app(key)) as client:
            with pytest.raises(WebSocketDisconnect):
                with client.websocket_connect("/v1/systentando/events"):
                    pass


def test_unconfigured_bridge_returns_no_credentials(monkeypatch):
    monkeypatch.delenv("FREDS_SUPERVISION_WS_URL", raising=False)
    monkeypatch.delenv("FREDS_SUPERVISION_DEVICE_TOKEN", raising=False)
    with TestClient(app("private-key")) as client:
        with client.websocket_connect("/v1/systentando/events", headers={"Authorization":"Bearer private-key"}) as socket:
            assert socket.receive_json() == {"type":"supervision:status", "status":"unconfigured"}
