# Freds 360° — tarefas e ordem Hadness

Plano detalhado de execução em outra sessão. Nenhum F360 foi confirmado no backlog remoto nesta entrega: o MCP retorna erro de método post inexistente. Não confundir estes códigos de planejamento com IDs Mongo. O design foi escrito, mas não implementado nem revisado visualmente no runtime.

## Referências essenciais

- [Design](DESIGN.md)
- [Arquitetura e contratos](IMPLEMENTATION.md)
- [Mockup aprovado](https://chatgpt.com/library?file_id=libfile_91b0d252ae6c81919de961189ec93b71&account_id=personal)
- [Manifesto para cadastro](backlog-import.json)
- Épico pré-existente FR-00: 6ae09463806c0105785f7440. Não alterar seu progresso como efeito colateral.

## Sequência

Corrigir F360-11 para poder cadastrar. Design/contratos (01→02), shell (03), renderer (04), fontes Graphify/execuções/Sentinel (05/06/07), composição real (08), dock (09 condicionado a FR-03/06), QA (10). Inspeções independentes podem ser executadas em paralelo por sessões autorizadas com ownership de arquivos; este handoff não dispara agentes.

| Código | Responsável | Pipeline sugerido | Depende de | Pontos relativos |
|---|---|---|---|---|
| F360-00 | architect | frontend | — | 13 |
| F360-01 | ux | frontend | — | 5 |
| F360-02 | architect | default | F360-01 | 5 |
| F360-03 | frontend-dev | frontend | F360-01, F360-02 | 8 |
| F360-04 | frontend-dev | frontend | F360-02, F360-03 | 8 |
| F360-05 | backend-dev | backend | F360-02 | 8 |
| F360-06 | backend-dev | backend | F360-02, F360-04 | 8 |
| F360-07 | backend-dev | backend | F360-02, F360-03 | 8 |
| F360-08 | developer | default | F360-04, F360-05, F360-06, F360-07 | 8 |
| F360-09 | developer | default | F360-08 | 8 |
| F360-10 | tester | default | F360-08, F360-09 | 8 |
| F360-11 | backend-dev | backend | — | 5 |

Pontos são estimativas relativas para refinamento, não prazo prometido. O épico agrega escopo, não somar seus pontos ao esforço dos filhos.

## Cadastro e início do pipeline

1. Conferir o código do client atual antes de corrigir, pois outra sessão está migrando serviços. Corrigir a API de escrita via contrato existente; não escrever direto no banco.
2. Consultar backlog e buscar os títulos F360 antes de importar, evitando duplicatas após resultado incerto.
3. Enviar cada args de backlog-import.json a upsert_backlog_item sequencialmente. Conferir sucesso real do texto/structuredContent; isError=false sozinho não basta.
4. Relistar e registrar IDs aqui e no manifesto; manter remote_id=null quando não confirmado.
5. Iniciar somente o épico F360-00 pelo run_hadness_pipeline(pipeline_name=frontend, task_id=ID_CONFIRMADO, workspace_path=REPO). Isso seleciona ux→frontend-dev→reviewer→QA; segurança continua gate obrigatório adicional F360-10/FR-12, não inferir que pipeline frontend a executa sozinho.
6. Não usar run_and_dispatch nesta fase. Cada filho pode seguir seu pipeline indicado após dependências aceitas; não começar todos simultaneamente.
7. Atualizar resultados e evidências após cada gate. Design em arquivos é pronto para revisão, não feature DONE. Aprovação criativa não equivale a deploy.

## Gates

G0: design e contratos revisados. G1: demo claramente identificada e acessível. G2: read-only real com fontes datadas e falha parcial. G3: evidências redigidas e isolamento de contexto. G4: chat/voz com permissões quando FR concluídas. G5: E2E/performance/mobile/reduced-motion/rollback. Não marcar épico DONE enquanto os cortes acordados não forem aceitos.

## F360-00 — Freds 360°: épico visual, Graphify, agentes e Sentinel

Responsável architect; dependências nenhuma.

Coordenar a entrega em cortes A shell/demo, B estrutura+atividade read-only, C Sentinel/evidências, D chat/voz, E QA/ativação. Não reiniciar FR-00 nem seus pipelines. Ler docs/freds-360/DESIGN.md e IMPLEMENTATION.md antes de editar.

Revisão de design → contratos → shell/renderer → três fontes reais → chat/voz existente → QA. Dependências são registradas como texto/tags, não enforcement automático.

## F360-01 — Design system, layout responsivo e motion do Freds 360°

Responsável ux; dependências nenhuma.

Design inicial já produzido em docs/freds-360/DESIGN.md, aguardando revisão. Mockup aprovado com carvão #0a0a0c e lime #d5ff40, núcleo abstrato Freds, grafo dominante e poucos painéis. Adaptar tokens do site sem importar CSS global. Especificar desktop/mobile, estados vazios/parciais/desconectados e drawer.

Aceite: validar composição 1440x900/1024x768/390x844, contraste AA, toque>=44px, texto legível, reduced-motion e lista acessível equivalente. Aprovar critérios antes do renderer; mockup não prova serviços online.

## F360-02 — Contratos da projeção 360° e registry de correlação

Responsável architect; dependências F360-01.

Definir portas GraphSource/ExecutionSource/IntegritySource, IDs estáveis por serviço/repo/agent/run, modelo snapshot schemaVersion/sourceStamp com timestamps e coverage separados, cursor/sequence por origem, sanitização. Decidir reuse do WS versus envelope novo em ADR. Ler proposta detalhada IMPLEMENTATION.md.

Aceite: contratos versionados, fixtures validadas, política sem mapping→Não mapeadas, auth por contexto, nenhuma união por nome aproximado, nenhuma regeneração de grafo/audit em GET. Persistência nova só por interface memory+Mongo se necessária.

## F360-03 — Shell visual e navegação /freddy/360 com fontes simuladas explícitas

Responsável frontend-dev; dependências F360-01, F360-02.

Criar shell, núcleo, feed, painel Sentinel, inspector e dock conforme DESIGN. Reconciliar App/Sidebar e ModuleCardsGrid/ProjectSessionList com edições concorrentes; não sobrescrever. Rota preview ou flag mantém /freddy e /office. Fixtures em modo demo explícito, sem mocks quando modo real falhar.

Aceite: seleção/drawer/teclado/foco/Escape/mobile funcionais, origem e status claros, botões não simulam operação sem aviso; nenhum fetch fora api.ts, sem novas credenciais ou chamadas pagas.

## F360-04 — Renderer de grafo e animação parallax acessível

Responsável frontend-dev; dependências F360-02, F360-03.

SVG com coordenadas determinísticas e overlays DOM; motion já instalado. Estrutura agregada overview até 80 nós/160 arestas como orçamento inicial, expandir sob demanda. Núcleo voz independente do estado operacional; parallax decorativo<=8px, controles fixos; sem force-layout contínuo.

Aceite: layout estável, fit/seleção/pausa/reduced-motion; sem timer por aresta; limitar partículas e trabalho por frame; aba oculta pausa efeitos; lista alternativa completa. Medir antes de introduzir WebGL/Canvas.

## F360-05 — Graphify snapshot seguro, versionamento e atualização da estrutura

Responsável backend-dev; dependências F360-02.

Reutilizar backend-monorepo/python/freds/services/ecosystem_graph_service.py e routers/ecosystem.py. Investigar lru_cache e invalidar por versão/mtime/publicação atômica. Adapter OpenJarvis lê projeção browser-safe; não enviar merged-graph bruto/caminhos privados. proposed GET /v1/ecosystem/snapshot deve ser confirmado antes de criar.

Aceite: generatedAt/observedAt/version/coverage, grafo ausente/stale explícito, ETag/refresh leve sugerido60s configurável, nenhum Graphify pesado por GET; auth/unidade e limits. graphify-out fora do Git; testar snapshot substituído atomicamente.

## F360-06 — Sobrepor execuções reais e reconciliar reconexões

Responsável backend-dev; dependências F360-02, F360-04.

Reutilizar server/freds_bridge.py, lib/api.ts e execution-runs.store.ts; não criar fonte paralela de verdade. Mapear run→serviço via registry explícito, runs desconhecidos na lista não mapeada. Feed filtra/agrega heartbeats sem perder lifecycle terminal. Timeouts e reconciliação mantêm unknown/cancel_unconfirmed.

Aceite: duplicado/fora de ordem/terminal/snapshot atrasado/duas sessões/troca de unidade testados; backoff+jitter; reconnect não reexecuta comando; lacuna de replay declarada; animações só de atividade confirmada; auth server-side sem URL privada no browser.

## F360-07 — Sentinel privado: findings, cobertura e evidências no painel

Responsável backend-dev; dependências F360-02, F360-03.

Integrar consultas sentinel_health/latest_report/list_findings/prioritized_issues em architecture-guides/sentinel/mcp/server.py pela bridge privada autorizada. Não confundir recipe local sentinel de social monitoring. Projeção sanitizada mapeia auditId/findingId/check/severity/estado/serviço/cobertura/data; polling30–60s configurável.

Aceite: segredo nunca em evidência/log/bundle; sem relatório=Não verificado; fonte stale destacada; nenhum run_audit/sync_backlog por GET; finding não implica enforcement. Testar auth/timeout/fonte parcial/sem mapping/cross-unit; caminho de evidência autorizado.

## F360-08 — Integração read-only da cena, feed, drawer e fontes

Responsável developer; dependências F360-04, F360-05, F360-06, F360-07.

Compor application/ecosystem_view via bootstrap; stores/seletores granulares, estado por contexto. api.ts única fronteira. Detalhes sob demanda, history cursor quando upstream suportar; sem alegar replay não implementado. Cabeçalho/legend distingue graph snapshot, activity e auditoria.

Aceite: uma fonte falha sem derrubar demais, limpeza ao trocar sessão, cap de eventos, sem dados globais privados em cache. Demonstrar seleção serviço→run/finding→evidência e acessibilidade sem animação. Budget overview250KB e render16/33ms como metas a medir.

## F360-09 — Dock conversacional, voz e ações com contexto de seleção

Responsável developer; dependências F360-08.

Integrar FR-03 e FR-06 existentes, FC-01/FC-02, sem duplicar engine/persona. Clique/seleção entrega refs autorizadas como contexto, não instruções vindas de logs. Fonte real da resposta e estados ouvir/transcrever/pensar/falar; parar player distinto de cancelar run. Pode ser entregue após read-only se OpenAI/voz indisponíveis.

Aceite: sem token no frontend, sem autoescuta; aprovação ação/escopo verificável, ACK confirmação e deny testados; stale chunk descartado, texto fallback. Renderizar capacidade ausente em vez de fingir operação. Não publicar/remediar/negociar por evento.

## F360-10 — QA integrado, evidências e ativação reversível do 360°

Responsável tester; dependências F360-08, F360-09.

Reutilizar FR-12. Testes contrato/reducer/reconexão/isolamento/redaction/prompt injection de evidências/mobile/keyboard/reduced-motion. Verificar não-regressão /office e trabalho concorrente. Profiling real da cena, histórico limitado e fonte parcial. Runbook start/stop/diagnóstico/fonte/rollback.

Aceite: build+testes e revisão visual com mockup, resultados documentados, indicadores não confundem unknown com conforme/idle, flag rollback sem cancelar runs. Primeiro corte read-only pode revisar sem voz; encerrar entrega total só com escopo validado. Nenhum deploy nesta tarefa de planejamento.

## F360-11 — Restaurar cadastro MCP do backlog antes da importação

Responsável backend-dev; dependências nenhuma.

Corrigir regressão do caminho de gravação que usa método inexistente BacklogServiceClient.post. Consultas get_backlog respondem; todas as tentativas de upsert F360 retornaram erro textual, apesar de isError=false. Investigar core/tools/backlog_tool.py e services/clients/backlog_service_client.py/BaseApiClient e aplicar no serviço correto em sessão autorizada.

Aceite: contrato de create/update real com idempotência e auth/unidade preservadas; erro expresso como falha de tool; consulta por título/chave confirma cadastro único. Não fazer fallback direto para Mongo nem mudar unidade para contornar.


## Cadastro remoto confirmado — 27/10/2026

As 12 tarefas foram cadastradas e relidas no backlog. O erro anterior de post não ocorreu. F360-11 permanece TODO para revisão/evidências da correção; não foi marcada DONE apenas porque o cadastro funcionou. IDs autoritativos registrados no manifesto.

| Código | ID |
|---|---|
| F360-00 | 6ae1067df52993ee9524dab3 |
| F360-01 | 6ae10681f52993ee9524dab4 |
| F360-02 | 6ae10682f52993ee9524dab5 |
| F360-03 | 6ae10683f52993ee9524dab6 |
| F360-04 | 6ae10684f52993ee9524dab7 |
| F360-05 | 6ae10685f52993ee9524dab8 |
| F360-06 | 6ae10686f52993ee9524dab9 |
| F360-07 | 6ae10686f52993ee9524daba |
| F360-08 | 6ae10687f52993ee9524dabb |
| F360-09 | 6ae10688f52993ee9524dabc |
| F360-10 | 6ae10689f52993ee9524dabd |
| F360-11 | 6ae1068af52993ee9524dabe |
