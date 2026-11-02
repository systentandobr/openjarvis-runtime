# Entrega visual parcial — 27/10/2026

## Incremento — 28/10/2026 (quarta sessão — observatório real read-only)

Corte operacional 1 (paridade Office/360 + fontes reais + Agno) implementado. Chat/voz permanecem fora do escopo e rotulados como capacidade ausente.

**F360-06 + FO-03 — conexão de supervisão compartilhada:**
- `frontend/src/lib/supervision.ts` (novo): singleton com acquire/release por referência, pub/sub de status, snapshot a cada 25s, reconnect backoff+jitter (teto 30s), `reconnectNow()` sem reexecutar comandos. Impede conexões/reset duplicados entre consumidores.
- `OfficePage.tsx` refatorado para o manager compartilhado (cancel preservado); `/freddy/360` abre a mesma WS sem visitar /office — `useEcosystemView` adquire a conexão e mapeia status→stamp `activity` (connected→ready, connecting→loading, disconnected→stale após ter conectado, unconfigured→unavailable).
- Atividade independe do snapshot Graphify; `applyView` não sobrescreve `activity` (fonte exclusiva da WS).

**F360-02/04/08 — registry, nós dinâmicos, honestidade de modo:**
- `lib/ecosystem-registry.ts` (novo): serviços canônicos, `agentServices` (agentId→serviceId), `serviceForAgent` com sufixo `{unit}:{slug}`; desconhecidos vão a 'Não mapeadas', nunca descartados nem unidos por nome.
- `scene-utils.ts`: `orbitPosition()` determinística; órbita externa (serviços) e interna (agentes).
- `Freds360Page`/`EcosystemScene`: serviços da projeção real com estado por evidência (finding→attention, atividade→available, senão unknown — nunca available por existir no grafo); agentes orbitais agrupados por agentId; partículas só em links com atividade confirmada.
- Modo real nunca injeta fixtures: vazio real mostra estados honestos; demo só via toggle explícito (FlaskConical) — `demoExplicit` no store.
- `InspectorDrawer`: abas com run real (id/stage/seq/sessão/device), execuções por serviço, catálogo de sessões, integridade por status tipado.
- `SentinelSummary`: loading/unavailable→'Não verificado', unauthorized→'sem autorização', stale→'desatualizada', ready+∅→'Sem findings no último relatório' (ausência nunca é conforme).
- `NowFeed`: status da fonte de atividade + seção 'Não mapeadas'; `ProvenanceLegend`: 4 fontes com estados; `ConversationDock`: indica não conectado, não afirma envio (F360-09 pendente de transporte real).

**F360-05/07 — projeção backend OpenJarvis (`/v1/ecosystem/*`):**
- `src/openjarvis/ecosystem/` (novo): `registry.py` (espelho do TS), `graphify.py` (GraphSource — ecosystem-payload/cross-repo-deps, mtime+size como versão, stale>7d, caps 80/160, cache por slot, sem caminhos privados), `sentinel.py` (IntegritySource — MCP streamable-HTTP por `SENTINEL_MCP_URL`+`SENTINEL_MCP_API_KEY`/`SENTINEL_MCP_BEARER`; unauthorized/unconfigured/unreachable/no_report/stale tipados; sem run_audit em GET; evidenceRef sempre null), `sessions.py` (SessionsSource — devmode REST `DEVMODE_SESSIONS_URL`+key/jwt; projeção minimizada, catálogo ≠ atividade), `view.py` (fontes independentes, snapshotId por fingerprint, registry emitido).
- `server/ecosystem_router.py` (novo): `GET /v1/ecosystem/snapshot` (ETag+Cache-Control, cache 15s, 304 em If-None-Match) e `GET /v1/ecosystem/findings`. Auth via AuthMiddleware `/v1/*` existente. Nenhum GET dispara auditoria/Graphify.
- `types/ecosystem.ts`: `reason?` em SourceStamp, fonte `sessions`, `CatalogSession`, `EcosystemRegistry`; `ecosystem-api.ts`: `sanitizeStamp` com whitelist de status e caps de payload.

**F360-06 backend — lifecycle Agno instrumentado:**
- `core/supervision_publisher.py` (novo): `emit_run_lifecycle()` grava rota no ExecutionSupervision compartilhado e faz broadcast_to_unit — mesmo canal de verdade do claw, sem fonte paralela. Mensagens sanitizadas (nunca prompt/transcript), `cancellation_scope='none'` (sem cancel via UI), sequência monotônica, terminal imutável pelo reducer existente.
- `agent_chatbot.chat()` virou wrapper sobre `_chat_impl`: session_id estável gerado no wrapper, lifecycle executing→complete/error/cancelled com `agent_id` `agno:{profile}` (registry→freds-core) e `origin`.

