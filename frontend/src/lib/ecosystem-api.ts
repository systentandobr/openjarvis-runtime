/**
 * Adapter de ecossistema 360° — fronteira única para fontes reais.
 * Segue contrato F360-02 (IMPLEMENTATION.md): api.ts é a única fronteira HTTP.
 *
 * Fontes independentes, cada uma com stamp tipado:
 * - graph:      GET /v1/ecosystem/snapshot (Graphify, projeção browser-safe)
 * - activity:   WS de supervisão compartilhada (supervision.ts) — fora do HTTP
 * - integrity:  findings Sentinel embutidos no snapshot + /v1/ecosystem/findings
 * - sessions:   catálogo devmode-sessions embutido no snapshot
 *
 * Uma fonte falha sem derrubar as demais. Snapshot ausente nunca injeta
 * fixtures: modo demo é escolha explícita do usuário, não fallback.
 */

import { apiFetch } from './api';
import type { EcosystemSnapshot, SourceStamp } from '../types/ecosystem';

export type SourceKey = 'graph' | 'activity' | 'integrity' | 'sessions';

export interface EcosystemView {
  snapshot: EcosystemSnapshot | null;
  stamps: Record<SourceKey, SourceStamp>;
  /** true apenas quando nenhuma fonte real respondeu — informativo,
   *  a decisão de exibir fixtures é do usuário (demo explícito). */
  demo: boolean;
  error: string | null;
}

export const DEFAULT_STAMP: SourceStamp = {
  status: 'unavailable',
  observedAt: null,
  generatedAt: null,
  version: null,
  coverage: [],
};

const VALID_STATUS = new Set(['loading', 'ready', 'stale', 'unavailable', 'unauthorized']);

/** Valida o stamp vindo do servidor; rejeita status fora do contrato. */
export function sanitizeStamp(value: unknown): SourceStamp {
  const stamp = (value ?? {}) as Partial<SourceStamp>;
  return {
    status: VALID_STATUS.has(stamp.status as string) ? (stamp.status as SourceStamp['status']) : 'unavailable',
    observedAt: typeof stamp.observedAt === 'string' ? stamp.observedAt : null,
    generatedAt: typeof stamp.generatedAt === 'string' ? stamp.generatedAt : null,
    version: typeof stamp.version === 'string' ? stamp.version : null,
    coverage: Array.isArray(stamp.coverage) ? stamp.coverage.filter((c): c is string => typeof c === 'string') : [],
    reason: typeof stamp.reason === 'string' ? stamp.reason : undefined,
  };
}

/** Tenta obter snapshot estrutural da projeção do ecossistema.
 *  Falha de uma fonte não derruba as demais; valida schema/limites. */
export async function fetchEcosystemSnapshot(signal?: AbortSignal): Promise<EcosystemSnapshot | null> {
  try {
    const res = await apiFetch('/v1/ecosystem/snapshot', { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.schemaVersion !== 1) return null;
    return {
      ...data,
      sources: {
        graph: sanitizeStamp(data.sources?.graph),
        activity: sanitizeStamp(data.sources?.activity),
        integrity: sanitizeStamp(data.sources?.integrity),
        sessions: sanitizeStamp(data.sources?.sessions),
      },
      nodes: Array.isArray(data.nodes) ? data.nodes.slice(0, 200) : [],
      relations: Array.isArray(data.relations) ? data.relations.slice(0, 400) : [],
      executions: Array.isArray(data.executions) ? data.executions : [],
      findings: Array.isArray(data.findings) ? data.findings : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : undefined,
      registry: data.registry && typeof data.registry === 'object' ? data.registry : undefined,
      warnings: Array.isArray(data.warnings) ? data.warnings.filter((w: unknown): w is string => typeof w === 'string') : [],
    } as EcosystemSnapshot;
  } catch {
    return null;
  }
}

/** Findings paginados do Sentinel (cursor futuro; hoje primeira página). */
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

/** Monta view consolidada das fontes HTTP (grafo/integridade/sessões).
 *  A fonte 'activity' é preenchida pela conexão WS compartilhada —
 *  aqui fica 'loading' até o status real da supervisão ser conhecido. */
export async function loadEcosystemView(signal?: AbortSignal): Promise<EcosystemView> {
  const stamps: Record<SourceKey, SourceStamp> = {
    graph: { ...DEFAULT_STAMP, status: 'loading' },
    activity: { ...DEFAULT_STAMP, status: 'loading' },
    integrity: { ...DEFAULT_STAMP, status: 'loading' },
    sessions: { ...DEFAULT_STAMP, status: 'loading' },
  };

  const snapshot = await fetchEcosystemSnapshot(signal);

  if (snapshot) {
    stamps.graph = snapshot.sources.graph;
    stamps.integrity = snapshot.sources.integrity;
    stamps.sessions = snapshot.sources.sessions ?? { ...DEFAULT_STAMP };
    // activity mantém o stamp do servidor apenas como configuração
    // ('unconfigured' é informativo); o estado real vem do WS.
    stamps.activity = snapshot.sources.activity;
    return { snapshot, stamps, demo: false, error: null };
  }

  // Endpoint indisponível: todas as fontes HTTP ficam indisponíveis;
  // 'activity' ainda pode ficar ready via supervisão WS.
  stamps.graph = { ...DEFAULT_STAMP, reason: 'unreachable' };
  stamps.integrity = { ...DEFAULT_STAMP, reason: 'unreachable' };
  stamps.sessions = { ...DEFAULT_STAMP, reason: 'unreachable' };
  return { snapshot: null, stamps, demo: true, error: null };
}
