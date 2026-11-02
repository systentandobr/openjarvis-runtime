import { ChevronRight, Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { IntegrityFinding, SourceStatus } from '../../types/ecosystem';

interface Props {
  onInspect: (id: string) => void;
  onIntegrity: (id: string) => void;
  findings: IntegrityFinding[];
  isDemo?: boolean;
  integrityStatus?: SourceStatus;
  generatedAt?: string | null;
}

function auditDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Painel Sentinel — estados tipados por fonte.
 *  Ausência de auditoria NUNCA significa conforme:
 *  unavailable/unauthorized → 'Não verificado'; ready+vazio → 'Sem findings'. */
export function SentinelSummary({ onInspect, onIntegrity, findings, isDemo = true, integrityStatus = 'unavailable', generatedAt }: Props) {
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const total = findings.length;

  if (!isDemo && integrityStatus !== 'ready') {
    const label =
      integrityStatus === 'loading'
        ? 'verificando'
        : integrityStatus === 'unauthorized'
          ? 'sem autorização'
          : integrityStatus === 'stale'
            ? 'fonte desatualizada'
            : 'indisponível';
    return (
      <aside className="f360-sentinel f360-glass">
        <h2>
          <ShieldCheck size={17} /> Sentinel <small>{label}</small>
        </h2>
        <div className="f360-coverage muted">
          <Database size={15} />
          <span>
            Não verificado
            <small>
              {integrityStatus === 'loading'
                ? 'Consultando fonte de auditoria…'
                : integrityStatus === 'unauthorized'
                  ? 'Credencial da bridge recusada'
                  : integrityStatus === 'stale'
                    ? `Última auditoria: ${auditDate(generatedAt)}`
                    : 'Fonte de auditoria não respondeu'}
            </small>
          </span>
        </div>
      </aside>
    );
  }

  if (!isDemo && total === 0) {
    return (
      <aside className="f360-sentinel f360-glass">
        <h2>
          <ShieldCheck size={17} /> Sentinel <small>verificado</small>
        </h2>
        <div className="f360-coverage">
          <ShieldCheck size={15} />
          <span>
            Sem findings no último relatório
            <small>Auditoria: {auditDate(generatedAt)}</small>
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="f360-sentinel f360-glass">
      <h2>
        <ShieldCheck size={17} /> Sentinel{' '}
        <small>{isDemo ? 'simulação' : `${total} finding${total !== 1 ? 's' : ''}`}</small>
      </h2>
      {isDemo ? (
        <>
          <button className="f360-alert" onClick={() => onInspect('gestor')}>
            <TriangleAlert size={18} /> 1 alerta para revisar <ChevronRight size={15} />
          </button>
          <button className="f360-finding" onClick={() => onIntegrity('gestor')}>
            <span className="f360-finding-icon">{'</>'}</span>
            <span>
              Credencial no frontend<small>Ver evidência de exemplo →</small>
            </span>
          </button>
          <div className="f360-coverage">
            <ShieldCheck size={15} />
            <span>
              Isolamento por unidade<small>Conforme · exemplo</small>
            </span>
          </div>
          <div className="f360-coverage muted">
            <Database size={15} />
            <span>
              Fonte indisponível<small>Não verificada · exemplo</small>
            </span>
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
              <span>
                {f.check}
                <small>
                  {f.status} · {f.severity}
                </small>
              </span>
            </button>
          ))}
          <div className="f360-coverage">
            <Database size={15} />
            <span>
              Fonte conectada
              <small>Auditoria: {auditDate(generatedAt || findings[0]?.observedAt)}</small>
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
