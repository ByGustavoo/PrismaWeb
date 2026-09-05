<div align="center"> <br> 
  <img align="center" alt="prisma-react" height="150" width="150" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
</div> 

<br> 

<div align="center">
  <strong>Prisma</strong> é o frontend de uma aplicação de finanças pessoais, criada para dar ao usuário uma visão clara e organizada do próprio dinheiro. Reúne contas, cartões, lançamentos, investimentos e planejamento em uma única interface, com dashboard de saldo, fluxo de caixa, gastos por categoria, faturas, compras parceladas, orçamento mensal, despesas recorrentes, previsão financeira, metas de compra e relatórios. A camada de dados já nasce preparada para consumir a API, permitindo que as telas sejam desenvolvidas e validadas antes mesmo do backend existir.
</div> 

 <br> <br> 

## 🚀 Ferramentas Utilizadas

* ⚡ Vite 5

* ⚛️ React 18

* 📊 Recharts 2

* 🔷 TypeScript 5

* 🖼️ Lucide React
    
* 🎨 CSS Modules

* 🧭 React Router 6


<br>


## 📌 Status do Projeto

O frontend está **completo e pronto para integração**. Todas as telas existem, todos os fluxos de
cadastro funcionam e a camada de dados responde por mocks enquanto o backend não existe.

O contrato que o backend precisa cumprir está em **[API_CONTRACT.md](API_CONTRACT.md)**: são 42
endpoints com método, URL, parâmetros, corpo de requisição, corpo de resposta, códigos de status,
validações e as regras de cálculo de cada um. É a especificação a partir da qual os `@RestController`
e os DTOs em Java / Spring Boot devem ser escritos.

A próxima etapa é o backend em **Java / Spring Boot / PostgreSQL**.


<br>


## ✨ Funcionalidades

<br>

🔹 **Dashboard**
* Saldo atual com variação contra o período anterior, receitas, despesas, investimentos e fatura do mês.
* Fluxo de entradas e saídas, gastos por categoria e calendário de gastos por dia.
* Seletor de período no header: mês a mês pelas setas, atalhos ("Últimos 3 meses", "Este ano") e intervalo próprio.

🔹 **Lançamentos**
* Listagem única para receitas, despesas e transferências, com rota própria por tipo.
* Busca, filtro por período, categoria, conta e situação, e ordenação — tudo aplicado em memória, respondendo a cada tecla.
* Cadastro, edição e exclusão, com formulário específico por tipo.
* Alternância entre tabela e cartões, com a preferência guardada no navegador.

🔹 **Contas e cartões**
* Cadastro de contas, com saldo, situação e participação no saldo total.
* Um cadastro só para os quatro tipos de cartão: crédito, débito, vale-alimentação e vale-refeição.
* Faturas derivadas das despesas e das parcelas, em quatro blocos: a pagar, atual, próximas e anteriores.
* Detalhe da fatura com as compras dentro dela e cadastro de compras parceladas com cronograma.

🔹 **Patrimônio**
* Carteira de investimentos com oito classes de ativo, distribuição em rosca, rentabilidade e evolução do patrimônio.

🔹 **Planejamento**
* Orçamento mensal por categoria, com consumo, projeção de ritmo e o que ficou fora do orçamento.
* Despesas recorrentes com custo mensal equivalente, próximos vencimentos e pausa sem exclusão.
* Previsão financeira dos próximos seis meses, mês a mês, com o método declarado na própria tela.
* Metas e desejos: acompanhamento do preço de uma compra pretendida, com histórico completo, menor preço, média, variação e gráfico de evolução.

🔹 **Análise**
* Relatórios por recorte de datas, com receitas e despesas por categoria, gasto por origem, evolução do saldo e evolução do patrimônio.

🔹 **Transversal**
* Tema claro, escuro e sistema.
* Busca global em lançamentos, categorias e contas, ignorando acentuação.
* Painel de avisos derivado dos próprios dados: faturas a vencer, lançamentos próximos e cartões perto do limite.
* Página 404 própria, fora do shell do app: o endereço que falhou fica à vista, com atalhos para as telas de entrada e uma série que se desenha em laço até o ponto onde os dados acabam.
* Estados de carregamento, vazio e erro em todas as telas, e responsividade do desktop ao celular.


<br>


## ⚙️ Como Executar

Requer Node.js 18 ou superior.

<br>

🔹 Instalação
```bash
# Instala as dependências do projeto
$ npm install
```

🔹 Ambiente
```bash
# Cria o arquivo de variáveis a partir do exemplo
$ cp .env.example .env
```

🔹 Execução
```bash
# Sobe o servidor de desenvolvimento em http://localhost:5173
$ npm run dev
```


<br>


## 📜 Scripts Disponíveis

<br>

