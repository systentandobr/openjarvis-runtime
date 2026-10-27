import { useRef } from 'react';
import { AudioLines, Bot, Focus, GitBranch } from 'lucide-react';
import type { DemoEvent, DemoService } from './fixtures';
import { demoStars } from './fixtures';
import { parallaxDelta } from './scene-utils';
import { FredsCore } from './FredsCore';
import { ServiceNode } from './ServiceNode';
import { NowFeed } from './NowFeed';
import { SentinelSummary } from './SentinelSummary';
import { ProvenanceLegend } from './ProvenanceLegend';
import { AccessibleServiceList } from './AccessibleServiceList';

interface Props {
  services: DemoService[];
  events: DemoEvent[];
  animate: boolean;
  onInspect: (id: string) => void;
  onIntegrity: (id: string) => void;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  onReset: () => void;
}

/** Renderer da cena — SVG com coordenadas determinísticas + overlays DOM acessíveis. */
export function EcosystemScene({ services, events, animate, onInspect, onIntegrity, sceneRef, onReset }: Props) {
  const frame = useRef<number | null>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!animate || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      sceneRef.current?.style.setProperty('--pan-x', `${parallaxDelta(x)}px`);
      sceneRef.current?.style.setProperty('--pan-y', `${parallaxDelta(y)}px`);
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
              <g key={s.id} className={s.state === 'attention' ? 'f360-warning-link' : s.state === 'offline' ? 'f360-offline-link' : ''}>
                <path id={`f360-path-${s.id}`} d={d} markerEnd="url(#f360-arrow)" />
                {s.state !== 'offline' && (
                  <circle className="f360-particle" r="2.5">
                    <animateMotion dur={`${4 + i * 0.7}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
          <ellipse cx="500" cy="335" rx="300" ry="220" className="f360-orbit" />
          <ellipse cx="500" cy="335" rx="210" ry="180" className="f360-orbit" />
        </svg>
        <FredsCore />
        {services.map(s => <ServiceNode key={s.id} service={s} onInspect={onInspect} />)}
        <button className="f360-agent f360-agent-dev" onClick={() => onInspect('core')}>
          <span><GitBranch size={16} /></span><AudioLines size={20} /><small>Developer</small>
        </button>
        <button className="f360-agent f360-agent-qa" onClick={() => onInspect('core')}>
          <span><Focus size={16} /></span><small>QA</small>
        </button>
        <button className="f360-agent f360-agent-arch" onClick={() => onInspect('core')}>
          <span><Bot size={16} /></span><small>Architect</small>
        </button>
      </div>
      <NowFeed events={events} onInspect={onInspect} />
      <SentinelSummary onInspect={onInspect} onIntegrity={onIntegrity} />
      <ProvenanceLegend />
      <AccessibleServiceList services={services} onInspect={onInspect} />
    </div>
  );
}
