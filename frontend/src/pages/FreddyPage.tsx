import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, AudioLines, BrainCircuit, CalendarDays, Check, ChevronRight, CirclePause, Database, Mic, Network, Send, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';
import './freddy.css';

const agents = [
  { name: 'Gestor', role: 'Atendimento e orçamentos', icon: '◈', detail: 'Consulta da unidade, atendimento e revisão de orçamentos. Conexão autenticada ainda precisa ser validada no OpenJarvis.' },
  { name: 'Dorama', role: 'Produção e narrativas', icon: '▷', detail: 'Projetos, episódios, roteiro e produção. Gerar mídia e publicar exigem permissões próprias.' },
  { name: 'Documentos', role: 'Conhecimento e evidências', icon: '▤', detail: 'Document-orchestrator: documentos e bases de conhecimento. Um datasource indexa conteúdo; uma ferramenta MCP executa operações.' },
  { name: 'Freds', role: 'Backlog e especialistas', icon: '✳', detail: 'O escritório já possui bridge de eventos e cancelamento. Despacho precisa de uma ferramenta autenticada própria.' },
  { name: 'Publicação', role: 'Postiz e redes sociais', icon: '↗', detail: 'Canais, revisão editorial e entrega. A configuração de Postiz não implica autorização para publicação automática.' },
  { name: 'Investimentos', role: 'Pesquisa e MetaTrader', icon: '⌁', detail: 'Acompanhamento proposto de pesquisa e posições. Este protótipo não envia ordens nem se conecta a uma conta financeira.' },
];
const initial = 'Bom dia. Vamos organizar o que merece sua atenção?';
export function FreddyPage() {
  const [tab, setTab] = useState('Visão geral');
  const [selected, setSelected] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState(initial);
  const [enabled, setEnabled] = useState([true, true]);
  const [notice, setNotice] = useState('');
  function ask(text: string) {
    if (!text.trim()) return;
    setAnswer(`Prévia de “${text.trim()}”: eu consultaria as fontes autorizadas, apresentaria até três prioridades e destacaria o que precisa da sua confirmação. Nenhuma consulta ou execução real foi iniciada.`);
    setInput('');
  }
  return <div className="freddy">
    <header className="fy-header"><Link to="/freddy" className="fy-brand"><BrainCircuit size={25} /><span>freddy<span className="fy-brand-dot">.</span><small>ASSISTANT</small></span></Link><div className="fy-header-right"><Link to="/freddy/360">Freds 360° <ArrowUpRight size={14}/></Link><span className="fy-preview">PROTÓTIPO INTERATIVO</span><Link to="/office">Abrir escritório <ArrowUpRight size={14}/></Link></div></header>
    <div className="fy-heading"><div><div className="fy-eyebrow">SYSTENTANDO · SEU CENTRO DE OPERAÇÕES</div><h1>Uma conversa.<br/><span>Todo o seu ecossistema.</span></h1><p>Contexto para decidir. Especialistas para avançar.</p></div><button className="fy-outline" onClick={()=>setTab('Integrações')}><Settings2 size={15}/> Gerenciar conexões</button></div>
    <nav className="fy-tabs" aria-label="Visões do assistente">{['Visão geral','Rotinas','Integrações'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}<span><i/> Ambiente de demonstração</span></nav>
    {tab==='Visão geral' && <>
      <div className="fy-main-grid"><section className="fy-orbit-card"><div className="fy-section-label"><Network size={14}/> ORQUESTRAÇÃO <span>6 especialistas propostos</span></div><div className="fy-orbit"><div className="fy-ring fy-ring-outer"/><div className="fy-ring fy-ring-inner"/>
        <div className={`fy-core ${listening?'listening':''}`}><div className="fy-core-symbol"><AudioLines size={46}/></div><strong>Freddy</strong><span>{listening?'Simulando escuta':'Seu assistente pessoal'}</span><small>PRÉVIA · SEM INFERÊNCIA</small></div>
        {agents.map((a,i)=><button key={a.name} className={`fy-agent fy-agent-${i}`} onClick={()=>setSelected(i)}><span className="fy-agent-icon">{a.icon}</span><strong>{a.name}</strong><small>{a.role}</small><em>Conexão a validar</em></button>)}
      </div><div className="fy-orbit-footer"><ShieldCheck size={15}/><span>Você decide o objetivo. Cada ação respeita suas permissões.</span></div></section>
      <aside className="fy-attention"><div className="fy-section-label">SEU DIA, EM FOCO <Sparkles size={15}/></div><h2>O que vem primeiro?</h2><p className="fy-muted">Exemplos do seu futuro resumo. Sem dados operacionais reais.</p>{[
        ['01','Atender antes de produzir','Clientes aguardando resposta e orçamentos próximos do prazo.','Gestor'],
        ['02','Destravar o próximo passo','Dependências e decisões que impedem o avanço dos agentes.','Freds'],
        ['03','Preparar a próxima entrega','Revisar roteiros, documentos e conteúdos antes da publicação.','Dorama + Postiz'],
      ].map(([n,t,d,s])=><button className="fy-priority" key={n} onClick={()=>ask(t)}><span>{n}</span><div><strong>{t}</strong><p>{d}</p><small>{s} · exemplo</small></div><ChevronRight size={16}/></button>)}<div className="fy-context"><span>UMA PERGUNTA ANTES DE AGIR</span><p>Hoje, a prioridade é atender clientes ou concluir uma entrega?</p><div>{['Atender clientes','Concluir entrega'].map(t=><button key={t} onClick={()=>ask(t)}>{t}</button>)}</div></div></aside></div>
      <section className="fy-conversation"><div className="fy-assistant-avatar"><Sparkles size={18}/></div><div className="fy-conversation-body"><span>FREDDY <small>· conversa demonstrativa</small></span><p aria-live="polite">{answer}</p><div className="fy-suggestions">{['Organize meu dia','Como estão os agentes?','O que precisa de mim?'].map(t=><button key={t} onClick={()=>ask(t)}>{t} <ArrowUpRight size={12}/></button>)}</div><form onSubmit={e=>{e.preventDefault();ask(input);}}><input aria-label="Mensagem para Freddy" placeholder="Diga ao Freddy o que você precisa…" value={input} onChange={e=>setInput(e.target.value)}/><button type="button" aria-label="Simular modo de voz" aria-pressed={listening} onClick={()=>{setListening(!listening);setNotice('Modo de voz apenas visual. Microfone e áudio não foram ativados.');}}>{listening?<CirclePause size={19}/>:<Mic size={19}/>}</button><button type="submit" aria-label="Enviar mensagem demonstrativa"><Send size={18}/></button></form><small>Simulação local. Sem uso de microfone, provedores ou tokens.</small></div></section>
    </>}
    {tab==='Rotinas' && <section className="fy-panel"><div className="fy-section-label"><CalendarDays size={16}/> RITMO DE TRABALHO</div><h2>Um dia acompanhado, sem ruído.</h2><p className="fy-muted">Os controles abaixo simulam a configuração nesta página. Nada será agendado ou persistido.</p><div className="fy-routines">{[['08:00','Clareza para começar','Agenda, atendimento, orçamentos e três prioridades justificadas.'],['15:00','Contexto para continuar','Mudanças, bloqueios, decisões pendentes e preparação do próximo dia.']].map(([time,title,desc],i)=><article key={time}><span className="fy-time">{time}</span><h3>{title}</h3><p>{desc}</p><small>America/Fortaleza · horário sugerido</small><button aria-pressed={enabled[i]} onClick={()=>setEnabled(enabled.map((v,j)=>i===j?!v:v))}>{enabled[i]?<Check size={15}/>:<CirclePause size={15}/>} {enabled[i]?'Ativa na simulação':'Pausada na simulação'}</button></article>)}</div><p>Em cada revisão: precisa de você · pode avançar · está bloqueado · contexto a confirmar.</p></section>}
    {tab==='Integrações' && <section className="fy-panel"><div className="fy-section-label"><Database size={16}/> CONECTAR O ECOSSISTEMA</div><h2>Cada fonte, com seu papel.</h2><p className="fy-muted">Estados de planejamento. Nenhuma conexão foi testada por este protótipo.</p><div className="fy-integration-grid">{agents.map((a,i)=><button key={a.name} onClick={()=>setSelected(i)}><span className="fy-agent-icon">{a.icon}</span><h3>{a.name}</h3><p>{a.role}</p><small>Requer configuração e validação</small><ArrowUpRight size={16}/></button>)}</div><div className="fy-integration-note"><ShieldCheck size={22}/><div><strong>Inteligência e credenciais no servidor</strong><p>OpenAI: configuração pendente. Modelo nano previsto para tarefas leves; voz exige uma integração de áudio própria. Chaves nunca entram nesta interface.</p><Link to="/settings">Configurações existentes →</Link> · <Link to="/data-sources">Fontes de dados existentes →</Link></div></div></section>}
    <footer className="fy-footer"><span>FREDDY ASSISTANT / CONCEPT 01</span><span>Planejar → confirmar → executar → aprender</span></footer>
    {notice && <div className="fy-notice" role="status">{notice}<button aria-label="Fechar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
    {selected!==null && <div className="fy-modal-backdrop" onClick={()=>setSelected(null)}><section role="dialog" aria-modal="true" aria-labelledby="fy-dialog-title" className="fy-modal"><button autoFocus className="fy-modal-close" aria-label="Fechar detalhes" onClick={()=>setSelected(null)}><X size={20}/></button><div onClick={e=>e.stopPropagation()}><span className="fy-eyebrow">INTEGRAÇÃO PROPOSTA</span><h2 id="fy-dialog-title">{agents[selected].name}</h2><p>{agents[selected].detail}</p><p className="fy-muted">Não conectado por esta página. Validar autenticação, unidade e capacidades antes de habilitar ações.</p><button className="fy-outline" onClick={()=>{setSelected(null);setTab('Integrações');}}>Ver integrações <ArrowUpRight size={14}/></button></div></section></div>}
  </div>;
}
