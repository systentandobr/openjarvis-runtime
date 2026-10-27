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

export interface EcosystemSnapshot {
  schemaVersion: 1;
  snapshotId: string;
  serverTime: string;
  sources: { graph: SourceStamp; activity: SourceStamp; integrity: SourceStamp };
  nodes: ServiceNode[];
  relations: Relation[];
  executions: ExecutionOverlay[];
  findings: IntegrityFinding[];
  warnings: string[];
}
