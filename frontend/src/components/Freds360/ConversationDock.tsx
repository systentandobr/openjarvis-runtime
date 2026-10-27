import { AudioLines, Mic, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

/** Dock demonstrativo — não captura áudio nem executa ações (fixture explícita). */
export function ConversationDock() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('Uma integração precisa da sua atenção.');
  function send() {
    if (!message.trim()) return;
    setReply(`Objetivo recebido na prévia: “${message.trim()}”. A conversa real será conectada na próxima etapa.`);
    setMessage('');
  }
  return (
    <footer className="f360-conversation">
      <p className="f360-response" role="status"><i />{reply}</p>
      <form onSubmit={e => { e.preventDefault(); send(); }}>
        <AudioLines className="f360-dock-wave" size={28} />
        <input
          aria-label="Objetivo para o Freds, simulação"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Fale com o Freds ou escreva um objetivo…"
        />
        <button type="button" aria-label="Informações sobre voz" onClick={() => setReply('Voz ainda não conectada nesta prévia. O microfone não foi ativado.')}>
          <Mic size={20} />
        </button>
        <button type="submit" aria-label="Enviar objetivo demonstrativo" disabled={!message.trim()}>
          <Send size={19} />
        </button>
      </form>
      <div className="f360-bottom">
        <span><ShieldCheck size={12} /> Ações sensíveis aguardam sua aprovação</span>
        <small>Conceito visual · dados simulados</small>
      </div>
    </footer>
  );
}
