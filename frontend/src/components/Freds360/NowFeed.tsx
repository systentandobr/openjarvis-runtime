import { ChevronRight, CircleHelp } from 'lucide-react';
import type { DemoEvent } from './fixtures';
import type { SourceStatus } from '../../types/ecosystem';
import type { SceneAgent } from './EcosystemScene';

interface Props {
  events: DemoEvent[];
  unmapped?: SceneAgent[];
  onInspect: (id: string) => void;
  isDemo?: boolean;
  activityStatus?: SourceStatus;
}

const STATUS_LABEL: Record<SourceStatus, string> = {
  loading: 'conectando',
  ready: 'tempo real',
  stale: 'reconectando',
  unavailable: 'desconectado',
  unauthorized: 'sem acesso',
};

export function NowFeed({ events, unmapped = [], onInspect, isDemo = true, activityStatus = 'unavailable' }: Props) {
  return (
    <aside className="f360-now f360-glass">
      <h2>
        <i /> Agora{' '}
        <small>{isDemo ? 'exemplos' : STATUS_LABEL[activityStatus]}</small>
      </h2>
      {events.length === 0 && !isDemo && (
        <div className="f360-feed-empty">
          {activityStatus === 'ready'
            ? 'Nenhuma execução observada no momento.'
            : 'Atividade indisponível — conexão de supervisão não estabelecida.'}
        </div>
      )}
      {events.map((e, idx) => (
        <button key={`${e.kind}-${idx}`} onClick={() => onInspect(e.runId ? `agent:${e.agent}` : 'core')}>
          <time>{e.time}</time>
          <span className={`f360-event-dot ${e.kind}`} />
          <span>
            <strong>{e.agent}</strong>
            <small>{e.event}</small>
          </span>
          <ChevronRight size={12} />
        </button>
      ))}
      {!isDemo && unmapped.length > 0 && (
        <div className="f360-feed-unmapped">
          <span>
            <CircleHelp size={13} /> Não mapeadas ({unmapped.length})
          </span>
          {unmapped.slice(0, 4).map((a) => (
            <button key={a.id} onClick={() => onInspect(a.id)}>
              <small>{a.agentId}</small>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
