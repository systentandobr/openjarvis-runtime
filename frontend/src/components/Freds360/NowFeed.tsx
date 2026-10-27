import { ChevronRight } from 'lucide-react';
import type { DemoEvent } from './fixtures';

export function NowFeed({ events, onInspect }: { events: DemoEvent[]; onInspect: (id: string) => void }) {
  return (
    <aside className="f360-now f360-glass">
      <h2><i /> Agora <small>exemplos</small></h2>
      {events.map(e => (
        <button key={e.kind} onClick={() => onInspect('core')}>
          <time>{e.time}</time>
          <span className={`f360-event-dot ${e.kind}`} />
          <span><strong>{e.agent}</strong><small>{e.event}</small></span>
          <ChevronRight size={12} />
        </button>
      ))}
    </aside>
  );
}
