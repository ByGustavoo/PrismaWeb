<div align="center"> <br> 
  <img align="center" alt="prisma-react" height="150" width="150" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
</div> 

<br> 

<div align="center">
  <strong>Prisma</strong> é o frontend de uma aplicação de finanças pessoais, criada para dar ao usuário uma visão clara e organizada do próprio dinheiro. Reúne contas, cartões, lançamentos, investimentos e planejamento em uma única interface, com dashboard de saldo, fluxo de caixa, gastos por categoria, faturas, compras parceladas, orçamento mensal, receitas e despesas recorrentes, previsão financeira, metas de compra e relatórios. Todo dado vem do <a href="https://github.com/ByGustavoo/PrismaAPI">PrismaAPI</a> — o backend em Java / Spring Boot / PostgreSQL —, e o que é cálculo (saldo, fatura, previsão, avisos) é resolvido lá, não na tela.
</div> 

<br> <br> 

## 🚀 Ferramentas Utilizadas

* 🟩 Nginx

* ⚡ Vite 5

* 🐳 Docker

* ⚛️ React 18

* 🧪 Vitest 2

* 📊 Recharts 2

* 🎬 Remotion 4

* 🎨 CSS Modules

* 🔷 TypeScript 5

* 🖼️ Lucide React

* 🧭 React Router 6

* ⚙️ GitHub Actions

<br>

## 🎬 Apresentação

<div align="center">
  <img alt="Apresentação do Prisma: as telas do app, do dashboard às configurações" src="video/apresentacao.gif" width="640" />
</div>

<br>

O vídeo completo tem 107 segundos, em 4K (3840×2160) a 60 fps e com trilha sintetizada, e passa por
cada tela do app: dashboard (com o card de gastos por dia), lançamentos, contas, cartões, faturas,
compras parceladas, orçamento, previsão, recorrentes, metas, investimentos, relatórios, avisos e
configurações. Os nomes e valores saem dos dados de exemplo do ambiente de desenvolvimento ou seguem
as regras do app: as parcelas fecham no centavo com o total da compra, a fatura fecha antes de vencer
e a previsão soma mês a mês. É feito com Remotion na pasta `video`, que tem `package.json` próprio e
fica fora do build, da CI e da imagem Docker. Há também uma versão para celular, o mesmo vídeo em 9:16
(2160×3840) a 60 fps, com a mesma trilha.

```bash
# Instala as dependências do vídeo
npm install --prefix video

# Gera a trilha e renderiza video/out/prisma-apresentacao.mp4 em 4K a 60 fps
npm run render --prefix video

# Renderiza a versão para celular em video/out/prisma-apresentacao-celular.mp4 (9:16, 4K, 60 fps)
npm run render:celular --prefix video

# Gera o video/apresentacao.gif deste README a partir do vídeo renderizado
npm run gif --prefix video

# Abre o Remotion Studio para editar as cenas
npm run estudio --prefix video
```

<br>

## 📌 Status do Projeto

O frontend está **completo e integrado ao PrismaAPI**. Todas as telas existem e todos os dados vêm
do backend — não há mocks nem dados fictícios no projeto. Sem a API rodando, as telas mostram o
estado de erro com a opção de tentar de novo.

Não há pendência no PrismaAPI. A paginação de `GET /lancamentos`, o `GET /lancamentos/{id}` e o recorte
por mês do `GET /faturas` estão publicados desde a `v1.0.14` da API, e uma versão anterior quebra a tela
de Lançamentos. Quando o frontend voltar a depender de algo que a API ainda não tem, a pendência vai
para um `API_CONTRACT.md` na raiz, que sai assim que ela for implementada.

A imagem é publicada no Docker Hub pela esteira, com versão e data visíveis em
**Configurações → Versões**.

<br>

## ✨ Funcionalidades

<br>

🔹 **Boas-vindas**
* Tela de abertura a cada nova aba, com a frase "Veja para onde vai cada real.", uma linha de saldo animada que segue tracejada depois de hoje e o logo viajando até o menu lateral ao começar.