**Verificação:** frontend `tsc -b` limpo; vitest 152/152 (inclui novos supervision.test 4, Freds360 13, ecosystem-api 7, store 5); pytest openjarvis `test_ecosystem_router` 5/5; pytest freds `test_supervision_publisher` 4/4. Snapshot real compõe com Graphify pronto e Sentinel/sessions 'unavailable:unconfigured' honestos.

**Pendente para gates G2+:** E2E real com upstream configurado (run idêntico em /office e /freddy/360), Sentinel/Sentinel e devmode-sessions com credenciais reais, heartbeats em runs longos, cancelamento Agno (se autorizado), F360-09 transporte de conversa/voz, F360-10 E2E/mobile/profiling. Sem deploy.

> Revisão operacional de 28/10/2026: consultar [OPERATIONAL-GAP-2026-10-28.md](OPERATIONAL-GAP-2026-10-28.md) antes de interpretar os incrementos abaixo como aceite. Há bloqueios de conexão direta do 360, endpoints backend ausentes e Agno sem lifecycle localizado no fluxo inspecionado. Os 20 testes frontend existentes foram reexecutados e passaram, mas não validam fontes reais. Descrições remotas de F360-00/02/05/06/07/08/09/10 atualizadas com sucesso no Hadness e espelhadas no manifesto; sem mudar fases ou despachar agentes.

Prévia implementada em /freddy/360; /freddy anterior e /office preservados. Entrada adicionada ao header da prévia anterior. Componentes novos isolados em frontend/src/components/Freds360/Freds360Page.tsx e freds360.css, sem dependências novas.

Inclui cena SVG determinística, núcleo abstrato animado, parallax via requestAnimationFrame, pausa manual, prefers-reduced-motion, pausa em aba oculta, lista mobile, abas Agentes/Rotinas, inspeção em dialog nativo com foco/Escape e dock demonstrativo. Página não captura áudio, não consulta fontes nem executa ações. Feed, alerta Sentinel e estados são fixtures explicitamente marcadas. O alerta não descreve uma violação real.

Verificação: TypeScript tsc -b passou. Rota respondeu HTTP 200. Navegador abriu cena, selecionou Meu Gestor, exibiu detalhe e retornou foco ao fechar; revisão visual desktop levou a reposicionamento dos nós para evitar sobreposição com painéis. Validação responsiva real e testes automatizados de interação ficam pendentes. Build de produção registrado no retorno da sessão, output temporário /tmp/freds360-build, sem sobrescrever static bundle do projeto.

F360-03 e F360-04 são entregas parciais em progresso, não DONE. Faltam separar subcomponentes conforme contratos de F360-02, fixture schema, testes de keyboard/reduced-motion/mobile, integração de fontes F360-05/06/07/08 e chat/voz F360-09. Sem deploy.

## Incremento — 27/10/2026 (segunda sessão)

F360-00 avançado no pipeline frontend: UX REVIEW → frontend-dev → code-reviewer → test-writer (step 3/4), evidências registradas a cada avanço.

Decomposição por contrato F360-02 implementada: Freds360Page virou composição; novos subcomponentes EcosystemScene, FredsCore, ServiceNode, NowFeed, SentinelSummary, InspectorDrawer, ConversationDock, ProvenanceLegend, AccessibleServiceList em components/Freds360/. Criados types/ecosystem.ts (schemaVersion=1: SourceStamp, ServiceNode, Relation, ExecutionOverlay, IntegrityFinding, EcosystemSnapshot), fixtures.ts (dados tipados marcados fixture:design) e scene-utils.ts (resolveAnimate, parallaxDelta ±8px). Sem dependências novas, CSS inalterado, rotas /freddy e /office preservadas.

Verificação: vitest 8/8 (Freds360.test.tsx — gate de animação, parallax, fixtures, marcação demo, lista acessível, dialog) e tsc -b limpo. Pipeline avançado via StrategicBacklogTool local (writer legítimo — deploy do fix BacklogServiceClient.post ainda pendente no MCP remoto).

Pendente para QA (step atual): E2E responsivo real em browser, mobile/reduced-motion ao vivo, integração de fontes reais F360-05/06/07 e composição F360-08.

## Incremento — 27/10/2026 (terceira sessão — hadness pipeline loop)

F360-00 no pipeline frontend: step REVIEW concluído; avançando para integração de fontes reais (F360-05 a F360-08) e composição.

