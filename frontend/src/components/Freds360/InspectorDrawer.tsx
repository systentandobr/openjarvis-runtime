import { forwardRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Database, X } from 'lucide-react';
import type { DemoService } from './fixtures';
import type { IntegrityFinding } from '../../types/ecosystem';

const TABS = ['Contexto', 'Execuções', 'Integridade'] as const;
export type InspectorTab = (typeof TABS)[number];

interface Props {
  service: DemoService | undefined;
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  onClose: () => void;
  isDemo?: boolean;
  findings?: IntegrityFinding[];
}

export const InspectorDrawer = forwardRef<HTMLDialogElement, Props>(function InspectorDrawer(
  { service, tab, onTab, onClose, isDemo = true, findings = [] },
  ref
) {
  const serviceFindings = findings.filter((f) => f.serviceId === service?.id || (!f.serviceId && service?.id === 'core'));

  const body =
    tab === 'Contexto'
      ? service?.detail
      : tab === 'Execuções'
        ? isDemo
          ? 'Os eventos e os agentes desta cena são exemplos de apresentação. Não há conexão de supervisão nesta página.'
          : 'Execuções reais aparecerão aqui quando a fonte de atividade estiver conectada.'
        : isDemo
          ? 'O alerta é ilustrativo. Nenhuma auditoria real foi consultada; não há evidência operacional disponível nesta prévia.'
          : serviceFindings.length > 0
            ? serviceFindings.map((f) => `${f.check} (${f.severity}): ${f.status}`).join('\n')
            : 'Nenhum finding de integridade para este serviço.';

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
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{body}</pre>
      <div className="f360-dialog-stamp">
        <Database size={16} /> Fonte: {isDemo ? 'fixture de design · sem validação de runtime' : 'dados reais · verificar cobertura'}
      </div>
      <Link to="/office">
        Abrir supervisão existente <ArrowUpRight size={14} />
      </Link>
    </dialog>
  );
});
