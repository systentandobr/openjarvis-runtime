import { describe, expect, it, vi } from 'vitest';
import { loadEcosystemView, fetchEcosystemSnapshot, fetchSentinelFindings } from './ecosystem-api';

vi.mock('./api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from './api';

describe('ecosystem-api', () => {
  describe('fetchEcosystemSnapshot', () => {
    it('retorna null quando endpoint responde 404', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await fetchEcosystemSnapshot();
      expect(result).toBeNull();
    });

    it('retorna null em erro de rede sem lançar exceção', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('Network error'));
      const result = await fetchEcosystemSnapshot();
      expect(result).toBeNull();
    });

    it('retorna snapshot quando schemaVersion está presente', async () => {
      const snapshot = {
        schemaVersion: 1,
        snapshotId: 'test',
        serverTime: new Date().toISOString(),
        sources: { graph: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] }, activity: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] }, integrity: { status: 'ready', observedAt: null, generatedAt: null, version: '1', coverage: [] } },
        nodes: [],
        relations: [],
        executions: [],
        findings: [],
        warnings: [],
      };
      vi.mocked(apiFetch).mockResolvedValue({ ok: true, json: async () => snapshot } as Response);
      const result = await fetchEcosystemSnapshot();
      expect(result).toEqual(snapshot);
    });
  });

  describe('fetchSentinelFindings', () => {
    it('retorna array vazio quando endpoint falha', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 503 } as Response);
      const result = await fetchSentinelFindings();
      expect(result).toEqual([]);
    });

    it('retorna findings quando disponíveis', async () => {
      const findings = [{ id: '1', check: 'test', severity: 'high', status: 'open', observedAt: '', auditId: 'a1', serviceId: null, evidenceRef: null }];
      vi.mocked(apiFetch).mockResolvedValue({ ok: true, json: async () => ({ findings }) } as Response);
      const result = await fetchSentinelFindings();
      expect(result).toEqual(findings);
    });
  });

  describe('loadEcosystemView', () => {
    it('retorna demo=true quando nenhuma fonte está disponível', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ ok: false, status: 404 } as Response);
      const view = await loadEcosystemView();
      expect(view.demo).toBe(true);
      expect(view.snapshot).toBeNull();
      expect(view.stamps.graph.status).toBe('unavailable');
    });

    it('retorna demo=false quando snapshot real é obtido', async () => {
      const snapshot = {
        schemaVersion: 1 as const,
        snapshotId: 'real',
        serverTime: new Date().toISOString(),
        sources: {
          graph: { status: 'ready' as const, observedAt: null, generatedAt: null, version: '1', coverage: ['all'] },
          activity: { status: 'ready' as const, observedAt: null, generatedAt: null, version: '1', coverage: ['all'] },
          integrity: { status: 'stale' as const, observedAt: null, generatedAt: null, version: '1', coverage: [] },
        },
        nodes: [{ id: 'svc1', label: 'Serviço 1', kind: 'service' as const, capabilities: ['api'], sourceRefs: ['graphify'] }],
        relations: [],
        executions: [],
        findings: [],
        warnings: [],
      };
      vi.mocked(apiFetch).mockResolvedValue({ ok: true, json: async () => snapshot } as Response);
      const view = await loadEcosystemView();
      expect(view.demo).toBe(false);
      expect(view.snapshot).not.toBeNull();
      expect(view.stamps.graph.status).toBe('ready');
    });
  });
});