🔹 **Dashboard**
* Saldo atual e patrimônio (saldo somado aos investimentos), com variação contra o período anterior, receitas, despesas, investimentos e fatura do mês, que passa para a seguinte quando a do mês já está paga.
* Fluxo de entradas e saídas, gastos por categoria e calendário de gastos por dia.
* Seletor de período no header: mês a mês pelas setas, atalhos ("Últimos 3 meses", "Este ano") e intervalo próprio.

🔹 **Lançamentos**
* Listagem única para receitas, despesas e transferências, com rota própria por tipo.
* Lista paginada do tamanho da tela (8 por página na tabela, 4 nos cartões), com páginas numeradas alinhadas ao rodapé do menu; busca (inclusive na observação, sem acento), filtro por período, categoria, conta e situação, e ordenação feitos pelo servidor.
* Cadastro, edição e exclusão, com formulário específico por tipo e o interruptor "Repetir", que transforma o lançamento no primeiro de uma recorrente.
* Alternância animada entre tabela e cartões, com a preferência guardada no navegador.

🔹 **Contas e cartões**
* Cadastro das contas do dia a dia (corrente, salário e outras), com a participação de cada uma no saldo total.
* Um cadastro só para os quatro tipos de cartão: crédito, débito, vale-alimentação e vale-refeição.
* Faturas derivadas das despesas e das parcelas, em quatro blocos: a pagar, atual, próximas e anteriores.
* Detalhe da fatura com as compras dentro dela e cadastro de compras no cartão, à vista ou parceladas, com cronograma, filtro por situação, ordenação por parcelas restantes, o que falta pagar e a fatura do mês das compras.
* Pagamento de parcela ou de fatura debitado da conta de pagamento do cartão: a parcela paga entra em despesas na data do pagamento, e desfazer devolve o saldo.

🔹 **Patrimônio**
* Carteira de investimentos com onze classes de ativo (incluindo RDB/caixinhas, poupança e previdência privada), distribuição em rosca, rentabilidade e evolução da carteira.
* Reserva de emergência como marca em qualquer investimento, com o total da reserva no resumo da tela.
* Aportes, resgates e atualização de saldo por investimento, com histórico que separa o dinheiro colocado do rendimento. Aporte e resgate podem sair de uma conta ou voltar para ela, e o saldo da conta acompanha.
* Ações acompanhadas pela quantidade: compra, venda e cotação, com preço médio e saldo pela cotação.

🔹 **Planejamento**
* Orçamento mensal por categoria, com consumo, projeção de ritmo e o que ficou fora do orçamento.
* Receitas e despesas recorrentes com custo mensal e entradas por mês, próximos vencimentos, pausa sem exclusão e lançamento automático na data — inclusive direto na fatura do cartão e no saldo do vale.
* Previsão financeira: o resto do mês corrente e os próximos seis meses, com recorrentes, parcelas, gasto variável, agendados e aportes em colunas próprias, e o método declarado com os números da base.
* Metas e desejos: acompanhamento do preço de uma compra pretendida, com histórico completo, menor preço, média, variação e gráfico de evolução.

🔹 **Análise**
* Relatórios por recorte de datas, com receitas e despesas por categoria, gasto por origem, evolução do saldo e evolução do patrimônio.

🔹 **Transversal**
* Tema claro, escuro e sistema.
* Busca global em lançamentos, categorias e contas, ignorando acentuação.
* Painel de avisos derivado dos próprios dados: faturas a vencer, contas, agendamentos e recorrentes próximos, receitas a receber, cartões perto do limite, orçamentos no limite, saldo negativo previsto e investimentos e metas sem atualização. Cada aviso pode ser lido ou adiado e volta sozinho quando a situação muda; tipos, antecedência e lembretes se escolhem em Configurações.
* Telas ocultas: cada tela do menu pode ser tirada em Configurações, e o que leva a ela some junto.
* Máscara monetária brasileira em todos os campos de valor e uma paleta de dezesseis cores fixas por categoria, distintas e legíveis nos dois temas.
* Página 404 própria, fora do shell do app: o endereço que falhou fica à vista, com atalhos para as telas de entrada e uma série que se desenha em laço até o ponto onde os dados acabam.
* Notificações de sucesso e de erro num canal único, com tempo proporcional ao texto, pausa ao passar o mouse e dispensa por deslize no toque.
* Estados de carregamento, vazio e erro em todas as telas, e responsividade do desktop ao celular.

