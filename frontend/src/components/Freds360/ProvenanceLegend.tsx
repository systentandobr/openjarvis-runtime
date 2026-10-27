import { Activity, GitBranch } from 'lucide-react';

interface Props {
  isDemo?: boolean;
}

/** Legenda de procedência — distingue snapshot de grafo, atividade e auditoria. */
export function ProvenanceLegend({ isDemo = true }: Props) {
  return (
    <div className="f360-provenance f360-glass">
      <span><GitBranch size={14} /> Graphify <small>{isDemo ? 'snapshot ilustrativo' : 'fonte real'}</small></span>
      <span><Activity size={14} /> Atividade <small>{isDemo ? 'eventos simulados' : 'execuções ativas'}</small></span>
    </div>
  );
}
