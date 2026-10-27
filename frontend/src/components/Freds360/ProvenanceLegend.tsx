import { Activity, GitBranch } from 'lucide-react';

/** Legenda de procedência — distingue snapshot de grafo, atividade e auditoria. */
export function ProvenanceLegend() {
  return (
    <div className="f360-provenance f360-glass">
      <span><GitBranch size={14} /> Graphify <small>snapshot ilustrativo</small></span>
      <span><Activity size={14} /> Atividade <small>eventos simulados</small></span>
    </div>
  );
}
