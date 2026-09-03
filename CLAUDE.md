# CLAUDE.md

Guia para o Claude Code trabalhar neste repositorio.

## Sobre o projeto

Frontend de uma aplicacao de financas pessoais (contas, cartoes, lancamentos, investimentos e
planejamento). O nome do produto e **Prisma**, usado de forma consistente no repositorio, no
`package.json`, em `APP_NAME` (`src/constants/app.ts`), no `<title>` do `index.html` e nos
prefixos de `localStorage` (`prisma:*`). Ao renomear um deles, renomeie todos.

O estado atual vai ate a **Etapa 3**: fundacao do frontend, dashboard e as telas de lancamentos
(listagem com filtros, cadastro, edicao e exclusao de receitas, despesas e transferencias). Nao
existe backend ainda; toda a camada de dados responde com mocks, e a escrita vive em memoria pelo
tempo da sessao. O backend em Java / Spring Boot / PostgreSQL vira nas proximas etapas.

## Comandos

```bash
npm install         # instala dependencias
npm run dev         # servidor de desenvolvimento em http://localhost:5173
npm run build       # tsc -b + build de producao
npm run preview     # serve o build de producao
npm run typecheck   # apenas checagem de tipos (tsc --noEmit)
```

Nao existe linter, formatter nem suite de testes configurados. **A verificacao antes de dar uma
tarefa por concluida e `npm run typecheck`** — rode sempre depois de mexer em `.ts`/`.tsx`.

## Stack

| Camada | Escolha |
| --- | --- |
| Build | Vite 5 |
| UI | React 18 + TypeScript 5 (`strict`) |
| Rotas | React Router 6 |
| Estilos | CSS Modules + custom properties (sem framework de UI) |
| Icones | lucide-react |
| Graficos | Recharts |

## Regras de arquitetura

Estas sao as invariantes do projeto. Quebra-las e o erro mais caro que se pode cometer aqui.

1. **Variaveis de ambiente so em `src/constants/env.ts`.** Nenhum outro arquivo le
   `import.meta.env`. Precisa de uma flag nova? Adiciona no objeto `env` e consome de la.

2. **URLs da API so em `src/api/endpoints.ts`.** Nenhuma string de rota de backend escrita fora
   desse arquivo.

3. **Componentes nunca chamam `fetch` nem `httpClient`.** Eles chamam services. Quem decide entre
   mock e API real e o service, sempre com o mesmo formato:

   ```ts
   export const dashboardService = {
     getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
       if (env.useMocks) {
         return mockResponse(buildDashboardSummary(), signal);
       }
       return httpClient.get<DashboardSummary>(endpoints.dashboard.summary, { signal });
     },
   };
   ```

   Todo mock passa por `mockResponse`, que aplica latencia artificial e respeita `AbortSignal`.
   Assim as telas ja exercitam carregamento, erro e cancelamento como fariam contra o backend real.

4. **Nenhum hex em componente.** Toda cor, espacamento, raio e tipografia sai dos tokens em
   `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`.

5. **Rotas so em `src/routes/paths.ts`.** Links usam `paths.x`, nunca string literal. A raiz `/`
   nao tem tela propria: ela redireciona para `paths.dashboard` (`/dashboard`), para que toda tela
   do app tenha um endereco com nome. O mesmo arquivo guarda os nomes dos query params (`busca`,
   `categoria`, `conta`, `novo`, `editar`) — eles sao contrato entre telas e nao devem ser escritos
   a mao em outro lugar.

6. **Contratos de dominio em `src/types/finance.ts`.** Sao o contrato esperado do backend futuro;
   mudar um tipo la e uma decisao de API, nao um detalhe de tela.

7. **Nada de `<select>` nativo.** O navegador desenha a lista do elemento nativo com as cores do
   sistema e ignora os tokens, o que deixa as opcoes ilegiveis no tema escuro. Campos de escolha
   usam `components/ui/Select`, um combobox proprio com `role="listbox"`, navegacao por teclado e
   estados de hover, selecao e foco vindos dos tokens. A lista sai num portal no `body` com posicao
   fixa: dentro de um formulario em modal, que rola, uma lista absoluta seria cortada pela borda do
   painel. Por isso `--z-popover` fica acima de `--z-modal` — nao inverta essa ordem.

