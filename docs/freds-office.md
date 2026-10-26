# Escritório do Freds no OpenJarvis

Direção do usuário em 25/10/2026: o OpenJarvis é a base do frontend; Freds é a persona do assistente que recebe objetivos e coordena o ecossistema. O escritório fica ao seu redor. O standalone mantém o trabalho anterior; esta interface não depende dele.

## Abrir e revisar

Prévia isolada: `/office-preview.html` (sem inicialização de analytics, descoberta de modelos ou inferência). A rota do app permanece `/office`.

No frontend, a navegação **Escritório do Freds** abre `/office`. Para desenvolvimento: `cd frontend` e `npm run dev -- --host 127.0.0.1 --port 5184`.

- **Mockup do vídeo**: demonstração isolada com 17 especialistas em quatro operações, planta em perspectiva, mesas selecionáveis e Freds no centro. Campos, contas e cotas são fixtures marcadas como simulação. A solicitação de interrupção tem controles explícitos para simular ACK ou ausência de resposta. Não executa provedores.
- **Agentes OpenJarvis**: consulta os agentes gerenciados existentes; a seleção usa o stream nativo para atualizar o snapshot. Contadores acumulados do agente não são apresentados como consumo de uma execução. As ações e aprovações nativas continuam nas páginas de agentes e conversa. Pausar um agente agendado não é tratado como cancelar um processo em voo.
- **Friendly / Freds**: observa eventos identificados e encaminha cancelamento pela bridge autenticada. Sessão e dispositivo podem filtrar a observação. Não mistura fixtures com os eventos reais.

O prompt padrão deste fork identifica o assistente como Freds e exige distinguir plano, despacho, execução e resultado confirmado. Configurações de prompt explícitas já instaladas continuam com precedência sobre o padrão. A persona não instala ferramentas nem concede novas permissões e não significa que a orquestração automática de todo o ecossistema esteja ligada.

## Bridge do servidor

`/v1/systentando/events` é uma bridge WebSocket opcional no servidor OpenJarvis. Reutiliza a autenticação WS do servidor e exige que a API tenha chave configurada; um servidor keyless não expõe a unidade privada do Freds.

Configuração somente no ambiente do processo servidor:

- `FREDS_SUPERVISION_WS_URL`: URL completa do WS Freds na unidade autorizada, por exemplo `wss://host/ws/<unidade>`.
- `FREDS_SUPERVISION_DEVICE_TOKEN`: token DeviceAuth da mesma unidade. Nunca usar `VITE_*`.

A bridge é para uma unidade/workspace configurada pelo administrador do servidor. Uma instalação multiusuário precisa de mapeamento de identidade/unidade antes de compartilhar esta bridge. O browser não escolhe upstream, unidade ou token; o servidor aceita somente controle `execution:cancel` com os quatro identificadores e observa apenas eventos de execução/resultados de cancelamento. Não encaminha chat nem comandos arbitrários. TLS é exigido fora de localhost. Segredos não aparecem nas respostas e erros não devolvem a URL de upstream.

São necessários os três componentes atualizados: OpenJarvis, Freds e Friendly. Nenhum serviço remoto foi publicado/reiniciado nesta entrega. A conexão real depende da configuração server-side e não foi validada contra uma operação real.

## Contrato entre Friendly e Freds

O Friendly registra o ciclo de vida do handler WS com UUID por execução, agente efetivo, sessão, executor, hostname real, sequência e horário. O mesmo ID segue nos eventos intermediários de comandos; os payloads preservam metadados permitidos, sem copiar prompts/argumentos completos para a telemetria. Execuções concorrentes ficam separadas, mesmo para o mesmo agente. Eventos `step` são observações intermediárias; somente `lifecycle` altera o ciclo de vida.

O Freds guarda rotas efêmeras por `(unidade, execution_id)`. Um evento de factory só retorna à unidade pai compatível com seu canal autenticado. Uma solicitação de interrupção só pode atingir o socket que anunciou aquela execução, com sessão e agente correspondentes. Socket diferente não assume um run existente. Rotas encerradas não recebem cancelamento nem ressuscitam por eventos atrasados. Após reinício/perda da rota, a operação falha sem afirmar interrupção.

Pedido:

```json
{"type":"execution:cancel","execution_id":"uuid","agent_id":"dev","session_id":"sessao","request_id":"uuid"}
```

Evento:

```json
{"type":"execution:event","event":{"data":{"schema_version":1,"event_kind":"lifecycle","execution_id":"uuid","agent_id":"dev","session_id":"sessao","source_unit_id":"unidade","executor_unit_id":"unidade:dev","sequence":2,"stage":"cancel_requested","cancellation_scope":"local_handler"}}}
```

Estados: `executing → cancel_requested → cancelled`; erro e conclusão normal também encerram o run. A UI mantém `cancel_unconfirmed` após 15s sem evento terminal. Um ACK tardio pode reconciliar esse estado. Sequências antigas e mudanças de agente/sessão são descartadas; um run terminal não volta a executar.

A confirmação acontece somente após a função do handler retornar. Cancelamento propaga o contexto aos adapters existentes e impede fallback adicional e avanço de pipeline. CLIs que respeitam CommandContext param seu processo controlado; não há garantia sobre subprocessos destacados ou jobs remotos. Arquivos, efeitos externos e custos em voo permanecem. Não há promessa de rollback ou de encerramento de uma árvore remota inteira.

## Limites da primeira integração

- Não há replay/snapshot de todos os runs do Friendly ao reconectar; a observação começa nos eventos recebidos após conectar.
- Rotas são voláteis, com retenção limitada; execução longa sem eventos pode perder controle nesta camada e ficará sem confirmação.
- Custos, cotas e escolha ótima de modelo só aparecem quando há dados reais suportados. Não foram adicionadas consultas de billing nem seleção automática de modelo.
- As aprovações existentes são preservadas; este escritório não traduz aprovação em comandos inventados nem despacha trabalho sem uma ferramenta conectada.
- A planta mostra até quatro sessões por página e nove mesas por sessão; a lista contém todas as execuções filtradas.
- O app nativo continua com seu acompanhamento compacto. Não recebe a planta do escritório.

## Verificação local desta entrega

Frontend: 35 testes passaram e o build Vite/TypeScript foi gerado em `/private/tmp/freds-office-build` para não sobrescrever o bundle estático versionado. Persona/configuração e bridge do OpenJarvis: 68 testes passaram. Freds: 3 testes de isolamento/roteamento passaram. Friendly: testes de aplicação, adapters WS/IA e comandos/bootstrap passaram; aplicação de execução e WS também passaram com detector de races. O teste de WS mantém o handler bloqueado após o pedido e verifica que nenhum ACK terminal sai antes de liberar sua saída. O teste de fallback prova que cancelamento não inicia outro provedor.

Revisão no navegador: planta com quatro operações e Freds central, seleção de mesa e informações, diálogo de escopo e estado de interrupção solicitada. Fonte real não foi conectada a uma operação do ecossistema nesta sessão. Modelo ótimo, billing e orquestração automática externa não foram declarados como concluídos.
