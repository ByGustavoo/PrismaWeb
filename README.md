# Contorno — controle de finanças pessoais (frontend)

Frontend de uma aplicação de finanças pessoais: contas, cartões, lançamentos, investimentos e planejamento.

Esta é a **Etapa 1**: fundação do frontend (estrutura, layout, navegação, identidade visual e camada de dados
preparada para a API). O backend em Java / Spring Boot / PostgreSQL será desenvolvido nas próximas etapas.

## Stack

| Camada | Escolha |
| --- | --- |
| Build | Vite 5 |
| UI | React 18 + TypeScript 5 (modo `strict`) |
| Rotas | React Router 6 |
| Estilos | CSS Modules + custom properties (sem framework de UI) |
| Ícones | lucide-react |
| Gráficos | Recharts |

## Como executar

Requer Node.js 18+.

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Só a checagem de tipos |

## Variáveis de ambiente

Todas ficam em `.env` (veja `.env.example`). Nenhum outro arquivo lê `import.meta.env`:
isso acontece só em `src/constants/env.ts`.

```
VITE_API_URL=http://localhost:8080/api   # URL base do backend
VITE_USE_MOCKS=true                      # false quando a API real existir
VITE_MOCK_DELAY=450                      # latência simulada dos mocks, em ms
```

## Estrutura

```
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

## Como a troca de mock por API vai funcionar

Os componentes nunca falam com `fetch` nem sabem de onde vêm os dados. Cada service decide a origem:

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

Os mocks passam por `mockResponse`, que aplica latência artificial e respeita `AbortSignal`.
Ou seja: as telas já exercitam carregamento, erro e cancelamento exatamente como farão contra o backend real.

Quando a API existir, basta trocar `VITE_USE_MOCKS` para `false`. Se os contratos em `src/types/finance.ts`
forem respeitados pelo backend, nenhum componente precisa mudar.

O `httpClient` já tem timeout, normalização de erros em `ApiError` e um ponto único (`getAuthToken`)
para plugar o token quando entrar o Spring Security.

## Tema claro e escuro

- Tokens em `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`.
  Nenhum componente declara cor em hex.
- Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.
- Três modos: claro, escuro e "sistema" (acompanha o dispositivo). Escolha em **Configurações**,
  atalho rápido no header.
- Recharts escreve cor como atributo de SVG, onde `var(--token)` não resolve de forma confiável.
  O hook `useChartPalette` lê os tokens computados e recalcula quando o tema muda.

## Responsividade

- **Desktop**: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.
- **Tablet / mobile** (< 1100px): sidebar vira drawer com scrim, fecha ao navegar e trava o scroll do fundo.
- Grid do dashboard: 4 cards → 2 → 1. Tabelas ganham scroll horizontal.
- `prefers-reduced-motion` respeitado globalmente.

## O que já está pronto

- Dashboard com saldo, receitas, despesas, investimentos, fatura atual, fluxo de caixa,
  gastos por categoria e últimos lançamentos (dados mockados).
- Lançamentos com listagem, busca, filtro por tipo via rota e modal de filtros.
- Configurações com seleção de tema e diagnóstico do ambiente de API.
- Componentes reutilizáveis, estados de carregamento, vazio e erro.

## Próximas etapas

- Backend em Spring Boot + PostgreSQL e substituição dos mocks.
- CRUD de lançamentos, contas, cartões e faturas.
- Investimentos, orçamento, despesas recorrentes, previsão e relatórios.
- Autenticação, ESLint/Prettier, testes e code-splitting por rota.
