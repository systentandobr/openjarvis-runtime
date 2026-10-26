import { useEffect, useRef, useState } from 'react';
import { AgentOffice, runLabels } from '../components/Office/AgentOffice';
import { useExecutionRuns, type ExecutionRun } from '../lib/execution-runs.store';
import { openFredsSupervision } from '../lib/api';

const statusText: Record<string, string> = {
  connecting: 'Conectando ao Freds...',
  connected: 'Conectado (Tempo Real)',
  disconnected: 'Desconectado',
  unconfigured: 'Bridge não configurada',
};

export function OfficePage() {
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'office' | 'list'>('office');
  const [target, setTarget] = useState<ExecutionRun | null>(null);
  const [retry, setRetry] = useState(0);
  const cancelDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (target) cancelDialog.current?.showModal();
    else cancelDialog.current?.close();
  }, [target]);

  const bridge = useRef<ReturnType<typeof openFredsSupervision> | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const live = useExecutionRuns((s) => s.runs);
  const [session, setSession] = useState('');
  const [device, setDevice] = useState('');

  const runs = Object.values(live);
  const sessions = [...new Set(runs.map((r) => r.sessionId))];
  const devices = [...new Set(runs.map((r) => r.deviceId).filter((id): id is string => !!id))];
  const visible = runs.filter(
    (r) => (!session || r.sessionId === session) && (!device || r.deviceId === device)
  );
  const active = visible.find((r) => r.id === selected);

  useEffect(() => {
    setSelected(null);
    setSession('');
    setDevice('');
    setError('');
    setTarget(null);
    useExecutionRuns.getState().reset();

    try {
      bridge.current = openFredsSupervision(
        (frame) => useExecutionRuns.getState().ingest(frame),
        setStatus
      );
    } catch {
      setStatus('disconnected');
    }

    return () => {
      bridge.current?.close();
      bridge.current = null;
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [retry]);

  function cancel(run: ExecutionRun) {
    setTarget(null);
    const requestId = crypto.randomUUID();
    if (
      !bridge.current?.cancel({
        execution_id: run.id,
        agent_id: run.agentId,
        session_id: run.sessionId,
        request_id: requestId,
      })
    ) {
      setError('Sem conexão: a solicitação não foi enviada.');
      return;
    }
    useExecutionRuns.getState().requestCancel(run.id, requestId);
    timeouts.current.push(
      setTimeout(() => useExecutionRuns.getState().unconfirmed(run.id, requestId), 15000)
    );
  }

  const button =
    'px-3 py-2 rounded-lg border border-slate-700 text-sm hover:border-lime-300 disabled:opacity-40 transition-colors';

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0b1014] text-slate-100">
      <header className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-lime-300 tracking-widest uppercase">Freds · seu assistente</p>
          <h1 className="text-xl font-medium">Seu ecossistema, ao redor do Freds.</h1>
          <p className="text-sm text-slate-400">
            Monitoramento em tempo real dos especialistas e execuções do ecossistema Systentando.
          </p>
        </div>
        <a href="/" className={button}>
          Conversar com Freds
        </a>
      </header>

      <div className="p-3 border-b border-slate-800 flex gap-3 flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === 'connected' ? 'bg-lime-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="font-medium text-sm text-slate-200">
            Monitoramento Operacional em Tempo Real
          </span>
          <span className="text-xs text-slate-400">
            ({runs.length} especialistas conectados)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400" role="status">
            {statusText[status] || status}
          </span>
          <button
            className={button}
            onClick={() => {
              if (bridge.current?.requestSnapshot()) {
                // snapshot solicitado via WebSocket ativo
              } else {
                setRetry((n) => n + 1);
              }
            }}
          >
            Atualizar snapshot
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-slate-400 flex flex-wrap gap-3 items-center">
        <span>Telemetria reconciliada via WebSocket direto do backend Freds.</span>
        {sessions.length > 1 && (
          <label>
            Sessão{' '}
            <select
              className="bg-slate-900 p-1 rounded border border-slate-700"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              <option value="">Todas as sessões ({sessions.length})</option>
              {sessions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {devices.length > 1 && (
          <label>
            Dispositivo{' '}
            <select
              className="bg-slate-900 p-1 rounded border border-slate-700"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            >
              <option value="">Todos dispositivos ({devices.length})</option>
              {devices.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        )}
        <button className={button} onClick={() => setView((v) => (v === 'office' ? 'list' : 'office'))}>
          {view === 'office' ? 'Ver lista detalhada' : 'Ver escritório visual'}
        </button>
      </div>

      {error && (
        <p className="p-3 text-amber-300 bg-amber-950/30 border-b border-amber-800" role="alert">
          {error}
        </p>
      )}

      {status !== 'connected' && (
        <p className="px-4 py-2 text-amber-200 text-sm bg-amber-950/20">
          Conectando à bridge do Freds...
        </p>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] overflow-auto lg:overflow-hidden">
        <div className="min-h-[420px] lg:min-h-0">
          {view === 'office' ? (
            <AgentOffice
              runs={visible}
              selectedId={selected}
              onSelect={setSelected}
              demo={false}
              snapshots={true}
            />
          ) : (
            <div className="p-4 h-full overflow-auto space-y-2">
              {visible.map((r) => (
                <button
                  className={`${button} block w-full text-left`}
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">{r.agentId}</span>
                    <span className="text-xs text-lime-400">{runLabels[r.stage] || r.stage}</span>
                  </div>
                  <span className="block text-xs text-slate-400">{r.message || r.sessionId}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="p-5 lg:overflow-auto border-l border-slate-800 bg-[#11191e]">
          <h2 className="font-medium mb-3">Painel de Supervisão</h2>
          <p className="text-xs text-slate-400 mb-5">
            Monitoramento das conexões e execuções ativas reportadas pelo assistente local.
          </p>

          {!active ? (
            <div className="text-sm text-slate-400 space-y-3">
              <p className="text-lime-400">
                {visible.filter((r) => r.stage === 'executing').length} agentes em execução
              </p>
              <p>{visible.filter((r) => r.stage === 'idle').length} especialistas online (aguardando)</p>
              <p>
                {visible.filter((r) => ['cancel_requested', 'cancel_unconfirmed'].includes(r.stage)).length}{' '}
                interrupções pendentes
              </p>
              <p className="text-xs text-slate-500 pt-3 border-t border-slate-800">
                Clique em uma mesa no escritório ou em um agente da lista para inspecionar os detalhes.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-1 text-slate-100">{active.agentId}</h3>
              <p className="text-lime-300 text-sm mb-4">
                {runLabels[active.stage] || active.stage}
              </p>

              <dl className="text-sm space-y-3 break-words">
                {[
                  ['Identificador', active.id],
                  ['Sessão / Grupo', active.sessionId],
                  ['Canal / Unidade', active.executorUnitId || 'Não informado'],
                  ['Dispositivo', active.deviceId || 'Não informado'],
                  ['Status / Atividade', active.message || 'Pronto'],
                  [
                    'Última atualização',
                    active.updatedAt ? new Date(active.updatedAt).toLocaleTimeString() : 'Agora',
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-slate-800/60 pb-2">
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="text-slate-200 text-xs font-mono mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>

              {active.cancellationScope === 'local_handler' &&
                !['complete', 'error', 'cancelled'].includes(active.stage) && (
                  <button
                    className={`${button} mt-5 w-full text-rose-300 border-rose-800/50 hover:border-rose-400`}
                    disabled={active.stage === 'cancel_requested'}
                    onClick={() => setTarget(active)}
                  >
                    Solicitar interrupção
                  </button>
                )}
            </>
          )}
        </aside>
      </div>

      <dialog
        ref={cancelDialog}
        onCancel={() => setTarget(null)}
        onClose={() => setTarget(null)}
        className="m-auto p-0 bg-transparent text-slate-100 max-w-[calc(100%-40px)] backdrop:bg-black/75"
      >
        {target && (
          <section
            className="bg-slate-900 border border-slate-600 rounded-xl p-6 max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="office-cancel-title"
          >
            <h2 id="office-cancel-title" className="text-lg mb-3">
              Interromper {target.agentId}?
            </h2>
            <p className="text-sm mb-3 break-words">
              Execução {target.id} · {target.sessionId}
            </p>
            <p className="text-sm text-slate-400 mb-5">
              Será solicitado o cancelamento deste handler. Aguarde a confirmação.
            </p>
            <div className="flex gap-3">
              <button autoFocus className={button} onClick={() => setTarget(null)}>
                Voltar
              </button>
              <button className={`${button} text-rose-300`} onClick={() => cancel(target)}>
                Solicitar interrupção
              </button>
            </div>
          </section>
        )}
      </dialog>
    </div>
  );
}

