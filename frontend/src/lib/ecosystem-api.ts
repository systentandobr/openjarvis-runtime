/**
 * Adapter de ecossistema 360° — fronteira única para fontes reais.
 * Segue contrato F360-02 (IMPLEMENTATION.md): api.ts é a única fronteira HTTP.
 *
 * Fontes:
 * - Graphify: GET /v1/ecosystem/snapshot (proposto) ou MCP get_ecosystem_graph
 * - Execuções: WS existente + execution-runs.store.ts
 * - Sentinel: MCP sentinel_list_findings / sentinel_latest_report
 *
 * Fallback: fixtures explícitas com FIXTURE_ORIGIN marcado.
 */

import { apiFetch } from './api';
import type { EcosystemSnapshot, SourceStamp } from '../types/ecosystem';

export type SourceKey = 'graph' | 'activity' | 'integrity';

export interface EcosystemView {
  snapshot: EcosystemSnapshot | null;
  stamps: Record<SourceKey, SourceStamp>;
  demo: boolean;
  error: string | null;
}

const DEFAULT_STAMP: SourceStamp = {
  status: 'unavailable',
  observedAt: null,
  generatedAt: null,
  version: null,
  coverage: [],
};

/** Tenta obter snapshot estrutural do Graphify via API local.
 *  Se o endpoint não existir, retorna null sem erro fatal. */
export async function fetchEcosystemSnapshot(signal?: AbortSignal): Promise<EcosystemSnapshot | null> {
  try {
    const res = await apiFetch('/v1/ecosystem/snapshot', { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.schemaVersion === 'number') return data as EcosystemSnapshot;
  } catch {
    // Endpoint ainda não implementado no backend OpenJarvis;
    // não quebrar UI — fallback para fixture explícita.
  }
  return null;
}

/** Tenta obter findings do Sentinel via API local (bridge MCP).
 *  Retorna array vazio se indisponível. */
export async function fetchSentinelFindings(signal?: AbortSignal): Promise<EcosystemSnapshot['findings']> {
  try {
    const res = await apiFetch('/v1/ecosystem/findings', { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.findings) ? data.findings : [];
  } catch {
    return [];
  }
}

/** Monta view consolidada a partir das fontes disponíveis.
 *  Cada fonte falha independentemente; nenhuma derruba as demais. */
export async function loadEcosystemView(signal?: AbortSignal): Promise<EcosystemView> {
  const stamps: Record<SourceKey, SourceStamp> = {
    graph: { ...DEFAULT_STAMP, status: 'loading' },
    activity: { ...DEFAULT_STAMP, status: 'loading' },
    integrity: { ...DEFAULT_STAMP, status: 'loading' },
  };

  const [snapshot] = await Promise.all([
    fetchEcosystemSnapshot(signal),
  ]);

  if (snapshot) {
    stamps.graph = snapshot.sources.graph;
    stamps.activity = snapshot.sources.activity;
    stamps.integrity = snapshot.sources.integrity;
    return { snapshot, stamps, demo: false, error: null };
  }

  // Nenhuma fonte real disponível: modo demo explícito
  stamps.graph = { ...DEFAULT_STAMP, status: 'unavailable' };
  stamps.activity = { ...DEFAULT_STAMP, status: 'unavailable' };
  stamps.integrity = { ...DEFAULT_STAMP, status: 'unavailable' };
  return { snapshot: null, stamps, demo: true, error: null };
}
