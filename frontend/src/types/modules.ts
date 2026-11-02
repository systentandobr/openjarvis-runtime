export type NativeModuleId = 'investimentos' | 'gestao' | 'dorama' | 'document-orchestrator';

export interface ModuleCapability {
  title: string;
  description: string;
  toolNames: string[];
}

export interface NativeModuleDefinition {
  id: NativeModuleId;
  route: string;
  title: string;
  shortName: string;
  iconName: 'TrendingUp' | 'Building2' | 'Clapperboard' | 'FileText';
  tagline: string;
  description: string;
  accentColor: string;
  accentGlow: string;
  badgeText: string;
  mcpNamespace: string;
  defaultAgentId: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  skills: string[];
  capabilities: ModuleCapability[];
  suggestedPrompts: string[];
}

export const NATIVE_MODULES: Record<NativeModuleId, NativeModuleDefinition> = {
  investimentos: {
    id: 'investimentos',
    route: '/modules/investimentos',
    title: 'Hadness Investimentos',
    shortName: 'Investimentos',
    iconName: 'TrendingUp',
    tagline: 'Análise de mercado, cotações e portfólio inteligente via MT5 & MCP',
    description: 'Ambiente analítico quantitativo com conexão direta a dados de mercado, cálculo de risco, posições abertas e simulação de cenários de alocação de capital.',
    accentColor: 'var(--color-accent-amber, #f59e0b)',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    badgeText: 'MT5 & Invest MCP',
    mcpNamespace: 'invest_*, mt5_*',
    defaultAgentId: 'invest-quant-agent',
    agentName: 'Quant Specialist',
    agentRole: 'Especialista em Análise de Ativos & MT5',
    agentAvatar: '📈',
    skills: ['market-analysis', 'portfolio-simulation', 'mt5-stream', 'asset-evaluation'],
    capabilities: [
      {
        title: 'Mercado e Cotações em Tempo Real',
        description: 'Consulta de símbolos, gráficos históricos e dados de livros via MetaTrader 5.',
        toolNames: ['mt5_get_marketwatch_symbols', 'mt5_get_chart_history', 'mt5_get_time_information', 'invest_coletar_dados_mercado']
      },
      {
        title: 'Gestão de Carteira e Posições',
        description: 'Auditoria de posições abertas, histórico de ordens e valor patrimonial.',
        toolNames: ['mt5_get_open_positions', 'mt5_get_order_history', 'invest_consultar_carteira']
      },
      {
        title: 'Simulação & Detecção de Oportunidades',
        description: 'Simulação de cenários estressados e detecção preditiva de ativos promissores.',
        toolNames: ['invest_simular_cenarios', 'invest_analisar_ativo', 'invest_detectar_oportunidades']
      }
    ],
    suggestedPrompts: [
      'Resuma o status da conexão com o MetaTrader 5 e posições abertas.',
      'Analise a carteira atual e sugira simulações de mitigação de risco.',
      'Quais são os ativos monitorados com maior volatilidade nas últimas 24h?'
    ]
  },
  gestao: {
    id: 'gestao',
    route: '/modules/gestao',
    title: 'Hadness Gestão & Custos',
    shortName: 'Gestão',
    iconName: 'Building2',
    tagline: 'Orçamentos, centros de custo, despesas operacionais e contratos',
    description: 'Centro operacional e financeiro do ecossistema Systentando, unificando orçamentos de serviços, precificação horária, despesas recorrentes e clientes.',
    accentColor: 'var(--color-accent, #0891b2)',
    accentGlow: 'rgba(8, 145, 178, 0.25)',
    badgeText: 'Gestor MCP',
    mcpNamespace: 'gestor_*',
    defaultAgentId: 'gestor-finance-agent',
    agentName: 'Gestor Operacional',
    agentRole: 'Auditor Financeiro & Centro de Custos',
    agentAvatar: '🏛️',
    skills: ['cost-center-management', 'budget-estimation', 'expense-allocation', 'quote-generation'],
    capabilities: [
      {
        title: 'Orçamentos e Serviços',
        description: 'Elaboração, estimativa de margem, histórico e atualização de propostas comerciais.',
        toolNames: ['list_quotes', 'create_quote', 'estimate_quote', 'list_services']
      },
      {
        title: 'Centros de Custo & Despesas',
        description: 'Acompanhamento de custos operacionais, alocação e conciliação de pagamentos.',
        toolNames: ['list_cost_centers', 'list_operating_expenses', 'create_operating_expense', 'get_operating_cost_summary']
      },
      {
        title: 'CRM e Clientes',
        description: 'Mapeamento de unidades atendidas, contratos ativos e esteira de leads.',
        toolNames: ['list_customers', 'list_leads', 'get_leads_pipeline_stats', 'get_operation_context']
      }
    ],
    suggestedPrompts: [
      'Apresente o resumo de custos operacionais e margem do mês corrente.',
      'Liste os orçamentos pendentes de aprovação e clientes em follow-up.',
      'Simule a alocação de nova despesa no centro de custos administrativo.'
    ]
  },
  dorama: {
    id: 'dorama',
    route: '/modules/dorama',
    title: 'Dorama Studio & Produção',
    shortName: 'Dorama',
    iconName: 'Clapperboard',
    tagline: 'Roteiros, visual beats, clonagem de voz, sound design e renderização',
    description: 'Estúdio de produção multimídia inteligente: criação e auditoria de roteiros, geração de beats com coerência visual, mixagem sonora e promoção de episódios.',
    accentColor: 'var(--color-accent-purple, #8b5cf6)',
    accentGlow: 'rgba(139, 92, 246, 0.25)',
    badgeText: 'Dorama Studio MCP',
    mcpNamespace: 'dorama_*, motion_*',
    defaultAgentId: 'dorama-director-agent',
    agentName: 'Diretor Criativo Dorama',
    agentRole: 'Diretor de Roteiro & Produção Audiovisual',
    agentAvatar: '🎬',
    skills: ['dorama-beat-generator', 'dorama-script-reviewer', 'dorama-production-editor', 'voice-synthesis'],
    capabilities: [
      {
        title: 'Gestão de Projetos & Personagens',
        description: 'Criação de séries, personagens consistentes, cenários e diretrizes artísticas.',
        toolNames: ['dorama_projects_list', 'dorama_character_add', 'dorama_setting_add', 'dorama_project_direction_set']
      },
      {
        title: 'Roteiros, Beats & Continuidade',
        description: 'Estruturação de cenas com validação SigLIP2 de continuidade visual e ritmo.',
        toolNames: ['dorama_story_generate', 'dorama_episode_visual_beats_generate', 'dorama_episode_visual_continuity_validate']
      },
      {
        title: 'Vozes, Áudio & Masterização',
        description: 'Clonagem vocal, síntese de diálogos e montagem da timeline de produção.',
        toolNames: ['dorama_voices_list', 'dorama_voice_design', 'dorama_episode_audio_generate', 'dorama_episode_produce']
      }
    ],
    suggestedPrompts: [
      'Liste os projetos e status de workflow da temporada atual no Dorama Studio.',
      'Analise a continuidade dos visual beats do último episódio em produção.',
      'Gere um rascunho de roteiro para o próximo episódio com tom dramático.'
    ]
  },
  'document-orchestrator': {
    id: 'document-orchestrator',
    route: '/modules/document-orchestrator',
    title: 'Document Orchestrator',
    shortName: 'Documentos',
    iconName: 'FileText',
    tagline: 'Estruturação acadêmica, conversão tese→artigo e auditoria de normas',
    description: 'Orquestrador documental de alta precisão: leitura de teses e laudas, conformidade de normas (ABNT, APA, Vancouver), verificação de DOI e integridade textual.',
    accentColor: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    badgeText: 'Academic & Norms MCP',
    mcpNamespace: 'document-orchestrator_*, academic_*',
    defaultAgentId: 'academic-curator-agent',
    agentName: 'Curador Documental',
    agentRole: 'Editor Científico & Especialista em Normas',
    agentAvatar: '📚',
    skills: ['academic-review', 'norms-compliance', 'thesis-extraction', 'citation-enrichment'],
    capabilities: [
      {
        title: 'Normas & Conformidade Periódica',
        description: 'Scout e sincronização de diretrizes de periódicos, Qualis e compliance estrutural.',
        toolNames: ['load_norms_spec', 'verify_article_compliance', 'check_abstract_compliance', 'sync_journal_norms']
      },
      {
        title: 'Transformação Tese → Artigo',
        description: 'Extração automatizada de seções, dados estatísticos, figuras e referências.',
        toolNames: ['extract_thesis_sections', 'extract_thesis_statistics', 'build_article_from_thesis', 'audit_complete_transformation']
      },
      {
        title: 'Citações & Validação de DOIs',
        description: 'Enriquecimento de metadados, validação em lote e formatação padronizada.',
        toolNames: ['validate_reference_doi', 'validate_references_batch', 'enrich_references', 'fix_references_format']
      }
    ],
    suggestedPrompts: [
      'Carregue as normas ativas e verifique a conformidade do manuscrito atual.',
      'Extraia as seções chave e tabelas da tese para montar um artigo científico.',
      'Valide o lote de DOIs e corrija o formato das referências bibliográficas.'
    ]
  }
};
