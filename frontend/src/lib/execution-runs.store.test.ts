import { beforeEach, describe, expect, it } from 'vitest';
import { useExecutionRuns } from './execution-runs.store';

const event = (stage: string, sequence: number, extra = {}) => ({
  type: 'execution:event',
  event: {
    data: {
      event_kind: 'lifecycle',
      execution_id: 'run',
      agent_id: 'dev',
      session_id: 's',
      stage,
      sequence,
      ...extra,
    },
  },
});

beforeEach(() => useExecutionRuns.getState().reset());

describe('correlação e confirmação de execução', () => {
  it('não transforma evento legado ou texto em execução identificada', () => {
    useExecutionRuns.getState().ingest({ type: 'execution:event', event: { data: { stage: 'executing' } } });
    expect(useExecutionRuns.getState().runs).toEqual({});
  });

  it('mantém tokens zero, ignora sequência antiga e não ressuscita encerrados', () => {
    const ingest = useExecutionRuns.getState().ingest;
    ingest(event('executing', 1, { tokens_used: 0 }));
    ingest(event('cancel_requested', 2));
    ingest(event('executing', 1));
    expect(useExecutionRuns.getState().runs.run.stage).toBe('cancel_requested');
    expect(useExecutionRuns.getState().runs.run.tokensUsed).toBe(0);
    ingest(event('cancelled', 3));
    ingest(event('executing', 4));
    expect(useExecutionRuns.getState().runs.run.stage).toBe('cancelled');
  });

  it('timeout não é confirmação e resultado de outro request não altera o run', () => {
    const store = useExecutionRuns.getState();
    store.ingest(event('executing', 1));
    store.requestCancel('run', 'request');
    store.unconfirmed('run', 'request');
    expect(useExecutionRuns.getState().runs.run.stage).toBe('cancel_unconfirmed');
    store.ingest({
      type: 'execution:cancel_result',
      execution_id: 'run',
      agent_id: 'dev',
      session_id: 's',
      request_id: 'wrong',
      stage: 'cancel_unconfirmed',
      message: 'wrong',
    });
    expect(useExecutionRuns.getState().runs.run.message).toBeUndefined();
    store.ingest(event('cancelled', 3));
    expect(useExecutionRuns.getState().runs.run.stage).toBe('cancelled');
  });

  it('ingestão de snapshot autorizada reconstrói estado ativo e não ressuscita encerrados', () => {
    useExecutionRuns.getState().ingest(event('cancelled', 1));
    expect(useExecutionRuns.getState().runs.run.stage).toBe('cancelled');

    useExecutionRuns.getState().ingest({

      type: 'execution:snapshot',
      unit_id: 'tenant',
      runs: [
        { execution_id: 'run', agent_id: 'dev', session_id: 's', stage: 'executing', sequence: 5 },
        {
          execution_id: 'run-active',
          agent_id: 'architect',
          session_id: 's2',
          stage: 'executing',
          sequence: 2,
          source_unit_id: 'tenant',
        },
      ],
    });

    const currentRuns = useExecutionRuns.getState().runs;
    expect(currentRuns.run.stage).toBe('cancelled');
    expect(currentRuns['run-active']).toBeDefined();
    expect(currentRuns['run-active'].stage).toBe('executing');
    expect(currentRuns['run-active'].agentId).toBe('architect');
  });

});
