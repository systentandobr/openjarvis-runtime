# Freds 360: demonstração → observatório operacional

Revisão de código e backlog remoto em 28/10/2026. Complementa DESIGN.md, IMPLEMENTATION.md e TASKS.md; não substitui suas decisões. Não houve deploy nem validação de tráfego autenticado em produção nesta análise.

## Resultado

A base visual e contratos existem, mas o 360 ainda não constitui supervisão operacional. Não basta remover a etiqueta demo. O Office já possui conexão de supervisão; a primeira entrega deve reutilizar essa capacidade, sem obrigar o usuário a visitar /office e sem condicionar atividade ao Graphify.

O PROGRESS.md registra a terceira sessão como implementação F360-03..11. Esse registro comprova trabalho parcial, não aceite operacional: os adapters frontend chamam endpoints ainda ausentes no servidor inspecionado; o dock não transmite mensagem. Preservar o histórico e aplicar os gates abaixo.

## Evidências e lacunas

| Área | Evidência no código | Falta para operação |
|---|---|---|
| Transporte | OfficePage abre openFredsSupervision, reconecta e solicita snapshots a cada 25s; useEcosystemView apenas observa o store | Extrair lifetime da conexão para serviço/hook compartilhado com aquisição/liberação, status e reconciliação; abrir diretamente no 360; impedir conexões/reset duplicados entre consumidores |
| Composição | events depende de viewMode real; viewMode depende de snapshot HTTP | Atividade independente do grafo; modo parcial por fonte; vazio real nunca retorna demoEvents/demoServices automaticamente |
| Snapshot | ecosystem-api chama /v1/ecosystem/snapshot e /findings; rotas não localizadas no servidor OpenJarvis | Adapter FastAPI → application → portas GraphSource, ExecutionSource, IntegritySource; identidade autenticada; validação runtime de schema/limites, sem cast baseado só em schemaVersion numérico |
| Sentinel | fetchSentinelFindings não é chamado por loadEcosystemView; erro vira []; painel vazio diz sem alertas | Resultado tipado por fonte: unauthorized/unavailable/stale/ready, data e cobertura. Ausência de auditoria nunca significa conforme. GET não dispara auditoria/remediação |
| Órbitas | EcosystemScene fixa Developer/QA/Architect; nós desconhecidos ficam em x50/y50 e estado available | Registry canônico de serviço/agent/engine/device/session; layout determinístico sem colisões; identidade sem união aproximada; estado por evidência, unknown por padrão |
| Execuções | Feed limita 3 runs ativos; snapshot.executions e relations não alimentam cena; drawer mostra texto futuro | Projeção runs→agentes/nós/arestas e histórico, seleção por executionId, filtros dispositivo/sessão/projeto, detalhes e terminais; fila Não mapeadas |
| devmode-sessions | SPEC separa catálogo/memória visual da autoridade de execução Friendly; REST paginado já definido | Adapter de leitura autenticado para projetos/workspaces/sessões, associação por IDs a runs e dispositivos; fallback isolado, polling com backoff/aba oculta; não inferir execução ativa da mera existência de sessão |
| freds-gateway | /ws/supervision existe; bridge aceita modo observer. README mantém migração REST/Hadness incompleta e stubs501 | Verificar endpoint efetivamente configurado sem divulgar URL/token; publisher→gateway→observer E2E; não presumir que Python e Go compartilham runs/bus; escolher autoridade e documentar transição sem dupla contagem |
| Agno/atendimento | agent_chatbot usa Agno e agenda atendimento_audit; não localizada emissão execution:event nesse caminho | Instrumentar entrada real de atendimento: início, etapa/ferramenta permitida, conclusão/falha/cancelamento, heartbeat e sequência; publisher server-side com unidade do contexto. Reusar gateway/store, sem criar engine paralelo |
| Atendimento/qualidade | /api/atendimento/audits/quality, flagged e jev-stats existem | Revisar escopo/autorização efetivos: handlers recebem unit_id opcional; não assumir isolamento. Projeção minimizada por unidade: sessões, espera, duração, escalonamento e qualidade apenas quando fonte existir. Agregados históricos não são fila ao vivo |
| Conversa | ConversationDock apenas setReply, inclusive modo real | FR-03/F360-09: transmissão real com confirmação de recebimento/resultado, cancel/timeout/erro; contexto IDs e resumo sanitizado. Nunca dizer objetivo enviado antes do envio. Voz é FR-06, opcional ao primeiro corte de monitoramento |

## Modelo e habilidades do observador

Freds ocupa o centro como supervisor. Órbitas agrupam infraestrutura (gateway/sessions), execução (Friendly/Agno/especialistas) e domínios (atendimento/documentos/etc.). Agrupar contagens e expandir progressivamente, preservando alternativa em lista mobile. O centro apresenta somente evidências: ativos, aguardando aprovação, falhas, fontes sem cobertura e última sincronização; não anima trabalho fictício.

