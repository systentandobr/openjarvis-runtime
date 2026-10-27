import { useEffect, useRef } from 'react';
import { loadEcosystemView } from '../../lib/ecosystem-api';
import { useEcosystemStore } from '../../lib/ecosystem.store';
import { useExecutionRuns } from '../../lib/execution-runs.store';

/** Coordena lifetime, cleanup e assinaturas do ecossistema 360°.
 *  Carrega snapshot na montagem; reage a visibilidade de aba.
 *  Integra execution-runs.store.ts como fonte de atividade. */
export function useEcosystemView() {
  const store = useEcosystemStore();
  const runs = useExecutionRuns((s) => s.runs);
  const abortRef = useRef<AbortController | null>(null);

  async function refresh() {
    store.setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const view = await loadEcosystemView(ctrl.signal);
      store.applyView(view);
    } finally {
      store.setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando execuções reais chegam, marca fonte de atividade como ready
  const runCount = Object.keys(runs).length;
  useEffect(() => {
    if (runCount > 0) {
      store.setSourceStatus('activity', 'ready');
    }
  }, [runCount, store]);

  // Pausa/reduced-motion via eventos do browser
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => store.setReducedMotion(query.matches);
    const visibility = () => store.setHiddenTab(document.hidden);
    sync();
    visibility();
    query.addEventListener('change', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      query.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [store]);

  return { refresh, runCount };
}
