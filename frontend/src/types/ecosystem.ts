/**
 * Contratos da projeção 360° (F360-02 / IMPLEMENTATION.md).
 * schemaVersion=1 — evoluir só com bump explícito.
 * Status de fonte NÃO é status de serviço; snapshot ausente não apaga histórico.
 */

export type SourceStatus = 'loading' | 'ready' | 'stale' | 'unavailable' | 'unauthorized';

export interface SourceStamp {
  status: SourceStatus;
  observedAt: string | null;
  generatedAt: string | null;
  version: string | null;
  coverage: string[];
  /** Motivo sanitizado quando não está 'ready'
   *  (ex.: 'unauthorized' | 'unconfigured' | 'unreachable' | 'no_report' | 'error'). */
  reason?: string;
}

export type ServiceState = 'available' | 'attention' | 'offline' | 'unknown';

export interface ServiceNode {
  id: string;
  label: string;
  kind: 'service' | 'repository';
  capabilities: string[];
  sourceRefs: string[];
}

export interface Relation {
  id: string;
  source: string;
  target: string;
  kind: string;
  origin: 'graphify' | 'registry';
  verifiedAt: string | null;
}

export interface ExecutionOverlay {
  executionId: string;
  agentId: string;
  sessionId: string;
  serviceId: string | null;
  sequence: number;
  stage: string;
  updatedAt: string;
}

export interface IntegrityFinding {
  id: string;
  serviceId: string | null;
  check: string;
  severity: string;
  status: string;
  observedAt: string;
  auditId: string;
  evidenceRef: string | null;
}

/** Sessão do catálogo devmode-sessions — catálogo, não atividade. */
export interface CatalogSession {
  id: string;
  projectId: string | null;
  workspaceId: string | null;
  title: string | null;
  status: string;
  updatedAt: string | null;
}

/** Registry de correlação emitido pelo backend (F360-02).
 *  agentId ausente do mapa permanece em 'Não mapeadas'. */
export interface EcosystemRegistry {
  agentServices: Record<string, string>;
}

export interface EcosystemSnapshot {
  schemaVersion: 1;
  snapshotId: string;
  serverTime: string;
  sources: {
    graph: SourceStamp;
    activity: SourceStamp;
    integrity: SourceStamp;
    sessions?: SourceStamp;
  };
  nodes: ServiceNode[];
  relations: Relation[];
  executions: ExecutionOverlay[];
  findings: IntegrityFinding[];
  sessions?: CatalogSession[];
  registry?: EcosystemRegistry;
  warnings: string[];
}
