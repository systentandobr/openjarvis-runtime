import { TriangleAlert } from 'lucide-react';
import type { DemoService } from './fixtures';

export function ServiceNode({ service, onInspect }: { service: DemoService; onInspect: (id: string) => void }) {
  const Icon = service.icon;
  return (
    <button
      className={`f360-node f360-node-${service.id}`}
      style={{ left: `${service.x}%`, top: `${service.y}%` }}
      onClick={() => onInspect(service.id)}
      aria-label={`${service.name}, ${service.stateLabel}. Abrir detalhes.`}
    >
      <span className="f360-node-icon"><Icon size={23} /></span>
      <span><strong>{service.name}</strong><small><i />{service.stateLabel}</small></span>
      {service.state === 'attention' && <TriangleAlert size={16} className="f360-alert-icon" />}
    </button>
  );
}
