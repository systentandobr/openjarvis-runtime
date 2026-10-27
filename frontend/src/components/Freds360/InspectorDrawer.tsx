import { forwardRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Database, X } from 'lucide-react';
import type { DemoService } from './fixtures';

const TABS = ['Contexto', 'Execuções', 'Integridade'] as const;
export type InspectorTab = (typeof TABS)[number];

interface Props {
  service: DemoService | undefined;
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  onClose: () => void;
}

export const InspectorDrawer = forwardRef<HTMLDialogElement, Props>(function InspectorDrawer({ service, tab, onTab, onClose }, ref) {
  const body =
    tab === 'Contexto'
      ? service?.detail
      : tab === 'Execuções'
        ? 'Os eventos e os agentes desta cena são exemplos de apresentação. Não há conexão de supervisão nesta página.'
        : 'O alerta é ilustrativo. Nenhuma auditoria real foi consultada; não há evidência operacional disponível nesta prévia.';
  return (
    <dialog ref={ref} className="f360-dialog" onCancel={onClose} onClose={onClose}>
      <header>
        <span className="f360-kicker">INSPECIONAR CONEXÃO</span>
        <button aria-label="Fechar detalhes" onClick={onClose}><X size={20} /></button>
      </header>
      <h2>{service?.name}</h2>
      <nav aria-label="Detalhes da conexão">
        {TABS.map(t => <button key={t} aria-pressed={tab === t} onClick={() => onTab(t)}>{t}</button>)}
      </nav>
      <p>{body}</p>
      <div className="f360-dialog-stamp"><Database size={16} /> Fonte: fixture de design · sem validação de runtime</div>
      <Link to="/office">Abrir supervisão existente <ArrowUpRight size={14} /></Link>
    </dialog>
  );
});
