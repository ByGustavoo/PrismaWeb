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

O frontend está **completo e pronto para integração**. Todas as telas existem, todos os dados vêm do
PrismaAPI — o frontend não tem mocks nem dados fictícios. Sem o backend rodando, as telas mostram o
estado de erro com a opção de tentar de novo.

O que o backend ainda precisa implementar para acompanhar o frontend está em
**[API_CONTRACT.md](API_CONTRACT.md)**: endpoints novos, contratos que mudaram, migrações e regras de
cálculo, com um checklist no fim. O que o PrismaAPI já implementa não aparece ali.

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
* Cadastro de contas, separando as do dia a dia das reservas (emergência, poupança, previdência), com evolução, aportes e rendimento das reservas.
* Um cadastro só para os quatro tipos de cartão: crédito, débito, vale-alimentação e vale-refeição.
* Faturas derivadas das despesas e das parcelas, em quatro blocos: a pagar, atual, próximas e anteriores.
* Detalhe da fatura com as compras dentro dela e cadastro de compras no cartão, à vista ou parceladas, com cronograma, filtro por situação, ordenação por parcelas restantes e total mensal comprometido.

🔹 **Patrimônio**
* Carteira de investimentos com dez classes de ativo (incluindo RDB/caixinhas e previdência privada), distribuição em rosca, rentabilidade e evolução do patrimônio.
* Aportes e atualização de saldo por investimento, com histórico que separa o dinheiro colocado do rendimento.

🔹 **Planejamento**
* Orçamento mensal por categoria, com consumo, projeção de ritmo e o que ficou fora do orçamento.
* Despesas recorrentes com custo mensal equivalente, próximos vencimentos e pausa sem exclusão.
* Previsão financeira: o resto do mês corrente e os próximos seis meses, com recorrentes, parcelas, gasto variável, agendados e aportes em colunas próprias, e o método declarado com os números da base.
* Metas e desejos: acompanhamento do preço de uma compra pretendida, com histórico completo, menor preço, média, variação e gráfico de evolução.

🔹 **Análise**
* Relatórios por recorte de datas, com receitas e despesas por categoria, gasto por origem, evolução do saldo e evolução do patrimônio.

🔹 **Transversal**
* Tema claro, escuro e sistema.
* Busca global em lançamentos, categorias e contas, ignorando acentuação.
* Painel de avisos derivado dos próprios dados: faturas a vencer, contas e recorrentes próximas, receitas a receber e cartões perto do limite.
* Máscara monetária brasileira em todos os campos de valor e dezessete categorias com cores fixas e distintas nos dois temas.
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
arquivo lê `import.meta.env` diretamente**: isso acontece apenas em `src/constants/ambiente.ts`, e o
resto do código consome o objeto `ambiente` exportado de lá.

O `.env` está no `.gitignore`; só o `.env.example` é versionado, e ele não contém segredo nenhum.

<br>

```bash
# URL base do backend (PrismaAPI, perfil dev)
VITE_API_URL=http://localhost:9017/PrismaAPI/v1
```


<br>


## 🐳 Docker

A imagem compila o app com Node 22 e o serve com o `nginx-unprivileged` (usuário sem root, porta
`8080`), com fallback de rotas para o `index.html`, cache longo em `/assets/` e `/healthz` para o
healthcheck.

**A URL da API é lida ao subir o container, e não no build.** O script
`docker/40-prisma-config.sh` grava `/config.js` a partir de `PRISMA_API_URL`, e o `ambiente.ts` dá
preferência a esse valor sobre o `VITE_API_URL`. Assim a mesma imagem publicada serve qualquer
ambiente.

<br>

```bash
# Sobe a partir da imagem publicada
docker compose up -d

# Compila a imagem localmente e sobe
docker compose up -d --build

# Aponta para outra API e outra porta
PRISMA_API_URL=https://api.exemplo.com/PrismaAPI/v1 PRISMA_WEB_PORT=3000 docker compose up -d
```

<br>

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PRISMA_API_URL` | `http://localhost:9017/PrismaAPI/v1` | URL da API, lida pelo navegador |
| `PRISMA_WEB_PORT` | `8080` | Porta publicada no host |
| `PRISMA_WEB_IMAGE` | `gurudohimalaia/prismaweb` | Repositório da imagem |
| `PRISMA_WEB_TAG` | `latest` | Versão da imagem |

> `PRISMA_API_URL` é acessada pelo navegador de quem usa o app, não pelo container: use um endereço
> que a máquina do usuário alcance.


<br>


## 🚢 Esteira e Versionamento

