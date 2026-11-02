import { AudioLines, Mic, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface Props {
  isDemo?: boolean;
  /** true quando o transporte de conversa real está conectado (F360-09/FR-03). */
  connected?: boolean;
}

/** Dock conversacional — integra FR-03/FR-06 quando disponíveis.
 *  Enquanto o transporte real não existe, o modo operacional indica
 *  'não conectado' — nunca afirma envio que não aconteceu.
 *  Modo demo explícito: não captura áudio nem executa ações. */
export function ConversationDock({ isDemo = true, connected = false }: Props) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState(
    isDemo ? 'Uma integração precisa da sua atenção.' : 'Observatório somente leitura — monitoramento ativo.'
  );

  function send() {
    if (!message.trim()) return;
    if (isDemo) {
      setReply(`Objetivo recebido na prévia: "${message.trim()}". A conversa real será conectada na próxima etapa.`);
    }
    setMessage('');
  }

  const disabled = !isDemo && !connected;

  return (
    <footer className="f360-conversation">
      <p className="f360-response" role="status"><i />{reply}</p>
      <form onSubmit={e => { e.preventDefault(); send(); }}>
        <AudioLines className="f360-dock-wave" size={28} />
        <input
          aria-label={isDemo ? 'Objetivo para o Freds, simulação' : 'Objetivo para o Freds — conversa não conectada'}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={
            isDemo
              ? 'Fale com o Freds ou escreva um objetivo…'
              : 'Conversa ainda não conectada — monitoramento somente leitura'
          }
          disabled={disabled}
        />
        <button
          type="button"
          aria-label="Informações sobre voz"
          onClick={() =>
            setReply(
              isDemo
                ? 'Voz ainda não conectada nesta prévia. O microfone não foi ativado.'
                : 'Voz não disponível — capacidade ausente renderizada, não simulada.'
            )
          }
        >
          <Mic size={20} />
        </button>
        <button
          type="submit"
          aria-label={isDemo ? 'Enviar objetivo demonstrativo' : 'Enviar objetivo — indisponível'}
          disabled={!message.trim() || disabled}
        >
          <Send size={19} />
        </button>
      </form>
      <div className="f360-bottom">
        <span><ShieldCheck size={12} /> Ações sensíveis aguardam sua aprovação</span>
        <small>{isDemo ? 'Conceito visual · dados simulados' : 'Observatório real · somente leitura'}</small>
      </div>
    </footer>
  );
}
