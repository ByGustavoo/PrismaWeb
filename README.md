<div align="center"> <br> 
  <img align="center" alt="prisma-react" height="150" width="150" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
</div> 

<br> 

<div align="center">
  Este projeto é o frontend de uma aplicação de finanças pessoais, criada para dar ao usuário uma visão clara e organizada do próprio dinheiro. Reúne contas, cartões, lançamentos, investimentos e planejamento em uma única interface, com dashboard de saldo, fluxo de caixa, gastos por categoria e histórico de movimentações. A camada de dados já nasce preparada para consumir a API, permitindo que as telas sejam desenvolvidas e validadas antes mesmo do backend existir.
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

Esta é a **Etapa 1**: a fundação do frontend — estrutura, layout, navegação, identidade visual e camada de dados preparada para a API. O backend em Java / Spring Boot / PostgreSQL será desenvolvido nas próximas etapas.


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


## 🔐 Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env` (veja o `.env.example`). Nenhum outro arquivo lê `import.meta.env` diretamente: isso acontece apenas em `src/constants/env.ts`.

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
│   ├── ui/        Button, Card, Input, Select, Modal, Badge,
│   │              Table, Loading, EmptyState, Toast
│   ├── common/    Amount, DeltaIndicator, UnderConstruction
│   ├── layout/    Sidebar, Header, PageHeader
│   ├── dashboard/ BalancePanel, StatTile, CashflowChart,
│   │              CategoryBreakdown, RecentTransactions
│   └── charts/    ChartTooltip
├── constants/     env, app, navigation
├── hooks/         useAsyncData, useMediaQuery, useLocalStorage,
│                  useLockBodyScroll, useChartPalette
├── layouts/       AppLayout (shell: sidebar + header + conteúdo)
├── pages/         Dashboard, Lançamentos, Configurações, placeholders, 404
├── providers/     ThemeProvider, ToastProvider, AppProviders
├── routes/        AppRoutes, paths
├── services/      dashboard, transactions, accounts, investments
│   └── mocks/     data, dashboard.mock, mockResponse
├── styles/        tokens.css (design tokens), global.css
├── types/         common, finance (contratos de domínio)
└── utils/         cn, date, format
```


<br>


## 🔄 Camada de Dados

Os componentes nunca falam com `fetch` nem sabem de onde vêm os dados. Cada service decide a origem:

<br>

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

<br>

Os mocks passam por `mockResponse`, que aplica latência artificial e respeita `AbortSignal`. Ou seja: as telas já exercitam carregamento, erro e cancelamento exatamente como farão contra o backend real.

Quando a API existir, basta trocar `VITE_USE_MOCKS` para `false`. Se os contratos em `src/types/finance.ts` forem respeitados pelo backend, nenhum componente precisa mudar.

O `httpClient` já conta com timeout, normalização de erros em `ApiError` e um ponto único (`getAuthToken`) para plugar o token quando entrar o Spring Security.


<br>


## 🌗 Tema Claro e Escuro

* 🎨 Tokens em `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`. Nenhum componente declara cor em hex.

* ⚡ Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.

* 🔀 Três modos disponíveis: claro, escuro e sistema (acompanha o dispositivo). A escolha fica em **Configurações**, com atalho rápido no header.

* 📊 O Recharts escreve cor como atributo de SVG, onde `var(--token)` não resolve de forma confiável. O hook `useChartPalette` lê os tokens computados e recalcula quando o tema muda.


<br>


## 📱 Responsividade

* 🖥️ **Desktop**: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.

* 📲 **Tablet e mobile** (< 1100px): a sidebar vira drawer com scrim, fecha ao navegar e trava o scroll do fundo.

* 🧩 Grid do dashboard: 4 cards → 2 → 1. Tabelas ganham scroll horizontal.

* ♿ `prefers-reduced-motion` respeitado globalmente.


<br>


## ✅ O Que Já Está Pronto

* 📊 Dashboard com saldo, receitas, despesas, investimentos, fatura atual, fluxo de caixa, gastos por categoria e últimos lançamentos.

* 💸 Lançamentos com listagem, busca, filtro por tipo via rota e modal de filtros.

* ⚙️ Configurações com seleção de tema e diagnóstico do ambiente de API.

* 🧱 Componentes reutilizáveis, com estados de carregamento, vazio e erro.


<br>


## 🗺️ Próximas Etapas

* 🟢 Backend em Spring Boot + PostgreSQL e substituição dos mocks.

* 📝 CRUD de lançamentos, contas, cartões e faturas.

* 📈 Investimentos, orçamento, despesas recorrentes, previsão e relatórios.

* 🔐 Autenticação, ESLint/Prettier, testes e code-splitting por rota.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
