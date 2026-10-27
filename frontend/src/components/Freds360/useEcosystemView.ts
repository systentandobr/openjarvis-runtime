import { useEffect, useRef } from 'react';
import { loadEcosystemView } from '../../lib/ecosystem-api';
import { useEcosystemStore } from '../../lib/ecosystem.store';
import { useExecutionRuns } from '../../lib/execution-runs.store';

/** Coordena lifetime, cleanup e assinaturas do ecossistema 360°.
 *  Carrega snapshot na montagem; reage a visibilidade de aba.
 *  Integra execution-runs.store.ts como fonte de atividade.
 *  IMPORTANTE: seletores de actions (referências estáveis) — nunca
 *  assinar o estado inteiro como dep de effect que chama set()
 *  (objeto novo a cada update → loop de update depth). */
export function useEcosystemView() {
  const setLoading = useEcosystemStore((s) => s.setLoading);
  const applyView = useEcosystemStore((s) => s.applyView);
  const setSourceStatus = useEcosystemStore((s) => s.setSourceStatus);
  const setReducedMotion = useEcosystemStore((s) => s.setReducedMotion);
  const setHiddenTab = useEcosystemStore((s) => s.setHiddenTab);
  const runs = useExecutionRuns((s) => s.runs);
  const abortRef = useRef<AbortController | null>(null);

  async function refresh() {
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const view = await loadEcosystemView(ctrl.signal);
      applyView(view);
    } finally {
      setLoading(false);
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
      setSourceStatus('activity', 'ready');
    }
  }, [runCount, setSourceStatus]);

  // Pausa/reduced-motion via eventos do browser
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    const visibility = () => setHiddenTab(document.hidden);
    sync();
    visibility();
    query.addEventListener('change', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      query.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [setReducedMotion, setHiddenTab]);

  return { refresh, runCount };
}
