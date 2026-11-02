import { Activity, GitBranch, ListTree, ShieldCheck } from 'lucide-react';
import type { SourceStatus } from '../../types/ecosystem';
import type { SourceKey } from '../../lib/ecosystem-api';

interface Props {
  isDemo?: boolean;
  sourceStatus?: Record<SourceKey, SourceStatus>;
}

const LABEL: Record<SourceStatus, string> = {
  loading: 'carregando',
  ready: 'pronta',
  stale: 'desatualizada',
  unavailable: 'indisponível',
  unauthorized: 'sem acesso',
};

/** Legenda de procedência — distingue snapshot de grafo, atividade WS,
 *  auditoria Sentinel e catálogo de sessões, cada um com seu estado. */
export function ProvenanceLegend({ isDemo = true, sourceStatus }: Props) {
  const st = (key: SourceKey) => LABEL[sourceStatus?.[key] ?? 'unavailable'];
  return (
    <div className="f360-provenance f360-glass">
      <span>
        <GitBranch size={14} /> Estrutura <small>{isDemo ? 'snapshot ilustrativo' : `Graphify · ${st('graph')}`}</small>
      </span>
      <span>
        <Activity size={14} /> Atividade <small>{isDemo ? 'eventos simulados' : `supervisão · ${st('activity')}`}</small>
      </span>
      <span>
        <ShieldCheck size={14} /> Auditoria <small>{isDemo ? 'findings simulados' : `Sentinel · ${st('integrity')}`}</small>
      </span>
      <span>
        <ListTree size={14} /> Sessões <small>{isDemo ? 'catálogo simulado' : `devmode · ${st('sessions')}`}</small>
      </span>
    </div>
  );
}
