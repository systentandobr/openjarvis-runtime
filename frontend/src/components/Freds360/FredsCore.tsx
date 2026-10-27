import { AudioLines } from 'lucide-react';

/** Núcleo abstrato do Freds — independente do estado operacional das fontes. */
export function FredsCore() {
  return (
    <div className="f360-core">
      <div className="f360-core-rings" aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} />)}</div>
      <strong>FREDS</strong>
      <span>Observando o ecossistema</span>
      <AudioLines size={29} />
      <small>CENA DEMONSTRATIVA</small>
    </div>
  );
}
