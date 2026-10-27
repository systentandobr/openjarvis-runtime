# Entrega visual parcial — 27/10/2026

Prévia implementada em /freddy/360; /freddy anterior e /office preservados. Entrada adicionada ao header da prévia anterior. Componentes novos isolados em frontend/src/components/Freds360/Freds360Page.tsx e freds360.css, sem dependências novas.

Inclui cena SVG determinística, núcleo abstrato animado, parallax via requestAnimationFrame, pausa manual, prefers-reduced-motion, pausa em aba oculta, lista mobile, abas Agentes/Rotinas, inspeção em dialog nativo com foco/Escape e dock demonstrativo. Página não captura áudio, não consulta fontes nem executa ações. Feed, alerta Sentinel e estados são fixtures explicitamente marcadas. O alerta não descreve uma violação real.

Verificação: TypeScript tsc -b passou. Rota respondeu HTTP 200. Navegador abriu cena, selecionou Meu Gestor, exibiu detalhe e retornou foco ao fechar; revisão visual desktop levou a reposicionamento dos nós para evitar sobreposição com painéis. Validação responsiva real e testes automatizados de interação ficam pendentes. Build de produção registrado no retorno da sessão, output temporário /tmp/freds360-build, sem sobrescrever static bundle do projeto.

F360-03 e F360-04 são entregas parciais em progresso, não DONE. Faltam separar subcomponentes conforme contratos de F360-02, fixture schema, testes de keyboard/reduced-motion/mobile, integração de fontes F360-05/06/07/08 e chat/voz F360-09. Sem deploy.

## Incremento — 27/10/2026 (segunda sessão)

F360-00 avançado no pipeline frontend: UX REVIEW → frontend-dev → code-reviewer → test-writer (step 3/4), evidências registradas a cada avanço.

Decomposição por contrato F360-02 implementada: Freds360Page virou composição; novos subcomponentes EcosystemScene, FredsCore, ServiceNode, NowFeed, SentinelSummary, InspectorDrawer, ConversationDock, ProvenanceLegend, AccessibleServiceList em components/Freds360/. Criados types/ecosystem.ts (schemaVersion=1: SourceStamp, ServiceNode, Relation, ExecutionOverlay, IntegrityFinding, EcosystemSnapshot), fixtures.ts (dados tipados marcados fixture:design) e scene-utils.ts (resolveAnimate, parallaxDelta ±8px). Sem dependências novas, CSS inalterado, rotas /freddy e /office preservadas.

Verificação: vitest 8/8 (Freds360.test.tsx — gate de animação, parallax, fixtures, marcação demo, lista acessível, dialog) e tsc -b limpo. Pipeline avançado via StrategicBacklogTool local (writer legítimo — deploy do fix BacklogServiceClient.post ainda pendente no MCP remoto).

Pendente para QA (step atual): E2E responsivo real em browser, mobile/reduced-motion ao vivo, integração de fontes reais F360-05/06/07 e composição F360-08.
