import React from 'react';
import type { ExecutionRun } from '../../lib/execution-runs.store';

export const runLabels: Record<string,string> = { executing:'Executando', cancel_requested:'Interrupção solicitada', cancel_unconfirmed:'Sem confirmação de parada', cancelled:'Cancelado', complete:'Concluído', waiting_approval:'Aprovação pendente', error:'Falha', idle:'Aguardando', attention:'Precisa de atenção', paused:'Pausado' };
const colors: Record<string,string> = { waiting_approval:'#f5bc67', executing:'#c3ff00', cancel_requested:'#f5bc67', cancel_unconfirmed:'#f5bc67', cancelled:'#9aa6ba', complete:'#60c5ab', error:'#ff8795' };

/** Inspectable vector office, no animation loops or generated binary assets. */
export function AgentOffice({ runs, selectedId, onSelect, demo = false, snapshots = false }: {
    runs: ExecutionRun[]; selectedId: string | null; onSelect: (id: string) => void; demo?: boolean; snapshots?: boolean;
}) {
    const sessions = [...new Set(runs.map(r => r.sessionId))];
    const [page, setPage] = React.useState(0);
    const pages = Math.max(1,Math.ceil(sessions.length/4));
    const currentPage=Math.min(page,pages-1);
    const visible=sessions.slice(currentPage*4,currentPage*4+4);
    const point=(u:number,v:number) => [650+(u-v)*.72,40+(u+v)*.34];
    const polygon=(u:number,v:number,w:number,h:number) => [[u,v],[u+w,v],[u+w,v+h],[u,v+h]].map(([a,b])=>point(a,b).join(',')).join(' ');
    return <section className="flex flex-col h-full min-h-0 bg-[#0c1014] text-slate-200" aria-label="Escritório de agentes">
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-b border-slate-800">
            <div><h2 className="text-base font-medium">Escritório de agentes</h2><p className="text-xs text-slate-400">{runs.length} {snapshots ? 'agentes observados' : 'execuções'} · {sessions.length} {snapshots ? 'grupo' : 'sessões'} {demo ? '· demonstração simulada' : '· eventos do executor'}</p></div>
            <span className="text-xs text-lime-300">Selecione uma mesa para inspecionar</span>
        </div>
        {!runs.length ? <div className="m-auto p-8 max-w-lg text-center"><h3 className="mb-3">Aguardando execuções identificadas</h3><p className="text-sm text-slate-400">As mesas aparecem ao receber eventos com agente, sessão e execução. Uma mensagem de chat não comprova um agente ativo.</p></div> : <div className="flex-1 min-h-0 overflow-auto">
            <svg viewBox="0 0 1280 650" className="w-full h-full min-w-[600px] min-h-[280px]" role="group" aria-label="Planta do escritório, agrupada por sessão">
                <defs><pattern id="office-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#19222a" strokeWidth=".6"/></pattern></defs>
                <rect width="1280" height="860" fill="url(#office-grid)"/>
                {visible.map((session,index)=>{
                    const group=runs.filter(r=>r.sessionId===session);
                    const u=(index%2)*460,v=Math.floor(index/2)*410;
                    const [lx,ly]=point(u+30,v+40);
                    return <g key={session}>
                        <polygon points={polygon(u,v,380,330)} fill={index%2?'#24312d':'#302f28'} stroke="#516057" strokeWidth="2"/>
                        <polyline points={[point(u,v+330),point(u,v),point(u+380,v)].map(p=>p.join(',')).join(' ')} fill="none" stroke="#7b8075" strokeWidth="9"/>
                        <text x={lx} y={ly-16+(index===3?185:0)} fill="#d6decf" fontSize="14" fontFamily="system-ui">{session.length>28 ? session.slice(0,25)+'…':session}</text>
                        {group.length>9 && <text x={lx} y={ly} fill="#d6decf" fontSize="12">{group.length-9} outras execuções na lista</text>}
                        {group.slice(0,9).map((run,i)=>{
                            // Multiple runs from one agent remain separate seats with their own controls.
                            const [x,y]=point(u+70+(i%3)*105,v+80+Math.floor(i/3)*85);
                            const color=colors[run.stage]||'#9aa6ba';
                            return <g key={run.id} role="button" tabIndex={0} aria-pressed={run.id===selectedId}
                                aria-label={`${run.agentId}, ${runLabels[run.stage]}, execução ${run.id}`}
                                onClick={()=>onSelect(run.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(run.id)}}}
                                className="cursor-pointer outline-none focus:stroke-lime-300">
                                <title>{run.agentId} · {runLabels[run.stage]} · {run.id}</title>
                                <ellipse cx={x} cy={y+24} rx="34" ry="11" fill="#0005"/>
                                <path d={`M${x-36},${y-5} l29,-14 l42,17 l-29,15 z`} fill="#a28b64" stroke={run.id===selectedId?'#c3ff00':'#504a3d'} strokeWidth={run.id===selectedId?3:1}/>
                                <path d={`M${x-36},${y-5} v17 l29,14 v-13 M${x+35},${y-2} v17`} stroke="#64573f" strokeWidth="4" fill="none"/>
                                <rect x={x-16} y={y-33} width="29" height="22" rx="2" fill="#17212a" stroke="#7b8b99"/>
                                <rect x={x-12} y={y-29} width="21" height="14" fill={color} opacity=".65"/>
                                <path d={`M${x-1},${y-11} v8 h12`} stroke="#a8b5c0" strokeWidth="3"/>
                                <rect x={x-7} y={y+8} width="19" height="17" rx="4" fill="#374757"/>
                                <rect x={x-4} y={y-4} width="13" height="15" fill={color}/>
                                <rect x={x-4} y={y-15} width="13" height="12" fill="#dfb891"/>
                                <rect x={x-4} y={y-17} width="13" height="4" fill="#322b2b"/>
                                <rect x={x-3} y={y+23} width="5" height="9" fill="#98a5af"/><rect x={x+6} y={y+23} width="5" height="9" fill="#98a5af"/>
                                <rect x={x-45} y={y+35} width="100" height="30" rx="5" fill="#101820" stroke={run.id===selectedId?'#c3ff00':'#344451'}/>
                                <circle cx={x-36} cy={y+44} r="3" fill={color}/>
                                <text x={x-28} y={y+47} fill="#edf0f4" fontSize="10" fontFamily="system-ui">{run.agentId.slice(0,14)}</text>
                                <text x={x-38} y={y+59} fill="#b3bfca" fontSize="9" fontFamily="system-ui">{runLabels[run.stage]}</text>
                            </g>;
                        })}
                    </g>;
                })}
                <g aria-label="Freds, seu assistente e ponto de coordenação" transform="translate(686 308)">
                    <ellipse cx="0" cy="15" rx="68" ry="34" fill="#16251c" stroke="#c3ff00" strokeWidth="2"/>
                    <path d="M-40 0 l40 -18 l40 18 l-40 18 z" fill="#819a62"/>
                    <rect x="-13" y="-32" width="26" height="19" rx="3" fill="#273a32" stroke="#c3ff00"/>
                    <rect x="-9" y="-28" width="18" height="11" fill="#c3ff00" opacity=".65"/>
                    <circle cx="0" cy="1" r="8" fill="#dfb891"/>
                    <path d="M-10 12 h20 v16 h-20 z" fill="#c3ff00"/>
                    <text x="0" y="50" textAnchor="middle" fill="#e7f6dd" fontSize="26">Freds</text>
                    <text x="0" y="66" textAnchor="middle" fill="#adbcab" fontSize="10">Seu assistente</text>
                </g>
            </svg>
        </div>}
        <div className="p-3 border-t border-slate-800 flex gap-4 flex-wrap text-xs text-slate-400">
            <span style={{color:colors.executing}}>● Em trabalho</span><span style={{color:colors.cancel_requested}}>● Aprovação / interrupção pendente</span><span style={{color:colors.error}}>● Falha</span><span style={{color:colors.complete}}>● Concluído</span><span>Seleção não inicia tarefas</span>
            {pages>1 && <><button disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Sessões anteriores</button><span>{currentPage+1}/{pages}</span><button disabled={currentPage===pages-1} onClick={()=>setPage(currentPage+1)}>Próximas sessões</button></>}
        </div>
    </section>;
}
