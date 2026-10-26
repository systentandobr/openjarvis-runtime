import { create } from 'zustand';

export type RunStage = 'executing' | 'cancel_requested' | 'cancel_unconfirmed' | 'cancelled' | 'complete' | 'error' | 'waiting_approval' | 'idle' | 'attention' | 'paused';
export interface ExecutionRun {
    observationKind?: 'run' | 'agent_snapshot'; totalTokens?: number;
    id: string; agentId: string; sessionId: string; executorUnitId?: string; deviceId?: string;
    stage: RunStage; sequence: number; updatedAt: string; provider?: string; model?: string;
    message?: string; skills?: string[]; hooks?: string[]; tokensUsed?: number; tokenLimit?: number;
    accountAlias?: string; quota5h?: number; quotaWeek?: number; routingReason?: string;
    parentId?: string; cancellationScope?: string; requestId?: string;
}
const terminal = (stage: string) => ['complete', 'error', 'cancelled'].includes(stage);
interface RunState {
    runs: Record<string, ExecutionRun>;
    ingest: (frame: Record<string, any>) => void;
    requestCancel: (id: string, requestId: string) => void;
    unconfirmed: (id: string, requestId: string) => void;
    reset: () => void;
}
export const useExecutionRuns = create<RunState>((set) => ({
    runs: {}, reset: () => set({ runs: {} }),
    ingest: (frame) => set(({ runs }) => {
        if (frame.type === 'execution:snapshot' && Array.isArray(frame.runs)) {
            const next = { ...runs };
            for (const item of frame.runs) {
                if (!item.execution_id || !item.agent_id || !item.session_id) continue;
                const existing = next[item.execution_id];
                if (existing && terminal(existing.stage)) continue;
                next[item.execution_id] = {
                    ...(existing || {}),
                    id: item.execution_id,
                    agentId: item.agent_id,
                    sessionId: item.session_id,
                    stage: (item.stage as RunStage) || 'executing',
                    sequence: item.sequence || 1,
                    updatedAt: new Date().toISOString(),
                    executorUnitId: item.source_unit_id,
                    message: item.last_event?.message || existing?.message,
                    observationKind: 'run',
                };
            }
            return { runs: next };
        }
        const data = frame.type === 'execution:cancel_result' ? frame : frame.event?.data;
        if (!data || !data.execution_id || !data.agent_id || !data.session_id) return { runs };
        const previous = runs[data.execution_id];
        if (previous && (previous.agentId !== data.agent_id || previous.sessionId !== data.session_id || terminal(previous.stage))) return { runs };
        if (data.event_kind === 'cancel_result' || frame.type === 'execution:cancel_result') {
            if (!previous || data.request_id !== previous.requestId) return { runs };
            return { runs: { ...runs, [previous.id]: { ...previous, stage: 'cancel_unconfirmed', message: data.message } } };
        }
        const lifecycle = data.event_kind === 'lifecycle';
        if (lifecycle && (!Number.isSafeInteger(data.sequence) || data.sequence < 1)) return { runs };
        if (!previous && !lifecycle) return { runs }; // legacy text is never interpreted as an agent/run
        if (lifecycle && previous && (!Number.isFinite(data.sequence) || data.sequence <= previous.sequence)) return { runs };
        const stage: RunStage = lifecycle ? data.stage : previous!.stage;
        if (!['executing', 'cancel_requested', 'cancelled', 'complete', 'error'].includes(stage)) return { runs };
        const run: ExecutionRun = { ...previous, id: data.execution_id, agentId: data.agent_id, sessionId: data.session_id,
            stage, sequence: lifecycle ? data.sequence : previous!.sequence, updatedAt: frame.event?.timestamp || new Date().toISOString() };
        for (const [wire, key] of [['account_alias','accountAlias'],['routing_reason','routingReason'],['provider','provider'],['model','model'],['message','message'],['executor_unit_id','executorUnitId'],['device_id','deviceId'],['skills','skills'],['hooks','hooks'],['parent_execution_id','parentId'],['cancellation_scope','cancellationScope']] as const) {
            if (data[wire] !== undefined && data[wire] !== null) (run as any)[key] = data[wire];
        }
        for (const [wire,key] of [['tokens_used','tokensUsed'],['token_limit','tokenLimit'],['quota_5h_remaining_percent','quota5h'],['quota_week_remaining_percent','quotaWeek']] as const) {
            if (typeof data[wire] === 'number' && Number.isFinite(data[wire]) && data[wire] >= 0) run[key] = data[wire];
        }
        // Keep a bounded history; never discard active executions to make room.
        const entries = Object.values({ ...runs, [run.id]: run });
        const old = entries.filter(r => terminal(r.stage)).sort((a,b) => a.updatedAt.localeCompare(b.updatedAt));
        const next = { ...runs, [run.id]: run };
        old.slice(0, Math.max(0, entries.length - 200)).forEach(r => delete next[r.id]);
        return { runs: next };
    }),
    requestCancel: (id, requestId) => set(({ runs }) => {
        const run = runs[id];
        if (!run || terminal(run.stage)) return { runs };
        return { runs: { ...runs, [id]: { ...run, stage: 'cancel_requested', requestId } } };
    }),
    unconfirmed: (id, requestId) => set(({ runs }) => {
        const run = runs[id];
        if (!run || run.requestId !== requestId || run.stage !== 'cancel_requested') return { runs };
        return { runs: { ...runs, [id]: { ...run, stage: 'cancel_unconfirmed' } } };
    }),
}));
