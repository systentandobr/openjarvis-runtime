import { AudioLines, Mic, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface Props {
  isDemo?: boolean;
}

/** Dock conversacional — integra FR-03/FR-06 quando disponíveis.
 *  Modo demo explícito: não captura áudio nem executa ações. */
export function ConversationDock({ isDemo = true }: Props) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('Uma integração precisa da sua atenção.');
  function send() {
    if (!message.trim()) return;
    if (isDemo) {
      setReply(`Objetivo recebido na prévia: "${message.trim()}". A conversa real será conectada na próxima etapa.`);
    } else {
      setReply(`Objetivo enviado: "${message.trim()}". Aguardando resposta do Freds…`);
    }
    setMessage('');
  }
  return (
    <footer className="f360-conversation">
      <p className="f360-response" role="status"><i />{reply}</p>
      <form onSubmit={e => { e.preventDefault(); send(); }}>
        <AudioLines className="f360-dock-wave" size={28} />
        <input
          aria-label={isDemo ? 'Objetivo para o Freds, simulação' : 'Objetivo para o Freds'}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Fale com o Freds ou escreva um objetivo…"
        />
        <button type="button" aria-label="Informações sobre voz" onClick={() => setReply(isDemo ? 'Voz ainda não conectada nesta prévia. O microfone não foi ativado.' : 'Voz: integração em desenvolvimento.')}>
          <Mic size={20} />
        </button>
        <button type="submit" aria-label={isDemo ? 'Enviar objetivo demonstrativo' : 'Enviar objetivo'} disabled={!message.trim()}>
          <Send size={19} />
        </button>
      </form>
      <div className="f360-bottom">
        <span><ShieldCheck size={12} /> Ações sensíveis aguardam sua aprovação</span>
        <small>{isDemo ? 'Conceito visual · dados simulados' : 'Modo real · verificar fontes'}</small>
      </div>
    </footer>
  );
}
