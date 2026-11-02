"""Rotas read-only da projeção 360° (F360-05/07/08).

Autenticação já aplicada pelo AuthMiddleware em /v1/*.
GET nunca dispara auditoria, regenera grafo nem muta upstream.
"""
from __future__ import annotations

import asyncio
import os

from fastapi import APIRouter, Request, Response

from openjarvis.ecosystem import view
from openjarvis.ecosystem.sentinel import integrity_snapshot

router = APIRouter()

_ETAG_TTL_S = float(os.getenv("ECOSYSTEM_SNAPSHOT_TTL_S", "15"))
_cache: dict = {"at": 0.0, "body": None}


@router.get("/v1/ecosystem/snapshot")
async def ecosystem_snapshot(request: Request, response: Response):
    """Projeção autorizada/versionada: nós, relações, findings, sessões e
    stamps por fonte. ETag leve; refresh sugerido 60s no cliente."""
    now = asyncio.get_running_loop().time()
    if _cache["body"] is None or (now - _cache["at"]) > _ETAG_TTL_S:
        _cache["body"] = await view.build_snapshot()
        _cache["at"] = now
    snapshot = _cache["body"]
    etag = f'"{snapshot["snapshotId"]}"'
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "private, max-age=30"
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304)
    return snapshot


@router.get("/v1/ecosystem/findings")
async def ecosystem_findings(response: Response):
    """Findings do Sentinel com stamp da fonte — mesma projeção do snapshot,
    isolada para paginação/filtro futuros. Nunca dispara auditoria."""
    result = await integrity_snapshot()
    response.headers["Cache-Control"] = "private, max-age=30"
    return {"findings": result["findings"], "stamp": result["stamp"]}
