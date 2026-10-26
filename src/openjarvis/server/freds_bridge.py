"""Opt-in single-workspace WS bridge. Upstream credentials stay server-side."""
from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from fastapi import APIRouter, WebSocket
from openjarvis.server.auth_middleware import authenticate_websocket

logger = logging.getLogger(__name__)
router = APIRouter()


def _load_dotenv() -> None:
    if os.environ.get("PYTEST_CURRENT_TEST"):
        return
    for p in (Path(".env"), Path(__file__).resolve().parents[3] / ".env", Path(__file__).resolve().parents[4] / ".env"):
        if p.is_file():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, _, v = line.partition("=")
                    k, v = k.strip(), v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
            except Exception:
                pass


def upstream_url() -> str | None:
    # Full WS route, e.g. wss://api.example/ws/<unit>?is_admin=true.
    # Never accept an upstream URL/token or unit override from the browser.
    _load_dotenv()
    base = os.getenv("FREDS_SUPERVISION_WS_URL", "")
    token = os.getenv("FREDS_SUPERVISION_DEVICE_TOKEN", "")
    if not base or not token:
        return None
    parts = urlsplit(base)
    if parts.scheme not in ("ws", "wss") or not parts.hostname:
        return None
    if parts.scheme == "ws" and parts.hostname not in ("127.0.0.1", "localhost", "::1"):
        return None
    query = dict(parse_qsl(parts.query))
    # This connection is an observer, never an executor/orchestration target.
    query.pop("orchestration_enabled", None)
    query["token"] = token
    query["is_admin"] = "true"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), ""))


def cancellation_frame(data: dict) -> dict | None:
    if data.get("type") != "execution:cancel":
        return None
    keys = ("execution_id", "agent_id", "session_id", "request_id")
    if not all(isinstance(data.get(k), str) and 0 < len(data[k]) <= 256 for k in keys):
        return None
    return {"type": "execution:cancel", **{key: data[key] for key in keys}}


def allowed_client_frame(data: dict) -> dict | None:
    if data.get("type") == "execution:snapshot_request":
        return {"type": "execution:snapshot_request"}
    return cancellation_frame(data)



@router.websocket("/v1/systentando/events")
async def freds_events(websocket: WebSocket):
    expected = getattr(websocket.app.state, "api_key", "")
    authorized, protocol = authenticate_websocket(websocket, expected)
    # A configured private upstream must not be exposed by a keyless Jarvis.
    if not expected or not authorized:
        await websocket.close(code=1008)
        return
    await websocket.accept(subprotocol=protocol)
    url = upstream_url()
    if not url:
        await websocket.send_json({"type": "supervision:status", "status": "unconfigured"})
        await websocket.close(code=1000)
        return
    await websocket.send_json({"type": "supervision:status", "status": "connecting"})
    try:
        from websockets.asyncio.client import connect
        async with connect(url, max_size=1024 * 1024, open_timeout=45) as upstream:
            await websocket.send_json({"type": "supervision:status", "status": "connected"})
            # Request initial active runs snapshot immediately upon connecting
            try:
                await upstream.send(json.dumps({"type": "execution:snapshot_request"}))
            except Exception:
                pass

            async def observe():
                async for text in upstream:
                    try:
                        frame = json.loads(text)
                    except (ValueError, TypeError):
                        continue
                    ftype = frame.get("type")
                    if ftype == "ping":
                        try:
                            await upstream.send(json.dumps({"type": "pong"}))
                        except Exception:
                            pass
                        continue
                    logger.info("Freds bridge received frame: type=%s", ftype)
                    if ftype in ("execution:event", "execution:cancel_result", "execution:snapshot"):
                        await websocket.send_json(frame)

            async def control():
                while True:
                    frame = allowed_client_frame(await websocket.receive_json())
                    if frame:
                        await upstream.send(json.dumps(frame))


            tasks = [asyncio.create_task(observe()), asyncio.create_task(control())]
            try:
                await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            finally:
                for task in tasks:
                    task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
    except Exception:
        # Don't return/log exception URLs: they contain the upstream token.
        try:
            await websocket.send_json({"type": "supervision:status", "status": "disconnected"})
            await websocket.close(code=1011)
        except Exception:
            pass
