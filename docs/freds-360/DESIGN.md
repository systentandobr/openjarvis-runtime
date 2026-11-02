# Design System — Freds 360°

Direção aprovada em 27/10/2026. Escopo: evolução da rota /freddy, mantendo /office e os trabalhos em andamento. Este documento define o design; o runtime não está implementado por este planejamento.

## Referência visual vinculada

[Mockup aprovado](https://chatgpt.com/library?file_id=libfile_91b0d252ae6c81919de961189ec93b71&account_id=personal).

Original local: /Users/marcelio/developing/systentando/generated_images/exec-a388a99a-e6fa-4b92-8c4f-a6e7d64d1d9e.png

SHA-256: e25287ef2daa18de5ae0192f68b6615665f637f38d4c3ea9ecd798165c194570.

A imagem é referência estética, com dados simulados. Não extrair métricas, aprovação de ações ou topologia autoritativa dela. Não copiar PNG para Git, public/ ou bundle. Renderizar com código. Consulta de referência também anexada por link nas tarefas.

## 1. Tema e atmosfera

Centro de operações silencioso: Freds no centro, ecossistema como cenário, detalhes sob demanda. Aproximadamente 60% da tela inicial reservado à visualização; evitar mosaico de cartões e headline promocional. O núcleo é abstrato, sem rosto/ator. Freds é o assistente interno; Systentando é a organização. A imagem orienta hierarquia, não pixels inflexíveis.

Camadas: fundo estrutural discreto → dependências → atividade efêmera → controles fixos. Movimento explica estado e percurso. Parallax apenas decorativo, não modifica relações reais ou acesso aos controles.

## 2. Paleta e tokens

Fonte: site/src/design-system/tokens/tokens.css. Adaptar semanticamente ao tema do OpenJarvis, sem importar CSS global do site.

| Token proposto | Cor | Uso |
|---|---|---|
| freds-background | #0a0a0c | Fundo carvão |
| freds-surface | #0f0f13 | Painéis escuros |
| freds-highlight | #15151a | Seleção discreta |
| freds-accent | #d5ff40 | Ação primária e foco |
| freds-text | #f8fafc | Texto principal |
| freds-muted | #94a3b8 | Texto secundário |

Erro/atenção/conforme usam tokens semânticos existentes; distinguir também com ícone e palavra. Lima não significa conformidade de segurança. Conferir contraste WCAG AA em texto/foco/estados.

## 3. Tipografia e geometria

Geist já disponível no frontend; não baixar outra fonte. Títulos 20–28px, nomes 13–15px, corpo 14–16px; evitar reproduzir os microlabels ilegíveis do mockup. Superfícies com curvas suaves de 12–16px, chat em cápsula. Borda sutil e brilho baixo; limitar filtros blur e sombras animadas. Alvos de toque de pelo menos 44px.

## 4. Composição e componentes

- Header compacto: marca / freds, Visão 360°, Agentes, Rotinas; identidade/contexto efetivo acessível. Indicador real de fonte, sem bolinha online decorativa enganosa.
- Rail de navegação existente preservado; evitar sidebar duplicada. /freddy integra o Layout existente.
- EcosystemScene: mapa agrupado por serviço/repositório; núcleo central Freds; zoom, enquadrar seleção e pausa do movimento. A posição central é layout, não prova de todas as relações.
- FredsCore: quieto/ouvindo/transcrevendo/pensando/falando/erro; voz somente se runtime confirmar. Parar áudio separado de cancelar execução.
- ServiceNode: nome, capacidade disponível e estado de fonte. Clicar abre drawer de inspeção; nada executa por hover.
- ActivityTrail: pontos/pulsos associados a runs reais; fila, esperando aprovação e desconhecido têm aparência distinta. Sem evento não desenhar trabalho fictício.
- NowFeed: até 3 eventos relevantes no desktop, expandir histórico; agrupar heartbeats repetidos e evitar log bruto.
- SentinelSummary: alerta mais relevante, contagem por severidade e evidência. Sem auditoria recente = não verificado. Findings não comprovam bloqueio de execução.
- InspectorDrawer: seleção por nó/run/finding com abas Contexto, Execuções, Integridade. Um drawer por vez; IDs e fonte acessíveis, caminhos sanitizados.
- ConversationDock: texto e voz, fonte da resposta, ação em andamento; integra FR-03/FR-06. Sem respostas simuladas no modo real.
- ProvenanceLegend: Graphify snapshot/data/versão; atividade conectada/último evento; Sentinel última auditoria/cobertura. Relógios independentes.

## 5. Estados e interação

Cenários obrigatórios: vazio, carregando, parcial, desconectado, expirado, não autorizado, sem mapeamento, falha e demonstração. Fixtures só por modo demo explícito e persistente na UI; nunca fallback silencioso a demo. Detalhe de alerta mostra check, fonte, alvo, escopo, primeira/última ocorrência, cobertura e status conforme contrato efetivo.

Fluxo inicial: visualizar → selecionar serviço → examinar execução/evidência → pedir ajuda ao Freds → prévia/aprovação se necessária → execução → resultado confirmado. Aprovação existente continua autoritativa no backend.

## 6. Motion e parallax

Usar motion já instalado e CSS para transições. Entradas de painéis: 160–240ms, seleção: 120–180ms, núcleo respirando: 3–5s com amplitude baixa. Pulsos só enquanto run ativo/recente e nunca como prova de progresso percentual. Evitar animação de layout global em cada evento.

Desktop: parallax discreto de fundo até 8px e camada de grafo até 4px; controles fixos. Atualização via requestAnimationFrame e refs, não React state em cada mousemove. Sem rotação automática, zoom constante ou câmera com inércia obrigatória.

prefers-reduced-motion e toggle manual desligam partículas/respiração/parallax; manter estados estáticos equivalentes. Pausar efeitos em aba oculta. Não usar orientação do dispositivo. Sem escuta de microfone automática.

## 7. Responsividade e acessibilidade

>=1280px: cena central, feed esquerdo compacto, Sentinel à direita, chat inferior. 768–1279px: só um painel auxiliar aberto. <768px: foco no Freds e serviço selecionado; lista acessível de serviços e feed em bottom sheet; sem tentar comprimir o grafo inteiro. Tela de 360px deve permitir ler e usar tudo sem arrastar a página lateralmente.

Grafo é melhoria progressiva. Lista DOM sincronizada é alternativa completa, navegável por teclado/leitor de tela. Drawer com foco capturado, Escape fecha e restaura o disparador. Seleção anunciada; feed não gera aria-live por heartbeat; erros importantes anunciados com moderação.

## 8. Revisão de design

Validar mockup estático antes de conectar fontes. Comparar em 1440x900, 1024x768 e 390x844 com motion normal/reduzido. Aceite: hierarquia próxima à imagem, texto legível, clareza de fonte e estado, detalhes sob demanda, nenhum dado fictício apresentado como operacional.