<br>

## ⚙️ Pré-requisitos

* Node.js 18 ou superior (a CI e a imagem usam o Node 22)

* PrismaAPI `v1.0.14` ou mais nova rodando, em `http://localhost:9017/PrismaAPI/v1` no desenvolvimento

<br>

## 🔐 Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env`, criado a partir do `.env.example`. **Nenhum outro
arquivo lê `import.meta.env` diretamente**: isso acontece apenas em `src/constants/ambiente.ts`, e o
resto do código consome o objeto `ambiente` exportado de lá.

O `.env` está no `.gitignore`; só o `.env.example` é versionado, e ele não contém segredo nenhum.

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API no desenvolvimento (`http://localhost:9017/PrismaAPI/v1`, perfil `dev` do PrismaAPI) |
| `PRISMA_API_URL` | URL da API usada pelo container, lida do `.env` pelo `docker-compose-prismaweb.yml` ao subir a imagem |

<br>

## ▶️ Como Executar

🔹 Instalação
```bash
# Instala as dependências do projeto
npm install
```

🔹 Ambiente
```bash
# Cria o arquivo de variáveis a partir do exemplo
cp .env.example .env
```

🔹 Execução
```bash
# Sobe o servidor de desenvolvimento em http://localhost:5173
npm run dev
```

<br>

## 📜 Scripts Disponíveis

```bash
# Servidor de desenvolvimento com HMR
npm run dev

# Checagem de tipos e build de produção
npm run build

# Serve o build de produção localmente
npm run preview

# Apenas a checagem de tipos
npm run typecheck

# Testes unitários com Vitest
npm test
```

O `typecheck` usa `tsc -b`, e não `tsc --noEmit`. O `tsconfig.json` da raiz é uma solução com
`references` e `files: []`: com `--noEmit`, a checagem não olharia arquivo nenhum e passaria sempre.
Como o `tsconfig.app.json` já tem `noEmit: true`, o `-b` checa sem gerar saída.

Os testes ficam ao lado do arquivo testado (`*.test.ts`) e cobrem a máscara de valor, a paginação, a
leitura da falha geral, o filtro que Lançamentos manda ao servidor, o recorte de meses das faturas e o
limite dos cartões.

<br>

## 🐳 Docker

A imagem compila o app com Node 22 e o serve com o `nginx-unprivileged` (usuário sem root, porta
`8080`), com fallback de rotas para o `index.html`, cache longo em `/assets/` e `/healthz` para o
healthcheck.

**A URL da API é lida ao subir o container, e não no build.** O script
`docker/40-prisma-config.sh` grava `/config.js` a partir de `PRISMA_API_URL`, e o `ambiente.ts` dá
preferência a esse valor sobre o `VITE_API_URL`. Assim a mesma imagem publicada serve qualquer
ambiente.

```bash
# Sobe a partir da imagem publicada, com a URL da API vinda do .env
docker compose -f docker-compose-prismaweb.yml up -d

# Baixa a imagem mais recente
docker compose -f docker-compose-prismaweb.yml pull

# Recria o container com a imagem baixada
docker compose -f docker-compose-prismaweb.yml up -d
```

| Onde | Valor | Uso |
|---|---|---|
| Porta no host | `5173` | Endereço do app: `http://localhost:5173` |
| Porta no container | `8080` | Porta do `nginx-unprivileged`, não muda |
| `PRISMA_API_URL` | `http://localhost:9027/PrismaAPI/v1` | URL da API, lida do `.env` ao subir o container |

O compose não traz a URL escrita dentro dele: ele lê `PRISMA_API_URL` do `.env` ao lado do arquivo,
como o `docker-compose-prismaapi.yml` faz no PrismaAPI. Sem a variável definida, o container sobe
com a URL vazia — copie o `.env.example` no servidor antes de subir.

