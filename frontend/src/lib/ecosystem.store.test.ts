import { describe, expect, it } from 'vitest';
import { useEcosystemStore, useEcosystemNodes, useEcosystemExecutions, useEcosystemFindings } from './ecosystem.store';

describe('ecosystem.store', () => {
  it('estado inicial: real (demo é opt-in), sem snapshot, fontes unavailable', () => {
    const state = useEcosystemStore.getState();
    expect(state.viewMode).toBe('real');
    expect(state.demoExplicit).toBe(false);
    expect(state.snapshot).toBeNull();
    expect(state.sourceStatus.graph).toBe('unavailable');
    expect(state.selectedNodeId).toBeNull();
    expect(state.animate).toBe(true);
  });

  it('applyView com snapshot real muda para viewMode=real', () => {
    const store = useEcosystemStore.getState();
    store.applyView({
      snapshot: {
        schemaVersion: 1,
        snapshotId: 's1',
        serverTime: new Date().toISOString(),
        sources: {
          graph: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] },
          activity: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] },
          integrity: { status: 'stale', observedAt: null, generatedAt: null, version: '1', coverage: [] },
        },
        nodes: [{ id: 'n1', label: 'N1', kind: 'service', capabilities: [], sourceRefs: [] }],
        relations: [],
        executions: [],
        findings: [],
        warnings: [],
      },
      stamps: {
        graph: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] },
        activity: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] },
        integrity: { status: 'stale', observedAt: null, generatedAt: null, version: '1', coverage: [] },
        sessions: { status: 'unavailable', observedAt: null, generatedAt: null, version: null, coverage: [] },
      },
      demo: false,
      error: null,
    });
    const state = useEcosystemStore.getState();
    expect(state.viewMode).toBe('real');
    expect(state.snapshot?.nodes).toHaveLength(1);
    expect(state.sourceStatus.graph).toBe('ready');
  });

  it('seleção de nó e reset', () => {
    const store = useEcosystemStore.getState();
    store.selectNode('svc1');
    expect(useEcosystemStore.getState().selectedNodeId).toBe('svc1');
    store.resetSelection();
    expect(useEcosystemStore.getState().selectedNodeId).toBeNull();
    expect(useEcosystemStore.getState().selectedTab).toBe('Contexto');
  });

  it('toggleAnimate inverte estado de animação', () => {
    const store = useEcosystemStore.getState();
    store.setAnimate(true);
    store.toggleAnimate();
    expect(useEcosystemStore.getState().animate).toBe(false);
  });

  it('snapshot nulo retorna arrays vazios via estado direto', () => {
    useEcosystemStore.setState({ snapshot: null });
    const state = useEcosystemStore.getState();
    expect(state.snapshot?.nodes ?? []).toEqual([]);
    expect(state.snapshot?.executions ?? []).toEqual([]);
    expect(state.snapshot?.findings ?? []).toEqual([]);
  });
});
