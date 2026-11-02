import { useEffect, useRef } from 'react';
import { loadEcosystemView } from '../../lib/ecosystem-api';
import { useEcosystemStore } from '../../lib/ecosystem.store';
import { useExecutionRuns } from '../../lib/execution-runs.store';
import { supervision, type SupervisionStatus } from '../../lib/supervision';
import type { SourceStatus } from '../../types/ecosystem';

/** Status da conexão WS → stamp da fonte 'activity'.
 *  Conexão aberta não prova serviço saudável: 'disconnected' depois de ter
 *  estado conectado é 'stale' (dados possivelmente desatualizados); antes
 *  da primeira conexão é 'unavailable'. */
function activityStatus(status: SupervisionStatus): SourceStatus {
  switch (status) {
    case 'connected':
      return 'ready';
    case 'connecting':
      return 'loading';
    case 'unconfigured':
      return 'unavailable';
    case 'disconnected':
      return supervision.wasConnected() ? 'stale' : 'unavailable';
  }
}

/** Coordena lifetime, cleanup e assinaturas do ecossistema 360°.
 *  - Adquire a conexão de supervisão compartilhada (mesma do Office).
 *  - Carrega snapshot na montagem; fontes falham independentemente.
 *  - Reage a visibilidade de aba e reduced-motion.
 *  IMPORTANTE: seletores de actions (referências estáveis) — nunca
 *  assinar o estado inteiro como dep de effect que chama set(). */
export function useEcosystemView() {
  const setLoading = useEcosystemStore((s) => s.setLoading);
  const applyView = useEcosystemStore((s) => s.applyView);
  const setSourceStatus = useEcosystemStore((s) => s.setSourceStatus);
  const setReducedMotion = useEcosystemStore((s) => s.setReducedMotion);
  const setHiddenTab = useEcosystemStore((s) => s.setHiddenTab);
  const resetEcosystem = useEcosystemStore((s) => s.resetEcosystem);
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
      resetEcosystem();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conexão de supervisão compartilhada: /freddy/360 abre a mesma WS do
  // Office. acquire/release por referência — nunca duplica nem reseta runs.
  useEffect(() => {
    const release = supervision.acquire();
    const unsubscribe = supervision.subscribe((status) => {
      setSourceStatus('activity', activityStatus(status));
    });
    return () => {
      unsubscribe();
      release();
    };
  }, [setSourceStatus]);

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

  return { refresh, runCount: Object.keys(runs).length };
}
