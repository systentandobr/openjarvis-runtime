import { ChevronRight } from 'lucide-react';
import type { DemoService } from './fixtures';

/** Lista acessível equivalente à cena — completa, usada no mobile e como fallback de a11y. */
export function AccessibleServiceList({ services, onInspect, isDemo = true }: { services: DemoService[]; onInspect: (id: string) => void; isDemo?: boolean }) {
  return (
    <div className="f360-mobile-list">
      <h2>
        Serviços do ecossistema <small>{isDemo ? 'Prévia' : 'Real'}</small>
      </h2>
      {services.length === 0 && !isDemo && <p>Nenhum serviço na projeção atual.</p>}
      {services.map(s => {
        const Icon = s.icon;
        return (
          <button key={s.id} onClick={() => onInspect(s.id)}>
            <Icon size={18} />{s.name}<ChevronRight size={15} />
          </button>
        );
      })}
    </div>
  );
}
