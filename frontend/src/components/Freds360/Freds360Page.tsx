import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Bot, ChevronRight, FlaskConical, Focus, GitBranch, Pause, Play, ShieldCheck } from 'lucide-react';
import './freds360.css';
import { demoEvents, demoRoutines, demoServices, type DemoEvent, type DemoService } from './fixtures';
import { orbitPosition, ORBIT_AGENT, ORBIT_SERVICE, resolveAnimate } from './scene-utils';
import { EcosystemScene, type SceneAgent } from './EcosystemScene';
import { InspectorDrawer, type InspectorTab } from './InspectorDrawer';
import { ConversationDock } from './ConversationDock';
import { useEcosystemStore } from '../../lib/ecosystem.store';
import { useEcosystemView } from './useEcosystemView';
import { useExecutionRuns, type ExecutionRun } from '../../lib/execution-runs.store';
import { serviceForAgent, serviceLabel } from '../../lib/ecosystem-registry';
import type { ServiceState } from '../../types/ecosystem';

const TABS = ['Visão 360°', 'Agentes', 'Rotinas'] as const;
const TERMINAL = ['complete', 'error', 'cancelled'];

function stageState(stage: string): ServiceState {
  if (stage === 'executing' || stage === 'idle') return 'available';
  if (stage === 'waiting_approval' || stage === 'attention') return 'attention';
  return 'unknown';
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

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
  const isDemo = viewMode === 'demo';
  const sourceStatus = store.sourceStatus;
  const registryMap = store.snapshot?.registry?.agentServices;
  const findings = isDemo ? [] : (store.snapshot?.findings ?? []);
  const sessions = isDemo ? [] : (store.snapshot?.sessions ?? []);
  const runList = Object.values(runs);

  const scene = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // Serviços: projeção real (layout determinístico em órbita) ou fixtures só no demo explícito.
  // Estado por evidência: finding → attention; atividade observada → available; senão unknown.
  const services: DemoService[] = isDemo
    ? demoServices
    : (store.snapshot?.nodes ?? [])
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((n, i, arr) => {
          const pos = orbitPosition(i, arr.length, ORBIT_SERVICE.rx, ORBIT_SERVICE.ry);
          const hasFinding = findings.some((f) => f.serviceId === n.id);
          const active = runList.some(
            (r) => !TERMINAL.includes(r.stage) && serviceForAgent(r.agentId, registryMap) === n.id
          );
          return {
            id: n.id,
            name: n.label,
            icon: n.kind === 'repository' ? GitBranch : Bot,
            x: pos.x,
            y: pos.y,
            state: (hasFinding ? 'attention' : active ? 'available' : 'unknown') as ServiceState,
            stateLabel: hasFinding
              ? 'Finding de integridade'
              : active
                ? 'Atividade observada'
                : `${n.kind} · sem telemetria`,
            detail: `Fonte: ${n.sourceRefs.join(', ') || 'Graphify'}. Capacidades: ${n.capabilities.join(', ') || '—'}.`,
            category: n.kind === 'service' ? 'Serviço' : 'Repositório',
          };
        });

  // Agentes orbitais dinâmicos — agrupados por agentId, runs reais.
  // Desconhecidos ficam visíveis e contam em 'Não mapeadas' (nunca descartados).
  const agents: SceneAgent[] = isDemo
    ? [
        { id: 'agent:Developer', agentId: 'Developer', label: 'Developer', x: 62, y: 47, state: 'available', stateLabel: 'exemplo', count: 1 },
        { id: 'agent:QA', agentId: 'QA', label: 'QA', x: 62, y: 67, state: 'attention', stateLabel: 'exemplo', count: 1 },
        { id: 'agent:Architect', agentId: 'Architect', label: 'Architect', x: 30, y: 47, state: 'available', stateLabel: 'exemplo', count: 1 },
      ]
    : Object.values(
          runList
            .filter((r) => !TERMINAL.includes(r.stage))
            .reduce<Record<string, ExecutionRun[]>>((acc, r) => {
              (acc[r.agentId] ??= []).push(r);
              return acc;
            }, {})
        )
        .map((group) => {
          const top = group.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
          return {
            id: `agent:${top.agentId}`,
            agentId: top.agentId,
            label: top.agentId,
            x: 0,
            y: 0,
            state: stageState(top.stage),
            stateLabel: top.stage,
            runId: top.id,
            count: group.length,
            mapped: serviceForAgent(top.agentId, registryMap),
          };
        })
        .sort((a, b) => a.agentId.localeCompare(b.agentId))
        .map((a, i, arr) => ({ ...a, ...orbitPosition(i, arr.length, ORBIT_AGENT.rx, ORBIT_AGENT.ry) }));

  const unmapped = agents.filter((a) => !a.mapped);

  const events: DemoEvent[] = isDemo
    ? demoEvents
    : runList
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 8)
        .map((r) => ({
          time: fmtTime(r.updatedAt),
          agent: r.agentId,
          event: r.message || r.stage,
          kind: 'dev' as const,
          runId: r.id,
        }));

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

  const activeService = services.find((s) => s.id === selected);
  const activeAgent = agents.find((a) => a.id === selected);
  const activeRun = activeAgent?.runId ? runList.find((r) => r.id === activeAgent.runId) : null;
  const serviceRuns = activeService
    ? runList.filter((r) => serviceForAgent(r.agentId, registryMap) === activeService.id)
    : [];
  const active = activeService ?? (activeAgent
    ? {
        id: activeAgent.id,
        name: activeAgent.agentId,
        icon: Bot,
        x: activeAgent.x,
        y: activeAgent.y,
        state: activeAgent.state,
        stateLabel: activeAgent.stateLabel,
        detail: activeAgent.mapped
          ? `Agente associado a ${serviceLabel(activeAgent.mapped)}.`
          : 'Agente sem mapping no registry — permanece em Não mapeadas.',
        category: 'Agente',
      }
    : undefined);

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
          <ShieldCheck size={13} /> {isDemo ? 'Demonstração' : 'Observatório somente leitura'}
        </span>
      </header>
      <div className="f360-toolbar">
        <span>Seu ecossistema, em perspectiva.</span>
        <div>
          <button
            aria-pressed={isDemo}
            onClick={() => store.setDemoExplicit(!isDemo)}
            aria-label={isDemo ? 'Voltar ao monitoramento real' : 'Ver demonstração com dados simulados'}
            title={isDemo ? 'Voltar ao monitoramento real' : 'Demonstração'}
          >
            <FlaskConical size={16} />
          </button>
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
          agents={agents}
          events={events}
          findings={findings}
          unmapped={unmapped}
          animate={animate}
          isDemo={isDemo}
          sourceStatus={sourceStatus}
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
              : `Monitoramento real. ${runList.length} execuções observadas · ${sessions.length} sessões catalogadas.`}
          </p>
          <div className="f360-service-list">
            {tab === 'Agentes'
              ? (isDemo ? services : [...services, ...agents.map((a) => ({
                  id: a.id, name: a.label, icon: Bot, x: 0, y: 0,
                  state: a.state, stateLabel: a.stateLabel,
                  detail: '', category: 'Agente',
                }))]).map((s) => {
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
      <ConversationDock isDemo={isDemo} connected={false} />
      <InspectorDrawer
        ref={dialog}
        service={active}
        run={activeRun}
        serviceRuns={serviceRuns}
        sessions={sessions}
        tab={inspectorTab}
        onTab={(t) => store.setSelectedTab(t as InspectorTab)}
        onClose={() => store.resetSelection()}
        isDemo={isDemo}
        findings={findings}
        sourceStatus={sourceStatus}
      />
    </div>
  );
}
