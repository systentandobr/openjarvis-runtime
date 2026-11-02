import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import type { DemoEvent, DemoService } from './fixtures';
import { demoStars } from './fixtures';
import { parallaxDelta } from './scene-utils';
import { FredsCore } from './FredsCore';
import { ServiceNode } from './ServiceNode';
import { NowFeed } from './NowFeed';
import { SentinelSummary } from './SentinelSummary';
import { ProvenanceLegend } from './ProvenanceLegend';
import { AccessibleServiceList } from './AccessibleServiceList';
import type { IntegrityFinding, ServiceState, SourceStatus } from '../../types/ecosystem';
import type { SourceKey } from '../../lib/ecosystem-api';

export interface SceneAgent {
  id: string;
  agentId: string;
  label: string;
  x: number;
  y: number;
  state: ServiceState;
  stateLabel: string;
  runId?: string;
  count?: number;
  mapped?: string | null;
}

interface Props {
  services: DemoService[];
  agents: SceneAgent[];
  events: DemoEvent[];
  findings: IntegrityFinding[];
  unmapped: SceneAgent[];
  animate: boolean;
  isDemo: boolean;
  sourceStatus: Record<SourceKey, SourceStatus>;
  onInspect: (id: string) => void;
  onIntegrity: (id: string) => void;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  onReset: () => void;
}

/** Renderer da cena — SVG com coordenadas determinísticas + overlays DOM acessíveis.
 *  Serviços na órbita externa, agentes (runs reais) na órbita interna.
 *  Partículas só correm em links com atividade confirmada. */
export function EcosystemScene({ services, agents, events, findings, unmapped, animate, isDemo, sourceStatus, onInspect, onIntegrity, sceneRef, onReset }: Props) {
  const frame = useRef<number | null>(null);
  const lastDelta = useRef<[number, number]>([0, 0]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!animate || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const dx = parallaxDelta(x);
    const dy = parallaxDelta(y);
    if (dx === lastDelta.current[0] && dy === lastDelta.current[1]) return;
    lastDelta.current = [dx, dy];
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      sceneRef.current?.style.setProperty('--pan-x', `${dx}px`);
      sceneRef.current?.style.setProperty('--pan-y', `${dy}px`);
    });
  }

  return (
    <div className="f360-stage" ref={sceneRef} onPointerMove={handlePointerMove} onPointerLeave={onReset}>
      <div className="f360-universe" aria-hidden="true">
        <svg viewBox="0 0 1000 660" preserveAspectRatio="none">
          {demoStars.map((s, i) => (
            <g key={i}>
              {i > 0 && <line x1={demoStars[i - 1].x} y1={demoStars[i - 1].y} x2={s.x} y2={s.y} />}
              <circle cx={s.x} cy={s.y} r={s.r} />
            </g>
          ))}
        </svg>
      </div>
      <div className="f360-horizon" aria-hidden="true" />
      <div className="f360-map">
        <svg className="f360-links" viewBox="0 0 1000 660" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="f360-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0 0 L5 2.5 L0 5" fill="currentColor" />
            </marker>
          </defs>
          {services.map((s, i) => {
            const d = `M500 335 Q${s.x * 10 + (i % 2 ? 50 : -50)} 335 ${s.x * 10} ${s.y * 6.6}`;
            return (
              <g key={s.id} className={s.state === 'attention' ? 'f360-warning-link' : s.state === 'unknown' ? 'f360-unknown-link' : s.state === 'offline' ? 'f360-offline-link' : ''}>
                <path id={`f360-path-${s.id}`} d={d} markerEnd="url(#f360-arrow)" />
                {s.state === 'available' && (
                  <circle className="f360-particle" r="2.5">
                    <animateMotion dur={`${4 + i * 0.7}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
          <ellipse cx="500" cy="335" rx="300" ry="220" className="f360-orbit" />
          <ellipse cx="500" cy="335" rx="190" ry="150" className="f360-orbit" />
        </svg>
        <FredsCore isDemo={isDemo} />
        {services.map((s) => (
          <ServiceNode key={s.id} service={s} onInspect={onInspect} />
        ))}
        {agents.map((a) => (
          <button
            key={a.id}
            className={`f360-agent f360-agent-${a.state}`}
            style={{ left: `${a.x}%`, top: `${a.y}%` }}
            onClick={() => onInspect(a.id)}
            aria-label={`Agente ${a.agentId}, ${a.stateLabel}. Abrir detalhes.`}
          >
            <span>
              <Bot size={16} />
            </span>
            <small>
              {a.label}
              {a.count && a.count > 1 ? ` ×${a.count}` : ''}
            </small>
          </button>
        ))}
      </div>
      <NowFeed events={events} unmapped={unmapped} onInspect={onInspect} isDemo={isDemo} activityStatus={sourceStatus.activity} />
      <SentinelSummary onInspect={onInspect} onIntegrity={onIntegrity} findings={findings} isDemo={isDemo} integrityStatus={sourceStatus.integrity} />
      <ProvenanceLegend isDemo={isDemo} sourceStatus={sourceStatus} />
      <AccessibleServiceList services={services} onInspect={onInspect} isDemo={isDemo} />
    </div>
  );
}
