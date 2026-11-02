# Office e conector de investimentos

Implementação local validada em 26/10/2026. O Office observa runs, estados, correlação e solicita interrupção; não fornece autorização de negociação ou resultado de corretora.

## Configuração privada da bridge

No processo servidor OpenJarvis, configurar `FREDS_SUPERVISION_WS_URL` para o endpoint `/ws/supervision` do gateway e `FREDS_SUPERVISION_DEVICE_TOKEN` com credencial da unidade/workspace. Bridge força mode=observer e remove is_admin para essa rota. Escopos: supervision:read e, se desejado, supervision:cancel. Nunca usar a credencial de publicação do conector no navegador.

Acesso do browser usa a autenticação já existente do servidor Jarvis em `/v1/systentando/events`. Tokens/upstream ficam no servidor. Esta bridge continua sendo de um workspace por instância; não representa delegação multiunidade do usuário Gestor. Preservar isolamento de implantação e evitar registro de query token pelo proxy.

## Comportamento

Eventos reais entram em execution:event/event.data. Office aceita executing, waiting_approval, paused, attention e estados terminais, mantém sequence e não reabre terminal por replay/snapshot atrasado. Snapshots distinguem agentes ociosos de execuções. Desconexão marca runs não terminais como unknown e desabilita controle. Reconnect tem backoff; snapshots são solicitados a cada25s.

Reinício do gateway recupera checkpoints observados; rotas continuam desconhecidas até rebind autenticado. Snapshot do gateway contém até500 ativos e100 terminais recentes; o histórico completo não é um ledger do Office. O gateway nesta fase exige uma réplica.

Interrupção exige execução/agente/sessão/request corretos, scope local_handler e rota fresca. cancel_unconfirmed não significa parada. cancelled é um evento terminal do executor. O conector pode já ter persistido a observação; isso não é revertido ao parar o handler. Nenhum botão cancela ordem ou zera posição.

O run de descoberta usa agent_id=mt5-discovery e session_id=investment-<connectorRef>. Cada tentativa cria run diferente; operation_id recebe o id do capability snapshot após persistência. Build/account do MT5 seguem unverified. Suite de store do Office e bridge foi verificada, além do teste integrado com processos reais/fixtures; sem contato com corretora ou mudança da configuração de produção.

Guia completo: architecture-guides/docs/19-investimentos-gestor-office.md no workspace. Não confundir essa nova coorte com migração das conversas, skills, backlog ou runtime inteiro de agentes.