- **`ci.yml`** roda em todo PR para a `main`: `npm run build` (typecheck incluso) e build da imagem,
  sem publicar.
- **`release.yml`** roda quando um PR é **mergeado** na `main` (e também manualmente, em
  *Actions → Release → Run workflow*). Ele calcula a próxima versão, publica a imagem no Docker Hub
  para `linux/amd64` e `linux/arm64` e cria a tag `vX.Y.Z` com uma release no GitHub.

A versão segue SemVer, e a fonte de verdade são as **tags git**. Sem nenhuma tag, a primeira
versão é a do `package.json`; a partir daí o incremento vem do rótulo do PR:

| Rótulo do PR | Exemplo |
| --- | --- |
| *(nenhum)* | `0.1.0` → `0.1.1` |
| `release:minor` | `0.1.1` → `0.2.0` |
| `release:major` | `0.2.0` → `1.0.0` |

Cada publicação gera as tags de imagem `X.Y.Z`, `X.Y`, `X` (a partir da `1.0.0`), `sha-<commit>` e
`latest`. PR fechado sem merge não publica nada.

A versão e a data de lançamento vão para a imagem e aparecem em **Configurações → Versões**, ao lado
das da API (lidas de `GET /sistema/versao`).

<br>

Configuração no GitHub (*Settings → Secrets and variables → Actions*):

| Nome | Tipo | Conteúdo |
| --- | --- | --- |
| `DOCKER_USERNAME` | Secret | Usuário do Docker Hub (`gurudohimalaia`) |
| `DOCKER_PASSWORD` | Secret | Senha ou access token do Docker Hub com permissão *Read & Write* |
| `DOCKER_IMAGE` | Secret | Repositório completo da imagem (`gurudohimalaia/prismaweb`) |

São os mesmos nomes da esteira do PrismaAPI, que publica em `gurudohimalaia/prismaapi`.

Os rótulos `release:minor` e `release:major` precisam ser criados em *Issues → Labels*.


<br>


## 📂 Estrutura do Projeto

<br>

```bash
src/
├── api/           clienteHttp, ErroApi, rotasApi (única fonte de URLs)
├── components/
│   ├── ui/        Botao, Painel, CampoTexto, AreaTexto, CampoSelecao, SeletorData,
│   │              Interruptor, Modal, DialogoConfirmacao, Selo, Tabela, BarraProgresso,
│   │              Carregamento, EstadoVazio, Notificacao
│   ├── comum/     ValorMonetario, MarcaPrisma, IndicadorVariacao, BarraResumo
│   ├── layout/    MenuLateral, Cabecalho, EspacoCabecalho, CabecalhoPagina, PainelAvisos,
│   │              BuscaGlobal, SeletorPeriodo
│   ├── dashboard/ PainelSaldo, BlocoIndicador, GraficoFluxoCaixa, DistribuicaoCategorias,
│   │              CalendarioGastos, UltimosLancamentos
│   ├── lancamentos/ filtros, tabela, lista, formulários e consulta em memória
│   ├── contas/    CartaoConta, ModalFormularioConta
│   ├── cartoes/   BlocoCartao, ModalFormularioCartao
│   ├── faturas/   EntradaFatura, ModalDetalheFatura
│   ├── parcelamentos/ CartaoParcelamento, ModalFormularioParcelamento
│   ├── investimentos/ GraficoAlocacao, GraficoCarteira, CartaoInvestimento,
│   │              ModalFormularioInvestimento
│   ├── orcamento/ NavegadorMes, LinhaOrcamento, ModalFormularioOrcamento
│   ├── recorrentes/ CartaoRecorrente, ModalFormularioRecorrente
│   ├── metas/     CartaoMeta, ModalFormularioMeta, ModalDetalheMeta, FiltrosMetas,
│   │              VariacaoPreco, MiniCurvaPreco, GraficoHistoricoPreco
│   ├── previsao/  GraficoPrevisao, TabelaPrevisao, ListaPrevisao
│   ├── relatorios/ SeletorPeriodoRelatorio, DistribuicaoOrigens, GraficoEvolucaoSaldo,
│   │              GraficoPatrimonio
│   └── graficos/  DicaGrafico
├── constants/     ambiente, aplicacao, navegacao, lancamentos, contas, cartoes, investimentos,
│                  orcamento, recorrentes, metas, previsao, relatorios, validacao
├── hooks/         useDadosAssincronos, useConsultaMidia, useArmazenamentoLocal,
│                  useTravarRolagem, usePaletaGrafico, useContagem, useValidacaoFormulario
├── layouts/       LayoutAplicacao (shell: sidebar + header + conteúdo)
├── pages/         PaginaDashboard, PaginaLancamentos, PaginaContas, PaginaCartoes,
│                  PaginaFaturas, PaginaParcelamentos, PaginaInvestimentos, PaginaOrcamento,
│                  PaginaRecorrentes, PaginaPrevisao, PaginaMetas, PaginaRelatorios,
│                  PaginaConfiguracoes, PaginaNaoEncontrada
├── providers/     ProvedorTema, ProvedorNotificacoes, ProvedorPeriodo, ProvedoresAplicacao
├── routes/        RotasAplicacao, caminhos (única fonte de rotas)
├── services/      dashboard, lancamentos, categorias, contas, cartoes, investimentos,
│                  orcamento, recorrentes, metas, previsao, relatorios, avisos
├── styles/        tokens.css (design tokens), global.css
├── types/         comum, financas (contratos de domínio)
└── utils/         juntarClasses, data, formatacao, validacao
```


