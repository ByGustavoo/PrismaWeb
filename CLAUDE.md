# CLAUDE.md

Guia para o Claude Code trabalhar neste repositorio.

## Sobre o projeto

Frontend de uma aplicacao de financas pessoais (contas, cartoes, lancamentos, investimentos e
planejamento). O nome do produto e **Prisma**, usado de forma consistente no repositorio, no
`package.json`, em `APP_NAME` (`src/constants/app.ts`), no `<title>` do `index.html` e nos
prefixos de `localStorage` (`prisma:*`). Ao renomear um deles, renomeie todos.

O estado atual e a **Etapa 1**: fundacao do frontend. Nao existe backend ainda; toda a camada de
dados responde com mocks. O backend em Java / Spring Boot / PostgreSQL vira nas proximas etapas.

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

5. **Rotas so em `src/routes/paths.ts`.** Links usam `paths.x`, nunca string literal.

6. **Contratos de dominio em `src/types/finance.ts`.** Sao o contrato esperado do backend futuro;
   mudar um tipo la e uma decisao de API, nao um detalhe de tela.

7. **Excecao ao token de cor: Recharts.** A biblioteca escreve cor como atributo de SVG, onde
   `var(--token)` nao resolve de forma confiavel. Use o hook `useChartPalette`, que le os tokens
   computados e recalcula quando o tema muda.

## Estrutura

```
src/
├── api/           httpClient, ApiError, endpoints
├── components/
│   ├── ui/        Button, Card, Input, Select, Modal, Badge, Table, Loading, EmptyState, Toast
│   ├── common/    Amount, DeltaIndicator, UnderConstruction
│   ├── layout/    Sidebar, Header, PageHeader
│   ├── dashboard/ BalancePanel, StatTile, CashflowChart, CategoryBreakdown, RecentTransactions
│   └── charts/    ChartTooltip
├── constants/     env, app, navigation
├── hooks/         useAsyncData, useMediaQuery, useLocalStorage, useLockBodyScroll, useChartPalette
├── layouts/       AppLayout (sidebar + header + conteudo)
├── pages/         Dashboard, Lancamentos, Configuracoes, placeholders, 404
├── providers/     ThemeProvider, ToastProvider, AppProviders
├── routes/        AppRoutes, paths
├── services/      dashboard, transactions, accounts, investments
│   └── mocks/     data, dashboard.mock, mockResponse
├── styles/        tokens.css, global.css
├── types/         common, finance
└── utils/         cn, date, format
```

Cada pasta de componentes tem um `index.ts` de barril — ao criar um componente novo, exporte-o la.

## Convencoes de codigo

- **Alias `@/` aponta para `src/`** (configurado em `vite.config.ts` e `tsconfig.app.json`).
  Use import absoluto entre pastas; relativo so dentro da mesma pasta.
- **Um `.module.css` ao lado do componente**, mesmo nome do arquivo.
- **Comentarios e strings de codigo sao escritos sem acentuacao** (ASCII puro): `Lancamentos`,
  `Financas`, `Configuracoes`. Isso vale para comentarios, constantes e labels no `.ts`/`.tsx`.
  O README e a documentacao em markdown usam acentuacao normal.
- **Comentario existe para explicar o porque, nao o que.** O codigo atual segue isso — mantenha o
  padrao, nao encha de comentario obvio.
- `tsconfig` roda com `noUnusedLocals`, `noUnusedParameters` e `noUncheckedIndexedAccess`.
  Acesso a indice de array devolve `T | undefined` — trate, nao use `!`.
- Formatacao de moeda, numero e data passa por `src/utils/format.ts`, que usa `Intl` com
  `LOCALE = 'pt-BR'` e `CURRENCY = 'BRL'` de `src/constants/app.ts`.
- Dados assincronos nas paginas vao por `useAsyncData`, que ja entrega estados de loading, erro e
  cancelamento.

## Tema

- Tres modos: claro, escuro e sistema. Escolha em **Configuracoes**, atalho no header.
- Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de
  tema errado. Se mexer na chave de storage (`THEME_STORAGE_KEY`), atualize esse script tambem.
- O `ThemeProvider` grava `data-theme` no `documentElement` **durante o render**, nao em efeito,
  para que quem le tokens computados (Recharts) enxergue o tema certo no mesmo ciclo.

## Responsividade

- Desktop: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.
- Abaixo de 1100px: sidebar vira drawer com scrim, fecha ao navegar e trava o scroll do fundo.
- Grid do dashboard: 4 → 2 → 1 coluna. Tabelas ganham scroll horizontal.
- `prefers-reduced-motion` e respeitado globalmente — nao adicione animacao sem cobrir esse caso.

## Ao trocar mocks pela API real

Basta `VITE_USE_MOCKS=false`. Se o backend respeitar os contratos de `src/types/finance.ts`,
nenhum componente muda. O `httpClient` ja tem timeout de 15s, normalizacao de erros em `ApiError`
e um ponto unico (`getAuthToken`) para plugar o token quando entrar o Spring Security.

## Fora de escopo hoje

Backend, autenticacao, CRUD real, ESLint/Prettier, testes e code-splitting por rota ainda nao
existem. Nao invente configuracao dessas sem o usuario pedir.
