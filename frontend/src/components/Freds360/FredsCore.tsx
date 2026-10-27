import { AudioLines } from 'lucide-react';

interface Props {
  isDemo?: boolean;
}

/** Núcleo abstrato do Freds — independente do estado operacional das fontes. */
export function FredsCore({ isDemo = true }: Props) {
  return (
    <div className="f360-core">
      <div className="f360-core-rings" aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} />)}</div>
      <strong>FREDS</strong>
      <span>Observando o ecossistema</span>
      <AudioLines size={29} />
      {isDemo && <small>CENA DEMONSTRATIVA</small>}
    </div>
  );
}
