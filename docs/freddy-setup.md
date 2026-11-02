# Configuração do Freddy no OpenJarvis

Perfil: `configs/freddy-local.toml`. A configuração ativa padrão é `~/.openjarvis/config.toml`; o perfil do repositório só é usado quando selecionado explicitamente com `OPENJARVIS_CONFIG`. Não substituir a configuração pessoal com o arquivo de avaliação de A100 em `configs/openjarvis/config.toml`.

O perfil seleciona cloud/OpenAI e gpt-5.4-nano, Faster-Whisper base em português no CPU/int8 e Kokoro com voz masculina portuguesa pm_alex. É configuração preparada, não comprovação de disponibilidade de modelo/voz. Faster-Whisper está instalado; Kokoro não estava instalado na verificação de 27/10/2026. O download dos pesos e a disponibilidade da voz precisam de teste antes de anunciar voz ativa. Modelos e caches não entram no Git.

A chave OpenAI exclusiva deste projeto ainda depende de criação segura e confirmação do destino. Não colocar segredos neste TOML ou em VITE_*. Configurar OPENAI_API_KEY no processo servidor não a torna disponível no navegador. O perfil não lê .env automaticamente.

MCPs externos são definidos em tools.mcp.servers como array JSON ou arquivo JSON relativo ao diretório do perfil. HTTP usa StreamableHTTPTransport; SSE legado não deve ser presumido compatível. Cada servidor pode declarar name, url e token_env, que referencia uma variável do processo servidor. A resolução de token_env exige a variável e rejeita token inline simultâneo. Não salva o segredo no arquivo. Não oferece OAuth automático nem refresh; credenciais expiram e precisam ser renovadas pelo host.

Exemplo de estrutura (URL ilustrativa, não ativada):

```json
[{"name":"gestor","url":"https://gestor.example.com/mcp","token_env":"GESTOR_MCP_TOKEN"}]
```

Antes de preencher a lista ativa, confirmar os endpoints reais de Freds, Gestor, Dorama e Document Orchestrator e executar initialize/tools/list e consulta read-only de contexto. Postiz permanece local; não publicar sua porta. Não copiar as credenciais do ChatGPT nem presumir que elas existem no OpenJarvis.

A página /freddy ainda é protótipo. O chat existente contém componentes de voz; essa nova página não chama provedores nem agenda tarefas. Primeiro validar modelos, STT, TTS e MCPs; depois conectar a interface. Não ativar publicação ou negociação por inferência.