O desenvolvimento não passa pelo compose: `npm run dev` serve em `http://localhost:5173` e fala com
a API local em `http://localhost:9017/PrismaAPI/v1` (`VITE_API_URL`).

`PRISMA_API_URL` é acessada pelo navegador de quem usa o app, não pelo container: use um endereço que
a máquina do usuário alcance.

<br>

## 🤖 Integração Contínua

| Workflow | Gatilho | O que faz |
|---|---|---|
| `ci.yml` | Pull Request para `main` | `npm run build` (typecheck incluso) e build da imagem, sem publicar |
| `release.yml` | PR mergeado em `main` (ou manual, em *Actions → Release → Run workflow*) | Calcula a próxima versão, publica a imagem para `linux/amd64` e `linux/arm64` no Docker Hub e cria a tag `vX.Y.Z` com uma Release no GitHub |

A versão segue SemVer, e a fonte de verdade são as **tags git**. Sem nenhuma tag, a primeira
versão é a do `package.json`; a partir daí o incremento vem do rótulo do PR:

| Rótulo do PR | Exemplo |
|---|---|
| *(nenhum)* | `1.0.26` → `1.0.27` |
| `release:minor` | `1.0.27` → `1.1.0` |
| `release:major` | `1.1.0` → `2.0.0` |

* **Tags da imagem:** cada publicação gera a versão exata (`X.Y.Z`) e `latest` — fixe `X.Y.Z` para reproduzir um ambiente e use `latest` para acompanhar o último.
* **Notas da Release:** a descrição do PR, o `docker pull` da versão e a lista de PRs gerada pelo GitHub. PR fechado sem merge não publica nada.
* **Versões na tela:** a versão e a data de lançamento vão para a imagem e aparecem em **Configurações → Versões**, ao lado das da API (lidas de `GET /sistema/versao`).
* **Rótulos:** `release:minor` e `release:major` precisam ser criados em *Issues → Labels*.

Configuração no GitHub (*Settings → Secrets and variables → Actions*), com os mesmos nomes da esteira
do PrismaAPI:

| Nome | Tipo | Conteúdo |
|---|---|---|
| `DOCKER_USERNAME` | Secret | Usuário do Docker Hub (`gurudohimalaia`) |
| `DOCKER_PASSWORD` | Secret | Senha ou access token do Docker Hub com permissão *Read & Write* |
| `DOCKER_IMAGE` | Secret | Repositório completo da imagem (`gurudohimalaia/prismaweb`) |

<br>

## 🔌 Integração com a API

Basta apontar `VITE_API_URL` para o PrismaAPI. Os tipos de `src/types/dto/` são os mesmos
DTOs do backend, e o contrato inteiro é escrito em português: rota em kebab-case sem acento
(`/contas/origens`, `/recorrentes`), campo e query param em camelCase sem acento
(`saldoAtual`, `dataInicial`) e valor de enum em maiúsculas (`RECEITA`, `CARTAO_CREDITO`).

Do lado do cliente:

* 🌐 `clienteHttp` com timeout de 15 s, montagem de query string e normalização de erros em `ErroApi` (`status`, `codigo`, `detalhes`).
* 🔑 Um ponto único, `obterTokenAutenticacao()`, para plugar o token quando entrar o Spring Security. Ele já monta o header `Authorization: Bearer <token>` quando devolve algo.
* 🧭 Todas as URLs em `src/api/rotasApi.ts`. Nenhuma string de rota de backend escrita fora dele.
* 🧵 `AbortSignal` propagado de ponta a ponta: trocar de tela cancela a requisição em voo.

O backend precisa liberar **CORS** para a origem do dev server (`http://localhost:5173`; o perfil `dev`
do PrismaAPI aceita qualquer porta de `localhost` e de `127.0.0.1`) nos métodos `GET`, `POST`, `PUT` e
`DELETE`, e responder erro no formato `ErrorResponseDTO` (`status`, `title`, `instance`, `type`,
`detail`, `errors`, `timestamp`) — o `detail` é o texto que aparece no toast da tela. O PrismaAPI já
faz as duas coisas.

<br>

## 🔄 Camada de Dados

