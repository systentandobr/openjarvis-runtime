import { Activity, Bot, Box, Database, FileText, Play, Send } from 'lucide-react';
import type { ServiceState } from '../../types/ecosystem';

/** Fixture explícita de design — NÃO é telemetria real. */
export const FIXTURE_ORIGIN = 'fixture:design' as const;

export interface DemoService {
  id: string;
  name: string;
  icon: typeof Box;
  x: number;
  y: number;
  state: ServiceState;
  stateLabel: string;
  detail: string;
  category: string;
}

export const demoServices: DemoService[] = [
  { id: 'core', name: 'Freds Core', icon: Box, x: 50, y: 14, state: 'available', stateLabel: 'Disponível · exemplo', detail: 'Orquestração e backlog. Esta cena demonstra como as execuções serão apresentadas; nenhum agente foi despachado.', category: 'Coordenação' },
  { id: 'gestor', name: 'Meu Gestor', icon: Bot, x: 26, y: 58, state: 'attention', stateLabel: 'Atenção · exemplo', detail: 'Atendimento, clientes e orçamentos. O alerta visual é uma fixture de design, não uma vulnerabilidade detectada na sua unidade.', category: 'Operação' },
  { id: 'dorama', name: 'Dorama Studio', icon: Play, x: 77, y: 58, state: 'available', stateLabel: 'Disponível · exemplo', detail: 'Projetos e produção de episódios. Geração e publicação continuam sujeitas às permissões próprias do serviço.', category: 'Produção' },
  { id: 'documents', name: 'Documentos', icon: FileText, x: 25, y: 73, state: 'available', stateLabel: 'Disponível · exemplo', detail: 'Documentos, revisão e referências. Fontes de conhecimento e ferramentas de execução têm papéis distintos.', category: 'Conhecimento' },
  { id: 'knowledge', name: 'Conhecimento', icon: Database, x: 77, y: 73, state: 'available', stateLabel: 'Disponível · exemplo', detail: 'Contexto e evidências recuperados com escopo de acesso. A projeção Graphify terá versão e data independentes das execuções.', category: 'Conhecimento' },
  { id: 'postiz', name: 'Postiz local', icon: Send, x: 50, y: 89, state: 'offline', stateLabel: 'Offline · exemplo', detail: 'O Postiz permanece local. A integração planejada consulta uma fila por conexão de saída, sem expor uma porta pública.', category: 'Publicação' },
];

/** Estrelas determinísticas (sem Math.random) — layout estável entre renders. */
export const demoStars = Array.from({ length: 55 }, (_, i) => ({
  x: (i * 137 + 43) % 1000,
  y: (i * 97 + 29) % 660,
  r: i % 9 === 0 ? 3 : 1.2,
}));

export interface DemoEvent { time: string; agent: string; event: string; kind: 'dev' | 'qa' | 'arch'; }

export const demoEvents: DemoEvent[] = [
  { time: '10:42', agent: 'Developer', event: 'revisando integração', kind: 'dev' },
  { time: '10:41', agent: 'QA', event: 'verificando contratos', kind: 'qa' },
  { time: '10:40', agent: 'Architect', event: 'plano atualizado', kind: 'arch' },
];

export const demoRoutines = [
  { time: '08:00', title: 'Revisão da manhã', desc: 'Agenda, atendimento e três prioridades.' },
  { time: '15:00', title: 'Acompanhamento da tarde', desc: 'Mudanças, bloqueios e próximos passos.' },
];
