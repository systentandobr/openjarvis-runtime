/**
 * Store de estado do ecossistema 360° (F360-08).
 * Separa grafo, overlays, fontes, seleção e preferências.
 * Reutiliza execution-runs.store.ts para execuções reais.
 */

import { create } from 'zustand';
import type { EcosystemSnapshot, ServiceNode, IntegrityFinding, ExecutionOverlay } from '../types/ecosystem';
import type { SourceKey, EcosystemView } from './ecosystem-api';

export type ViewMode = 'demo' | 'real' | 'mixed';

interface EcosystemState {
  // Snapshot
  snapshot: EcosystemSnapshot | null;
  loading: boolean;
  error: string | null;

  // Fontes individuais
  sourceStatus: Record<SourceKey, 'loading' | 'ready' | 'stale' | 'unavailable' | 'unauthorized'>;

  // Modo de visualização
  viewMode: ViewMode;

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
  setSourceStatus: (key: SourceKey, status: EcosystemState['sourceStatus'][SourceKey]) => void;
  setViewMode: (mode: ViewMode) => void;
  selectNode: (id: string | null) => void;
  setSelectedTab: (tab: EcosystemState['selectedTab']) => void;
  setAnimate: (animate: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setHiddenTab: (hidden: boolean) => void;
  toggleAnimate: () => void;
  resetSelection: () => void;
  applyView: (view: EcosystemView) => void;
}

const initialSourceStatus: EcosystemState['sourceStatus'] = {
  graph: 'unavailable',
  activity: 'unavailable',
  integrity: 'unavailable',
};

export const useEcosystemStore = create<EcosystemState>((set) => ({
  snapshot: null,
  loading: false,
  error: null,
  sourceStatus: { ...initialSourceStatus },
  viewMode: 'demo',
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
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  setAnimate: (animate) => set({ animate }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setHiddenTab: (hiddenTab) => set({ hiddenTab }),
  toggleAnimate: () => set(({ animate }) => ({ animate: !animate })),
  resetSelection: () => set({ selectedNodeId: null, selectedTab: 'Contexto' }),
  applyView: (view) =>
    set({
      snapshot: view.snapshot,
      viewMode: view.demo ? 'demo' : view.snapshot ? 'real' : 'mixed',
      sourceStatus: {
        graph: view.stamps.graph.status,
        activity: view.stamps.activity.status,
        integrity: view.stamps.integrity.status,
      },
      error: view.error,
    }),
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
