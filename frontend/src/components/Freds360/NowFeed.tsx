import { ChevronRight } from 'lucide-react';
import type { DemoEvent } from './fixtures';

interface Props {
  events: DemoEvent[];
  onInspect: (id: string) => void;
  isDemo?: boolean;
}

export function NowFeed({ events, onInspect, isDemo = true }: Props) {
  return (
    <aside className="f360-now f360-glass">
      <h2><i /> Agora <small>{isDemo ? 'exemplos' : 'execuções ativas'}</small></h2>
      {events.length === 0 && (
        <div className="f360-feed-empty">Nenhum evento ativo no momento.</div>
      )}
      {events.map((e, idx) => (
        <button key={`${e.kind}-${idx}`} onClick={() => onInspect('core')}>
          <time>{e.time}</time>
          <span className={`f360-event-dot ${e.kind}`} />
          <span><strong>{e.agent}</strong><small>{e.event}</small></span>
          <ChevronRight size={12} />
        </button>
      ))}
    </aside>
  );
}