8. **Excecao ao token de cor: Recharts.** A biblioteca escreve cor como atributo de SVG, onde
   `var(--token)` nao resolve de forma confiavel. Use o hook `useChartPalette`, que le os tokens
   computados e recalcula quando o tema muda.

## Estrutura

```
src/
├── api/           httpClient, ApiError, endpoints
├── components/
│   ├── ui/        Button, Card, Input, Textarea, Select, Modal, ConfirmDialog, Badge, Table,
│   │              Loading, EmptyState, Toast
│   ├── common/    Amount, BrandMark, DeltaIndicator, UnderConstruction
│   ├── layout/    Sidebar, Header, HeaderSlot, PageHeader, NotificationsPanel,
│   │              GlobalSearch, PeriodSwitcher
│   ├── dashboard/ BalancePanel, StatTile, CashflowChart, CategoryBreakdown, RecentTransactions
│   ├── transactions/ TransactionFilters, TransactionsTable, TransactionsList (cartoes),
│   │              formularios de lancamento, meta (icone/cor por tipo e situacao) e
│   │              query (filtro, periodo e ordenacao)
│   └── charts/    ChartTooltip
├── constants/     env, app, navigation, transactions
├── hooks/         useAsyncData, useMediaQuery, useLocalStorage, useLockBodyScroll, useChartPalette
├── layouts/       AppLayout (sidebar + header + conteudo)
├── pages/         Dashboard, Lancamentos, Configuracoes, placeholders, 404
├── providers/     ThemeProvider, ToastProvider, PeriodProvider, AppProviders
├── routes/        AppRoutes, paths
├── services/      dashboard, transactions, categories, accounts, investments, alerts
│   └── mocks/     data, transactions.store, dashboard.mock, alerts.mock, mockResponse
├── styles/        tokens.css, global.css
├── types/         common, finance
└── utils/         cn, date, format
```

Cada pasta de componentes tem um `index.ts` de barril — ao criar um componente novo, exporte-o la.

## Convencoes de codigo

- **Alias `@/` aponta para `src/`** (configurado em `vite.config.ts` e `tsconfig.app.json`).
  Use import absoluto entre pastas; relativo so dentro da mesma pasta.
- **Um `.module.css` ao lado do componente**, mesmo nome do arquivo.
- **Texto de interface e portugues brasileiro acentuado.** Titulo, label, descricao, placeholder,
  `aria-label`, mensagem de erro, texto de toast e dado de mock que chega a tela usam acentuacao
  correta: `Lancamentos` -> `Lançamentos`, `Configuracoes` -> `Configurações`. Titulos e labels
  seguem capitalizacao de frase ("Últimos lançamentos", "Rentabilidade acumulada"), nunca tudo em
  minusculo nem title case ao estilo ingles.
- **O que nao aparece na tela continua em ASCII puro:** comentarios, JSDoc, nomes de variaveis,
  chaves de objeto, ids de mock (`cat-saude`) e as rotas em `src/routes/paths.ts`
  (`/lancamentos`, `/configuracoes`). Manter essa separacao evita quebrar referencias no codigo.
- **Comentario existe para explicar o porque, nao o que.** O codigo atual segue isso — mantenha o
  padrao, nao encha de comentario obvio.
- `tsconfig` roda com `noUnusedLocals`, `noUnusedParameters` e `noUncheckedIndexedAccess`.
  Acesso a indice de array devolve `T | undefined` — trate, nao use `!`.
- Formatacao de moeda, numero e data passa por `src/utils/format.ts`, que usa `Intl` com
  `LOCALE = 'pt-BR'` e `CURRENCY = 'BRL'` de `src/constants/app.ts`. Todo valor exibido sai como
  `R$ 5.000,00`.
- **Valor monetario na tela sempre pelo componente `Amount`.** Ele usa `formatCurrencyParts` para
  separar o simbolo dos algarismos: "R$" fica em um span com a familia de interface e os digitos em
  um span `.tabular` com a familia de numeros. Escrever `{formatCurrency(x)}` direto no JSX faz o
  cifrao herdar o tracking negativo da familia de numeros e desalinhar em relacao ao resto do app.
