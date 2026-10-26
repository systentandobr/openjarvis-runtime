import { useEffect, useRef, useState } from 'react';
import { AgentOffice, runLabels } from '../components/Office/AgentOffice';
import { useExecutionRuns, type ExecutionRun } from '../lib/execution-runs.store';
import { fetchManagedAgents, openFredsSupervision } from '../lib/api';
import { useAgentEvents } from '../lib/useAgentEvents';

const initialDemo = (): ExecutionRun[] => Array.from({length:17}, (_,i) => ({
  id:`demo-${i}`, agentId:['Arquiteto','Developer','QA','UX','Integrações'][i%5]+' '+(i+1),
  sessionId:['Engenharia · Freds','Qualidade · Freds','Design · Freds','Operações · Freds'][i%4],
  stage:i===1?'cancel_unconfirmed':i===3?'waiting_approval':i===4?'error':i===8?'complete':'executing', sequence:1,
  updatedAt:new Date().toISOString(), provider:['CLI A','CLI B','Local'][i%3],model:['Modelo A','Modelo B','Modelo C'][i%3],
  accountAlias:i%4===3?'Pessoal · exemplo':'Empresa · exemplo',quota5h:Math.max(5,85-i*4),quotaWeek:Math.max(10,90-i*3),
  routingReason:i%3===0?'Exemplo: tarefa com dependências entre projetos, modelo de maior capacidade proposto.':'Exemplo: rotina de escopo reduzido, modelo de menor custo proposto.',
  tokensUsed:1000+i*234,tokenLimit:30000,cancellationScope:'local_handler',
  message:'Demonstração: atividade simulada, sem executar ferramentas.',
}));
const statusText: Record<string,string> = {connecting:'Conectando',connected:'Conectado',disconnected:'Desconectado',unconfigured:'Bridge não configurada',demo:'Demonstração',snapshot:'Snapshot de agentes'};

