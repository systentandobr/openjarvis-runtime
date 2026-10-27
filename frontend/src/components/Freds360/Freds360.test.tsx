import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Freds360Page } from './Freds360Page';
import { demoServices, demoStars, FIXTURE_ORIGIN } from './fixtures';
import { parallaxDelta, PARALLAX_MAX_PX, resolveAnimate } from './scene-utils';

function render() {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Freds360Page />
    </MemoryRouter>,
  );
}

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

describe('Freds360Page — marcação demo e a11y (static markup)', () => {
  it('marca a página como Demonstração e a cena como demonstrativa', () => {
    const html = render();
    expect(html).toContain('Demonstração');
    expect(html).toContain('CENA DEMONSTRATIVA');
    expect(html).toContain('dados simulados');
  });
  it('expõe lista acessível equivalente com todos os serviços', () => {
    const html = render();
    expect(html).toContain('Serviços do ecossistema');
    for (const s of demoServices) expect(html).toContain(s.name);
  });
  it('diálogo de inspeção existe com rótulo de fechamento', () => {
    const html = render();
    expect(html).toContain('class="f360-dialog"');
    expect(html).toContain('aria-label="Fechar detalhes"');
    expect(html).toContain('fixture de design');
  });
  it('classe de animação presente por padrão (controlável pelo usuário)', () => {
    const html = render();
    expect(html).toContain('f360-animate');
    expect(html).toContain('Pausar movimento');
  });
});
