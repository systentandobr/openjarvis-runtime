import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ChevronRight, Focus, Pause, Play, ShieldCheck } from 'lucide-react';
import './freds360.css';
import { demoEvents, demoRoutines, demoServices } from './fixtures';
import { resolveAnimate } from './scene-utils';
import { EcosystemScene } from './EcosystemScene';
import { InspectorDrawer, type InspectorTab } from './InspectorDrawer';
import { ConversationDock } from './ConversationDock';

const TABS = ['Visão 360°', 'Agentes', 'Rotinas'] as const;

export function Freds360Page() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Visão 360°');
  const [moving, setMoving] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('Contexto');
  const scene = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const active = demoServices.find(s => s.id === selected);
  const animate = resolveAnimate(moving, hidden, reduced);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    const visibility = () => setHidden(document.hidden);
    sync(); visibility();
    query.addEventListener('change', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      query.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (selected) dialog.current?.showModal(); else dialog.current?.close();
  }, [selected]);

  function reset() {
    scene.current?.style.setProperty('--pan-x', '0px');
    scene.current?.style.setProperty('--pan-y', '0px');
  }
  useEffect(() => { if (!animate) reset(); }, [animate]);

  function inspect(id: string) { setInspectorTab('Contexto'); setSelected(id); }
  function inspectIntegrity(id: string) { setInspectorTab('Integridade'); setSelected(id); }

  return (
    <div className={`f360 ${animate ? 'f360-animate' : ''}`}>
      <header className="f360-header">
        <Link to="/freddy" className="f360-brand"><span className="f360-mark">✣</span><strong>systentando</strong><span>/ freds</span></Link>
        <nav aria-label="Visões do Freds">
          {TABS.map(t => (
            <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
              {t === tab && <i />}{t}
            </button>
          ))}
        </nav>
        <span className="f360-demo"><ShieldCheck size={13} /> Demonstração</span>
      </header>
      <div className="f360-toolbar">
        <span>Seu ecossistema, em perspectiva.</span>
        <div>
          <button onClick={() => { reset(); setTab('Visão 360°'); }} aria-label="Enquadrar visão geral"><Focus size={16} /></button>
          <button aria-pressed={!moving} onClick={() => setMoving(!moving)} aria-label={moving ? 'Pausar movimento' : 'Ativar movimento'}>
            {moving ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <Link to="/office">Escritório <ArrowUpRight size={13} /></Link>
        </div>
      </div>
      {tab === 'Visão 360°' ? (
        <EcosystemScene
          services={demoServices}
          events={demoEvents}
          animate={animate}
          onInspect={inspect}
          onIntegrity={inspectIntegrity}
          sceneRef={scene}
          onReset={reset}
        />
      ) : (
        <section className="f360-secondary">
          <span className="f360-kicker">{tab === 'Agentes' ? 'ESPECIALISTAS E SERVIÇOS' : 'SEU RITMO DE TRABALHO'}</span>
          <h1>{tab === 'Agentes' ? 'Uma visão de cada conexão.' : 'Clareza para começar. Contexto para continuar.'}</h1>
          <p>Prévia visual. Nenhuma conexão, execução ou rotina foi ativada por esta página.</p>
          <div className="f360-service-list">
            {tab === 'Agentes'
              ? demoServices.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => inspect(s.id)}>
                      <Icon size={24} /><strong>{s.name}</strong><small>{s.category}</small><ChevronRight size={16} />
                    </button>
                  );
                })
              : demoRoutines.map(r => (
                  <article key={r.time}>
                    <time>{r.time}</time><h2>{r.title}</h2><p>{r.desc}</p>
                    <small>America/Fortaleza · proposta, não agendada</small>
                  </article>
                ))}
          </div>
          <Link to="/freddy">Abrir protótipo anterior →</Link>
        </section>
      )}
      <ConversationDock />
      <InspectorDrawer
        ref={dialog}
        service={active}
        tab={inspectorTab}
        onTab={setInspectorTab}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
