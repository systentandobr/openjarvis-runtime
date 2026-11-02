# Freds 360° — arquitetura, integração e execução

Data: 27/10/2026. Executar em outra sessão; planejamento não autoriza deploy. Ler DESIGN.md, TASKS.md, ../freddy-hadness-handoff.md, ../freds-conversation.md e os AGENTS.md aplicáveis. Há edição concorrente em andamento: primeiro git status/diff; não sobrescrever nem resetar trabalho alheio.

## Escopo e entregas

Evoluir /freddy para uma visão 360° com estrutura do Graphify, atividade de agentes, integridade Sentinel e conversa. Manter /office como fallback de supervisão. Cortes: (A) shell visual com fixtures explícitas; (B) estrutura/atividade reais somente leitura; (C) findings/evidências e fonte real; (D) chat/voz e ações existentes; (E) QA e ativação gradual. Cada corte deve funcionar com as demais fontes indisponíveis.

Não duplicar FR-00..FR-12: F360 detalha o redesenho e as integrações de observabilidade. FR-03 fornece chat, FR-04 autenticação/MCPs, FR-06 voz, FR-08/09 rotinas/notificações, FR-10 conhecimento, FR-12 QA. FR-02/OpenAI não bloqueia shell, grafo ou supervisão. FC-01/02 e FP-01 preservados. Não incluir ordens MetaTrader ou publicação social neste escopo.

## Levantamento real e lacunas

| Componente | Fonte local conferida | Estado e trabalho |
|---|---|---|
| Protótipo | frontend/src/pages/FreddyPage.tsx, freddy.css | Simulação; preservar modo demo e substituir gradualmente |
| Layout e navegação | frontend/src/App.tsx, components/Sidebar | Há alterações concorrentes, inclusive ModuleCardsGrid/ProjectSessionList; reconciliar antes do shell |
| Supervisão | server/freds_bridge.py; frontend/src/lib/api.ts e execution-runs.store.ts | Bridge WS e reducer com sequência, snapshots, unknown e cancel_unconfirmed; reutilizar |
| Grafo | backend-monorepo/python/freds/services/ecosystem_graph_service.py e routers/ecosystem.py | Projeção já reduz/sanitiza; limita nós/arestas. lru_cache não prova atualização automática; definir invalidação/versionamento |
| Fonte Graphify | graphify-out-merged/merged-graph.json, ECOSYSTEM_GRAPH_PATH | Arquivo do servidor, gerado fora do Git. Existência/atualização em runtime ainda não validadas |
| Sentinel | architecture-guides/sentinel/mcp/server.py | sentinel_health, latest_report, list_findings, prioritized_issues, report_history. Não confundir com recipe local chamada sentinel |
| Conectores | server/connectors_router.py, lib/connectors-api.ts | Datasource de conhecimento não equivale a sessão autenticada de MCP; verificar capacidades |
| Chat/voz | lib/api.ts, lib/tts.ts, hooks/useSpeech.ts | Integrações existentes a reutilizar; /freddy não tem conversa real ligada |
| Identidade | site/src/design-system/tokens/tokens.css | Tokens dark/lime confirmados; reutilização sem acoplar CSS global |

Railway e fontes reais não foram validados nesta entrega. Sessão implementadora deve confirmar rota, método, auth, contrato e resposta read-only por serviço. Não inventar endpoint remoto ou permissão. O MCP Sentinel deve continuar privado, por bridge autenticada. Postiz local não é exposto por esta feature.

## Arquitetura proposta

Browser → api.ts → adapters FastAPI OpenJarvis → application/ecosystem_view → portas GraphSource, ExecutionSource, IntegritySource → adapters Freds/Graphify/Sentinel. Bootstrap compõe adapters. Estado de UI não acessa banco, disco privado, credencial ou serviço remoto diretamente.

A projeção de leitura deve ser sem estado por usuário quando possível; evitar nova base. Se houver cache persistente/mapeamento persistido, criar interface e impls memory+Mongo seguindo guardrails; sem segunda fonte de verdade de execução ou finding. Persistência operacional pertence aos serviços existentes. Não espalhar HTTP por componentes.

Backend proposto (nomes de rotas novos, não já implementados):