Os componentes nunca falam com `fetch`. Eles chamam services, e cada service é uma camada fina sobre
o `clienteHttp`, com a URL vinda de `rotasApi`:

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

* 🧮 **O que é cálculo, é do servidor.** Fatura, limite comprometido, cronograma de parcelas, distribuição e evolução da carteira, reserva de emergência, patrimônio, consumo do orçamento, previsão, avisos e análise de meta são derivados pelo PrismaAPI. O frontend apresenta, não recalcula.
* ⏳ **Carregamento, erro e cancelamento** passam por `useDadosAssincronos`, que usa o `AbortSignal` para descartar respostas de uma tela que já foi deixada.
* 📦 **Cada tela é um pacote próprio**, carregado ao abrir (`carregarTela`, sobre `React.lazy`); só o dashboard fica no pacote inicial, e as outras telas baixam depois, com o navegador ocioso.

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

* 📲 **Abaixo de 1100px**: a sidebar vira drawer com scrim, prende o foco como um modal, fecha ao navegar e no Esc, e trava o scroll do fundo.

* 🧩 **Abaixo de 900px**: a listagem de lançamentos e a tabela da previsão trocam a tabela por cartões — rolar de lado até o valor não é leitura. Grids de cartões usam `auto-fill` com largura mínima.

* 👆 Alvos de toque e corpo de campo crescem em `@media (pointer: coarse)`: 44px de alvo e 16px de texto, o mínimo que evita o zoom automático do Safari no iOS.

* 🎬 `prefers-reduced-motion` respeitado globalmente.

<br>

## 📂 Estrutura do Projeto

O código é organizado por pacote, como o PrismaAPI: cada camada se divide pelos mesmos pacotes do
backend (`conta`, `cartao`, `fatura`, `compraparcelada`, `lancamento`, `investimento`, `meta`…), e o que
não é de um domínio fica pela função.

```
src
├── api                 # clienteHttp, ErroApi e rotasApi (única fonte de URLs)
├── components
│   ├── ui              # Botao, Modal, CampoValor, CampoSelecao, SeletorData, Paginacao e os outros controles
│   ├── comum           # ValorMonetario, IndicadorVariacao, BarraResumo, HistoricoMovimentacoes, ResultadoFiltros
│   ├── graficos        # DicaGrafico e GraficoEvolucao
│   ├── layout          # MenuLateral, Cabecalho, CabecalhoPagina, BuscaGlobal e SeletorPeriodo
│   ├── boasVindas      # TelaBoasVindas, LinhaDoSaldo e a transição de saída
│   ├── erro            # MolduraDeErro, SerieInterrompida, LimiteDeErro, TelaDeFalha e FalhaNaTela
│   ├── aviso           # PainelAvisos (sino) e PainelPreferenciasAvisos
│   ├── tela            # PainelTelas e TelaOculta
│   └── <pacote>        # Componentes de cada domínio: dashboard, lancamento, conta, cartao, fatura…
├── constants           # Gerais na raiz (ambiente, aplicacao, navegacao, validacao) e uma pasta por pacote
├── hooks               # Gerais na raiz (useDadosAssincronos, useCatalogo…) e os de domínio por pacote
├── layouts             # LayoutAplicacao (sidebar + header + conteúdo)
├── pages               # Uma pasta por pacote, com as telas, e erro/ (404)
├── providers           # ProvedorTema, ProvedorNotificacoes, ProvedorTelas, ProvedorAvisos e ProvedorPeriodo
├── routes              # RotasAplicacao, caminhos (única fonte de rotas) e carregarTela
├── services            # Um service por controller do backend, uma pasta por pacote
├── styles              # tokens.css (design tokens) e global.css
├── types               # dto/<pacote>/<Nome>DTO.ts, enums/ e comum/, reexportados por @/types
└── utils               # formatacao, data, validacao, foco, mascaraValor, paginacao e falhaDeTela
```

<br>

## 🗺️ Próximas Etapas

* 🔐 Autenticação com Spring Security, plugada no `obterTokenAutenticacao()`.

* 🧰 ESLint e Prettier, testes de componente e de tela, e `npm test` na CI.

* 📄 Exportação de relatórios (PDF e CSV).

<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
