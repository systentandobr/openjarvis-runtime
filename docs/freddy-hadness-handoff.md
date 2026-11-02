# Freddy operacional — handoff Hadness

Data: 27/10/2026. Épico FR-00. Implementação destinada a outra sessão.

## Como retomar

Consultar FR-00 e as dependências no backlog; começar por FR-01. Inspecionar git status/diff para preservar trabalho existente. Pipeline default: architect → developer → reviewer → bug-fixer → QA → security. Abertura do pipeline do épico não significa despacho nem execução dos filhos. Dependências estão registradas textualmente e em tags; não constituem bloqueio automático do motor. O épico não deve ser encerrado só pela entrega do planejamento.

## Estado verificado

/freddy é protótipo aprovado. Perfis: configs/freddy-local.toml e docs/freddy-setup.md. Config padrão ~/.openjarvis/config.toml não substituída. Faster-Whisper instalado, Kokoro ausente na última inspeção; voz ainda simulada. Chave OpenAI não criada: confirmação de destino recusada. Nenhum agendamento real ativado. token_env e perfil passaram verificações isoladas; pytest não está na .venv. OAuth Gestor parcial, sem deploy. Os testes e a disponibilidade devem ser revalidados.

Reutilizar FC-01 (6aded0f7806c01057856e985), FC-02 (6aded2fd806c01057856f40b) e FP-01 (6ae08278806c0105785f0bf1), sem duplicar núcleos existentes.

## Mapa

| Código | ID no backlog | Responsável | Dependências |
|---|---|---|---|
| FR-00 | 6ae09463806c0105785f7440 | architect | nenhuma |
| FR-01 | 6ae09463806c0105785f7448 | architect | nenhuma |
| FR-02 | 6ae09464806c0105785f7456 | backend-specialist | FR-01 |
| FR-03 | 6ae09465806c0105785f745e | developer | FR-01, FR-02 |
| FR-04 | 6ae09465806c0105785f7467 | backend-specialist | FR-01 |
| FR-05 | 6ae09466806c0105785f746e | developer | FR-03, FR-04 |
| FR-06 | 6ae09467806c0105785f7475 | developer | FR-02, FR-03 |
| FR-07 | 6ae09467806c0105785f7479 | developer | FR-04, FR-05 |
| FR-08 | 6ae09468806c0105785f747d | backend-specialist | FR-05 |
| FR-09 | 6ae09469806c0105785f7485 | developer | FR-08 |
| FR-10 | 6ae09469806c0105785f7493 | backend-specialist | FR-04, FR-05 |
| FR-11 | 6ae0946a806c0105785f749d | architect | FR-04, FR-08 |
| FR-12 | 6ae0946b806c0105785f74a6 | tester | FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10 |

## FR-00 — Freddy operacional: épico e handoff Hadness

Responsável: architect. Dependências: nenhuma.

Mapear e coordenar a evolução da página /freddy. Primeiro corte: conversa textual real + agenda/backlog; depois voz e rotinas. Reutilizar FC-01 para voz e FC-02 para chat Friendly; FP-01 é integração futura de plugin/Postiz, não bloqueia o MVP local.

Aceite: dependências e responsáveis explícitos, decisão de transporte registrada, evidência de cada capacidade e roteiro de implementação para outra sessão.

## FR-01 — Inventariar runtime e selecionar configuração ativa

Responsável: architect. Dependências: nenhuma.

Inspecionar serviço atual, comando de inicialização, portas, config realmente carregada e alterações não commitadas. Padrão observado ~/.openjarvis/config.toml; perfil preparado configs/freddy-local.toml não está ativo. configs/openjarvis/config.toml é avaliação A100 e não deve substituir config pessoal. Selecionar perfil explicitamente via OPENJARVIS_CONFIG, preservando autenticação, limites e dados. Revisar start-ecosystem.sh antes de usar.

Aceite: inventário sem segredos; health e configuração efetiva verificáveis; ativação reversível documentada; sem reiniciar serviços alheios.

## FR-02 — Provisionar OpenAI e validar modelo nano no backend

Responsável: backend-specialist. Dependências: FR-01.

