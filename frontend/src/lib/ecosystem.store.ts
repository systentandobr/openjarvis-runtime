/**
 * Store de estado do ecossistema 360° (F360-08).
 * Separa grafo, overlays, fontes, seleção e preferências.
 * Reutiliza execution-runs.store.ts para execuções reais.
 *
 * 'demo' é modo EXPLÍCITO do usuário — nunca fallback silencioso.
 * 'activity' é escrita exclusivamente pela conexão WS compartilhada
 * (supervision.ts); applyView não a sobrescreve.
 */

import { create } from 'zustand';
import type { EcosystemSnapshot, ServiceNode, IntegrityFinding, ExecutionOverlay, CatalogSession, SourceStatus } from '../types/ecosystem';
import type { SourceKey, EcosystemView } from './ecosystem-api';

export type ViewMode = 'demo' | 'real' | 'mixed';

interface EcosystemState {
  // Snapshot
  snapshot: EcosystemSnapshot | null;
  loading: boolean;
  error: string | null;

  // Fontes individuais — status tipado por fonte, nunca status de serviço
  sourceStatus: Record<SourceKey, SourceStatus>;

  // Modo de visualização — 'demo' somente quando demoExplicit
  viewMode: ViewMode;
  demoExplicit: boolean;

  // Seleção
  selectedNodeId: string | null;
  selectedTab: 'Contexto' | 'Execuções' | 'Integridade';

  // Preferências
  animate: boolean;
  reducedMotion: boolean;
  hiddenTab: boolean;

  // Ações
  setSnapshot: (snapshot: EcosystemSnapshot | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSourceStatus: (key: SourceKey, status: SourceStatus) => void;
  setViewMode: (mode: ViewMode) => void;
  setDemoExplicit: (enabled: boolean) => void;
  selectNode: (id: string | null) => void;
  setSelectedTab: (tab: EcosystemState['selectedTab']) => void;
  setAnimate: (animate: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setHiddenTab: (hidden: boolean) => void;
  toggleAnimate: () => void;
  resetSelection: () => void;
  applyView: (view: EcosystemView) => void;
  /** Limpeza ao trocar contexto/sessão — não persiste dados de outro escopo. */
  resetEcosystem: () => void;
}

const initialSourceStatus: EcosystemState['sourceStatus'] = {
  graph: 'unavailable',
  activity: 'unavailable',
  integrity: 'unavailable',
  sessions: 'unavailable',
};

export const useEcosystemStore = create<EcosystemState>((set) => ({
  snapshot: null,
  loading: false,
  error: null,
  sourceStatus: { ...initialSourceStatus },
  viewMode: 'real',
  demoExplicit: false,
  selectedNodeId: null,
  selectedTab: 'Contexto',
  animate: true,
  reducedMotion: false,
  hiddenTab: false,

  setSnapshot: (snapshot) => set({ snapshot }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSourceStatus: (key, status) =>
    set(({ sourceStatus }) => ({ sourceStatus: { ...sourceStatus, [key]: status } })),
  setViewMode: (viewMode) => set({ viewMode }),
  setDemoExplicit: (demoExplicit) =>
    set({ demoExplicit, viewMode: demoExplicit ? 'demo' : 'real' }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  setAnimate: (animate) => set({ animate }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setHiddenTab: (hiddenTab) => set({ hiddenTab }),
  toggleAnimate: () => set(({ animate }) => ({ animate: !animate })),
  resetSelection: () => set({ selectedNodeId: null, selectedTab: 'Contexto' }),
  applyView: (view) =>
    set((state) => ({
      snapshot: view.snapshot,
      // demo só quando o usuário escolheu explicitamente; real otherwise
      viewMode: state.demoExplicit ? 'demo' : 'real',
      sourceStatus: {
        // 'activity' pertence à conexão WS compartilhada — não sobrescrever
        activity: state.sourceStatus.activity,
        graph: view.stamps.graph.status,
        integrity: view.stamps.integrity.status,
        sessions: view.stamps.sessions.status,
      },
      error: view.error,
    })),
  resetEcosystem: () =>
    set((state) => ({
      snapshot: null,
      loading: false,
      error: null,
      sourceStatus: { ...initialSourceStatus },
      viewMode: state.demoExplicit ? 'demo' : 'real',
      selectedNodeId: null,
      selectedTab: 'Contexto',
    })),
}));

/** Hook de conveniência: nós do snapshot ou vazio. */
export function useEcosystemNodes(): ServiceNode[] {
  return useEcosystemStore((s) => s.snapshot?.nodes ?? []);
}

/** Hook de conveniência: execuções ativas do snapshot. */
export function useEcosystemExecutions(): ExecutionOverlay[] {
  return useEcosystemStore((s) => s.snapshot?.executions ?? []);
}

/** Hook de conveniência: findings do snapshot. */
export function useEcosystemFindings(): IntegrityFinding[] {
  return useEcosystemStore((s) => s.snapshot?.findings ?? []);
}

/** Hook de conveniência: catálogo de sessões devmode. */
export function useEcosystemSessions(): CatalogSession[] {
  return useEcosystemStore((s) => s.snapshot?.sessions ?? []);
}
