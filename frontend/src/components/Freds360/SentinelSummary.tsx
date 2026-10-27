import { ChevronRight, Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { IntegrityFinding } from '../../types/ecosystem';

interface Props {
  onInspect: (id: string) => void;
  onIntegrity: (id: string) => void;
  findings: IntegrityFinding[];
  isDemo?: boolean;
}

export function SentinelSummary({ onInspect, onIntegrity, findings, isDemo = true }: Props) {
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const total = findings.length;

  if (!isDemo && total === 0) {
    return (
      <aside className="f360-sentinel f360-glass">
        <h2><ShieldCheck size={17} /> Sentinel <small>sem findings</small></h2>
        <div className="f360-coverage">
          <ShieldCheck size={15} />
          <span>Sem alertas pendentes<small>Última verificação em andamento</small></span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="f360-sentinel f360-glass">
      <h2><ShieldCheck size={17} /> Sentinel <small>{isDemo ? 'simulação' : `${total} finding${total !== 1 ? 's' : ''}`}</small></h2>
      {isDemo ? (
        <>
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
        </>
      ) : (
        <>
          {(criticalCount > 0 || highCount > 0) && (
            <button className="f360-alert" onClick={() => onIntegrity(findings[0]?.serviceId || 'core')}>
              <TriangleAlert size={18} />
              {criticalCount > 0 ? `${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}` : ''}
              {criticalCount > 0 && highCount > 0 ? ' + ' : ''}
              {highCount > 0 ? `${highCount} alto${highCount !== 1 ? 's' : ''}` : ''}
              <ChevronRight size={15} />
            </button>
          )}
          {findings.slice(0, 2).map((f) => (
            <button key={f.id} className="f360-finding" onClick={() => onIntegrity(f.serviceId || 'core')}>
              <span className="f360-finding-icon">{'</>'}</span>
              <span>{f.check}<small>{f.status} · {f.severity}</small></span>
            </button>
          ))}
          <div className="f360-coverage">
            <Database size={15} />
            <span>Fonte conectada<small>Audit ID: {findings[0]?.auditId?.slice(0, 8) || '—'}</small></span>
          </div>
        </>
      )}
    </aside>
  );
}