<br>


## 🔄 Camada de Dados

Os componentes nunca falam com `fetch`. Eles chamam services, e cada service é uma camada fina sobre
o `clienteHttp`, com a URL vinda de `rotasApi`:

<br>

```ts
export const dashboardService = {
  buscarResumo(period?: PeriodoDashboard, signal?: AbortSignal): Promise<DashboardDTO> {
    return clienteHttp.get<DashboardDTO>(rotasApi.dashboard.resumo, {
      consulta: { dataInicial: period?.dataInicial, dataFinal: period?.dataFinal },
      signal,
    });
  },
};
```

<br>

* 🧮 **O que é cálculo, é do servidor.** Fatura, limite comprometido, cronograma de parcelas,
  distribuição e evolução da carteira, evolução das reservas, consumo do orçamento, previsão, avisos
  e análise de meta são derivados pelo PrismaAPI, com as regras descritas no contrato.
* ⏳ **Carregamento, erro e cancelamento** passam por `useDadosAssincronos`, que usa o `AbortSignal`
  para descartar respostas de uma tela que já foi deixada.


<br>


## 🔌 Integração com a API

Basta apontar `VITE_API_URL` para o PrismaAPI. Os tipos de `src/types/financas.ts` são os DTOs do
backend; as mudanças que ele ainda precisa acompanhar estão em **[API_CONTRACT.md](API_CONTRACT.md)**.

O que já está pronto do lado do cliente:

* 🌐 `clienteHttp` com timeout de 15 s, montagem de query string e normalização de erros em `ErroApi`
  (`status`, `codigo`, `detalhes`).
* 🔑 Um ponto único, `obterTokenAutenticacao()`, para plugar o token quando entrar o Spring Security. Ele já
  monta o header `Authorization: Bearer <token>` quando devolve algo.
* 🧭 Todas as URLs em `src/api/rotasApi.ts`. Nenhuma string de rota de backend escrita fora dele.
* 🧵 `AbortSignal` propagado de ponta a ponta: trocar de tela cancela a requisição em voo.

O backend precisa liberar **CORS** para a origem do dev server (`http://localhost:5173`; o perfil `dev`
do PrismaAPI aceita qualquer porta de `localhost` e de `127.0.0.1`) nos métodos `GET`, `POST`, `PUT` e
`DELETE`, e responder erro no formato `ErrorResponseDTO` (`status`, `title`, `instance`, `type`,
`detail`, `errors`, `timestamp`) — o `detail` é o texto que aparece no toast da tela. O PrismaAPI já
faz as duas coisas.


<br>


## 🌗 Tema Claro e Escuro

* 🎨 Tokens em `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`. Nenhum componente declara cor em hex.

* ⚡ Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.

* 🔀 Três modos disponíveis: claro, escuro e sistema (acompanha o dispositivo). A escolha fica em **Configurações**, com atalho rápido no header.

* 📊 O Recharts escreve cor como atributo de SVG, onde `var(--token)` não resolve de forma confiável. O hook `usePaletaGrafico` lê os tokens computados e recalcula quando o tema muda.

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

* 🟢 Backend em Java / Spring Boot + PostgreSQL, com as pendências do [API_CONTRACT.md](API_CONTRACT.md).

* 🔐 Autenticação com Spring Security, plugada no `obterTokenAutenticacao()`.

* 🧰 ESLint e Prettier, suíte de testes e code-splitting por rota.

* 💳 Pagamento e quitação de fatura, histórico de cotação por ativo e exportação de relatórios — deliberadamente fora do escopo atual.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
