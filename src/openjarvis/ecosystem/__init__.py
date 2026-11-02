"""Projeção read-only do ecossistema para o Freds 360° (F360-05/07/08).

Browser → api.ts → GET /v1/ecosystem/* → esta camada → adapters:
  GraphSource (arquivo Graphify), IntegritySource (Sentinel MCP privado),
  SessionsSource (devmode-sessions REST), supervision upstream (config).

GET nunca dispara auditoria, regenera grafo nem muta estado upstream.
"""