🔹 dev
```bash
# Servidor de desenvolvimento com HMR
$ npm run dev
```

🔹 build
```bash
# Checagem de tipos e build de produção
$ npm run build
```

🔹 preview
```bash
# Serve o build de produção localmente
$ npm run preview
```

🔹 typecheck
```bash
# Apenas a checagem de tipos
$ npm run typecheck
```

<br>

> O `typecheck` usa `tsc -b`, e não `tsc --noEmit`. O `tsconfig.json` da raiz é uma solução com
> `references` e `files: []`: com `--noEmit`, a checagem não olharia arquivo nenhum e passaria
> sempre. Como o `tsconfig.app.json` já tem `noEmit: true`, o `-b` checa sem gerar saída.


<br>


## 🔐 Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env`, criado a partir do `.env.example`. **Nenhum outro
arquivo lê `import.meta.env` diretamente**: isso acontece apenas em `src/constants/env.ts`, e o
resto do código consome o objeto `env` exportado de lá.

O `.env` está no `.gitignore`; só o `.env.example` é versionado, e ele não contém segredo nenhum.

<br>

```bash
# URL base do backend
VITE_API_URL=http://localhost:8080/api

# Troque para "false" quando a API real existir
VITE_USE_MOCKS=true

# Latência simulada dos mocks, em milissegundos
VITE_MOCK_DELAY=450
```


<br>


## 📂 Estrutura do Projeto

<br>

```bash
src/
├── api/           httpClient, ApiError, endpoints (única fonte de URLs)
├── components/
│   ├── ui/        Button, Card, Input, Textarea, Select, DatePicker, Switch,
│   │              Modal, ConfirmDialog, Badge, Table, ProgressBar, Loading,
│   │              EmptyState, Toast
│   ├── common/    Amount, BrandMark, DeltaIndicator, SummaryBar, UnderConstruction
│   ├── layout/    Sidebar, Header, HeaderSlot, PageHeader, NotificationsPanel,
│   │              GlobalSearch, PeriodSwitcher
│   ├── dashboard/ BalancePanel, StatTile, CashflowChart, CategoryBreakdown,
│   │              SpendingCalendar, RecentTransactions
│   ├── transactions/ filtros, tabela, lista, formulários e query em memória
│   ├── accounts/  AccountCard, AccountFormModal
│   ├── cards/     CardTile, CardFormModal
│   ├── invoices/  InvoiceEntry, InvoiceDetailModal
│   ├── installments/ InstallmentCard, InstallmentFormModal
│   ├── investments/ AllocationChart, PortfolioChart, InvestmentCard, InvestmentFormModal
│   ├── budget/    MonthNavigator, BudgetRow, BudgetFormModal
│   ├── recurring/ RecurringCard, RecurringFormModal
│   ├── goals/     GoalCard, GoalFormModal, GoalDetailModal, GoalFilters,
│   │              PriceDelta, PriceSparkline, PriceHistoryChart
│   ├── forecast/  ForecastChart, ForecastTable, ForecastList
│   ├── reports/   ReportRangePicker, SourceBreakdown, BalanceTrendChart, NetWorthChart
│   └── charts/    ChartTooltip
├── constants/     env, app, navigation, transactions, accounts, cards,
│                  investments, budget, recurring, goals, forecast, reports
├── hooks/         useAsyncData, useMediaQuery, useLocalStorage,
│                  useLockBodyScroll, useChartPalette, useCountUp
├── layouts/       AppLayout (shell: sidebar + header + conteúdo)
├── pages/         Dashboard, Lançamentos, Contas, Cartões, Faturas, Parcelamentos,
│                  Investimentos, Orçamento, Recorrentes, Previsão, Metas,
│                  Relatórios, Configurações, 404
├── providers/     ThemeProvider, ToastProvider, PeriodProvider, AppProviders
├── routes/        AppRoutes, paths (única fonte de rotas)
├── services/      dashboard, transactions, categories, accounts, cards,
│                  investments, budget, recurring, goals, forecast, reports, alerts
│   └── mocks/     data, stores de escrita e builders de cada domínio
├── styles/        tokens.css (design tokens), global.css
├── types/         common, finance (contratos de domínio)
└── utils/         cn, date, format
```


<br>


## 🔄 Camada de Dados

Os componentes nunca falam com `fetch` nem sabem de onde vêm os dados. Eles chamam services, e cada
service decide a origem:

<br>

```ts
export const dashboardService = {
  getSummary(period?: DashboardPeriod, signal?: AbortSignal): Promise<ResumoDashboard> {
    if (env.useMocks) {
      return mockResponse(buildDashboardSummary(period), signal);
    }
    return httpClient.get<ResumoDashboard>(endpoints.dashboard.resumo, {
      query: { de: period?.from, ate: period?.to },
      signal,
    });
  },
};
```

