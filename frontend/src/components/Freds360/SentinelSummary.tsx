import { ChevronRight, Database, ShieldCheck, TriangleAlert } from 'lucide-react';

export function SentinelSummary({ onInspect, onIntegrity }: { onInspect: (id: string) => void; onIntegrity: (id: string) => void }) {
  return (
    <aside className="f360-sentinel f360-glass">
      <h2><ShieldCheck size={17} /> Sentinel <small>simulação</small></h2>
      <button className="f360-alert" onClick={() => onInspect('gestor')}>
        <TriangleAlert size={18} /> 1 alerta para revisar <ChevronRight size={15} />
      </button>
      <button className="f360-finding" onClick={() => onIntegrity('gestor')}>
        <span className="f360-finding-icon">{'</>'}</span>
        <span>Credencial no frontend<small>Ver evidência de exemplo →</small></span>
      </button>
      <div className="f360-coverage">
        <ShieldCheck size={15} />
        <span>Isolamento por unidade<small>Conforme · exemplo</small></span>
      </div>
      <div className="f360-coverage muted">
        <Database size={15} />
        <span>Fonte indisponível<small>Não verificada · exemplo</small></span>
      </div>
    </aside>
  );
}