- **Cor de variacao segue a seta, sempre.** No `DeltaIndicator` subir e verde e cair e vermelho, em
  qualquer tela. Nao reintroduza um modo que inverta so a cor: ele produz seta para baixo em verde,
  e o simbolo passa a contradizer a cor.
- Dados assincronos nas paginas vao por `useAsyncData`, que ja entrega estados de loading, erro e
  cancelamento.

## Tema

- Tres modos: claro, escuro e sistema. Escolha em **Configuracoes**, atalho no header.
- Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de
  tema errado. Se mexer na chave de storage (`THEME_STORAGE_KEY`), atualize esse script tambem.
- O `ThemeProvider` grava `data-theme` no `documentElement` **durante o render**, nao em efeito,
  para que quem le tokens computados (Recharts) enxergue o tema certo no mesmo ciclo.
- Os dois temas usam cinzas neutros, sem desvio de matiz: a cor fica reservada ao acento e aos
  estados semanticos, que assim se destacam. Ao acrescentar um token de superficie, respeite a
  escala de elevacao `canvas < surface < surface-raised < surface-muted`.
- `--chart-2`/`--chart-3` sao parentes de `--positive`/`--negative`, mas nao os mesmos valores: texto
  precisa de 4.5:1 e acaba escuro, enquanto barra e area sao objeto grafico (3:1) e podem ser mais
  claras e saturadas. Nao unifique os dois pares.
- Contraste e requisito, nao detalhe: texto em 4.5:1 e cor de grafico em 3:1 sobre a superficie em
  que aparece, nos dois temas. Vale tambem para o par cor/fundo dos badges (`--positive` sobre
  `--positive-soft`, e assim por diante), que e o ponto onde isso costuma escapar.
- Os tokens `--brand-*` sao a excecao a regra de tema: um logotipo nao muda de cor com o tema,
  entao eles ficam no bloco `:root` e valem para claro e escuro.

## Escrita nos mocks

Cadastro, edicao e exclusao de lancamentos passam por `transactionsService`, que no modo mock
delega a `services/mocks/transactions.store.ts`. O store muta o array `transactions` de
`mocks/data.ts` — a mesma fonte que abastece dashboard e avisos, entao um lancamento novo aparece
em todas as telas. O estado vive so ate o reload da pagina, de proposito: nao ha persistencia
enquanto nao houver backend.

Os lancamentos escritos a mao cobrem as ultimas semanas. Os meses anteriores saem de
`monthlyTemplate`, um modelo de mes tipico que `buildHistory()` expande para tras com variacao
fixa por mes — o grafico precisa oscilar, mas nao pode mudar a cada recarregamento. O tamanho de
`monthlyVariation` define ate onde o historico vai, e precisa cobrir com folga o mes mais antigo
que o seletor de periodo oferece (`CUSTOM_RANGE_MONTHS`), ja que um mes unico ainda desenha os
cinco meses anteriores. O mes corrente para no dia de hoje: um lancamento com data futura marcado
como pago seria incoerente, e os itens pendentes e agendados ja vem da lista escrita a mao.

`buildDashboardSummary(period)` recorta tudo pelo intervalo pedido e calcula as variacoes contra a
janela de mesmo tamanho imediatamente anterior, no lugar dos percentuais fixos que existiam antes.
O saldo de um mes passado e reconstruido a partir dos saldos de hoje, desfazendo o que entrou e
saiu depois daquela data. Nessa conta a transferencia so pesa quando cruza a fronteira do total:
o aporte na corretora, que fica fora de `includeInTotal`, reduz o saldo visivel, enquanto uma
transferencia entre duas contas do total nao muda nada.

O contrato de escrita e `TransactionPayload`: o cliente manda ids (`accountId`, `categoryId`,
`toAccountId`) e quem resolve nome de conta e de categoria e o servidor. O store tambem devolve
`ApiError` nos casos invalidos, com o mesmo formato do `httpClient`, para que a tela ja trate erro
como tratara contra a API real.