Criar chave exclusiva via fluxo seguro somente após confirmação do destino (tentativas anteriores recusadas; nenhuma chave criada). Perfil prevê gpt-5.4-nano com engine cloud; verificar suporte real do adapter, parameters, tool calling e modelo disponível. OPENAI_API_KEY apenas servidor; .env não é carregado automaticamente pelo perfil. Evitar fallbacks pagos silenciosos.

Aceite: chamada mínima autorizada de texto e ferramenta; custos/token usage identificados; falha fechada sem chave; zero segredos no bundle/logs/Git; não afirmar modelo validado apenas por TOML.

## FR-03 — Conectar /freddy ao chat real e estados de execução

Responsável: developer. Dependências: FR-01, FR-02.

Substituir resposta simulada em frontend/src/pages/FreddyPage.tsx por integração via frontend/src/lib/api.ts. Reutilizar stores/streaming existentes e correlacionar conversa, sessão, turno e request. Para Friendly, continuar FC-02 ID 6aded2fd806c01057856f40b e docs/freds-conversation.md; não tratar bridge de supervisão como transporte de chat. Decidir explicitamente engine OpenJarvis versus Friendly; nenhuma mudança silenciosa de fonte.

Aceite: enviar/streaming/erro/fim observáveis; isolamento de conversas; reconexão não duplica turno; cancelar execução separado de parar áudio; exemplos não se misturam com dados reais.

## FR-04 — Conectar MCPs e validar identidade/capacidades

Responsável: backend-specialist. Dependências: FR-01.

Inventariar Freds, Gestor, Document Orchestrator e Dorama, confirmar URL/auth/transporte por serviço e initialize/tools/list. Cliente atual usa StreamableHTTPTransport ou stdio; SSE legado não deve ser presumido compatível. Adicionado token_env em core/config.py: testar antes de ativar. Nunca copiar sessão do ChatGPT. Gestor get_operation_context deriva unidade; conta pretendida systentandobr@gmail.com não é prova de autorização. OAuth parcial em architecture-security é dependência quando aplicável.

Aceite: matriz por servidor com disponibilidade/autenticação/freshness; consulta read-only real; falta de credencial marcada; nenhum token em TOML/frontend/logs; catálogos sem colisão; aprovações mantidas e escrita não liberada por anotação da UI.

## FR-05 — Agenda e backlog reais no resumo do Freddy

Responsável: developer. Dependências: FR-03, FR-04.

Criar vertical 'organize meu dia' com agenda e backlog das fontes autorizadas. Determinar janela do dia America/Fortaleza, paginação, tarefas abertas, prazos, impacto e dependências. Retornar até três prioridades justificadas com links/IDs, fonte e data. Reutilizar agentes/morning_digest.py quando adequado sem disparar ações extras.

Aceite: duas fontes reais consultadas; concluídos não priorizados; dados ausentes distinguem-se de fila vazia; perguntas críticas de contexto; nenhum dado operacional inventado.

## FR-06 — Validar STT/TTS local e ligar voz ao Freddy

Responsável: developer. Dependências: FR-02, FR-03.

