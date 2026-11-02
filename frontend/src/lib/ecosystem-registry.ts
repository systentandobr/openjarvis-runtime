/**
 * Registry canônico de correlação do ecossistema 360° (F360-02).
 *
 * IDs estáveis por serviço/agente; nunca unir por label aproximado.
 * agentId fora do mapa cai na fila 'Não mapeadas' — nunca é descartado.
 * O backend pode emitir `snapshot.registry.agentServices` autoritativo;
 * este módulo é o fallback local e a fonte para fixtures de layout.
 */

export type OrbitGroup = 'infra' | 'execution' | 'domain';

export interface RegistryService {
  id: string;
  label: string;
  orbit: OrbitGroup;
}

/** Serviços conhecidos do ecossistema — existência ≠ disponibilidade. */
export const REGISTRY_SERVICES: RegistryService[] = [
  { id: 'freds-core', label: 'Freds Core', orbit: 'execution' },
  { id: 'friendly', label: 'Friendly (Claw)', orbit: 'execution' },
  { id: 'openjarvis', label: 'OpenJarvis', orbit: 'infra' },
  { id: 'gateway', label: 'Freds Gateway', orbit: 'infra' },
  { id: 'sessions', label: 'DevMode Sessions', orbit: 'infra' },
  { id: 'sentinel', label: 'Sentinel', orbit: 'infra' },
  { id: 'gestor', label: 'Meu Gestor', orbit: 'domain' },
  { id: 'dorama', label: 'Dorama Studio', orbit: 'domain' },
];

/** agentId canônico → serviceId. Aceita sufixo '{unit}:{slug}'. */
export const AGENT_SERVICES: Record<string, string> = {
  'agno-chatbot': 'freds-core',
  atendimento: 'freds-core',
  chatbot: 'freds-core',
  orchestrator: 'freds-core',
  deepagent: 'freds-core',
  dev: 'friendly',
  developer: 'friendly',
  'frontend-dev': 'friendly',
  'backend-dev': 'friendly',
  claw: 'friendly',
  qa: 'friendly',
  tester: 'friendly',
  reviewer: 'friendly',
  'code-reviewer': 'friendly',
  'test-writer': 'friendly',
  architect: 'friendly',
  ux: 'friendly',
  manager: 'friendly',
  'sales-specialist': 'friendly',
};

export function serviceForAgent(
  agentId: string,
  overrides?: Record<string, string>,
): string | null {
  const slug = agentId.includes(':') ? agentId.split(':').pop()! : agentId;
  return overrides?.[agentId] ?? overrides?.[slug] ?? AGENT_SERVICES[slug] ?? AGENT_SERVICES[agentId] ?? null;
}

export function serviceLabel(serviceId: string): string {
  return REGISTRY_SERVICES.find((s) => s.id === serviceId)?.label ?? serviceId;
}