**Transferencia nao e receita nem despesa.** Ela tem `category: null`, carrega `toAccountId` e fica
fora do total do periodo (`netTotal`) e de `spendingByCategory`: o dinheiro so troca de conta e nao
altera o patrimonio. Por isso a tela de Transferencias esconde a coluna e o filtro de categoria —
seriam um traco em toda linha.

A tela de lancamentos busca do service so pelo `kind` da rota; busca, periodo, categoria, conta,
situacao e ordenacao sao aplicados em memoria por `components/transactions/query.ts`, para responder
a cada tecla sem uma nova ida ao servidor. Os mesmos filtros existem em `TransactionFilters` do
service porque sao os parametros que a API vai receber como query string.

## Periodo do dashboard e busca

O `PeriodSwitcher` e a busca global sao os dois pontos em que o header conversa com as telas.

- **Periodo.** O caso comum — um mes de cada vez — fica nas setas; o painel do seletor guarda os
  atalhos ("Ultimos 3 meses", "Este ano") e o intervalo proprio, montado com dois `Select` de mes.
  As setas deslocam a janela inteira: de "maio a agosto" chega-se a "janeiro a abril". O seletor
  so aparece no dashboard — as outras telas ou nao tem nocao de periodo ou tem o proprio filtro,
  como Lancamentos.
- **O periodo nao vai para a URL.** Ele vive no `PeriodProvider` (`usePeriod`), em memoria. O
  endereco de uma tela diz que tela e, nao qual filtro esta aberto nela, e um `?de=&ate=` colado
  no fim de `/dashboard` era ruido em todo print e em todo link compartilhado. O preco assumido e
  que recarregar a pagina volta ao mes corrente — que e o ponto de partida esperado de quem abre
  o app. Se um dia o recorte precisar sobreviver ao reload, o caminho e `localStorage` com a
  chave `prisma:*`, como a sidebar recolhida, e nao a query string.
- **A janela dos graficos nao e sempre o periodo.** Um mes sozinho nao conta historia nenhuma numa
  linha, entao o recorte de mes unico desenha os cinco meses anteriores como contexto. Um periodo
  de varios meses ja e a propria janela — mostrar meses de fora dele confundiria.
- **Rotulo segue o recorte.** Fora do mes corrente, "Saldo atual" vira "Saldo no fim de agosto de
  2026"; num intervalo, "Receitas do mes" vira "Receitas do periodo" e a variacao passa a ser "em
  relacao ao periodo anterior", comparada com a janela de mesmo tamanho imediatamente anterior.
  Rotulo que diz "atual" num mes passado e uma mentira barata de evitar: os componentes recebem o
  substantivo (`periodNoun`) e o texto pronto por prop.
- **O header cede o que a tela ja tem.** Em Lancamentos (`pageOwnsControls` no `Header`) somem a
  busca global e o "Novo lancamento": as duas caixas de busca ficavam lado a lado, quase
  identicas, uma navegando e a outra filtrando, e o botao era um quarto caminho para o mesmo
  formulario que os tres da tela ja abrem por tipo. No lugar da busca o header expoe um
  `HeaderSlot`, e a tela renderiza ali o proprio campo por portal: o estado continua sendo da tela
  (o que viaja e o no, nao o valor) e a busca aparece onde o usuario ja procura por busca em todas
  as outras telas. Abaixo de 900px o header nao tem folga para o campo, entao ele volta para a
  tela, ao lado do botao que abre os filtros. **Ceder so vale quando a tela realmente substitui o
  controle** — esconder sem substituto e o erro que isso evita.
- **Busca global.** `GlobalSearch` procura em lancamentos, categorias e contas ao mesmo tempo e
  entrega cada resultado como destino: lancamento abre `?editar=<id>`, categoria abre
  `?categoria=<id>` e conta abre `?conta=<id>`, todos em `/lancamentos`. A ultima linha leva a
  `?busca=<termo>`. A comparacao ignora acento (`fold`), porque quem digita "saude" espera achar
  "Saude". Chegar pela busca **reseta** os filtros da tela antes de aplicar o que veio na URL: um
  filtro esquecido da navegacao anterior zeraria o resultado que o usuario acabou de escolher.
