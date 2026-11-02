/**
 * Conexão de supervisão Freds compartilhada (FO-03 / F360-06).
 *
 * Singleton com aquisição/liberação por referência: Office e Freds 360
 * dividem a mesma WebSocket — abrir /freddy/360 direto observa os mesmos
 * runs de /office, sem conexões nem resets duplicados entre consumidores.
 *
 * Reconexão com backoff exponencial + jitter (teto 30s); reconnect nunca
 * redispara comandos — o estado sai de unknown somente por snapshot/evento
 * upstream, conforme o reducer de execution-runs.store.
 */

import { openFredsSupervision } from './api';
import { useExecutionRuns } from './execution-runs.store';

export type SupervisionStatus = 'connecting' | 'connected' | 'disconnected' | 'unconfigured';

type Bridge = ReturnType<typeof openFredsSupervision>;
type StatusListener = (status: SupervisionStatus) => void;

const SNAPSHOT_INTERVAL_MS = 25_000;
const RECONNECT_CAP_MS = 30_000;
const KNOWN: SupervisionStatus[] = ['connecting', 'connected', 'disconnected', 'unconfigured'];

class SupervisionManager {
  private consumers = 0;
  private bridge: Bridge | null = null;
  private status: SupervisionStatus = 'connecting';
  private listeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private attempts = 0;
  private everConnected = false;

  /** Adquire um consumidor da conexão. Retorna função de liberação idempotente. */
  acquire(): () => void {
    this.consumers += 1;
    if (this.consumers === 1) this.start();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.consumers = Math.max(0, this.consumers - 1);
      if (this.consumers === 0) this.stop();
    };
  }

  getStatus(): SupervisionStatus {
    return this.status;
  }

  /** True se a conexão já chegou a 'connected' neste ciclo de vida. */
  wasConnected(): boolean {
    return this.everConnected;
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  cancel(frame: { execution_id: string; agent_id: string; session_id: string; request_id: string }): boolean {
    return this.bridge?.cancel(frame) ?? false;
  }

  requestSnapshot(): boolean {
    return this.bridge?.requestSnapshot() ?? false;
  }

  /** Força reconexão imediata (botão manual); não reexecuta comandos. */
  reconnectNow(): void {
    if (this.consumers === 0) return;
    this.clearReconnect();
    this.bridge?.close();
    this.bridge = null;
    this.connect();
  }

  private emit(next: SupervisionStatus) {
    if (next === this.status) return;
    this.status = next;
    for (const listener of this.listeners) listener(next);
  }

  private start() {
    this.attempts = 0;
    this.connect();
  }

  private connect() {
    try {
      this.bridge = openFredsSupervision(
        (frame) => useExecutionRuns.getState().ingest(frame),
        (value) => this.onStatus(value),
      );
    } catch {
      this.onStatus('disconnected');
    }
  }

  private onStatus(value: string) {
    const status = (KNOWN as string[]).includes(value) ? (value as SupervisionStatus) : 'disconnected';
    if (status === 'connected') {
      this.everConnected = true;
      this.attempts = 0;
      this.armSnapshot();
    } else {
      this.disarmSnapshot();
      if (status === 'disconnected') {
        useExecutionRuns.getState().disconnected();
        this.scheduleReconnect();
      }
    }
    this.emit(status);
  }

  private scheduleReconnect() {
    if (this.consumers === 0 || this.reconnectTimer !== null) return;
    const base = Math.min(1_000 * 2 ** Math.min(this.attempts, 5), RECONNECT_CAP_MS);
    const delay = Math.round(base * (0.6 + Math.random() * 0.6));
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.consumers > 0) this.connect();
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private armSnapshot() {
    this.disarmSnapshot();
    this.snapshotTimer = setInterval(() => {
      this.bridge?.requestSnapshot();
    }, SNAPSHOT_INTERVAL_MS);
  }

  private disarmSnapshot() {
    if (this.snapshotTimer !== null) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  private stop() {
    this.clearReconnect();
    this.disarmSnapshot();
    this.bridge?.close();
    this.bridge = null;
    this.attempts = 0;
    this.everConnected = false;
    this.emit('disconnected');
  }
}

/** Instância única do processo — nunca instanciar por página. */
export const supervision = new SupervisionManager();