Evoluir contratos para distinguir service, agent, engine, session e device (ou registry separado com links tipados), com versionamento/migração explícitos. Registry liga agentId→serviceId/engineId; runs conservam executionId/sessionId/deviceId e principal autenticado. IDs desconhecidos não são descartados. SourceStamp precisa cobertura, origem e timestamps; conexão aberta não prova serviço saudável e run antigo não prova atividade fresh.

Habilidades prioritárias: observar lifecycle e disponibilidade; explicar o que cada agente está fazendo com evidência; detectar silêncio/atraso e falha; mostrar bloqueios e aprovações; navegar sessão→execução→tarefa Hadness; separar auditoria arquitetural Sentinel, decisão de guardrail por tool e qualidade de atendimento. Despachar/cancelar exige autorização de capability, confirmação aplicável e resultado correlacionado; monitoramento não concede controle. Não incluir conteúdo de cliente, telefone, prompt/transcript ou segredo nos eventos gerais.

## Entregas vinculadas ao Hadness existente

1. **F360-06 + FO-03:** corrigir conexão compartilhada e atividade independente; reutilizar reducer de sequence/terminais/desconexão. Primeiro corte entrega paridade observacional Office/360.
2. **F360-02/04/08:** registry, nós dinâmicos, correlação, layout e drawer/feed reais; devmode-sessions via adapter somente leitura. Manter contrato visual e renderer existentes.
3. **F360-05/08:** implementar projeção backend de fontes com status independente, schema e limites; o grafo é estrutura versionada, não sinal de atividade.
4. **F360-06/08 + FR-07:** instrumentar Agno no backend Python e conectar os agentes de atendimento, sem duplicar a migração gateway (6adc0e15c69499d7282a4838 em REVIEW e 6adc092ac69499d7282a4837 em TODO). Catálogo devmode já tem task DONE 6adb77121f2f210d7147763a; não recriar serviço.
5. **F360-07:** Sentinel e auditoria/guardrails com cobertura e evidências, estados de fonte independentes, revisão do tenant nos adapters de atendimento.
6. **F360-09 + FR-03/06 + FO-06/07:** conversa e ações reais como corte posterior; voz não bloqueia aceite do observatório somente leitura.
7. **F360-10:** E2E dos caminhos abaixo antes de retirar demo do escopo operacional; reconciliar fases de subtarefas pelo aceite, não pelo avanço do épico.

## Gates para retirar demonstração

- Abrir diretamente /freddy/360 em sessão limpa e observar o mesmo run que /office, sem navegação prévia. Iniciar/completar/falhar um run e conferir IDs/etapas em ambas.
- Executar atendimento Agno controlado e vê-lo surgir no nó correto com evento terminal; impedir vazamento entre duas unidades. Nenhum dado real de cliente no teste.
- Listar sessões paginadas e associar a execução correta por IDs, preservando sessões sem run como catálogo; disponibilidade desconhecida explicitada.
- Derrubar Graphify mantendo gateway: atividade continua. Derrubar Sentinel: auditoria fica indisponível, nunca sem alertas por fallback. Snapshot vazio válido não inventa agentes/eventos.
- Desconectar/reconectar/reiniciar gateway: stale/unknown, deduplicação, sequência monotônica, terminais preservados, controle não reconstruído por snapshot; testar troca rápida de rota e consumidores simultâneos.
- Backend retorna 401/403/404/503 e payload malformado: fontes distinguíveis; sem credenciais de upstream no browser. Revisar contexto autenticado dos endpoints de auditoria antes de expor dados.
- Inspeção abre execução real e tarefa Hadness correlacionada; não correlacionar por nome/título. Atividade sem mapping permanece visível em Não mapeadas.
- Mobile 390x844, teclado, reduced-motion, aba oculta; volume de agentes agrupado sem sobreposição. Fixture acessível apenas em demo explícito, nunca fallback silencioso de modo operacional.

Aceite inicial: observatório somente leitura com atividade real, disponibilidade/cobertura claras e agentes de atendimento instrumentados. Chat/voz/controle e fontes opcionais ausentes mantêm seus próprios rótulos e gates; não bloquear nem falsificar monitoramento por essas ausências.

## Verificação desta revisão

20 testes existentes passaram (Freds360 8, ecosystem-api 7, ecosystem.store 5). Esses testes usam mocks/fixtures e não validam conexão inicial, producers reais ou integração backend. Backlog remoto: F360-00 REVIEW; 03/04 IN_PROGRESS; 01/02/05..11 TODO. FO-01/02/03/08/10 constam DONE; FO-04/05/06/07/09 TODO. Não avancei nem despachei pipelines nesta revisão.