- GET /v1/ecosystem/snapshot: projeção autorizada/versionada, limite de serviços/nós, resumo e status de cada fonte.
- GET /v1/ecosystem/nodes/{opaque_id}: detalhe autorizado e limitado; rejeitar traversal, IDs desconhecidos e acesso cross-unit.
- GET /v1/ecosystem/findings: paginação/cursor e filtros whitelist; nenhuma execução de auditoria implícita.
- WS /v1/ecosystem/events: apenas se houver necessidade de envelope unificado; preferir reutilizar WS de execuções e combinar na application/store para não criar consumidor upstream por aba. Definir decisão no ADR antes de implementar.

GET não pode disparar auditoria, refresh pesado do Graphify, dispatch ou sync_backlog. Ferramentas de mutação permanecem separadas com autorizações existentes. Backend escuta local por padrão; não publicar serviço para atender a este planejamento.

## Modelo de leitura proposto

Tipos versionados a detalhar em frontend/src/types/ecosystem.ts e contratos backend. Campos internos de unit não são argumentos livres do browser.

```ts
type SourceStatus = 'loading' | 'ready' | 'stale' | 'unavailable' | 'unauthorized';
type SourceStamp = { status: SourceStatus; observedAt: string | null;
  generatedAt: string | null; version: string | null; coverage: string[] };
type ServiceNode = { id: string; label: string; kind: 'service' | 'repository';
  capabilities: string[]; sourceRefs: string[] };
type Relation = { id: string; source: string; target: string;
  kind: string; origin: 'graphify' | 'registry'; verifiedAt: string | null };
type ExecutionOverlay = { executionId: string; agentId: string; sessionId: string;
  serviceId: string | null; sequence: number; stage: string; updatedAt: string };
type IntegrityFinding = { id: string; serviceId: string | null; check: string;
  severity: string; status: string; observedAt: string; auditId: string;
  evidenceRef: string | null };
```

Snapshot: schemaVersion=1, snapshotId, serverTime, sources com stamps separados, nodes/relations e execution/finding refs, warnings sanitizados. Status de fonte não é status de serviço. service online não significa agente executando. Snapshot ausente não deve apagar histórico confirmado nem afirmar sucesso.

Envelope de evento proposto: schemaVersion, eventId, type, source, scopeKey opaco, observedAt, sequence por stream, payload whitelist, sourceVersion/cursor quando disponível. eventId deduplica; sequência é comparada só dentro do mesmo stream/execução. Não ordenar globalmente relógios de hosts diferentes. Executions mantêm o contrato existente; não substituir reducer estável para caber no desenho.

## Correlação do ecossistema

Definir registry de IDs estáveis e aliases (serviceId/repositoryId/projectId/agentId). Nunca unir por label aproximado. Execuções sem serviceId resolvido aparecem em 'Não mapeadas'. Findings de secret não trazem segredo nem arquivo inteiro; expor trecho redigido e referência autorizada. Grafo representa relações documentadas, não um inventário de saúde em tempo real. Não posicionar um alerta em serviço apenas por semelhança de nome.

Graphify: usar projeção agregada por repositório/serviço, preservando IDs de origem. Máximo inicial proposto 80 nós/160 arestas visíveis, expansão local sob demanda e paginação. Serviço atual suporta limites maiores, mas a tela inicial deve ser reduzida. Não enviar grafo bruto com source_file privado ao browser. Permitir navegar no grafo a partir de repo/seleção e voltar à visão agregada.

## Atualização, reconexão e cobertura

- Execuções: WS existente; snapshots de reconciliação e sequência. Backoff exponencial com jitter até 30s. Reconnect não redispara comandos. Unknown após desconexão, não idle/concluído.
- Estrutura: iniciar com snapshot e ETag/version; refresh configurável sugerido 60s condicionado a visibilidade, sem regerar grafo. Invalidação por versão/mtime/publicação atômica; lru_cache atual deve ser tratado explicitamente. Mostrar idade; não chamar snapshot estrutural de live.
- Sentinel: leitura sugerida 30–60s, jitter/cache por escopo; depende do contrato real. Mostrar audit time e coverage. Sem findings + sem relatório/coverage válida não significa conforme.
- Freshness thresholds configuráveis por fonte e medidos; não hardcode de SLA de negócio. Polling pausa/reduz aba oculta; WS permanece conforme necessidade. No servidor, limites, timeout, cancelamento e circuit breaker por fonte, sem bloquear snapshot inteiro.
- MVP sem replay upstream: reconectar obtém snapshot e informa lacuna; replay/cursor só prometido após implementação autoritativa. Não ressuscitar run terminal por evento atrasado; escopos/sessões diferentes descartados.

## Frontend e rendering

