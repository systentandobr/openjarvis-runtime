import { beforeEach, describe, expect, it, vi } from 'vitest';

const frames: Array<(frame: Record<string, any>) => void> = [];
const statuses: Array<(s: string) => void> = [];
const closeSpy = vi.fn();
const snapshotSpy = vi.fn();
const cancelSpy = vi.fn();

vi.mock('./api', () => ({
  openFredsSupervision: vi.fn((onFrame: any, onStatus: any) => {
    frames.push(onFrame);
    statuses.push(onStatus);
    onStatus('connecting');
    return {
      cancel: cancelSpy,
      requestSnapshot: snapshotSpy,
      close: closeSpy,
    };
  }),
}));

import { supervision } from './supervision';
import { openFredsSupervision } from './api';

describe('supervision — conexão compartilhada', () => {
  beforeEach(() => {
    frames.length = 0;
    statuses.length = 0;
    vi.clearAllMocks();
  });

  it('primeira aquisição abre uma única conexão; consumidores extras não duplicam', () => {
    const release1 = supervision.acquire();
    const release2 = supervision.acquire();
    expect(openFredsSupervision).toHaveBeenCalledTimes(1);
    release1();
    expect(openFredsSupervision).toHaveBeenCalledTimes(1);
    expect(closeSpy).not.toHaveBeenCalled();
    release2();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('liberação idempotente não decrementa duas vezes', () => {
    const release = supervision.acquire();
    release();
    release();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('status propagado aos assinantes; ingest de frames vai ao store', () => {
    const seen: string[] = [];
    const release = supervision.acquire();
    const unsub = supervision.subscribe((s) => seen.push(s));
    expect(seen).toContain('connecting');
    statuses[0]?.('connected');
    expect(seen).toContain('connected');
    unsub();
    release();
  });

  it('reconnectNow fecha e reabre sem reexecutar comandos', () => {
    const release = supervision.acquire();
    supervision.reconnectNow();
    expect(closeSpy).toHaveBeenCalled();
    expect(openFredsSupervision).toHaveBeenCalledTimes(2);
    release();
  });
});
