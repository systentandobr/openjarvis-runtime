import { forwardRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Database, X } from 'lucide-react';
import type { DemoService } from './fixtures';
import type { CatalogSession, IntegrityFinding, SourceStatus } from '../../types/ecosystem';
import type { ExecutionRun } from '../../lib/execution-runs.store';
import type { SourceKey } from '../../lib/ecosystem-api';

const TABS = ['Contexto', 'Execuções', 'Integridade'] as const;
export type InspectorTab = (typeof TABS)[number];

interface Props {
  service: DemoService | undefined;
  run?: ExecutionRun | null;
  serviceRuns?: ExecutionRun[];
  sessions?: CatalogSession[];
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  onClose: () => void;
  isDemo?: boolean;
  findings?: IntegrityFinding[];
  sourceStatus?: Record<SourceKey, SourceStatus>;
}

function fmt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR');
}

const INTEGRITY_TEXT: Record<SourceStatus, string> = {
  loading: 'Consultando a fonte de auditoria…',
  unauthorized: 'Acesso à auditoria não autorizado. Estado: não verificado.',
  unavailable: 'Fonte de auditoria indisponível. Estado: não verificado — ausência de dados não significa conformidade.',
  stale: 'Última auditoria está desatualizada; findings podem não refletir o estado atual.',
  ready: 'Nenhum finding de integridade para este serviço no último relatório.',
};

export const InspectorDrawer = forwardRef<HTMLDialogElement, Props>(function InspectorDrawer(
  { service, run = null, serviceRuns = [], sessions = [], tab, onTab, onClose, isDemo = true, findings = [], sourceStatus },
  ref
) {
  const integrityStatus = sourceStatus?.integrity ?? 'unavailable';
  const serviceFindings = findings.filter((f) => f.serviceId === service?.id || (!f.serviceId && service?.id === 'core'));

  const contexto = isDemo
    ? service?.detail
    : service?.detail ?? 'Sem detalhes registrados para esta seleção.';

  const execucoes = isDemo ? (
    'Os eventos e os agentes desta cena são exemplos de apresentação. Não há conexão de supervisão nesta página.'
  ) : run ? (
    <dl className="f360-run-detail">
      <div><dt>Execução</dt><dd>{run.id}</dd></div>
      <div><dt>Agente</dt><dd>{run.agentId}</dd></div>
      <div><dt>Estágio</dt><dd>{run.stage} · seq {run.sequence}</dd></div>
      <div><dt>Sessão</dt><dd>{run.sessionId}</dd></div>
      <div><dt>Dispositivo</dt><dd>{run.deviceId || 'não informado'}</dd></div>
      <div><dt>Última atualização</dt><dd>{fmt(run.updatedAt)}</dd></div>
      {run.message && <div><dt>Atividade</dt><dd>{run.message}</dd></div>}
    </dl>
  ) : (
    <div className="f360-run-list">
      {serviceRuns.length === 0 && (
        <p>
          {sourceStatus?.activity === 'ready'
            ? 'Nenhuma execução associada a este serviço no momento.'
            : 'Fonte de atividade não conectada — execuções não verificadas.'}
        </p>
      )}
      {serviceRuns.map((r) => (
        <p key={r.id}>
          <strong>{r.agentId}</strong> · {r.stage} · seq {r.sequence} · {fmt(r.updatedAt)}
        </p>
      ))}
      <p className="f360-muted">
        Catálogo de sessões: {sourceStatus?.sessions === 'ready' ? `${sessions.length} registradas` : 'indisponível'}
      </p>
    </div>
  );

  const integridade = isDemo ? (
    'O alerta é ilustrativo. Nenhuma auditoria real foi consultada; não há evidência operacional disponível nesta prévia.'
  ) : integrityStatus !== 'ready' ? (
    INTEGRITY_TEXT[integrityStatus]
  ) : serviceFindings.length > 0 ? (
    <div className="f360-run-list">
      {serviceFindings.map((f) => (
        <p key={f.id}>
          <strong>{f.check}</strong> ({f.severity}): {f.status}
          {f.evidenceRef ? ` · evidência ${f.evidenceRef}` : ''}
        </p>
      ))}
    </div>
  ) : (
    INTEGRITY_TEXT.ready
  );

  return (
    <dialog ref={ref} className="f360-dialog" onCancel={onClose} onClose={onClose}>
      <header>
        <span className="f360-kicker">INSPECIONAR CONEXÃO</span>
        <button aria-label="Fechar detalhes" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <h2>{service?.name}</h2>
      <nav aria-label="Detalhes da conexão">
        {TABS.map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => onTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <div className="f360-dialog-body">
        {tab === 'Contexto' ? <p>{contexto}</p> : tab === 'Execuções' ? execucoes : integridade}
      </div>
      <div className="f360-dialog-stamp">
        <Database size={16} /> Fonte:{' '}
        {isDemo ? 'fixture de design · sem validação de runtime' : 'dados reais · verificar cobertura por fonte'}
      </div>
      <Link to="/office">
        Abrir supervisão existente <ArrowUpRight size={14} />
      </Link>
    </dialog>
  );
});