- **Os parametros da busca saem da URL assim que sao lidos**
  (`setSearchParams({}, { replace: true })`), para que voltar no historico nao reabra um
  formulario nem refiltre a lista. Sao os unicos query params do app, e todos transitorios.

## Avisos

O sino do header abre o `NotificationsPanel`, alimentado por `alertsService`. Os avisos nao sao
uma lista fixa: `buildAlerts()` os deriva dos mesmos mocks que abastecem as telas — faturas a
vencer, lancamentos pendentes ou agendados dentro de 15 dias, e cartoes acima de 70% do limite.
Quando o backend entrar, so o service muda.

A urgencia aparece na cor do icone (`critical` / `attention` / `info`), nao no fundo da linha: uma
lista com tres fundos coloridos vira ruido. O ponto no sino conta apenas os avisos que nao sao
`info`, e e calculado no mount do painel — nao depende de o usuario abri-lo.

## Responsividade

- Desktop: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.
- Abaixo de 1100px: sidebar vira drawer com scrim, fecha ao navegar (e no Esc) e trava o scroll
  do fundo. Fechado, o drawer fica `visibility: hidden` — fora da tela **e** fora do fluxo de
  foco, para o Tab nao entrar num menu invisivel.
- Grid do dashboard: 4 → 2 → 1 coluna.
- **Abaixo de 900px a listagem de lancamentos troca a tabela por cartoes** (`TransactionsList`,
  escolhido por `useIsCompact`). A tabela tem `min-width: 1000px`: rolar de lado ate o valor, que
  e o dado mais importante da linha, nao e leitura. O cartao traz um controle proprio de
  ordenacao, para que o celular nao perca o que o cabecalho da tabela oferece.
- **Nada de esconder acao sem substituto.** Na mesma faixa o campo de busca do header vira um
  botao que abre a busca sobre o header, e "Novo lancamento" perde o rotulo mas continua la como
  botao de icone. Antes os dois sumiam com `display: none`.
- `prefers-reduced-motion` e respeitado globalmente — nao adicione animacao sem cobrir esse caso.

## Alvos de toque e campos

Os tokens `--control-height`, `--control-height-sm`, `--control-font` e `--tap-size` mudam de
valor em `@media (pointer: coarse)`, no fim de `tokens.css`. Campo e botao usam esses tokens em
vez de altura fixa, entao no desktop a interface segue densa e no celular tudo cresce junto: alvo
de 44px (referencia do iOS) e corpo de campo de 16px. **O corpo de 16px nao e preferencia**: com
menos que isso o Safari no iOS aplica zoom na pagina inteira ao focar um input, e o usuario cai
num layout deslocado que precisa desfazer a mao.

## Acessibilidade

- `AppLayout` abre com um link "Pular para o conteudo" (`.skip-link` no `global.css`), que salta
  a sidebar inteira e leva ao `<main id="conteudo">`.
- `Modal` prende o Tab dentro do painel e devolve o foco a quem o abriu. O elemento que abriu e
  lido **no render**, nao num efeito: quando `open` vira true o React ainda nao aplicou o
  `autoFocus` do primeiro campo, e depois disso `document.activeElement` ja seria o campo.
- Formulario de lancamento marca campo obrigatorio no rotulo e, ao reprovar, leva o foco ao
  primeiro `[aria-invalid="true"]` em vez de so pintar as mensagens.
- Contraste, foco visivel e navegacao por teclado sao requisito, nao acabamento.

## Ao trocar mocks pela API real

Basta `VITE_USE_MOCKS=false`. Se o backend respeitar os contratos de `src/types/finance.ts`,
nenhum componente muda. O `httpClient` ja tem timeout de 15s, normalizacao de erros em `ApiError`
e um ponto unico (`getAuthToken`) para plugar o token quando entrar o Spring Security.

## Fora de escopo hoje

Backend, autenticacao, persistencia real, ESLint/Prettier, testes e code-splitting por rota ainda
nao existem. Cartoes, faturas, parcelas e investimentos continuam como telas em construcao. Nao
invente configuracao dessas sem o usuario pedir.
