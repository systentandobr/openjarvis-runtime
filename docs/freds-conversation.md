# Freds conversacional

A skill `skills/freds-conversational/SKILL.md` é instrucional e compatível com o loader nativo do OpenJarvis. Ela orienta personalidade, diálogo, contexto, síntese de eventos, delegação e linguagem de aprovação/cancelamento. Não é um pipeline que dispara ferramentas e não instala um agente novo.

## Identidade compartilhada com o Friendly

A fonte canônica agora é `code-assistant-friendly/.context/skills/freds-conversational/SKILL.md`. Ela reúne os valores existentes em `IDENTITY.md` e `SOUL.md` do Friendly com a orientação conversacional do escritório. Os arquivos legados continuam preservados; suas listas históricas de canais/provedores não são tratadas como inventário ativo. `USER.md` com placeholders não é memória confirmada do usuário.

O arquivo deste runtime é uma exportação idêntica, sem dependência de outro checkout em produção. Para atualizar e conferir, na raiz do OpenJarvis:

```sh
python3 scripts/sync_freds_conversational.py
python3 scripts/sync_freds_conversational.py --check
```

Use `--source /caminho/SKILL.md` quando os repositórios não forem irmãos. Mude a fonte no Friendly e exporte; evite editar duas personalidades separadamente.

O Friendly registra `/converse <mensagem>` no mesmo registry de comandos. Esse handler carrega a skill do registry existente e chama o provedor já configurado, mantendo o contexto de sessão, workspace, streaming e cancelamento recebido. Passa pelo Processor e pela política existente de aprovação/auto-run; não cria backlog automaticamente, não instancia outro modelo e não executa uma chamada adicional de recomendação. Isso não cria memória global compartilhada nem garante que todo provider persista histórico. CLIs conservam suas permissões e possíveis efeitos; esta chamada não é um sandbox novo.

**Limite atual:** o chat nativo do OpenJarvis ainda responde pelo engine do OpenJarvis. A bridge `/v1/systentando/events` é de supervisão/controles, não um transporte de chat. A identidade compartilhada e o comando do backend estão preparados; encaminhar o chat a `/converse` requer o contrato de transporte abaixo, sem inferir que observar um agente significa conversar com ele.

### Próxima ligação do chat (FO-06)

Criar um adapter server-side explícito de conversa Friendly, selecionável na UI, usando o transporte autenticado existente e o mesmo Processor. Correlacionar conversation/session/turn/request/run/device; mostrar a fonte da resposta, o provider real e seus fallbacks. Manter aprovações no backend e refletir a decisão na UI. Não enviar `skip_approval`/`dispatch` para contornar o fluxo do canal.

Reconexão não deve reenviar um turno sem idempotência confirmada. Falha não deve disparar outro engine silenciosamente. Streaming precisa de sequência, término e erro; cancelamento deve apontar para o run e aguardar ACK, separado de interromper o player de voz. Validar duas sessões/dispositivos sem cruzar respostas, aprovação negada sem chamada ao provider, resposta tardia após troca de conversa, queda/reconexão e cancelamento real. Sem esse teste ponta a ponta, não apresentar o chat como integrado ao Friendly.

## Carregar no runtime

O `SystemBuilder` consulta `./skills` do diretório de trabalho e depois o `skills_dir` configurado, quando `[skills].enabled=true`. Assim, iniciar o serviço a partir da raiz de `openjarvis-runtime` torna o pacote descobrível na próxima construção do sistema. O catálogo disponibiliza a ferramenta instrucional `skill_freds-conversational`; a decisão de carregá-la depende do agente/modelo em uso e do catálogo realmente ligado. Um modelo sem capacidade de ferramentas não invoca a skill automaticamente.

`configs/freds-conversational.example.toml` é um fragmento para mesclar à configuração ativa. Ele sugere o uso da skill no prefixo e usa um diretório de skills relativo à raiz. Não substitua a configuração inteira com o exemplo: ele não contém autenticação nem engines. Se o servidor iniciar de outro diretório, configure `skills_dir` com o caminho apropriado. Não sobrescrever prompts pessoais sem revisar sua precedência; o prefixo é um complemento, não uma substituição dos limites e do contexto do runtime.

Para verificar a descoberta, na raiz do repositório, com a CLI instalada:

```sh
jarvis skill list
jarvis skill info freds-conversational
```

`jarvis skill run` não significa conversar com um modelo: skills instrucionais não têm passos executáveis. A checagem desta entrega carrega a skill, publica seu catálogo e invoca a ferramenta instrucional sem inferência nem execução externa. Nenhum servidor foi reiniciado e nenhuma configuração de usuário foi sobrescrita nesta sessão.

## Como pedir

- “Freds, use a skill freds-conversational e me ajude a organizar o que precisa da minha atenção.”
- “Freds, me conte o que mudou no escritório desde o último estado confirmado.”
- “Freds, detalhe essa decisão de modelo e conta antes de eu aprovar.”
- “Freds, pare de falar” interrompe a voz quando o player oferecer isso; “cancele a execução X” exige identificação e confirmação do executor.

A referência ao Jarvis do cinema indica uma experiência de conversa serena e competente. A identidade continua sendo Freds; não há promessa de consciência, autonomia irrestrita, acesso a todos os dispositivos ou imitação de ator.

## Voz: capacidade presente e próxima entrega

O frontend atual usa `useSpeech`: grava um trecho, envia para transcrição e acrescenta o texto ao campo de entrada. Em `InputArea`, o microfone fica indisponível enquanto a resposta está em streaming. Existem adapters de síntese de voz no backend e um player para áudio em mensagens; isso não prova que uma resposta falada esteja configurada nesta instalação.

Para chegar a um modo de conversa por voz mais fluido, a entrega de interface/áudio ainda precisa:

1. Estados observáveis de ouvir, transcrever, pensar, responder e falar, com controles explícitos de entrada/saída e erro.
2. STT/TTS configurados e disponíveis no ambiente, escolha de voz original e fallback por texto. Não adicionar custo/provider por suposição.
3. Interrupção da fala (barge-in), descarte de chunks antigos, coordenação de turnos, cancelamento de player separado do cancelamento de run e restauração correta ao mudar de conversa/modelo.
4. Consentimento do microfone, limite/indicador da escuta, pausa e encerramento visíveis; retomada automática somente se habilitada pelo usuário.
5. Testes de ruído, transcrição incorreta, falha de áudio/rede, fonte ampliada e mobile; uma aprovação sensível por voz precisa manter ação/conta/escopo verificáveis no fluxo existente.

Uma skill sozinha não implementa esses recursos. Ela já define como o Freds deve se comportar quando o frontend disponibilizá-los, sem afirmar que estão ativos.