export function OfficePage() {
  const [source,setSource]=useState<'demo'|'native'|'friendly'>('friendly');
  const [demo,setDemo]=useState(initialDemo), [native,setNative]=useState<ExecutionRun[]>([]);
  const [status,setStatus]=useState('connecting'), [error,setError]=useState('');
  const [selected,setSelected]=useState<string|null>(null), [view,setView]=useState<'office'|'list'>('office');
  const [target,setTarget]=useState<ExecutionRun|null>(null), [retry,setRetry]=useState(0);
  const cancelDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(target)cancelDialog.current?.showModal();else cancelDialog.current?.close();},[target]);
  const sourceRef=useRef(source); sourceRef.current=source;
  const bridge=useRef<ReturnType<typeof openFredsSupervision>|null>(null);
  const timeouts=useRef<ReturnType<typeof setTimeout>[]>([]);
  const live=useExecutionRuns(s=>s.runs);
  const [session,setSession]=useState(''), [device,setDevice]=useState('');
  const runs=source==='demo'?demo:source==='native'?native:Object.values(live);
  const sessions=[...new Set(runs.map(r=>r.sessionId))];
  const devices=[...new Set(runs.map(r=>r.deviceId).filter((id):id is string=>!!id))];
  const visible=runs.filter(r=>(!session||r.sessionId===session)&&(!device||r.deviceId===device));
  const active=visible.find(r=>r.id===selected);
  async function refreshNative() {
    try {
      const agents=await fetchManagedAgents();
      if(sourceRef.current!=='native')return;
      setNative(agents.map(a=>({id:a.id,agentId:a.name,sessionId:'Agentes nativos do OpenJarvis',
        observationKind:'agent_snapshot',stage:a.status==='running'?'executing':a.status==='error'?'error':a.status==='paused'?'paused':a.status==='idle'?'idle':'attention',sequence:0,
        updatedAt:new Date(a.updated_at*1000).toISOString(),model:typeof a.config.model==='string'?a.config.model:undefined,
        totalTokens:a.total_tokens,message:a.current_activity||a.status})));
      setStatus('snapshot');setError('');
    } catch {if(sourceRef.current==='native'){setStatus('disconnected');setError('Não foi possível consultar os agentes nativos.');}}
  }
  useAgentEvents(source==='native'?active?.id:undefined,()=>{void refreshNative();});
  useEffect(()=>{
    setSelected(null);setSession('');setDevice('');setError('');setTarget(null);
    useExecutionRuns.getState().reset();
    if(source==='demo')setStatus('demo');
    else if(source==='native')void refreshNative();
    else {
      try {bridge.current=openFredsSupervision(frame=>useExecutionRuns.getState().ingest(frame),setStatus);}
      catch {setStatus('disconnected');}
    }
    return ()=>{bridge.current?.close();bridge.current=null;timeouts.current.forEach(clearTimeout);timeouts.current=[];};
  },[source,retry]);
  function cancel(run:ExecutionRun) {
    setTarget(null);
    if(source==='demo') {setDemo(prev=>prev.map(r=>r.id===run.id?{...r,stage:'cancel_requested'}:r));return;}
    if(source!=='friendly')return;
    const requestId=crypto.randomUUID();
    if(!bridge.current?.cancel({execution_id:run.id,agent_id:run.agentId,session_id:run.sessionId,request_id:requestId})){
      setError('Sem conexão: a solicitação não foi enviada.');return;
    }
    useExecutionRuns.getState().requestCancel(run.id,requestId);
    timeouts.current.push(setTimeout(()=>useExecutionRuns.getState().unconfirmed(run.id,requestId),15000));
  }
  const button='px-3 py-2 rounded-lg border border-slate-700 text-sm hover:border-lime-300 disabled:opacity-40';
  return <div className="h-full min-h-0 flex flex-col bg-[#0b1014] text-slate-100">
    <header className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs text-lime-300 tracking-widest uppercase">Freds · seu assistente</p><h1 className="text-xl font-medium">Seu ecossistema, ao redor do Freds.</h1><p className="text-sm text-slate-400">Objetivos, especialistas e decisões em um só escritório.</p></div>
      <a href="/" className={button}>Conversar com Freds</a>
    </header>
    <div className="p-3 border-b border-slate-800 flex gap-2 flex-wrap items-center">
      {(['demo','native','friendly'] as const).map(value=><button key={value} className={button} aria-pressed={source===value} onClick={()=>setSource(value)}>{value==='demo'?'Mockup do vídeo':value==='native'?'Agentes OpenJarvis':'Friendly / Freds'}</button>)}
      <span className="text-xs text-slate-400 ml-auto" role="status">{statusText[status]||status}</span>
      {source!=='demo'&&<button className={button} onClick={()=>{if(source==='friendly'&&bridge.current?.requestSnapshot()){/* snapshot solicitado via bridge ativa */}else{setRetry(n=>n+1);}}}>Reconectar / atualizar</button>}
    </div>
    <div className="px-4 py-2 text-xs text-slate-400 flex flex-wrap gap-3 items-center">
      <span>{source==='demo'?'SIMULAÇÃO · 17 agentes / 4 operações · nenhum gasto ou envio real':source==='native'?'Snapshot nativo: tokens acumulados do agente, sem inferir uma execução ou interromper processos.':'Eventos e snapshots do Friendly · monitoramento operacional reconciliado em tempo real.'}</span>

      <label>Sessão <select className="bg-slate-900 p-1" value={session} onChange={e=>setSession(e.target.value)}><option value="">Todas nesta fonte</option>{sessions.map(s=><option key={s}>{s}</option>)}</select></label>
      {!!devices.length&&<label>Dispositivo <select className="bg-slate-900 p-1" value={device} onChange={e=>setDevice(e.target.value)}><option value="">Escolha um dispositivo</option>{devices.map(d=><option key={d}>{d}</option>)}</select></label>}
      <button className={button} onClick={()=>setView(v=>v==='office'?'list':'office')}>{view==='office'?'Ver lista':'Ver escritório'}</button>
    </div>
    {error&&<p className="p-3 text-amber-300" role="alert">{error}</p>}
    {source==='friendly'&&status!=='connected'&&<p className="px-4 py-2 text-amber-200 text-sm">A fonte usa a bridge autenticada do servidor. Sem conexão, o estado pode estar desatualizado.</p>}
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] overflow-auto lg:overflow-hidden">
      <div className="min-h-[420px] lg:min-h-0">
        {view==='office'?<AgentOffice runs={visible} selectedId={selected} onSelect={setSelected} demo={source==='demo'} snapshots={source==='native'}/>:<div className="p-4 h-full overflow-auto space-y-2">{visible.map(r=><button className={button+' block w-full text-left'} key={r.id} onClick={()=>setSelected(r.id)}>{r.agentId} · {runLabels[r.stage]}<span className="block text-xs text-slate-400">{r.sessionId}</span></button>)}</div>}
      </div>
      <aside className="p-5 lg:overflow-auto border-l border-slate-800 bg-[#11191e]">
        <h2 className="font-medium mb-3">Freds acompanha com você</h2>
        <p className="text-xs text-slate-400 mb-5">O escritório mostra o trabalho observado. Pedidos e aprovações reais continuam nos fluxos de agentes e conversa existentes.</p>
        {!active?<div className="text-sm text-slate-400 space-y-3"><p>{visible.filter(r=>r.stage==='executing').length} em trabalho</p><p>{visible.filter(r=>r.stage==='waiting_approval').length} aprovações pendentes</p><p>{visible.filter(r=>['cancel_requested','cancel_unconfirmed'].includes(r.stage)).length} interrupções sem confirmação</p><p>Selecione uma mesa para inspecionar.</p></div>:<>
          <h3 className="text-lg mb-2">{active.agentId}</h3><p className="text-lime-300 mb-4">{runLabels[active.stage]}</p>
          {source==='demo'&&active.stage==='waiting_approval'&&<div className="p-3 mb-4 rounded-lg border border-amber-600 text-sm"><p>Freds aguarda sua decisão: permitir uma tentativa de fallback para CLI B / Modelo B, mudando a conta de {active.accountAlias} para Empresa (exemplo)?</p><p className="text-xs text-slate-400 my-2">Apenas simulação; não envia contexto nem consome créditos.</p><div className="flex gap-2 flex-wrap"><button className={button} onClick={()=>setDemo(prev=>prev.map(r=>r.id===active.id?{...r,stage:'executing',provider:'CLI B',model:'Modelo B',accountAlias:'Empresa · exemplo',routingReason:'Fallback e troca de conta aprovados uma vez na simulação.',message:'Aprovação simulada recebida; tentativa de exemplo iniciada.'}:r))}>Aprovar na simulação</button><button className={button} onClick={()=>setDemo(prev=>prev.map(r=>r.id===active.id?{...r,stage:'paused',message:'Proposta simulada rejeitada; trabalho pausado.'}:r))}>Rejeitar na simulação</button></div></div>}
          <dl className="text-sm space-y-4 break-words">
            {[[active.observationKind==='agent_snapshot'?'Agente':'Execução',active.id],['Operação / sessão',active.sessionId],['Executor',active.executorUnitId||'Não informado'],['Dispositivo',active.deviceId||'Não informado'],['Plataforma / provedor',active.provider||'Não informado'],['Modelo',active.model||'Não informado'],['Conta',active.accountAlias||'Não informada'],['Motivo da rota',active.routingReason||'Não informado pelo executor'],['Atividade',active.message||'Não informada'],['Tokens da execução',active.tokensUsed===undefined?'Não informados':active.tokensUsed.toLocaleString()],['Tokens acumulados do agente',active.totalTokens===undefined?'Não informados':active.totalTokens.toLocaleString()],['Limite de tokens',active.tokenLimit===undefined?'Não informado':active.tokenLimit.toLocaleString()],['Cota de 5h restante',active.quota5h===undefined?'Não informada':active.quota5h+'%'],['Cota semanal restante',active.quotaWeek===undefined?'Não informada':active.quotaWeek+'%'],['Atualização',new Date(active.updatedAt).toLocaleTimeString()]].map(([k,v])=><div key={k}><dt className="text-xs text-slate-400">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {source!=='native'&&active.cancellationScope==='local_handler'&&!['complete','error','cancelled'].includes(active.stage)&&<button className={button+' mt-5 w-full text-rose-300'} disabled={active.stage==='cancel_requested'||(source==='friendly'&&status!=='connected')} onClick={()=>setTarget(active)}>Solicitar interrupção</button>}
          {source==='demo'&&active.stage==='cancel_requested'&&<div className="mt-3 space-y-2"><button className={button} onClick={()=>setDemo(prev=>prev.map(r=>r.id===active.id?{...r,stage:'cancelled'}:r))}>Simular ACK do executor</button><button className={button} onClick={()=>setDemo(prev=>prev.map(r=>r.id===active.id?{...r,stage:'cancel_unconfirmed'}:r))}>Simular ausência de ACK</button></div>}
          <p className="text-xs text-slate-400 mt-4">Interrupção confirma a saída do handler local. Jobs externos, arquivos alterados e gastos em voo podem permanecer.</p>
        </>}
        {source==='demo'&&<button className={button+' mt-5'} onClick={()=>{setDemo(initialDemo());setSelected(null);}}>Reiniciar demonstração</button>}
      </aside>
    </div>
    <dialog ref={cancelDialog} onCancel={()=>setTarget(null)} onClose={()=>setTarget(null)} className="m-auto p-0 bg-transparent text-slate-100 max-w-[calc(100%-40px)] backdrop:bg-black/75">{target&&<section className="bg-slate-900 border border-slate-600 rounded-xl p-6 max-w-lg" role="dialog" aria-modal="true" aria-labelledby="office-cancel-title"><h2 id="office-cancel-title" className="text-lg mb-3">Interromper {target.agentId}?</h2><p className="text-sm mb-3 break-words">Execução {target.id} · {target.sessionId}</p><p className="text-sm text-slate-400 mb-5">Será solicitado o cancelamento deste handler. Aguarde a confirmação; ausência de resposta não significa encerramento.</p><div className="flex gap-3"><button autoFocus className={button} onClick={()=>setTarget(null)}>Voltar</button><button className={button+' text-rose-300'} onClick={()=>cancel(target)}>Solicitar interrupção</button></div></section>}</dialog>
  </div>;
}
