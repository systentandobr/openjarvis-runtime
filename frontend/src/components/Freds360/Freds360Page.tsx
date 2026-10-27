import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ChevronRight, Focus, Pause, Play, ShieldCheck } from 'lucide-react';
import './freds360.css';
import { demoEvents, demoRoutines, demoServices, FIXTURE_ORIGIN } from './fixtures';
import { resolveAnimate } from './scene-utils';
import { EcosystemScene } from './EcosystemScene';
import { InspectorDrawer, type InspectorTab } from './InspectorDrawer';
import { ConversationDock } from './ConversationDock';
import { useEcosystemStore } from '../../lib/ecosystem.store';
import { useEcosystemView } from './useEcosystemView';
import { useExecutionRuns } from '../../lib/execution-runs.store';

const TABS = ['Visão 360°', 'Agentes', 'Rotinas'] as const;

export function Freds360Page() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Visão 360°');
  const store = useEcosystemStore();
  const { refresh } = useEcosystemView();
  const runs = useExecutionRuns((s) => s.runs);

  const moving = store.animate;
  const hidden = store.hiddenTab;
  const reduced = store.reducedMotion;
  const selected = store.selectedNodeId;
  const inspectorTab = store.selectedTab;
  const viewMode = store.viewMode;

  const scene = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // Resolve dados: reais quando disponíveis, senão fixtures explícitas
  const services =
    viewMode === 'real' && store.snapshot?.nodes?.length
      ? store.snapshot.nodes.map((n) => ({
          id: n.id,
          name: n.label,
          icon: demoServices.find((d) => d.id === n.id)?.icon ?? demoServices[0].icon,
          x: demoServices.find((d) => d.id === n.id)?.x ?? 50,
          y: demoServices.find((d) => d.id === n.id)?.y ?? 50,
          state: 'available' as const,
          stateLabel: `${n.kind} · ${n.capabilities.slice(0, 2).join(', ')}`,
          detail: `Fonte: ${n.sourceRefs.join(', ') || 'Graphify'}. Capacidades: ${n.capabilities.join(', ')}.`,
          category: n.kind === 'service' ? 'Serviço' : 'Repositório',
        }))
      : demoServices;

  const events =
    viewMode === 'real' && Object.values(runs).length > 0
      ? Object.values(runs)
          .filter((r) => !['complete', 'error', 'cancelled'].includes(r.stage))
          .slice(0, 3)
          .map((r) => ({
            time: new Date(r.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            agent: r.agentId,
            event: r.stage,
            kind: 'dev' as const,
          }))
      : demoEvents;

  const findings =
    viewMode === 'real' && store.snapshot?.findings?.length
      ? store.snapshot.findings
      : [];

  const animate = resolveAnimate(moving, hidden, reduced);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (selected && !el.open) el.showModal();
    else if (!selected && el.open) el.close();
  }, [selected]);

  function reset() {
    scene.current?.style.setProperty('--pan-x', '0px');
    scene.current?.style.setProperty('--pan-y', '0px');
  }
  useEffect(() => {
    if (!animate) reset();
  }, [animate]);

  function inspect(id: string) {
    store.setSelectedTab('Contexto');
    store.selectNode(id);
  }
  function inspectIntegrity(id: string) {
    store.setSelectedTab('Integridade');
    store.selectNode(id);
  }

  const active = services.find((s) => s.id === selected);
  const isDemo = viewMode === 'demo';

  return (
    <div className={`f360 ${animate ? 'f360-animate' : ''}`}>
      <header className="f360-header">
        <Link to="/freddy" className="f360-brand">
          <span className="f360-mark">✣</span>
          <strong>systentando</strong>
          <span>/ freds</span>
        </Link>
        <nav aria-label="Visões do Freds">
          {TABS.map((t) => (
            <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
              {t === tab && <i />}
              {t}
            </button>
          ))}
        </nav>
        <span className="f360-demo">
          <ShieldCheck size={13} /> {isDemo ? 'Demonstração' : 'Fontes reais'}
        </span>
      </header>
      <div className="f360-toolbar">
        <span>Seu ecossistema, em perspectiva.</span>
        <div>
          <button
            onClick={() => {
              reset();
              setTab('Visão 360°');
            }}
            aria-label="Enquadrar visão geral"
          >
            <Focus size={16} />
          </button>
          <button
            aria-pressed={!moving}
            onClick={() => store.setAnimate(!moving)}
            aria-label={moving ? 'Pausar movimento' : 'Ativar movimento'}
          >
            {moving ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => refresh()} aria-label="Recarregar fontes">
            ↻
          </button>
          <Link to="/office">
            Escritório <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      {tab === 'Visão 360°' ? (
        <EcosystemScene
          services={services}
          events={events}
          findings={findings}
          animate={animate}
          isDemo={isDemo}
          onInspect={inspect}
          onIntegrity={inspectIntegrity}
          sceneRef={scene}
          onReset={reset}
        />
      ) : (
        <section className="f360-secondary">
          <span className="f360-kicker">
            {tab === 'Agentes' ? 'ESPECIALISTAS E SERVIÇOS' : 'SEU RITMO DE TRABALHO'}
          </span>
          <h1>
            {tab === 'Agentes' ? 'Uma visão de cada conexão.' : 'Clareza para começar. Contexto para continuar.'}
          </h1>
          <p>
            {isDemo
              ? 'Prévia visual. Nenhuma conexão, execução ou rotina foi ativada por esta página.'
              : `Modo real. ${Object.values(runs).length} execuções carregadas. Fonte: ${FIXTURE_ORIGIN.replace('fixture:', '')}.`}
          </p>
          <div className="f360-service-list">
            {tab === 'Agentes'
              ? services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => inspect(s.id)}>
                      <Icon size={24} />
                      <strong>{s.name}</strong>
                      <small>{s.category}</small>
                      <ChevronRight size={16} />
                    </button>
                  );
                })
              : demoRoutines.map((r) => (
                  <article key={r.time}>
                    <time>{r.time}</time>
                    <h2>{r.title}</h2>
                    <p>{r.desc}</p>
                    <small>America/Fortaleza · proposta, não agendada</small>
                  </article>
                ))}
          </div>
          <Link to="/freddy">Abrir protótipo anterior →</Link>
        </section>
      )}
      <ConversationDock isDemo={isDemo} />
      <InspectorDrawer
        ref={dialog}
        service={active}
        tab={inspectorTab}
        onTab={(t) => store.setSelectedTab(t as InspectorTab)}
        onClose={() => store.resetSelection()}
        isDemo={isDemo}
        findings={findings}
      />
    </div>
  );
}