Criar components/Freds360/{Freds360Shell,EcosystemScene,FredsCore,ServiceNode,NowFeed,SentinelSummary,InspectorDrawer,ConversationDock,ProvenanceLegend,AccessibleServiceList}. Estado em lib/ecosystem.store.ts (Zustand) separando grafo, overlays, fontes, seleção e preferências; reutilizar execution-runs.store.ts para runs. Hook useEcosystemView coordena lifetime, cleanup e assinaturas. Usar seletores granulares, não rerender por heartbeat de todo o canvas.

Decisão recomendada MVP: SVG com coordenadas determinísticas por grupo e overlays DOM para acessibilidade, motion já instalado, sem WebGL/D3/Three novo por padrão. Deixar renderer atrás de interface; só adotar Canvas/WebGL se profiling justificar a carga real. Layout/ordem estáveis entre snapshots; evitar force simulation sacudindo a tela. Transforms em camadas e limites de partículas, sem criar timer por aresta. No mobile usar lista/cena focada, não dezenas de microlabels.

Cliques abrem drawer; nenhuma autorização de execução fica no canvas. Ações permitidas derivadas do backend e ainda validadas no servidor. Eventos recebidos não podem disparar remediação, publicação ou desvio de guardrail. Intervenção do usuário cria pedido explícito vinculado a run/ação/escopo, mantendo ACK e estado não confirmado.

## Segurança

Identidade por sessão autenticada e contexto efetivo, autorização em cada fonte, segregação de unidade/workspace. Tokens e URLs privadas no servidor; sem VITE_*/NEXT_PUBLIC_* secretos. Config de upstream controlada pelo operador (SSRF prevention); IDs/filtros whitelist, timeout e body limits. WS valida auth/Origin segundo contrato existente. Sem token em query/log/error payload novo. Mensagens/evidências de upstream são dados não confiáveis, não instruções ao assistente. Redigir segredo antes de serializar; links de evidência não aceitam javascript: nem URL arbitrária. CSP e políticas do app preservadas.

Testar troca de usuário/unidade durante conexão: fechar subscriptions, limpar caches por contexto, recarregar fonte autorizada; nunca cache global compartilhado de dados privados. Não usar JWT administrativo global. Sentinel finding é evidência a revisar; bloquear ação exige enforcement real separado e não será inferido da UI.

## Performance e verificação

Orçamentos propostos para medir no ambiente alvo, não promessas: snapshot comprimido <=250KB para overview, mediana render <=16ms desktop e <=33ms mobile, transição de seleção <200ms sem trabalho pesado síncrono, cena interativa após snapshot em <=2s em rede local. Cap de eventos em memória (ex. 200 itens recentes) e paginação no histórico; load shedding agrupa repetidos sem descartar lifecycle terminal.

Testes de contrato: shape/version, mapeamento desconhecido, auth ausente, fontes parciais, redaction e timeout. Reducers: ordem/replay/duplicado/clock skew/snapshot atrasado/terminal/cancel_unconfirmed. Frontend: navegação teclado, drawer/foco, demo explícita, desconectado, fonte stale, mobile, reduced-motion. E2E: mockup fixture → fonte real read-only → alerta com evidência → consulta chat → ação com aprovação negada/aceita quando disponível. Não gerar teste que só reproduz implementação visual.

## Ativação e rollback

Primeira entrega rota de preview /freddy/360 ou feature flag local independente; manter /freddy e /office atuais até validação do usuário. Confirmar compatibilidade do router instalado. Promover depois por configuração sem apagar componentes antigos. Rollback desliga flag e novas subscriptions; não remove logs/resultados nem cancela runs em voo. Nenhum deployment nesta sessão de planejamento. Na sessão executora, reportar implementado/testado/ativo separadamente.

## Próxima sessão

1. Ler DESIGN e TASKS, abrir o mockup vinculado e conferir hash se usar arquivo local.
2. Reconciliar diffs com FR-00/FR-01/FR-04 em execução na outra sessão.
3. Executar F360-01 (design/code boundaries), F360-02 (contratos) e validar fixtures.
4. Implementar shell e renderer estático antes de dados reais.
5. Integrar Graphify, execuções, Sentinel em cortes testáveis, com fonte indisponível tratada.
6. Integrar chat/voz quando FR-03/06 estiverem validadas; não esperar OpenAI para entregar read-only.
7. QA, runbook e revisão visual; pedir aprovação específica somente para publicação/deploy se necessário.