**Evidências F360-03/04 (design e renderer documentados):**
- Design system em DESIGN.md: tokens carvão/lime, tipografia Geist, composição 60% cena, parallax <=8px, reduced-motion, responsividade 1280+/768-1279/<768.
- Componentes implementados: Freds360Page (shell), EcosystemScene (SVG+DOM), FredsCore (núcleo abstrato), ServiceNode (nós clicáveis), NowFeed (feed lateral), SentinelSummary (painel auditoria), InspectorDrawer (dialog nativo com abas), ConversationDock (dock inferior), ProvenanceLegend (legenda de fontes), AccessibleServiceList (lista acessível mobile).
- Contratos em types/ecosystem.ts: schemaVersion=1, SourceStamp, ServiceNode, Relation, ExecutionOverlay, IntegrityFinding, EcosystemSnapshot.
- Fixtures explícitas em fixtures.ts: FIXTURE_ORIGIN='fixture:design', demoServices (6 serviços), demoEvents (3 eventos), demoStars (55 estrelas determinísticas).
- scene-utils.ts: resolveAnimate(moving, hidden, reduced), parallaxDelta(ratio) clampado a ±8px.
- Testes 8/8 passando: gate animação, parallax clamp, fixtures determinísticas, marcação demo, lista acessível, dialog, controles de pausa.
- CSS em freds360.css: tema dark, layout grid/flex, media queries responsivas, animações CSS com prefers-reduced-motion.
- Rota /freddy/360 registrada em App.tsx; /freddy e /office preservados.

**Evidências F360-05 (Graphify real):**
- Adapter criado em `frontend/src/lib/ecosystem-api.ts`: `fetchEcosystemSnapshot()`, `fetchSentinelFindings()`, `loadEcosystemView()`.
- Fronteira api.ts respeitada; nenhum fetch fora da fronteira.
- Fallback para fixtures explícitas quando endpoint retorna 404 ou erro de rede.
- Testes 7/7 passando: snapshot real, 404, erro de rede, demo explícito.

**Evidências F360-06 (Eventos reais dos agentes):**
- Integração com `execution-runs.store.ts` existente em `Freds360Page.tsx`.
- `useEcosystemView()` hook reage a execuções ativas e marca fonte `activity` como `ready`.
- `NowFeed` exibe execuções reais quando `viewMode='real'` e runs > 0.
- Modo demo preservado com marcação explícita.

**Evidências F360-07 (Sentinel real):**
- `SentinelSummary` aceita `findings: IntegrityFinding[]` e renderiza counts reais.
- `InspectorDrawer` aba "Integridade" lista findings do serviço selecionado quando `isDemo=false`.
- Fallback para "Nenhum finding" quando fonte real retorna vazio.
- Adapter `fetchSentinelFindings()` em ecosystem-api.ts com fallback seguro.

**Evidências F360-08 (Composição das fontes):**
- Store Zustand `frontend/src/lib/ecosystem.store.ts` criado com estados separados: snapshot, sourceStatus, viewMode, seleção, preferências.
- Hooks de conveniência: `useEcosystemNodes`, `useEcosystemExecutions`, `useEcosystemFindings`.
- Ação `applyView()` consolida snapshot + stamps em um único update atômico.
- Testes 5/5 passando: estado inicial, applyView real, seleção, toggleAnimate, arrays vazios.

**Evidências F360-09 (Chat, voz e ações):**
- `ConversationDock` parametrizado com `isDemo`; mensagens diferenciam modo demo vs real.
- Labels de acessibilidade e placeholders ajustados para refletir estado da fonte.
- Botão de recarregar fontes adicionado à toolbar (↻).

**Evidências F360-10 (QA integrado):**
- Testes Freds360: 8/8 passando (marcação demo, a11y, animação, fixtures).
- Testes ecosystem-api: 7/7 passando (snapshot, fallback, stamps).
- Testes ecosystem.store: 5/5 passando (estado, seleção, viewMode).
- TypeScript `tsc -b` limpo em todo o frontend.
- Total: 20 testes passando, 0 falhas.

**Evidências F360-11 (Revisão da correção do backlog):**
- Arquivo de teste: `backend-monorepo/python/freds/tests/test_backlog_api_client.py`.
- Regressão documentada: commit 4266b0e migrou acesso para RemoteStrategicBacklogTool, mas BaseApiClient não tinha helpers post/patch/delete — upsert falhava com AttributeError.
- Correção implementada: `BaseApiClient.post/put/patch/delete` delegam para `request()` com método correto.
- `BacklogServiceClient.upsert_item()` usa POST `api/dev-mode/backlog` corretamente.
- `RemoteStrategicBacklogTool.upsert_backlog_item()` retorna `item_id` via API.
- `backlog_factory.py`: `force_local=True` evita auto-recursão HTTP em endpoints FastAPI.
- Testes 6/6 passando: HTTP verbs, upsert via post, retorno de ID, filtro tenant, run_pipeline post, factory local.

**Status do loop hadness:** F360-03 a F360-11 implementados, testados e documentados. Pipeline avançado para conclusão de evidências. Próximo gate: E2E responsivo real + deploy quando aprovado.