Subtarefa de integração de FC-01 ID 6aded0f7806c01057856e985, sem duplicar o núcleo de voz. Reutilizar hooks/useSpeech.ts, lib/tts.ts e endpoints /v1/speech/*. Faster-Whisper instalado; Kokoro não instalado na última inspeção. Perfil sugere CPU/int8, pt, Kokoro pm_alex: testar voz/modelo/licença e latência, não assumir. Modelos/caches fora do Git. Começar push-to-talk; estados ouvindo/transcrevendo/pensando/falando/erro; interrupção de áudio não cancela run.

Aceite: português ponta a ponta, consentimento microfone, fallback por texto, áudio obsoleto descartado, falha STT/TTS visível, ruído/mobile/HTTPS e redução de movimento testados; sem escuta automática implícita.

## FR-07 — Atendimento e orçamentos do Gestor no painel

Responsável: developer. Dependências: FR-04, FR-05.

Integrar consultas do Gestor para fila de atendimento, respostas pendentes e orçamentos próximos de vencer. Validar contexto usuário/unidade primeiro. Definir campos de pendência, prazo e estado com a API; não inferir negociação externa ou faturamento a partir de proposta. Escrita segue prévia/reviewId/payload/requestKey existentes.

Aceite: links às entidades e contexto efetivo; filtros e paginação; prioridade explicável; isolamento entre unidades; sem envios ou alterações comerciais automáticos.

## FR-08 — Configurar rotinas persistentes manhã e tarde

Responsável: backend-specialist. Dependências: FR-05.

Reutilizar scheduler/scheduler.py, store.py, tools.py e connectors/scheduler.py; avaliar persistência e reinício antes de criar outro scheduler. Rotinas propostas 08h e 15h America/Fortaleza, horários configuráveis e janelas de execução claras. Manhã agenda/3 prioridades/bloqueios; tarde deltas/concluídos/decisões/amanhã. Chave idempotente por rotina/janela/unidade, lease, retries limitados, deduplicação e histórico; política de execução perdida/desligamento do Mac explícita.

Aceite: agendar/pausar/retomar visíveis e reais; reinício sem duplicação; offline/falha de fonte não vira sucesso; nenhuma publicação ou negociação disparada pelo resumo.

## FR-09 — Notificações e histórico acionável

Responsável: developer. Dependências: FR-08.

Definir canal inicial de notificação realmente suportado (UI/desktop e opcional canal já autorizado). Não presumir push mobile, voz espontânea ou funcionamento com Mac desligado. Persistir resultado por execução, entregue versus gerado, não lidos, dedupe e severidade. Apresentar apenas mudanças relevantes e ações de leitura.

Aceite: evento de entrega observável, fallback e permissão negada testados; navegação para histórico; sem enviar mensagem a terceiros ou email sem autorização.

## FR-10 — Conectar conhecimento e registrar decisões confirmadas

Responsável: backend-specialist. Dependências: FR-04, FR-05.

Separar datasource de busca/indexação das operações MCP. Integrar bases autorizadas/document-orchestrator com proveniência, versão, escopo e data. Não indexar todo disco/banco indiscriminadamente. Registro de evidência→proposta→decisão humana confirmada→resultado; hipótese não vira preferência persistente. Controle de acesso também na recuperação.

Aceite: resposta com fonte, limites de contexto e remoção/reindexação previstos; isolamento e prompt injection de fonte não autorizam ações; dados pessoais/segredos excluídos conforme escopo.

## FR-11 — Produção Dorama e Postiz local como etapa posterior

Responsável: architect. Dependências: FR-04, FR-08.

Vincular FP-01 ID 6ae08278806c0105785f0bf1. Acompanhar roteiro→produção→revisão→aprovação→agendamento→publicação confirmada; Postiz permanece local, worker consulta fila por saída autenticada, sem ingress público. Detalhar idempotência/reconciliação de resultado incerto antes de liberar publicação. Investimentos/MetaTrader em observação, sem ordens.

Aceite: plano de integração e consultas de status; nenhuma publicação automática por instalar conector; assets em Tigris/storage, nunca Git; escopos de aprovação explícitos.

## FR-12 — QA de segurança, mobile e handoff operacional

Responsável: tester. Dependências: FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10.

Validar ponta a ponta, testes significativos de isolamento, credenciais/expiração, reconexão, replay, cancelamento e ações sensíveis. HTTPS para microfone mobile; rede local e hostname configuráveis. Runbook de iniciar/parar/diagnosticar/rollback; documentar capacidade implantada versus disponível no código. Perfis/modelos/custos sem afirmações não medidas.

Aceite: build e testes relevantes com resultados documentados; artefatos pesados ignorados; nenhum segredo em fonte/bundle/log; roteiro de aceitação executado e limitações declaradas; deploy separado de implementação.

## Regras operacionais

Segredos somente no servidor; não versionar mídia/pesos/caches. Conta pretendida systentandobr@gmail.com não determina unidade: confirmar pelo contexto autenticado. Fontes ausentes são não verificadas. Microfone mobile requer HTTPS. Agenda America/Fortaleza. Publicação, negociação e deploy não autorizados pelo cadastro de tarefas. Registrar fontes, datas, decisão confirmada e resultado; hipótese não vira memória persistente automaticamente.

