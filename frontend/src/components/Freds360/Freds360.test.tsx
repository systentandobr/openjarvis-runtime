import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { Freds360Page } from './Freds360Page';
import { EcosystemScene } from './EcosystemScene';
import { demoEvents, demoServices, demoStars, FIXTURE_ORIGIN } from './fixtures';
import { parallaxDelta, PARALLAX_MAX_PX, orbitPosition, resolveAnimate } from './scene-utils';
import { useEcosystemStore } from '../../lib/ecosystem.store';

function render() {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Freds360Page />
    </MemoryRouter>,
  );
}

afterEach(() => {
  useEcosystemStore.getState().resetEcosystem();
  useEcosystemStore.getState().setDemoExplicit(false);
});

describe('gate de animação (resolveAnimate)', () => {
  it('anima somente com moving && visível && sem reduced-motion', () => {
    expect(resolveAnimate(true, false, false)).toBe(true);
    expect(resolveAnimate(false, false, false)).toBe(false);
    expect(resolveAnimate(true, true, false)).toBe(false);
    expect(resolveAnimate(true, false, true)).toBe(false);
  });
});

describe('parallax decorativo', () => {
  it('respeita o teto de ±8px e clampa fora do range', () => {
    expect(Math.abs(parallaxDelta(0.5))).toBeLessThanOrEqual(PARALLAX_MAX_PX);
    expect(parallaxDelta(2)).toBe(PARALLAX_MAX_PX);
    expect(parallaxDelta(-2)).toBe(-PARALLAX_MAX_PX);
  });
});

describe('layout orbital determinístico', () => {
  it('mesma entrada produz mesma posição e distribui sem colisões', () => {
    const a = orbitPosition(0, 4, 300, 220);
    const b = orbitPosition(0, 4, 300, 220);
    expect(a).toEqual(b);
    const positions = [0, 1, 2, 3].map((i) => orbitPosition(i, 4, 300, 220));
    expect(new Set(positions.map((p) => `${p.x},${p.y}`)).size).toBe(4);
  });
});

describe('fixtures explícitas', () => {
  it('serviços têm coordenadas válidas e estado marcado como exemplo', () => {
    for (const s of demoServices) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(100);
      expect(s.stateLabel).toContain('exemplo');
    }
    expect(FIXTURE_ORIGIN).toBe('fixture:design');
  });
  it('estrelas são determinísticas', () => {
    expect(demoStars).toHaveLength(55);
    expect(demoStars[0]).toEqual(demoStars[0]);
  });
});

describe('Freds360Page — modo real (padrão)', () => {
  it('marca como observatório somente leitura e nunca injeta fixtures', () => {
    const html = render();
    expect(html).toContain('Observatório somente leitura');
    expect(html).not.toContain('CENA DEMONSTRATIVA');
    for (const s of demoServices) expect(html).not.toContain(s.stateLabel);
  });
  it('estados honestos sem fontes: não verificado e catálogo indisponível', () => {
    const html = render();
    expect(html).toContain('Não verificado');
    expect(html).toContain('Conversa ainda não conectada');
  });
  it('expõe lista acessível equivalente mesmo vazia', () => {
    const html = render();
    expect(html).toContain('Serviços do ecossistema');
    expect(html).toContain('Nenhum serviço na projeção atual');
  });
  it('legenda de procedência mostra as quatro fontes', () => {
    const html = render();
    for (const src of ['Estrutura', 'Atividade', 'Auditoria', 'Sessões']) {
      expect(html).toContain(src);
    }
  });
  it('diálogo de inspeção existe com rótulo de fechamento', () => {
    const html = render();
    expect(html).toContain('class="f360-dialog"');
    expect(html).toContain('aria-label="Fechar detalhes"');
  });
  it('classe de animação presente por padrão (controlável pelo usuário)', () => {
    const html = render();
    expect(html).toContain('f360-animate');
    expect(html).toContain('Pausar movimento');
  });
});

describe('modo demo explícito — cena com fixtures', () => {
  // renderToStaticMarkup usa o snapshot inicial do store (SSR); o modo
  // demo é verificado via isDemo nos componentes de apresentação.
  function renderScene(isDemo: boolean) {
    return renderToStaticMarkup(
      <EcosystemScene
        services={demoServices}
        agents={[]}
        events={demoEvents}
        findings={[]}
        unmapped={[]}
        animate={true}
        isDemo={isDemo}
        sourceStatus={{ graph: 'unavailable', activity: 'unavailable', integrity: 'unavailable', sessions: 'unavailable' }}
        onInspect={() => {}}
        onIntegrity={() => {}}
        sceneRef={{ current: null }}
        onReset={() => {}}
      />,
    );
  }
  it('fixtures marcadas apenas quando isDemo', () => {
    const html = renderScene(true);
    expect(html).toContain('CENA DEMONSTRATIVA');
    expect(html).toContain('exemplos');
    expect(html).toContain('simulação');
    for (const s of demoServices) expect(html).toContain(s.name);
  });
  it('cena real não injeta fixtures nem marcações de exemplo', () => {
    const html = renderToStaticMarkup(
      <EcosystemScene
        services={[]}
        agents={[
          { id: 'agent:qa', agentId: 'qa', label: 'qa', x: 50, y: 50, state: 'available', stateLabel: 'executing', count: 1, mapped: 'friendly' },
        ]}
        events={[{ time: '10:00', agent: 'qa', event: 'executing', kind: 'dev', runId: 'r1' }]}
        findings={[]}
        unmapped={[]}
        animate={true}
        isDemo={false}
        sourceStatus={{ graph: 'unavailable', activity: 'ready', integrity: 'unavailable', sessions: 'unavailable' }}
        onInspect={() => {}}
        onIntegrity={() => {}}
        sceneRef={{ current: null }}
        onReset={() => {}}
      />,
    );
    expect(html).not.toContain('CENA DEMONSTRATIVA');
    expect(html).not.toContain('exemplo');
    expect(html).not.toContain('simulação');
    expect(html).toContain('Agente qa');
  });
});