<br>

### Como os mocks funcionam

* 🕐 **Todo mock passa por `mockResponse`**, que aplica a latência de `VITE_MOCK_DELAY` e respeita o
  `AbortSignal`. As telas já exercitam carregamento, erro e cancelamento exatamente como farão
  contra o backend real.

* ✍️ **A escrita é real, só que em memória.** Cadastrar, editar e excluir passa pelos *stores* em
  `src/services/mocks/`, que mutam os mesmos arrays que abastecem as outras telas: um lançamento
  novo aparece no dashboard, nos avisos e no relatório na mesma sessão. O estado vive até o reload
  da página — não há persistência enquanto não houver backend, e isso é proposital.

* 🚦 **Os mocks recusam entrada inválida como a API vai recusar.** Os stores lançam `ApiError` com
  status `404`, `409` e `422` e com o mesmo formato de corpo do `httpClient`, para que a tela já
  trate erro do jeito certo antes da integração.

* 🧮 **O que é cálculo, é cálculo.** Fatura, limite comprometido, cronograma de parcelas,
  distribuição da carteira, consumo do orçamento, previsão e análise de meta são derivados dos
  dados, não escritos à mão. O formato produzido aqui é exatamente o que o backend vai ter de
  devolver.

* 📈 **O histórico é determinístico.** As séries longas usam variação fixa por mês, e não aleatória:
  um gráfico precisa oscilar, mas não pode mudar a cada recarregamento.


<br>


## 🔌 Integração com a API

Basta trocar `VITE_USE_MOCKS` para `false`. Se o backend respeitar os contratos de
`src/types/finance.ts` — detalhados endpoint a endpoint em **[API_CONTRACT.md](API_CONTRACT.md)** —
**nenhum componente precisa mudar**.

O que já está pronto do lado do cliente:

* 🌐 `httpClient` com timeout de 15 s, montagem de query string e normalização de erros em `ApiError`
  (`status`, `code`, `details`).
* 🔑 Um ponto único, `getAuthToken()`, para plugar o token quando entrar o Spring Security. Ele já
  monta o header `Authorization: Bearer <token>` quando devolve algo.
* 🧭 Todas as URLs em `src/api/endpoints.ts`. Nenhuma string de rota de backend escrita fora dele.
* 🧵 `AbortSignal` propagado de ponta a ponta: trocar de tela cancela a requisição em voo.

O backend precisa liberar **CORS** para `http://localhost:5173` nos métodos `GET`, `POST`, `PUT` e
`DELETE`, e responder erro no formato `{ "message", "code", "errors" }` — a `message` é o texto que
aparece no toast da tela.


<br>


## 🌗 Tema Claro e Escuro

* 🎨 Tokens em `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`. Nenhum componente declara cor em hex.

* ⚡ Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.

* 🔀 Três modos disponíveis: claro, escuro e sistema (acompanha o dispositivo). A escolha fica em **Configurações**, com atalho rápido no header.

* 📊 O Recharts escreve cor como atributo de SVG, onde `var(--token)` não resolve de forma confiável. O hook `useChartPalette` lê os tokens computados e recalcula quando o tema muda.

* 🧭 A página 404 fica fora do shell do app, mas dentro dos providers: ela abre no mesmo tema em que a pessoa estava, inclusive quando o endereço é digitado direto na barra do navegador.

* ♿ Contraste é requisito, não acabamento: texto em 4.5:1 e cor de gráfico em 3:1 sobre a superfície em que aparecem, nos dois temas.


<br>


## 📱 Responsividade

* 🖥️ **Desktop**: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.

* 📲 **Abaixo de 1100px**: a sidebar vira drawer com scrim, fecha ao navegar e trava o scroll do fundo.

* 🧩 **Abaixo de 900px**: a listagem de lançamentos e a tabela da previsão trocam a tabela por cartões — rolar de lado até o valor não é leitura. Grids de cartões usam `auto-fill` com largura mínima.

* 👆 Alvos de toque e corpo de campo crescem em `@media (pointer: coarse)`: 44px de alvo e 16px de texto, o mínimo que evita o zoom automático do Safari no iOS.

* 🎬 `prefers-reduced-motion` respeitado globalmente.


<br>


## 🗺️ Próximas Etapas

* 🟢 Backend em Java / Spring Boot + PostgreSQL, implementando o [API_CONTRACT.md](API_CONTRACT.md).

* 🔐 Autenticação com Spring Security, plugada no `getAuthToken()`.

* 🧰 ESLint e Prettier, suíte de testes e code-splitting por rota.

* 💳 Pagamento e quitação de fatura, histórico de cotação por ativo e exportação de relatórios — deliberadamente fora do escopo atual.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
