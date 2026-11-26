# CLAUDE.md

Guia para o Claude Code trabalhar neste repositorio. O codigo nao tem comentarios: o porque das
decisoes mora aqui. Quase toda regra abaixo foi pedida ou corrigida pelo usuario; quando um item diz
"nao reintroduza", a alternativa ja foi entregue e recusada.

## Sobre o projeto

Frontend de financas pessoais: dashboard, lancamentos, contas e cartoes (com faturas e compras
parceladas), investimentos, planejamento (orcamento, recorrentes, previsao, metas) e relatorios. O
produto se chama **Prisma** em todo lugar: repositorio, `package.json`, `NOME_APLICACAO`
(`src/constants/aplicacao.ts`), `<title>` do `index.html` e prefixo `prisma:*` do `localStorage`.
Renomeou um, renomeie todos.

O backend e o PrismaAPI (Java / Spring Boot / PostgreSQL, em `D:\Projetos\PrismaAPI`). **Nao ha mocks
no frontend**: todo dado vem da API, e sem ela as telas abrem no estado de erro com "Tentar de novo".
A camada `services/mocks` e a flag `VITE_USE_MOCKS` foram removidas a pedido do usuario e so voltam se
ele pedir. Calculo de saldo, fatura, previsao, avisos e evolucao e trabalho do backend.

**O `API_CONTRACT.md` da raiz so existe enquanto ha pendencia.** Ele lista apenas o que o PrismaAPI
ainda precisa implementar para acompanhar o frontend (endpoints novos, contratos alterados, migracoes,
regras de calculo), conferido contra o codigo do backend. O que ja existe nao entra, e quando a ultima
pendencia sai o arquivo sai junto — **hoje ele nao existe**: a paginacao de lancamentos, o
`GET /lancamentos/{id}` e o recorte por mes do `GET /faturas` (PRM-59 a PRM-61) estao publicados no
PrismaAPI desde a `v1.0.14`; uma API anterior a ela quebra a tela de Lancamentos. Ao mudar um tipo em
`src/types/dto/`, uma rota em `src/api/rotasApi.ts` ou uma regra que o backend aplica, recrie-o
com a pendencia no mesmo trabalho. O `README.md` documenta instalacao e variaveis. Tres documentos que
divergem valem menos que um so.

## Comandos

```bash
npm install         # instala dependencias
npm run dev         # servidor de desenvolvimento em http://localhost:5173
npm run build       # tsc -b + build de producao
npm run preview     # serve o build de producao
npm run typecheck   # apenas checagem de tipos (tsc -b)
npm test            # testes unitarios (vitest run)

npm install --prefix video       # dependencias do video de apresentacao
npm run render --prefix video    # trilha + video/out/prisma-apresentacao.mp4 em 4K (3840x2160) a 60 fps
npm run render:celular --prefix video  # o mesmo video em 9:16, video/out/prisma-apresentacao-celular.mp4 (2160x3840)
npm run gif --prefix video       # video/apresentacao.gif do README (640px, 8 fps, 48 cores, abaixo de 10 MB)
npm run estudio --prefix video   # Remotion Studio
```

Nao ha linter nem formatter. **Antes de dar uma tarefa por concluida: `npm run typecheck`** depois de
mexer em `.ts`/`.tsx`, **e `npm test`** quando a mudanca toca regra coberta por teste. Os testes sao
Vitest, ao lado do arquivo testado (`utils/mascaraValor.test.ts`), e rodam sobre o `vite.config.ts`,
entao o alias `@/` vale neles. Hoje tem teste a mascara de valor — ela concentra a edicao em funcoes
puras justamente para digitacao, cursor e exclusao serem testaveis sem DOM —, o filtro que Lancamentos
manda ao servidor (`components/lancamento/consulta.test.ts`), a regra dos numeros da paginacao
(`utils/paginacao.test.ts`), a leitura da falha geral (`utils/falhaDeTela.test.ts`), o recorte de
meses que Cartoes e Faturas mandam ao servidor (`constants/fatura/fatura.test.ts`) e o limite
comprometido e disponivel dos cartoes (`constants/cartao/cartao.test.ts`). A CI ainda nao
roda `npm test`.

O script usa `tsc -b`, e nao `tsc --noEmit`: o `tsconfig.json` da raiz e uma solucao com `references` e
`files: []`, entao `--noEmit` nao checa arquivo nenhum e passa sempre. Como `tsconfig.app.json` ja tem
`noEmit: true`, o `-b` checa sem gerar saida. Nao volte o script.

## Stack

| Camada | Escolha |
| --- | --- |
| Build | Vite 5 |
| UI | React 18 + TypeScript 5 (`strict`) |
| Rotas | React Router 6, com as future flags da v7 (`v7_startTransition`, `v7_relativeSplatPath`) ligadas no `BrowserRouter` |
| Estilos | CSS Modules + custom properties (sem framework de UI) |
| Icones | lucide-react |
| Graficos | Recharts |
| Testes | Vitest 2 |

## Regras de arquitetura

Invariantes do projeto. Quebra-las e o erro mais caro que se pode cometer aqui.

1. **Variaveis de ambiente so em `src/constants/ambiente.ts`.** Nenhum outro arquivo le
   `import.meta.env`; flag nova entra no objeto `ambiente`. O mesmo arquivo le
   `window.__PRISMA_CONFIG__`, escrito pelo `public/config.js` (vazio no desenvolvimento, regravado
   pelo container ao subir), que tem prioridade sobre o `VITE_API_URL`.

2. **URLs da API so em `src/api/rotasApi.ts`.**

3. **Componentes nunca chamam `fetch` nem `clienteHttp`.** Chamam services, camadas finas sobre o
   `clienteHttp`, sempre neste formato:

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

4. **Nenhum hex em componente.** Cor, espacamento, raio e tipografia saem de `src/styles/tokens.css`,
   sob `[data-theme='light']` e `[data-theme='dark']`.

5. **Rotas so em `src/routes/caminhos.ts`.** Links usam `caminhos.x`. A raiz `/` redireciona para
   `caminhos.dashboard` (`/dashboard`), para toda tela ter endereco com nome. O mesmo arquivo guarda os
   query params (`busca`, `categoria`, `conta`, `cartao`, `compra`, `fatura`, `investimento`, `meta`,
   `novo`, `editar`), que sao contrato entre telas. Todos sao transitorios: a tela os le e limpa a URL
   (`setSearchParams({}, { replace: true })`), para voltar no historico nao reabrir formulario nem
   refiltrar. Estado de filtro e de visualizacao nunca vai para a query string.

6. **Contratos de dominio em `src/types/`** — sao o contrato do PrismaAPI, e mudar um tipo e
   decisao de API. Um arquivo por DTO em `dto/<pacote>/` (com os mesmos subpacotes do backend, como
   `dto/dashboard/gasto/categoria/`), um por enum em `enums/`, `ErrorResponseDTO` em `dto/erro/` e o que
   so o frontend usa (`ID`, `TokenCor`, `Opcao`) em `comum/`. Todos sao reexportados por `@/types`, que e
   de onde se importa; DTO novo entra no barril. **Todo campo e em portugues**, como os DTOs do backend: query param e campo JSON em
   camelCase sem acento (`dataInicial`, `idCartao`, `saldoAtual`, `limiteComprometido`), enum em
   MAIUSCULAS (`RECEITA`, `CARTAO_CREDITO`), inicio e fim de recorte sempre `dataInicial`/`dataFinal`,
   rotas em kebab-case sem acento (`/contas/origens`, `/metas/{id}/precos`) e tipos com o nome do DTO
   (`ContaDTO`, `SalvarContaDTO`, `TipoConta`, `Situacao`). O banco e snake_case e a traducao acontece
   so no mapeamento JPA. Ao renomear campo, lembre que `dataKey` do Recharts e chaves de `query` nos
   services sao string e nao passam pelo compilador. So Lancamentos e paginado, com DTO proprio
   (`PaginaLancamentosDTO`, ver "Lancamentos e saldo"); nao introduza `Page<T>` generico nem pagine
   outra listagem sem o usuario pedir.

7. **Nada de `<select>` nem `<input type="date">` nativos** — o navegador os desenha com as cores do
   sistema, ignorando os tokens, e no tema escuro ficavam ilegiveis. Escolha usa
   `components/ui/CampoSelecao` (combobox com `role="listbox"`, teclado e estados dos tokens); data usa
   `components/ui/SeletorData`, com a mesma arquitetura. A lista vai para um portal no `body` com
   posicao fixa (absoluta, seria cortada pelo modal que rola), por isso `--z-popover` fica acima de
   `--z-modal` — nao inverta. No `SeletorData` **o foco fica no gatilho**, com o dia anunciado por
   `aria-activedescendant`: foco dentro do portal brigaria com a trava de Tab do `Modal`. Pelo mesmo
   motivo o Escape do calendario chama `stopPropagation`, senao fecharia o formulario.

   **Filtro tem a largura da maior opcao.** `CampoSelecao` usado como filtro (fora de formulario)
   recebe `larguraPelaMaiorOpcao` e nao leva `width` no CSS: o gatilho empilha todos os rotulos
   invisiveis na mesma celula de grade e mede o mais longo (com o prefixo, como "Ordenar:") mais 16px
   antes da seta. Abaixo de 600px os filtros ocupam a linha inteira.

8. **Excecao ao token de cor: Recharts**, que escreve cor como atributo SVG, onde `var()` nao resolve
   de forma confiavel. Use `usePaletaGrafico`, que le os tokens computados e recalcula na troca de tema.
   Duas familias que nao se misturam: as **series** (`--chart-1` a `--chart-8`) sao semanticas
   (receita, despesa, saldo, aporte); a **paleta categorica** (`--palette-1` a `--palette-16`, em
   `paleta`) da identidade a categoria ou classe de ativo, com token fixo por item
   (`CategoriaDTO.tokenCor`, `corClasseAtivo`). Fora do Recharts, `corDaPaleta(token)`
   (`constants/cores.ts`) devolve o `var()`. As dezesseis cores sairam de script: todas passam de 4:1
   sobre a superficie nos dois temas, e a menor distancia OKLab entre duas despesas e 0,076 no claro e
   0,084 no escuro. Ao mexer numa cor, refaca a conta.

## Estrutura

```
.github/workflows/  ci (PR), release (merge na main -> Docker Hub + tag)
docker/            nginx.conf, 40-prisma-config.sh (gera config.js no start)
public/            favicon, config.js (configuracao de execucao, vazia no dev)
video/             pacote Remotion do video de apresentacao (ver abaixo)
src/
├── api/           clienteHttp, ErroApi, rotasApi
├── components/
│   ├── ui/        Botao, Painel, CampoTexto, CampoValor, AreaTexto, CampoSelecao, SeletorData, Interruptor, Modal,
│   │              DialogoConfirmacao, Selo, Tabela, BarraProgresso, Carregamento, EstadoVazio, Notificacao,
│   │              Paginacao
│   ├── comum/     ValorMonetario, MarcaPrisma, IndicadorVariacao, BarraResumo, HistoricoMovimentacoes, VooMovimentacao,
│   │              ResultadoFiltros
│   ├── graficos/  DicaGrafico, GraficoEvolucao (valor x aportado)
│   ├── layout/    MenuLateral, Cabecalho, EspacoCabecalho, CabecalhoPagina, BuscaGlobal, SeletorPeriodo
│   ├── boasVindas/ TelaBoasVindas, LinhaDoSaldo (fundo), transicaoBoasVindas (saida por View Transitions)
│   ├── erro/      MolduraDeErro, SerieInterrompida (cena), LimiteDeErro, TelaDeFalha, FalhaNaTela
│   ├── aviso/     PainelAvisos (sino), PainelPreferenciasAvisos
│   ├── tela/      PainelTelas, TelaOculta
│   ├── dashboard/ PainelSaldo, BlocoIndicador, GraficoFluxoCaixa, DistribuicaoCategorias,
│   │              CalendarioGastos, UltimosLancamentos
│   ├── lancamento/ FiltrosLancamentos, TabelaLancamentos, ListaLancamentos (cartoes),
│   │              AlternadorVisualizacao, formularios, aparencia (icone/cor por tipo e situacao),
│   │              consulta (filtro, periodo e ordenacao)
│   ├── conta/     CartaoConta, ModalFormularioConta, aparencia
│   ├── cartao/    BlocoCartao, ModalFormularioCartao, aparencia (icone, tom de limite)
│   ├── fatura/    EntradaFatura (destaque e linha), ModalDetalheFatura, aparencia (rotulo e tom da fatura)
│   ├── compraparcelada/ CartaoParcelamento, ModalParcelasCompra (cronograma), ModalFormularioParcelamento,
│   │              ControlePagamentoParcela, FiltrosParcelamentos, consulta, aparencia (tom da parcela)
│   ├── investimento/ GraficoAlocacao (rosca), GraficoCarteira, CartaoInvestimento,
│   │              ModalFormularioInvestimento, ModalDetalheInvestimento, aparencia,
│   │              contaMovimentacao (opcoes de conta do aporte e do resgate), calculoAcoes (previas)
│   ├── orcamento/ NavegadorMes, LinhaOrcamento, ModalFormularioOrcamento
│   ├── recorrente/ CartaoRecorrente, ModalFormularioRecorrente, lancamentoAutomatico (dica e explicacao,
│   │              usadas tambem no formulario de lancamento)
│   ├── meta/      CartaoMeta, ModalFormularioMeta, ModalDetalheMeta, FiltrosMetas, VariacaoPreco,
│   │              MiniCurvaPreco, GraficoHistoricoPreco, aparencia, consulta
│   ├── previsao/  GraficoPrevisao, TabelaPrevisao, ListaPrevisao (versao compacta)
│   └── relatorio/ SeletorPeriodoRelatorio, DistribuicaoOrigens, GraficoEvolucaoSaldo, GraficoPatrimonio
├── constants/     ambiente, aplicacao, navegacao, validacao, notificacoes, cores (gerais, na raiz) e
│                  <pacote>/<pacote>.ts: aviso, cartao, compraparcelada (compraParcelada.ts), conta,
│                  fatura, investimento, lancamento, meta, orcamento, previsao, recorrente, relatorio, tela
├── hooks/         gerais na raiz (useDadosAssincronos, useConsultaMidia, useArmazenamentoLocal,
│                  useTravarRolagem, usePaletaGrafico, useContagem, useValidacaoFormulario,
│                  useIndicadoresRolagem, useTabelaCabe, useLarguraEixoMoeda, useValorComAtraso,
│                  useCatalogo, useCliqueFora, useReposicionarPopover) e de pacote:
│                  fatura/usePagamentoFatura, compraparcelada/usePagamentoParcela, conta/useVersaoOrigens
├── layouts/       LayoutAplicacao (sidebar + header + conteudo)
├── pages/         <pacote>/Pagina*: dashboard, lancamento, conta, cartao, fatura, compraparcelada,
│                  investimento, orcamento, recorrente, previsao, meta, relatorio, configuracao, erro (404)
├── providers/     ProvedorTema, ProvedorNotificacoes, ProvedorTelas, ProvedorAvisos, ProvedorPeriodo,
│                  ProvedoresAplicacao
├── routes/        RotasAplicacao, caminhos, carregarTela
├── services/      <pacote>/<pacote>.service.ts: aviso, cartao, categoria, compraparcelada, conta (e
│                  origensAlteradas), dashboard, fatura, investimento, lancamento, meta, orcamento, previsao,
│                  recorrente, relatorio, sistema, tela
├── styles/        tokens.css, global.css
├── types/         comum/ (ID, TokenCor, Opcao), dto/<pacote>/<Nome>DTO.ts, enums/<Nome>.ts, index.ts
└── utils/         juntarClasses, data, formatacao, validacao, foco, mascaraValor, falhaDeTela, paginacao
```

**Organizacao por pacote, como no PrismaAPI.** Cada camada (`components`, `pages`, `services`, `types/dto`,
`constants`, hooks de dominio) se divide pelos pacotes do backend, com o mesmo nome no singular e sem
separador: `conta`, `cartao`, `fatura`, `compraparcelada`, `lancamento`, `investimento`, `recorrente`,
`meta`, `relatorio`, `aviso`, `tela`... O que nao e de um dominio (ui, comum, graficos, layout,
boasVindas, erro, providers, utils, hooks gerais) fica pela funcao. Pacote novo no backend ganha a mesma
pasta em cada camada que o usar. Excecoes: `metapreco` so existe em `types/dto` (como no backend), e
`configuracao` so em `pages`, porque a tela junta aviso, tela e sistema.

- **Um service por controller do backend**: `cartaoService` (cartoes), `faturaService` (faturas e
  pagamento da fatura) e `compraParceladaService` (compras e pagamento de parcela) sao tres, como
  `CartaoController`, `FaturaController` e `CompraParceladaController`. O objeto leva o nome do pacote
  no singular (`contaService`, `lancamentoService`), e todos saem do barril `@/services`.
- **Cada nome mora no pacote do dominio dele**: rotulo e tom de fatura em `constants/fatura` e
  `components/fatura/aparencia`, parcela em `constants/compraparcelada` e
  `components/compraparcelada/aparencia`; cartao fica so com tipo, situacao, limite e `TODOS_CARTOES`.
- Cada pasta de componentes tem um `index.ts` de barril — componente novo e exportado la. `pages/` nao
  tem barril: cada tela e carregada sob demanda (ver "Carregamento por tela").
- **O shell importa pelo arquivo, nao pelo barril**: `Cabecalho` importa
  `@/components/aviso/PainelAvisos` e `LayoutAplicacao`, `@/components/tela/TelaOculta`. Pelo barril, o
  CSS de `PainelPreferenciasAvisos` e `PainelTelas` (que so Configuracoes usa) ia para o pacote inicial,
  porque import de CSS e efeito colateral e nao sai no tree-shaking: foram 4,5 kB a mais. O mesmo vale
  para qualquer componente que o layout ou o `Aplicacao` importem.

**`video/`** tem `package.json` proprio e fica fora do build, da CI e do Docker; uma cena por tela do
app. `src/linhaDoTempo.ts` guarda cues e valores em passos de 1/30 s; o render e a 60 fps e cada quadro
le o passo fracionario por `usePasso` (`animacao.ts`), entao o movimento sai em 60 quadros sem dobrar
nenhum numero. `scripts/gerarAudio.ts` arranja a trilha sintetizada (150 BPM, toda cena e acento na
grade de 12 passos) sobre o DSP de `scripts/sintese.ts`. A versao de celular e a composicao
`ApresentacaoPrismaCelular` (1080x1920 a `--scale=2`), com a mesma linha do tempo e trilha; quem muda o
layout e o contexto de `src/formato.ts` (`useRetrato`). No retrato: o `CenaDividida` empilha texto e
cartao num bloco centrado com 40px entre os dois; a notificacao sai 24px abaixo do cartao, centrada e
com os 520px da paisagem (presa na base e na largura toda ficava longe e pesada); no Gancho a pilha de
portas encolhe com a convergencia; o fundo mostra so a subida da linha ate o "hoje"; cartao que muda
de altura reserva a maior (`alturaCartaoRetrato`), senao o titulo centrado com ele pula.

## Convencoes de codigo

- **Alias `@/` aponta para `src/`.** Import absoluto entre pastas; relativo so na mesma pasta.
- **Um `.module.css` ao lado do componente**, com o mesmo nome.
- **Texto de interface e portugues brasileiro acentuado** — titulo, label, placeholder, `aria-label`,
  erro, toast — em capitalizacao de frase ("Últimos lançamentos"), nunca title case nem tudo minusculo.
- **O separador entre dois trechos de texto e o travessao, e o trecho seguinte comeca em maiuscula**:
  "Contas — Venceu há 54 dias", "10x — Notebook". O ponto medio (`·`) foi tirado do projeto inteiro,
  inclusive do `AvisoService` do PrismaAPI e do video. Nao o reintroduza.
- **O que nao aparece na tela e ASCII puro**: variaveis, chaves, ids (`cat-saude`) e os caminhos de
  `caminhos.ts` (`/lancamentos`, `/configuracoes`).
- **O projeto nao tem comentarios** — nem de linha, de bloco ou JSDoc, em `.ts`, `.tsx`, `.css`,
  `index.html` e `.gitignore`. Excecoes: as explicacoes das variaveis em `.env.example` e a diretiva
  `/// <reference types="vite/client" />` de `src/vite-env.d.ts`, que nao e comentario.
- `tsconfig` roda com `noUnusedLocals`, `noUnusedParameters` e `noUncheckedIndexedAccess`: indice de
  array devolve `T | undefined` — trate, nao use `!`.
- Moeda, numero e data passam por `src/utils/formatacao.ts` (`Intl`, `LOCALIDADE = 'pt-BR'`,
  `MOEDA = 'BRL'`). Datas por extenso saem de `formatarDataPorExtenso` ("03 de Dezembro de 2026", mes em
  maiuscula), base de `formatarDataCompleta` e `formatarInstanteCompleto`.
- Dados assincronos das paginas vao por `useDadosAssincronos` (loading, erro e cancelamento).

## Valor monetario e variacao

- **Valor na tela sempre pelo `ValorMonetario`**, nunca `{formatarMoeda(x)}` no JSX. Ele usa
  `formatarPartesMoeda`: "R$" num span na familia de interface (reduzido, 0,68em) e os digitos num
  `.tabular` na familia de numeros — sem a separacao o cifrao herda o tracking negativo dos numeros.
  **O sinal fica fora do "R$"**, num span proprio na familia dos algarismos, com 0,8em e 0,12em de
  respiro; o negativo e o `−` tipografico (U+2212), nao o hifen, e o `+` leva peso 700 (`.plus`).
  `formatarPercentualComSinal` usa o mesmo `−`, e o `IndicadorVariacao` separa sinal e numero
  (`formatarPartesPercentualComSinal`) com o mesmo respiro. O sinal fica na posicao do desenho da fonte:
  subi-lo foi testado e recusado. Nao volte a deslocar o sinal.
- **Dois modos de movimento que nao se sobrepoem.** `contarAoAparecer` conta de zero ate o valor uma
  vez, ao aparecer (`useContagem`); `animar` rola os algarismos quando o valor muda. Durante a contagem
  os digitos sao texto e as rodas assumem so no fim, no valor final (a roda assenta por transicao de
  CSS, que precisa de alvo parado). Os dois valem so para os indicadores-titulo: no dashboard, saldo,
  patrimonio, as tres linhas de fluxo e os quatro tiles; em Contas, Cartoes, Faturas e Parcelamentos,
  a `BarraResumo` do topo. Cartoes de lista nao contam. Excecao do `animar` (pedido do usuario): o
  cabecalho e a faixa de numeros do detalhe de investimento rolam ao registrar — reais pelo
  `ValorMonetario`, contagem, quantidade de acoes e data pelo `NumeroRolante` (a mesma roda, sem "R$";
  separadores ficam parados). A trava de "ja contou" fecha na **chegada**, nunca na partida: o
  `StrictMode` monta duas vezes no dev.
- **O passo da roda e inteiro em pixels**: `--roll-step: round(1.12em, 4px)` em
  `ValorMonetario.module.css`. Com 1,12em cru cada algarismo parava numa fracao de pixel diferente e o
  navegador encaixava a linha de base no pixel mais proximo — o 9 e o 3 de "1.930,00" ficavam 1px
  acima. Multiplo de 4 para continuar inteiro em 125%, 150% e 175% do Windows. Altura da face,
  `line-height` do encaixe e do separador saem todos do `--roll-step`, e a contagem de entrada
  (`.counting`) usa o mesmo `line-height`, senao a linha encolhia ao trocar de fase e as linhas de fluxo
  do dashboard pulavam 9px. O `@supports` mantem `1.12em` onde `round()` nao existe (sem ele todo valor
  mostraria zero).
- **No `IndicadorVariacao` a seta segue o numero e a cor segue a noticia.** `sentidoFavoravel`
  (padrao `ALTA`) e o sentido verde: saldo, receita e rentabilidade sobem verde; despesa e `BAIXA`.
  Cor invertida nunca aparece sem a palavra: `legendaVariacaoGasto` (`constants/lancamento/lancamento.ts`) escreve
  "Gastou mais"/"Gastou menos" no dashboard e "a mais"/"a menos que no período anterior" em Relatorios;
  `legendaVariacaoReceita` escreve "Recebeu mais"/"Recebeu menos" no bloco de receitas (as duas
  legendas do dashboard comecam em maiuscula). Indicador novo em que menos e melhor passa `BAIXA` e uma
  legenda com a palavra. As duas versoes anteriores ("cor fixa invertida sem palavra" e "cor segue a
  seta") foram apontadas como erro.
- O mesmo principio vale para a comparacao com a fatura anterior (seta verde quando caiu, vermelha
  quando subiu, valor em `muted`, frase em maiuscula depois do travessao) e para o `VariacaoPreco` das
  metas (ver Metas).
- **O percentual e a legenda dividem a linha de base**: o container usa `align-items: baseline` e so o
  `svg` leva `align-self: center`. Archivo e Instrument Sans tem ascendentes diferentes, e centrados
  cada um pela propria caixa o "0,0%" ficava 1px acima da legenda.
- **Sem base de comparacao, a variacao e em reais.** `VariacaoDTO` sempre traz `diferenca` e so traz
  `percentual` quando ele diz algo (o PrismaAPI o omite com janela anterior zero ou acima de 999%).
  Sem `percentual`, o `IndicadorVariacao` desenha "+R$ 4.802,05" pelo `ValorMonetario`, com a mesma
  cor, seta e legenda. Escolha do usuario depois de ver "+175257,3%" e "0,0%" com base zerada.
- **O icone do canto de Receitas e Despesas no dashboard leva a cor da noticia** (`iconeSegueVariacao`
  no `BlocoIndicador`, pelo `tomDaVariacao`): verde boa, vermelho ruim, `--accent` estavel.
  Investimentos e Fatura ficam sempre azuis. No mouse a cor aparece no hover; no toque fica fixa.

## Tema

- Tres modos: claro, escuro e sistema, em Configuracoes, com atalho no header. Um script inline no
  `index.html` aplica o tema salvo antes do React (mexeu em `CHAVE_TEMA`, atualize o script). O
  `ProvedorTema` grava `data-theme` no `documentElement` **durante o render**, para quem le tokens
  computados (Recharts) ver o tema certo no mesmo ciclo. O script e o provedor tambem gravam `--canvas`
  nas `meta[name="theme-color"]`, para a barra do Safari seguir o tema do app e nao o do sistema.
- Cinzas neutros, sem desvio de matiz; a cor fica para o acento e os estados semanticos. Escala de
  elevacao: `canvas < surface < surface-raised < surface-muted`.
- **Contraste e requisito**: texto 4.5:1 e grafico 3:1 sobre a superficie em que aparece, nos dois
  temas — inclusive o par cor/fundo dos selos (`--positive` sobre `--positive-soft` etc.).
- **Pares de texto e de grafico nao se unificam.** `--chart-2`/`--chart-3` sao parentes de
  `--positive`/`--negative`, mais claros e saturados (objeto grafico, 3:1). `--warning-graphic` e o
  terceiro par: amarelo escurecido vira marrom, entao o par grafico mantem matiz e saturacao e sobe sete
  pontos de luminosidade (`#ab7600`, 3.95:1, contra `#8a6000` do texto). Vale so onde a cor e forma —
  barra do `BarraProgresso`, faixa do mes mais apertado na previsao, borda do toast de aviso; selo,
  sino, data e titulo ficam no `--warning`. No escuro os dois coincidem.
- `--heat-0` a `--heat-4` sao a escala do calendario de gastos (do cinza de superficie ao
  `--negative`). Objeto grafico: so precisam distinguir do vizinho. Nao use para texto nem selo.
- `--counter`/`--counter-contrast` sao o par do contador do sino (ver Avisos).
- Os tokens `--brand-*` ficam em `:root` e valem nos dois temas: logotipo nao muda com o tema.
- **Tokens de movimento**: `--ease-out` (cor, borda, sombra, giro de seta); `--ease-in` (o que sai de
  cena); `--ease-spring`, o unico com ultrapassagem (entrada de item de lista e de popover, curso do
  `Interruptor`, roda de algarismo, hover do menu); `--duration-fast/base/slow`; `--stagger-step`.
- **Entrada de lista e a classe global `.list-item-in`** (`global.css`), com `style={{ '--i': index }}`.
  Keyframe em `.module.css` tem o nome reescrito pelo CSS Modules, entao uma animacao compartilhada
  precisa ser global; keyframes de uso local ficam no proprio modulo.
- **Troca de recorte nao e corte seco.** A classe global `.refreshing` marca o bloco de conteudo de cada
  tela: com o `aria-busy` ligado ele recua para 55% e volta ao chegar o dado. A atenuacao entra com
  atraso de `--duration-fast` e sai sem atraso (resposta rapida nao pisca); so a opacidade se move,
  para o `ValorMonetario` continuar montado e rolar; sob `prefers-reduced-motion` o recuo e cancelado
  por completo (zerar so a duracao viraria pisca). Filtro aplicado em memoria nao passa por isso.
- **Todo X que fecha fica vermelho no hover**: classe global `.botao-fechar` (`--negative` sobre
  `--negative-soft`) no X do `Modal`, do drawer, da busca no celular e da notificacao. X que nao fecha
  (como "Limpar filtros") nao leva a classe.

## Interacao, toque e responsividade

- **Hover so com mouse.** Todo `:hover` vai dentro de `@media (hover: hover)`, seguido de
  `@media (hover: none)` com as mesmas regras em `:active` — no iPhone o hover "grudava" depois do toque
  (PRM-55). Destaque de cartao por foco usa `:has(:focus-visible)`, nao `:focus-within`.
- **Toque sem realce nem atraso**: `-webkit-tap-highlight-color: transparent` no `html` e
  `touch-action: manipulation` em links, botoes e papeis de controle.
- **Alvos de toque**: `--control-height`, `--control-height-sm`, `--control-font` e `--tap-size` mudam
  em `@media (pointer: coarse)` no fim de `tokens.css` — alvo de 44px e campo com corpo de 16px. Os
  16px sao obrigatorios: com menos o Safari do iOS da zoom na pagina ao focar.
- `prefers-reduced-motion` e respeitado globalmente — animacao nova cobre esse caso.
- **Sidebar**: fixa no desktop, recolhida (76px) persistida em `localStorage`. Abaixo de 1100px vira
  drawer com scrim, fecha ao navegar e no Esc, trava a rolagem do fundo e, fechada, fica
  `visibility: hidden` para o Tab nao entrar nela.
- **Nada de esconder acao sem substituto.** Na faixa estreita a busca do header vira um botao que a
  abre sobre o header, e "Novo lançamento" perde o rotulo mas fica como icone.
- **Tabela so quando cabe; senao, cartoes** (`useTabelaCabe`, em Lancamentos e Previsao): o hook mede
  quanto a tabela transborda da area — e nao a largura da janela, porque menu recolhido e dados mudam a
  conta. Abaixo de 900px sao sempre cartoes. A tabela de lancamentos quebra observacao, rota e categoria,
  trava so a data e cabe a partir de 1280px. No desktop o `AlternadorVisualizacao` guarda a escolha em
  `prisma:transactions-view`; quando a tabela nao cabe, o seletor sai. Os cartoes trazem ordenacao
  propria. "Últimos lançamentos" do dashboard vira lista abaixo de 900px.
- **Grades de cartoes usam `auto-fill` com largura minima** (contas, cartoes, parcelamentos,
  investimentos, orcamento, recorrentes): o conteudo decide quando quebrar. Dashboard: 4 → 2 → 1.
- **`BarraResumo` com numero impar de itens, abaixo de 768px**, abre com o primeiro item (o numero
  principal) na linha inteira, separado por borda, e o resto em pares — senao o ultimo sobrava ao lado
  de uma celula vazia. Vale para Contas, Cartoes, Faturas e Investimentos; a barra com variacao
  (Relatorios) fica de fora.
- **O eixo Y em reais tem a largura do maior rotulo** (`useLarguraEixoMoeda`, minimo 78px, medido em
  canvas com a fonte do app). No celular o eixo de "Entradas e saídas" avanca 16px sobre o respiro do
  cartao para sobrar largura as barras.
- **No celular o modal e uma folha que sobe de baixo** (`subirFolha`, `--duration-slow`), presa a base
  com a area segura.
- No celular os tres botoes de acao de Lancamentos preenchem a linha (cabem juntos a partir de 390px;
  abaixo, "Transferência" ocupa a segunda linha).

## Padroes de tela compartilhados

- **Ritmo vertical**: `--space-5` (20px) entre os blocos de uma tela (`.stack`/`.grid` de topo) e
  `--space-4` (16px) entre o titulo de uma secao e o conteudo (`.section`), em todas as telas. Com `h2`
  escondido (Compras parceladas) o segundo nao se aplica.
- **Esqueleto so na primeira carga** (`carregando && !dados`) — dashboard, Lancamentos, Contas, Cartoes,
  Faturas, Parcelamentos. Trocar periodo, cadastrar, editar ou excluir mantem os numeros na tela (com
  `.refreshing`), para os valores rolarem e a contagem nao recomecar. Por isso **rotulos de conteudo
  seguem `data.dataInicial`/`data.dataFinal`, e nao o periodo selecionado**; so o titulo da pagina
  acompanha a selecao na hora. Excecao pedida pelo usuario: em Lancamentos, trocar de pagina mostra o
  esqueleto (o conteudo e outro), na altura que a lista tinha.
- **Filtro de tela vai na linha de acoes do `CabecalhoPagina`; filtro de bloco, no cabecalho do
  bloco.** Seletor de cartao em Faturas e busca + seletores de Compras parceladas e de Metas dividem a
  linha com a acao principal, com `tamanho="sm"` no `CampoSelecao` e no `CampoTexto` (iguala a altura
  ao `Botao tamanho="sm"`; o corpo so cai para `--fs-sm` em `pointer: fine`). A linha de acoes quebra em
  qualquer largura (`flex-wrap` em `.actions`). Compras parceladas e Metas sao iguais: busca, cartao (so
  compras), situacao e ordenacao, nessa ordem, antes do botao, aplicados em memoria (`consulta.ts` de
  cada pasta, busca sem acento por `normalizarBusca`), e so aparecem com item cadastrado. **Abaixo de
  600px "Nova compra" e "Nova meta" vem antes dos filtros**, trocados no JSX (`useFiltrosEmpilhados`), e
  nao com `order`, para o Tab seguir a tela.
- **`ResultadoFiltros`** (`components/comum`) mostra a contagem e "Limpar filtros" acima dos cartoes, so
  com filtro ativo e resultado (sem resultado, o `EstadoVazio` ja tem o proprio botao). A contagem vai
  tambem para um `role="status"` escondido e sempre montado. Limpar leva o foco para a busca
  (`limparFiltros`), senao ele cairia no `body`.
- **Detalhe horizontal a partir de 1100px** nos detalhes de investimento e de meta (`Modal` em `xl`,
  1400px): em coluna o modal rolava inteiro. A coluna da direita (historico) leva `contain: size` e rola
  dentro da altura da coluna esquerda, com esmaecimento e parada de Tab medidos por
  `useIndicadoresRolagem`. Abaixo de 1100px tudo empilha. O registro embutido: abaixo de 480px vira uma
  coluna; quando o botao desce para linha propria (abaixo de 700px), leva `--space-2` de margem alem do
  `gap`, senao parecia colado no ultimo campo.
- **Registro embutido, nunca segundo modal**: dois paineis empilhados disputariam a trava de Tab e o
  Escape. Pelo mesmo motivo "Editar" e "Excluir" fecham o detalhe antes de abrir o painel seguinte.
- **Modal de detalhe le pelo id, nao por retrato** (`detailId` em Metas, `scheduleId` em Parcelamentos,
  cabecalho do `DetalheFaturaDTO` em Faturas): guardar o objeto deixaria o modal com os dados de antes
  da ultima acao.
- **Lista com rolagem propria e valores a direita** (cronograma do `ModalParcelasCompra`, historicos
  dos detalhes de investimento e de meta, categorias do dashboard expandidas): esmaecimento so do lado
  em que ha mais (`data-acima`, `data-abaixo`); a lista so vira parada de Tab quando rola; `overflow-x:
  hidden` (`overflow-y: auto` sozinho liga a rolagem horizontal); a barra de rolagem fica no respiro
  lateral do cartao — a lista avanca `--space-3` + `--scrollbar-size` para a direita e devolve o
  `--space-3` em `padding` (com menos, a barra encostava nos numeros). Os tres modais levam
  `scrollbar-gutter: stable`, para a coluna de valores nao mudar de lugar conforme o numero de itens. A
  folga cabe no respiro de quem contem: abaixo de 600px o cronograma cai para `--space-1`.
  `--scrollbar-size` e a largura do `::-webkit-scrollbar` do `global.css` — mudam juntas. As quatro
  medem pelo `useIndicadoresRolagem`; quem precisa de outra medida na mesma passada (a altura minima do
  `DistribuicaoCategorias`) a passa como segundo argumento. Nao volte a medir a mao.
- **Popover e painel que fecham ao clicar fora usam `useCliqueFora`** (`CampoSelecao`, `SeletorData`,
  `SeletorPeriodo`, `PainelAvisos`, `BuscaGlobal`): recebe as areas que contam como dentro, por ref ou
  por seletor (`'[role="listbox"]'`, porque a lista do `CampoSelecao` vai para um portal). O Escape
  continua em cada componente, porque cada um devolve o foco a um lugar. Lista em portal com posicao
  fixa acompanha o gatilho por `useReposicionarPopover` (rolagem em captura e resize); o calculo da
  posicao fica no componente, porque menu e calendario viram para cima por regras diferentes.

## Acessibilidade

- `LayoutAplicacao` abre com "Pular para o conteúdo" (`.skip-link`), que leva ao `<main id="conteudo">`
  (`tabIndex={-1}`).
- **`Modal` prende o Tab e devolve o foco a quem o abriu.** Quem abriu e lido **no render**, nao em
  efeito (depois o `autoFocus` ja moveu o foco). O foco so volta quando o painel saiu do DOM (o
  `StrictMode` ensaia desmontar). **Se quem abriu ja nao existe, o foco vai ao `<main>`** com
  `preventScroll` — caso do "Novo lançamento" do header, que some em `/lancamentos`.
- **Quem abriu pode sumir depois**: `devolverFoco` (`utils/foco.ts`) vigia com um `MutationObserver` —
  elemento removido leva o foco ao `<main>`, elemento reinserido o recebe de volta. A vigia termina
  quando o foco vai a outro lugar, no primeiro clique ou em `ESPERA_MAXIMA_RETORNO_FOCO_MS` (cobre os
  15 s do `clienteHttp`).
- **O drawer do menu se comporta como o `Modal`**: foco em "Fechar menu", Tab preso
  (`manterTabDentro`), retorno a quem abriu — lido no efeito, porque nada no drawer tem `autoFocus` — e
  so se o foco ainda estiver no drawer ou no `body`. O `LayoutAplicacao` fecha o drawer ao sair da faixa
  de tablet.
- Formulario marca obrigatorio no rotulo e, ao reprovar, leva o foco ao primeiro
  `[aria-invalid="true"]`.
- Controle que some ao ser clicado leva o foco a um destino explicito (controle seguinte da mesma
  linha, busca, titulo do painel) — nunca deixa cair no `body`.

## Formularios

**Todo campo de dinheiro e `CampoValor`**, nunca `CampoTexto` com prefixo. **Os dois ultimos digitos
sao os centavos**: digita-se so numero, e "1", "150", "155083" viram "0,01", "1,50", "1.550,83" a cada
tecla. Virgula, ponto e letra sao ignorados; teclado `inputMode="numeric"`, exceto o saldo da conta
(`permitirNegativo`), em `decimal` para o hifen alternar o sinal.

- O estado continua a string formatada ("1.550,83" ou vazia), lida por `interpretarEntradaValor` como
  reais — o numero que a API recebe. Nao troque o estado por centavos inteiros sem mudar os onze
  formularios e o contrato juntos.
- A edicao e a funcao pura `editarEntradaMonetaria` (`utils/mascaraValor.ts`): recebe texto anterior,
  texto bruto, cursor e `inputType`. A formatacao ancora na direita e o cursor e reposto pelos digitos a
  sua direita. Apagar um separador apaga o digito vizinho (Backspace o anterior, Delete o seguinte), pelo
  `inputType` no `onChange` — no Android o `keydown` chega como "Unidentified". Zero digitado mostra
  "0,00"; zero por exclusao esvazia. Limite: 14 digitos (`DIGITOS_MAXIMOS_ENTRADA_VALOR`, o
  `NUMERIC(14,2)`), e a tecla excedente e recusada. Colar com o campo vazio ou todo selecionado cola o
  valor ("R$ 1.500,50", "1500.50", "1,500.50"; `centavosDoValorColado`); no meio, so os digitos.
- Inteiro (dia, ultimos digitos) passa por `apenasDigitos`.
- **Sugestao recente do navegador pinta a moldura inteira.** O Chrome pinta `:autofill` so no
  `<input>`, e a moldura `.control` tem respiro lateral, entao o campo ficava azul so no meio.
  `Campo.module.css` segura o fundo do `<input>` transparente (transicao de 600000s, porque o
  navegador aplica a cor com `!important`) e pinta a `.control` de `--accent-soft` por `:has()`, com
  as regras de `:-webkit-autofill` e `:autofill` separadas (seletor desconhecido derruba a lista). Vale
  para `CampoTexto`, `CampoValor` e `AreaTexto`. Campo com lista propria (`BuscaGlobal`) leva
  `autoComplete="off"`, senao abria um segundo menu por cima do nosso.

**Validacao: `useValidacaoFormulario`**, com as regras de `utils/validacao.ts` (`erroTexto`,
`erroValor`) e os limites de `constants/validacao.ts`.

- Os limites sao os do banco: `limitesTexto` repete os VARCHAR, e `DIGITOS_INTEIROS_MAXIMOS_VALOR` e
  `CASAS_DECIMAIS_MAXIMAS_VALOR`, o `NUMERIC(14,2)`. Campo novo com limite entra nas tres camadas no
  mesmo trabalho. Excecao: `limitesTexto.observacoes` (500) e regra de produto sobre coluna `TEXT`.
- Quando o erro aparece: nada durante a primeira digitacao; ao sair de um campo preenchido e invalido,
  aparece; dali em diante acompanha cada tecla. Obrigatorio vazio so e cobrado no envio. Passar do
  limite de caracteres acusa na hora.
- Os erros sao recalculados dos valores a cada render; o hook guarda so quais campos podem mostrar o
  seu. Depois de um envio que nao fecha o formulario (registro de preco da meta), chame `reiniciar()`.
- Texto livre nao usa `maxLength` (corta texto colado sem avisar): o `CampoTexto` recebe
  `limiteCaracteres` e mostra contador a partir de 80%. `maxLength` so em formato fixo.
- Dinheiro nao passa pelo `Number` cru (aceitaria "1e5" e "0x10"); "12abc" diz "precisa ser um
  número", nunca "informe o valor".

## Header, periodo e busca

- **O header tem miolo com a caixa do conteudo**: a faixa vai de ponta a ponta, mas os controles ficam
  num `.inner` com o mesmo `max-width: var(--content-max)`, `margin-inline: auto` e `padding-inline` do
  `.container` do `LayoutAplicacao`. Barra fixa nova repete o arranjo.
- **Sidebar e area principal dividem as mesmas linhas.** A marca da sidebar tem a altura do header mais
  1px de borda, e anula o `padding-inline` da sidebar com margem negativa, para as duas bordas formarem
  uma linha so. O centro do primeiro item do menu coincide com o centro do titulo da tela: o
  `padding-top` do `.nav` sai de `--content-padding-top`, `--page-title-line` e `--nav-item-height`, e o
  respiro do conteudo le `--content-padding-top` — nada de valor solto. O item usa `--nav-item-height`
  como altura minima (o `max()` do token cede ao `--tap-size` no toque).
- **O hover do menu e uma pilula**: fundo num `::before` que cresce de 96% a 100% com `--ease-spring`,
  icone e rotulo deslizam 2px; recolhido, o icone cresce 10%. O subitem desliza so o texto (num `span`).
  O ativo usa a mesma pilula em `--accent-soft`. O botao de recolher divide os seletores. Sob movimento
  reduzido so a cor muda.
- **Ordem do header**: busca, sino, tema e "Novo lançamento".
- **Periodo do dashboard** (`SeletorPeriodo`, so no dashboard): setas para um mes de cada vez,
  deslocando a janela inteira; o painel guarda os atalhos ("Últimos 3 meses", "Este ano") e o intervalo
  proprio com dois `CampoSelecao` de mes. As setas param no mes corrente e no mes mais antigo de
  `MESES_PERIODO_PERSONALIZADO`, encostando na borda em vez de passar, com `aria-disabled` (nao
  `disabled`, que tiraria o foco). O periodo vive no `ProvedorPeriodo` (`usePeriodo`), em memoria, e nao
  vai para a URL; recarregar volta ao mes corrente. Se um dia precisar sobreviver ao reload, o caminho e
  `localStorage` com `prisma:*`.
- **Rotulo segue o recorte**: fora do mes corrente, "Saldo atual" vira "Saldo no fim de agosto de
  2026"; num intervalo, "Receitas do mês" vira "Receitas do período" e a variacao e "em relação ao
  período anterior" (janela de mesmo tamanho imediatamente anterior). Os componentes recebem o
  substantivo (`substantivoPeriodo`) e o texto pronto por prop.
- **O header cede o que a tela ja tem** (`pageOwnsControls` no `Cabecalho`): em Lancamentos somem a
  busca global e "Novo lançamento", e a tela renderiza a propria busca no `EspacoCabecalho` por portal
  (o estado continua da tela). Abaixo de 900px o campo volta para a tela. Ceder so vale com substituto.
- **Busca global** (`BuscaGlobal`): procura em lancamentos, categorias e contas; lancamento abre
  `?editar=<id>`, categoria `?categoria=<id>`, conta `?conta=<id>`, e a ultima linha `?busca=<termo>`,
  todos em `/lancamentos`. Ignora acento (`normalizarBusca`). Categorias e origens vem do `useCatalogo`
  (ver abaixo), ativado no primeiro foco. Lancamentos vao ao servidor com `?busca=` e `tamanho` igual ao
  limite de sugestoes (5), com `ESPERA_ENTRE_TECLAS_MS` (250 ms, `constants/aplicacao.ts`) entre teclas.
  Chegar pela busca reseta os filtros da tela antes de aplicar o da URL.
- **Catalogo em cache** (`hooks/useCatalogo.ts`): categorias e origens (contas e cartoes) ficam em
  memoria para a sessao, divididas por Lancamentos, Recorrentes, Compras parceladas, Orcamento
  (`useCategoriasDoTipo('DESPESA')`) e busca global. Categorias carregam uma vez, porque o app nao as
  edita; origens recarregam quando a versao de `origensAlteradas` muda — `contaService` e
  `cartaoService` chamam `origensAlteradas.marcar` ao criar, editar e excluir. Gravacao nova que mude
  `/contas/origens` passa pelo mesmo `marcar`. Pedido que falha sai do cache, para a proxima tela tentar
  de novo.

## Dashboard

- **O card de fatura passa para a seguinte quando a do mes ja esta paga.** No mes corrente, com a
  fatura que fecha no mes `PAGA`, o servidor devolve a do mes seguinte (`FaturaDTO.mes`), e o rotulo
  vira "Fatura de Dezembro de 2026" em vez de "Fatura do mês". Mes passado e fatura aberta quitada
  ("Paga até agora") continuam no proprio mes. Pedido do usuario depois de ver "R$ 0,00 — Vence em 5
  de Dezembro" com a fatura de novembro paga.
- **A janela dos graficos nao e sempre o periodo**: mes unico desenha os cinco anteriores como contexto;
  periodo de varios meses e a propria janela. Vale tambem para o `CalendarioGastos`.
- **O patrimonio fica no painel de saldo, abaixo da variacao** (`DashboardDTO.patrimonio`, saldo do
  total mais a carteira, com `variacaoPatrimonio`). E estoque, nao fluxo: faixa propria em
  `--surface-muted`, "Saldo somado aos investimentos", variacao sem legenda, rotulo e valor na mesma
  linha (`flex-shrink: 0` no valor).
- **A linha do painel de saldo termina onde os numeros terminam**: o `AreaChart` nao tem margem
  lateral, o primeiro e o ultimo mes ancoram pela borda (`RotuloMesNaBorda`) e a superficie tem
  `overflow: visible` para o ponto ativo nao ser cortado.
- **"Entradas e saídas" ocupa a altura da linha, e "Gastos por categoria" nao a estica.** O
  `ResponsiveContainer` fica num `.chartArea` absoluto dentro de um corpo com `min-height: 260px`. O
  `DistribuicaoCategorias` recebe `manterAlturaAoExpandir`: "Ver mais" guarda a altura recolhida, a
  lista rola dentro dela (padrao de lista com rolagem) e rola ate a sexta categoria. Abaixo de 1200px,
  empilhados, a lista volta a crescer.

## Lancamentos e saldo

Regras aplicadas pelo PrismaAPI; o frontend apresenta.

- **O saldo total so conta o que e do total.** Receita e despesa em conta fora de `incluirNoTotal` nao
  mexem nele, nem despesa em vale; transferencia so pesa quando cruza a fronteira do total. **Compra e
  parcela no cartao de credito so saem da conta quando sao pagas**: ate hoje o saldo so muda pelo
  pagamento da fatura ou da parcela, que debita a conta de pagamento do cartao; depois de hoje a
  projecao desconta a compra na data dela e a parcela no vencimento. Dashboard, relatorios e previsao
  contam igual.
- **Gravar um lancamento mexe no saldo da conta**: `ContaDTO.saldo` e o de hoje, e o servidor aplica,
  desfaz e reaplica o efeito de todo lancamento `PAGO` ao criar, editar e excluir. `PENDENTE` e
  `AGENDADO` nao mexem.
- **Variacao e saldo passado**: o resumo compara com a janela anterior de mesmo tamanho, e o saldo de
  um mes passado e reconstruido a partir do de hoje.
- O contrato de escrita e `SalvarLancamentoDTO`: o cliente manda ids (`idOrigem`, `idCategoria`,
  `idContaDestino`) e o servidor resolve nomes. Erro de regra chega como `ErroApi`, com a mensagem do
  servidor no toast.
- **Transferencia nao e receita nem despesa**: `categoria: null`, `idContaDestino`, fora do
  `resultado` da `PaginaLancamentosDTO` e de `gastoPorCategoria`. A tela de Transferencias esconde coluna e filtro de categoria.
- **A forma de pagamento sai da origem**: origem em cartao esconde "Forma de pagamento" e envia
  `CARTAO_CREDITO`; origem em conta nao oferece cartao. O PrismaAPI recusa com `422` essa combinacao,
  categoria do lado errado, origem em cartao de debito e `PAGO` com data futura. Data futura com
  "Concluído" troca na hora para "Agendado".
- **Na receita, "Situação" divide a linha com Valor e Data** (grade de seis colunas, `.trio`, em
  tercos), porque sobrava sozinha. A despesa no cartao nao usa o arranjo: la Situação so aparece depois
  de escolher o cartao, e subir o campo reorganizaria o formulario sob quem preenche.
- **A tela pede ao servidor uma pagina de 25 por vez** (`TAMANHO_PAGINA_LANCAMENTOS`), nas quatro rotas
  de lancamento, pedido do usuario: quase ninguem passa da primeira pagina, mais gente filtra. `GET
  /lancamentos` recebe `pagina` (a partir de 0), `tamanho` (1 a 100), `ordenacao` (`DATA`, `DESCRICAO`,
  `VALOR`) e `direcao` (`ASC`, `DESC`), alem dos filtros, e devolve `PaginaLancamentosDTO`: `itens`,
  `pagina`, `tamanho`, `quantidadeTotal`, `quantidadePaginas` e `resultado` (receitas menos despesas do
  filtro inteiro). O contador "279 lançamentos" e o "Resultado do período" saem dai, e nao da pagina.
- **Busca, periodo, tipo, categoria, conta, situacao e ordenacao vao para o servidor.**
  `paraFiltroDoServidor` (`components/lancamento/consulta.ts`, testada) traduz o estado da tela: o tipo
  da rota vale mais que o filtro de tipo, o atalho de periodo vira datas e o vazio nao vai. A busca
  espera `ESPERA_ENTRE_TECLAS_MS` entre teclas, mas limpar vale na hora; o servidor procura em
  descricao, observacao, categoria e contas, sem acento. A ordenacao da tabela e dos cartoes usa os
  enums da API (`OrdenacaoLancamento`, `DirecaoOrdenacao`).
- **Mudar filtro, busca ou ordenacao volta para a pagina 1**: a pagina e guardada junto da chave do
  filtro, e chave diferente le pagina 0. Salvar ou excluir recarrega a mesma pagina; se ela ficar vazia
  (excluiu o ultimo item da ultima), volta para a ultima que existe.
- **Paginas numeradas** (`components/ui/Paginacao`, escolha do usuario): "1–25 de 279" e, a direita,
  anterior, numeros com reticencias (`paginasVisiveis`, `utils/paginacao.ts`: primeira, ultima e as
  vizinhas da atual, sempre com a mesma quantidade de itens) e proxima; abaixo de 600px os numeros dao
  lugar a "Página 2 de 12". Setas nas pontas com `aria-disabled`, pagina atual com `aria-current`,
  resumo em `aria-live`. Trocar de pagina mostra o esqueleto na altura da lista anterior, rola ate o topo
  da lista (`scroll-margin-top` abaixo do header) e leva o foco a ela. Filtrar so esmaece
  (`.refreshing`).
- **Filtros de categoria e conta saem do catalogo** (`useCatalogo`), e nao dos lancamentos carregados:
  com 25 na tela, a lista de opcoes ficaria incompleta. Categorias seguem o tipo da tela. Origem
  inativa nao aparece no filtro (o catalogo so traz as ativas).
- **`?editar=<id>` busca pelo id** (`GET /lancamentos/{id}`, `lancamentoService.buscar`) quando o
  lancamento nao esta na pagina carregada.
- **Lancamento gerado nao se edita nem exclui** (`ehLancamentoGerado`; `PUT`/`DELETE` respondem `409`):
  - despesa de pagamento de parcela traz `LancamentoDTO.parcela` (`idCompra`, `numero`, `total`), nota
    "Gerada pelo pagamento da parcela" (`NOTA_PAGAMENTO_PARCELA`) e leva a
    `/parcelamentos?compra=<id>`, onde o pagamento se desfaz;
  - transferencia de aporte ou resgate traz `LancamentoDTO.investimento` (`idInvestimento`, `tipo`),
    nota "Gerada pelo aporte no investimento"/"Gerada pelo resgate do investimento"
    (`notaLancamentoGerado`) e leva a `/investimentos?investimento=<id>`. No resgate o `idOrigem` e o
    id do investimento.
  - Lapis e lixeira dao lugar ao botao que abre a origem; `?editar=<id>` da busca cai no mesmo
    `openEdit`.
  - Ja o lancamento de recorrente (`LancamentoDTO.recorrente`, nota "Recorrente — Mensal") continua
    editavel e excluivel (ver Recorrentes).

## Contas, cartoes, faturas e parcelamentos

Telas `/contas`, `/cartoes`, `/faturas` e `/parcelamentos`, no grupo "Contas e cartões". Contas e
cartoes sao cadastro; faturas e parcelamentos sao leitura calculada, exceto o cadastro da compra.

**Contas e cartoes**

- Contas so tem dinheiro do dia a dia (`CORRENTE`, `SALARIO`, `OUTRA`), sem secoes. Dinheiro guardado e
  investimento (ver Investimentos).
- **Um cadastro so para os quatro tipos de cartao.** `CartaoDTO` tem campos especificos opcionais:
  credito tem limite e datas de fatura, debito aponta a conta, vales tem saldo proprio. Campos de
  credito passam por `ehCartaoCredito` (`constants/cartao/cartao.ts`), que estreita o tipo — nunca
  `card.limiteCredito!`. O formulario so envia os campos do tipo escolhido.
- **Excluir nao apaga historico.** Conta ou cartao com lancamentos, recorrentes ou compra parcelada
  devolve `409` sugerindo inativar; conta vinculada a cartao de debito tambem. Inativo sai do saldo
  total e dos seletores, mas o passado continua legivel: `listarOrigens()` filtra por `situacao`, e
  `buscarOrigem(id)` busca em tudo. `listarOrigens()` e funcao, para conta nova aparecer sem recarregar;
  o cartao de debito fica fora dela (a conta ja esta la).
- **A barra de limite usa as faixas de `constants/cartao/cartao.ts`** (ambar a partir de 70%, vermelha a
  partir de 90%), independentes do percentual do aviso escolhido em Configuracoes — a barra descreve o
  cartao; o aviso, o que o usuario quer ser interrompido para saber.
- **`limiteComprometido` nao e gravado**: e a soma das faturas nao pagas, inclusive futuras.

**Faturas**

- **Fatura e derivada**, das despesas no cartao e das parcelas. O ciclo vai do fechamento anterior
  (exclusivo) ate o deste mes (inclusivo); o vencimento cai no mes seguinte quando o dia de vencimento e
  anterior ou igual ao de fechamento. **A fatura leva o nome do mes em que fecha**: num cartao que fecha
  dia 13, depois de 13 de setembro a compra entra na fatura de outubro, que e a "Fatura atual".
- **Quatro blocos**: "A pagar" (ciclo fechado), "Fatura atual" (em andamento), "Próximas faturas" e
  "Faturas anteriores". `VENCIDA` fica em "A pagar" so dentro de `DIAS_HORIZONTE_AVISOS` (15 dias,
  `constants/aviso/aviso.ts`) e depois passa para anteriores com selo neutro (`tomDaFatura`): sem registro de
  pagamento, e tratada como paga.
- **Fatura aberta quitada diz "Paga até agora" e nao sai de "Fatura atual"** — ainda recebe compras. O
  selo sai de `rotuloDaFatura`/`tomDaFatura` (`components/fatura/aparencia.ts`), tambem para a futura
  quitada; a situacao do contrato continua `ABERTA`. So depois do fechamento vira `PAGA` e muda de bloco.
- **`total` e o tamanho; `valorRestante` e o que se deve.** Destaque, linha e modal mostram o total e,
  com parcela paga, "já pago" e "falta". Somas de "quanto vou pagar" usam `valorRestante`: "A pagar
  agora", "Ciclo em aberto", "Já comprometido", "Faturas atuais", "Fatura atual" de Cartoes e o tile do
  dashboard.
- **Fechamento vem antes de vencimento, em toda tela** (destaque, linhas, modal, `BlocoCartao`). As
  linhas de proximas e anteriores escrevem as datas por extenso. Abaixo de 900px o valor sobe para o
  lado do mes e o selo fica ao lado das datas; abaixo de 600px "Fecha" e "Vence" ocupam duas linhas.
- As janelas de meses de "Próximas faturas" e "Faturas anteriores" ficam no cabecalho de cada bloco, e
  o total ao lado do titulo soma o que esta a vista. Faturas futuras e antigas sao linhas, que viram
  duas abaixo de 900px.
- **O servidor recebe so o recorte do passado** (`filtroFaturasDesde`, `constants/fatura`): trocar a
  janela de "Faturas anteriores" pede `GET /faturas?dataInicial=` de novo, com `.refreshing`; o futuro
  vem sempre inteiro, porque "Já comprometido" soma todas as futuras. Cartoes pede so a fatura atual
  (`filtroFaturasAtuais`: do mes passado ao seguinte, onde sempre caem a `ABERTA` e a `FECHADA`). As duas
  telas pedem cartoes e contas em separado das faturas, para gravar um cartao ou trocar a janela nao
  repetir o que nao mudou. O corte em memoria continua: uma API sem o recorte ignora os parametros, e as
  telas funcionam igual. O seletor de cartao so some na primeira carga.

**Compras parceladas**

- **Parcelas nao sao lancamentos**: vivem em `comprasParceladas` e entram nas faturas pelo calculo. As
  primeiras levam o valor arredondado para baixo e a ultima absorve a sobra.
- **Uma parcela e compra a vista** (`quantidadesParcelas` comeca em 1, e `rotuloQuantidadeParcelas`
  escreve "À vista (1x)", em `constants/compraparcelada`): o formulario comeca em "À vista (1x)", o
  cartao e o mesmo com o selo "À vista" e textos no singular. Entra em "Falta pagar" e na fatura.
- **"Falta pagar"** soma todas as parcelas por vencer; **"Fatura de Dezembro"** soma, de todas as
  compras (a vista ou parceladas), as parcelas nao pagas do mes mais antigo que ainda tem parcela em
  aberto. Ficam lado a lado, com dica. O rotulo so leva o ano fora do ano corrente: "Fatura de Novembro
  de 2026" quebrava em duas linhas a 390px e descia o valor abaixo do de "Falta pagar". O mes segue o
  card de fatura do dashboard: paga a fatura (ou vencidas as parcelas), passa sozinho para a seguinte,
  e o numero so difere do card por despesa lancada direto no cartao. Nao volte ao "Total mensal em parcelas" pela `parcelaAtual` de cada compra:
  deixava a compra a vista de fora (R$ 223,71 a menos que a fatura, apontado pelo usuario) e, entre
  fechamento e vencimento, misturava parcelas de dois meses.
- **Hierarquia do progresso**: "Parcela 3 de 10" em destaque, "8 restantes" num selo de acento e
  "2 pagas — Última parcela em Abr/2027" menor.
- **Todo cartao de compra tem a mesma altura**: `grid-auto-rows: 1fr` sem `align-items: start`, valores
  e "Ver as N parcelas" ancorados na base (`margin-top: auto` em `.facts`); o quitado tem as mesmas duas
  linhas ("8 de 8 parcelas pagas" e "Quitada em Mar/2026"). Com uma coluna (container query na
  `.section`, abaixo de 856px) cada cartao volta a sua altura.
- **A lista nao tem titulo visivel nem contagem fixa**: a `BarraResumo` ja diz quantas compras ha; o
  `h2` "Compras" fica escondido para leitor de tela. A busca ("Buscar nas compras") procura em
  descricao, categoria e cartao. Ordenar por parcelas restantes deixa as quitadas sempre no fim.
- **O cronograma abre num modal** (`ModalParcelasCompra`, por "Ver as N parcelas"), com pago, falta,
  total, barra e uma linha por parcela. Nao reintroduza a expansao do cartao (abria buraco na grade).
  A lista tem `max-height: min(19.5rem, 42dvh)` e rolagem propria; ao abrir ja vem rolada ate a
  parcela atual, com uma paga acima — so na abertura.
- **A barra de parcelas enche, e nao troca de cor**: cada segmento do `BarraProgresso` tem um
  preenchimento (`::after`) que corre em `--duration-slow` com `--ease-out` e, ao chegar, da um pulso
  com halo (`chegada`). Ao desfazer esvazia mais rapido e sem pulso. O componente guarda a troca em
  estado (`change`): so os segmentos dela pulsam, em cascata (`--ordem`); a barra que nasce cheia nao
  anima. Sob movimento reduzido, sem animacao.

**Pagamento antecipado**

- **Parcela pode ser marcada como paga antes de vencer** (`POST`/`DELETE
  /compras-parceladas/{id}/parcelas/{numero}/pagamento`, sem corpo, data de hoje, em `parcelas_pagas`).
  Ela continua na fatura do mes, mas sai de `valorRestante`, do limite comprometido, do aviso e da
  previsao; no saldo pesa na data do pagamento. Parcela vencida ja e paga pela data (`409`).
  `pagamentoAntecipado` (em `ParcelaDTO` e `ParcelaItemFaturaDTO`) diz o que pode ser desfeito: so a
  paga a mao que nao venceu mostra "Desfazer". Reduzir parcelas ao editar apaga as marcas excedentes.
- **`ControlePagamentoParcela` e `usePagamentoParcela`** servem o modal de parcelas (versao discreta em
  texto de acento) e o modal da fatura (botao com borda). **O cartao da compra nao tem botao de
  pagamento** — o atalho foi entregue e removido a pedido do usuario. A espera do hook termina quando o
  dado novo chega, nao quando a requisicao volta (evita `POST` repetido); o foco vai para o controle
  novo da mesma linha, so se estiver solto.
- **A fatura inteira pode ser paga, so de dentro do modal** ("Já paguei esta fatura" no rodape do
  `ModalDetalheFatura`). `POST /faturas/{id}/pagamento` marca **os itens que a fatura tem naquele
  momento** — parcelas em aberto em `parcelas_pagas`, compras comuns numa data no lancamento. Compra que
  entrar depois volta a contar. Por isso pagar a fatura aparece nas Compras parceladas sem regra extra.
- **"Desfazer pagamento" limpa a fatura toda**, inclusive parcelas marcadas uma a uma. Aparece com a
  fatura quitada ou com compra comum paga (`ItemFaturaDTO.paga`, sem "Desfazer" proprio).
- **Pagar debita a conta de pagamento do cartao** (`CartaoDTO.idConta`, "Conta de pagamento", o mesmo
  campo da conta vinculada no debito, mostrado no `BlocoCartao`). Sem ela o servidor responde `409`.
  Cada parcela paga gera uma despesa `PAGO` nessa conta, com a categoria da compra e a descricao seguida
  de `(n/total)` — a que aparece em Lancamentos, no dashboard e no orcamento. Compra lancada direto no
  cartao nao gera outra despesa.

## Investimentos

Tela `/investimentos`, sob "Patrimônio". Cadastro, movimentacoes (aporte, resgate, saldo) e leitura
calculada.

- **Reserva, poupanca e previdencia sao investimentos, nao contas.** Ate a PRM-49 Contas tinha
  `EMERGENCIA`, `POUPANCA` e `PREVIDENCIA` e a previdencia era contada duas vezes. Sairam `CartaoReserva`,
  `ModalDetalheConta`, `EvolucaoContaDTO`, `/contas/reservas` e `/contas/{id}/evolucao`. Nao reintroduza
  tipo de conta para dinheiro guardado.
- **A reserva de emergencia e uma marca, nao uma classe** (`reservaEmergencia`, "Faz parte da reserva de
  emergência"): e finalidade, nao produto. "Reserva de emergência" na `BarraResumo` soma os marcados
  (`CarteiraDTO.reserva`), e o cartao leva o selo "Reserva".
- **Aqui nao se diz "patrimônio"** (esse e o do dashboard, contas mais investimentos): "Valor atual",
  "Evolução da carteira", "Carteira" no miolo, "na carteira" no cartao.
- **Aporte, resgate e rendimento nao se misturam.** `APORTE` soma saldo e aportado; `RESGATE` tira dos
  dois **na mesma proporcao** (a rentabilidade nao muda); `RENDIMENTO` registra o saldo informado, e o
  valor e a diferenca para o anterior. `aportado`, `valorAtual`, `dataInicio` e `dataAtualizacao` sao
  leitura da serie, nunca gravados. Resgate nao passa do saldo (`422`). A data minima do registro e a
  ultima atualizacao; na mesma data vale a `ordem` de gravacao.
- **Aporte e resgate podem mexer numa conta, opcionalmente.** "Saiu de qual conta?"/"Voltou para qual
  conta?" comecam em "Nenhuma — Fora do Prisma"; com conta, o servidor grava transferencia paga. No
  cadastro o padrao e "Nenhuma — Já estava investido". Opcoes de `opcoesContaMovimentacao` (contas
  ativas, "nome — instituição"), carregadas uma vez pela `PaginaInvestimentos`. Excluir o investimento
  apaga as transferencias e devolve o saldo, e o dialogo diz isso.
- **Editar nao mexe em valor** (`AtualizarInvestimentoDTO`). O cadastro grava aplicacao inicial e saldo
  de hoje; dali em diante valor so muda pelo detalhe.
- **Formulario horizontal a partir de 1100px**: `Modal` em `lgPlus` (1080px), grade de quatro colunas —
  nome em duas, quarta em `1.25fr` (para "Nenhuma — Já estava investido" nao cortar), reserva comecando
  a linha (`.rowStart`), Observação nas duas colunas da direita por duas linhas (`.note`) e a previa
  embaixo do interruptor. O cadastro de acao cabe sem rolagem em 1920x935. Abaixo de 1100px, duas
  colunas; abaixo de 600px, uma.
- **O detalhe e onde o investimento vive** (`ModalDetalheInvestimento`). Clicar no cartao abre em
  "Atualizar saldo"; o botao "Aporte" abre em "Aportar" com foco no valor. Seletor de tres estados
  ("Aportar", "Resgatar", "Atualizar saldo" — curtos para nao quebrar a 390px). Com conta, campos em tres
  colunas e a descricao na segunda linha com o botao. A previa diz para quanto vao saldo e aportado.
  Layout horizontal (padrao compartilhado): saldo, rendimento e os quatro numeros numa faixa no topo;
  grafico e registro a esquerda, historico a direita em `minmax(340px, 0.48fr)`.
- **Registrar no detalhe nao pisca: o registro voa ate o historico.** O corpo do modal nao usa
  `.refreshing` (o recuo a 55% era lido como o modal fechando e abrindo). O botao segura o carregamento
  ate o extrato novo chegar, sem `disabled` (o foco nao cai no `body`), e o formulario so limpa nessa
  hora. Na chegada, as movimentacoes de id novo viram `ChegadaMovimentacao` do `HistoricoMovimentacoes`:
  a linha abre espaco (`grid-template-rows`), uma replica dela (`VooMovimentacao`, portal com
  `requestAnimationFrame`, que segue a linha a cada quadro) sai do botao em arco e pousa exatamente
  sobre ela em `DURACAO_VOO_MOVIMENTACAO_MS`, e a linha aparece com destaque em `--accent-soft` que se
  apaga. O historico rola ao topo e, empilhado, o modal rola ate ele. O `GraficoEvolucao` transiciona
  em 800 ms e pulsa o ultimo ponto (`pulsoNoUltimo`), com a superficie em `overflow: visible`. Sob
  movimento reduzido nao ha voo nem pulso.
- **Onze classes de ativo** (`ClasseAtivo`), cada uma com token fixo em `corClasseAtivo`. `RDB` cobre
  caixinhas; `PREVIDENCIA`, PGBL e VGBL; `POUPANCA` usa `--palette-12` e o icone `HandCoins` (o 6 e
  vermelho, lido como perda). As tres tem dica propria (`dicaClasseAtivo`).
- **A curva vem das movimentacoes** (em cada fim de mes, o ultimo saldo conhecido mais os aportes
  posteriores), pronta do servidor. `GraficoEvolucao` desenha valor em area e aportado tracejado.
- **Rosca** (`GraficoAlocacao`): o miolo e uma caixa medida — `--donut-readout` 132px dentro do buraco
  de `--donut-size` 232px com `innerRadius` 70% (raio 81px), meia-diagonal 8px dentro do anel. Mexeu no
  tamanho ou no raio, refaca a conta. A legenda e uma lista ao lado que quebra o nome em duas linhas, e
  sobe para cima abaixo de 900px. **A legenda e de botoes**: hover ou Tab mostra a classe no miolo;
  clique fixa (`aria-pressed`), e a previa tem precedencia sobre a fixada. Em `pointer: coarse` o item
  cresce ate `--tap-size`. A fatia nao tem contorno de foco nem e parada de Tab (`rootTabIndex={-1}`,
  `outline` removido em fatia, superficie e wrapper). A troca do miolo tem entrada curta
  (`entradaMiolo`, `key` pela classe).
- **Os dois graficos da linha casam topo e base**: `.charts` sem `align-items: start`, painel da rosca
  sem `align-self: start`.

**Acoes por quantidade** (PRM-54; ETF, FII e cripto continuam por valor ate o usuario pedir)

- Uma acao tem `codigo` (obrigatorio, maiusculas), `quantidade` inteira, `precoMedio` e `cotacao`; o
  saldo e quantidade x cotacao. Cadastro por `POST /investimentos/acoes` (`SalvarAcaoDTO`: quantidade,
  preco, taxas e cotacao opcionais); `POST /investimentos` recusa acao com `422`. O modo e decidido por
  `ehAcaoPorQuantidade`, que estreita o tipo.
- O seletor do detalhe vira "Comprar | Vender | Atualizar cotação" (`/compras`, `/vendas`,
  `/cotacoes`), sem tipo novo: compra e `APORTE` com `quantidade`, `precoUnitario` e `taxas`; venda e
  `RESGATE`; cotacao e `RENDIMENTO` com preco. Compra soma quantidade x preco + taxas; venda tira do
  aportado o preco medio das vendidas e recebe quantidade x preco - taxas; o preco da operacao vira a
  cotacao. Previas por `calculoAcoes`. Venda nao passa da quantidade, taxas nao passam do valor. Os
  sete campos cabem em duas linhas (`registerFieldsTrade`, quatro colunas).
- Acao antiga cadastrada por valor mantem Aportar/Resgatar/Atualizar saldo, com aviso "Informar
  quantidade"; a edicao pede codigo e "Quantas ações você tem" e o servidor grava "Posição informada"
  (`RENDIMENTO` com quantidade). Acao nao troca de classe (`422`): o seletor trava.
- O cartao mostra "PETR4 — Petrobras" (`nomeDoInvestimento`, tambem no modal e nos toasts), "100
  ações — Preço médio R$ 32,55" e o botao "Comprar".

## Orcamento, recorrentes e previsao

Telas sob "Planejamento": `/planejamento/orcamento`, `/planejamento/recorrentes`,
`/planejamento/previsao`.

**Orcamento**

- **E recorrente e nao tem mes**: `OrcamentoDTO` guarda categoria e limite, valido ate ser alterado; o
  consumo e por mes. Uma categoria tem no maximo um limite (`409`), e o formulario nem oferece as ja
  orcadas.
- **"Gasto fora do orçamento"** existe para a soma dos limites nao ser lida como o gasto do mes.
- **A projecao de ritmo tem piso** (`DIAS_MINIMOS_PROJECAO_ORCAMENTO`, dez dias); antes disso nao
  projeta. As faixas da barra e do selo ficam juntas em `constants/orcamento/orcamento.ts`.
- **Navega por mes com setas** (`NavegadorMes`), com rotulo de largura fixa.

**Recorrentes**

- **Um cadastro so, de receita ou despesa** (`RecorrenteDTO.tipo`, `TipoRecorrente`, rota
  `/recorrentes`). A tela se chama "Recorrentes", com secoes "Receitas" e "Despesas"; a `BarraResumo`
  traz "Entradas por mês" (`ResumoRecorrentesDTO.receitaMensal`). "Custo mensal", "Próximo vencimento",
  vencimentos proximos, aviso e previsao sao so de despesas (a previsao projeta receita pela media). No
  formulario novo, seletor Despesa/Receita no topo (`radiogroup`); ao editar, o tipo vai no titulo.
  Receita so entra em conta ou vale; o servidor recusa o lado errado com `422`. O cartao da receita
  mostra o valor em `positive` e "Chega em N dias" (`formatarRotuloRecebimento`).
- **Recorrencia normaliza para o mes** (`ocorrenciasMensais`: anual / 12, semanal x 4,3452), so para o
  equivalente mensal que o formulario mostra. As ocorrencias da previsao, do aviso e do lancador sao
  contadas no servidor (`Frequencia` do PrismaAPI), e a recorrente mensal guarda o dia de referencia: a
  do dia 31 cai em 28/02 e volta a 31/03.
- **"Lançar automaticamente"** (`lancarAutomaticamente`) faz o servidor gravar em cada data uma receita
  ou despesa `PAGO` real na origem. No cartao de credito ela entra na fatura como qualquer compra, com a
  marca "Recorrente" (`ItemFaturaDTO.idRecorrente`), e nao vai para Compras parceladas. Todo lancamento
  de recorrente traz `LancamentoDTO.recorrente` (`id`, `frequencia`), nota "Recorrente — Mensal" e
  continua editavel. No cadastro novo o interruptor liga sozinho na despesa no cartao de credito e na
  receita com destino, e desliga na despesa em conta, ate o usuario mexer; ligado, a categoria e
  obrigatoria (`422`). O cartao mostra o selo "Lança sozinha".
- **"Repetir" no formulario de lancamento cria a recorrente**: o interruptor abre "Periodicidade"
  (mensal) e manda `SalvarLancamentoDTO.repeticao`; o lancamento vira o primeiro da serie. A dica diz o
  proximo (`proximaOcorrenciaAPartirDeHoje`). Num lancamento que ja e de serie, o interruptor da lugar a
  "Esta receita se repete — Mensal" com link para Recorrentes.
- **Receita pode cair no vale**: receita e despesa `PAGO` num vale movem `CartaoDTO.saldo`. O vale
  continua fora do saldo total, mas entra em receitas e despesas do mes. Lancamentos de vale antigos nao
  foram recalculados. Vale e auxilio usam a categoria "Benefícios" (`--palette-4`, `V2.6` do PrismaAPI).
- **O "Como funciona?" do `Interruptor`** (`explicacao`) e um bloco que abre no lugar, em
  `--surface-muted` (`aria-expanded`), e nao tooltip — que nao existiria no toque nem no teclado. O
  texto muda com a origem.
- **Pausar existe para nao apagar**: a pausada sai do custo e da previsao e volta com um clique, por
  botao proprio no cartao.

**Previsao**

- **Parte do fim deste mes**: o que falta no mes corrente vira "Resto de <mês>" (`restanteMesAtual`,
  marcado "Em andamento"): agendados e pendentes, recorrentes sem lancamento, parcelas ate o fim do mes
  e o variavel proporcional aos dias restantes.
- **O gasto variavel e um resto**: media de despesa dos tres meses fechados menos a media das
  recorrentes no mesmo periodo. Parcelas nao entram no desconto (nunca estiveram na media).
- **Aporte tem coluna propria** (transferencia para conta fora do total); no grafico empilha sobre a
  despesa em outra cor.
- **A tela diz como foi feita**: a nota de metodo mostra as medias da base (`PrevisaoDTO.base`).
- Tabela e lista mobile saem de `linhasPrevisao`; zero aparece como traco.

## Metas e desejos

Tela `/planejamento/metas`, "Metas" na sidebar e "Metas e desejos" no titulo — e planejamento, nao
vitrine.

- **O historico e a tela; o preco atual e so a ultima linha.** Registrar preco nunca sobrescreve
  (`metaService.adicionarPreco`, `POST /metas/{id}/precos`); `AtualizarMetaDTO` mexe em nome, link, imagem,
  situacao e observacao, nunca em preco.
- **A analise e do servidor; a frase e da interface**: `AnaliseMetaDTO.leitura` e um `LeituraMeta`
  (`PRIMEIRO`, `MENOR`, `ABAIXO_DA_MEDIA`, `ACIMA_DA_MEDIA`, `MAIOR`, `ESTAVEL`), com os textos em
  `constants/meta/meta.ts`. O servidor olha primeiro a posicao na faixa (5% de folga nos extremos,
  `FOLGA_DOS_EXTREMOS` do `MetaService`) e so depois a media. Um registro so e "Primeiro registro", nunca "Preço estável"; no lugar da curva entra o
  convite a registrar de novo.
- **Os totais olham so o que esta em acompanhamento**; comprada e cancelada ficam no cadastro pelo
  historico.
- **`VariacaoPreco` e outro componente, nao o `IndicadorVariacao`** (nao unifique): preco que cai e
  verde, e ele sempre escreve "Baixou"/"Subiu" ao lado da seta. O "R$" tem o tamanho dos algarismos —
  unica excecao ao simbolo reduzido, feita no proprio modulo (`.amount > :first-child`). O percentual vai
  num `Selo` no tom da variacao (`tomSeloPreco`). No historico (`separarPercentual`) e na "Variação
  total" da analise (`.pairSeparator`) ha travessao entre valor e percentual, em `--text-subtle`; no
  cartao e no cabecalho do detalhe, nao. A "Variação total" leva a cor da noticia (`tomPreco`) e nao tem
  seta.
- **A variacao diz em relacao a que e**: no cartao e no cabecalho do detalhe e desde o primeiro preco,
  com `legenda={LEGENDA_VARIACAO_TOTAL_META}` ("Desde o primeiro registro") — no cartao numa linha
  propria (`legendaAbaixo`), no modal ao lado do selo depois de travessao (abaixo de 600px desce, sem o
  travessao). No historico e em relacao a linha anterior, sem legenda.
- **Cartao da meta**: preco logo abaixo do titulo e variacao sempre abaixo do preco (lado a lado nao
  cabia em 324px); a sobra de altura vai para baixo da curva (`margin-bottom: auto` em `.spark` e
  `.sparkHint`). A 320px o `.content` leva `min-width: 0` e o rodape quebra (`flex-wrap`, acoes em
  `margin-left: auto`); a partir de 360px fica numa linha. A minicurva e SVG a mao (`MiniCurvaPreco`,
  `currentColor`); o grafico do detalhe e Recharts com a media tracejada e eixo de marcas redondas
  (`eixoRedondo`).
- **No detalhe, a situacao fica ao lado do nome, no titulo do modal** (`seloTitulo` do `Modal`); no
  celular desce para baixo do nome.
- **Detalhe horizontal** (padrao compartilhado) em tres colunas: resumo (`auto`), analise ao lado em 3 x
  2 e, abaixo, frase, grafico e registro a esquerda; a direita (`.aside`, `contain: size`), historico,
  "Abrir a página do produto", botoes de situacao e a observacao num bloco com borda e rotulo "Sua
  observação" (sem rotulo, foi lida como texto do sistema; borda e nao fundo, que e a voz do produto). A
  ordem do HTML continua a do celular. Na coluna, a observacao de cada preco desce para baixo do valor
  (`display: contents`). Abaixo de 700px a linha do historico vira grade de duas colunas (data e preco;
  variacao embaixo do preco; observacao por ultimo). O registro reage a propria largura (`@container`):
  abaixo de 640px Observação e "Registrar" descem.
- A busca tem 220px e diz "Buscar nas metas"; Metas nao entra em `pageOwnsControls`.
- **Nao ha scraping nem atualizacao automatica de preco**; o link do produto abre numa aba nova.

## Relatorios

Tela `/relatorios`, recorte em `SeletorPeriodoRelatorio`.

- **Relatorio se pede por dia** (`PeriodoRelatorio`, duas datas ISO), e todo atalho termina hoje.
- **Os seis recortes ficam a vista como botoes**; abaixo de 900px viram `CampoSelecao`. As datas
  proprias so aparecem com "Personalizado".
- **O agrupamento segue a duracao** (`constants/relatorio/relatorio.ts`): por dia ate dez dias, por semana ate
  quarenta e cinco, por mes acima.
- **A evolucao do patrimonio e empilhada em conta e investimento.**
- **Cada origem de "Gastos por conta e cartão" tem uma cor** (barra e icone), por `coresDasOrigens`: um
  hash de grupo e id escolhe em `TOKENS_COR_ORIGEM` (oito matizes, sem vermelho nem cinzas), com colisao
  indo para o proximo token livre.
- **Ordem dos blocos por pergunta**: resumo; "Receitas e despesas" em largura total; a composicao, com
  "Gastos por categoria" a esquerda e, a direita, uma coluna com "Receitas por categoria" e "Gastos por
  conta e cartão" (`.column > * { align-self: stretch }`); por ultimo "Evolução do saldo" e "Evolução do
  patrimônio" lado a lado.
- **Os dois lados da composicao terminam na mesma linha**: a `.split` estica as celulas e as duas listas
  de categoria recebem `preencherAltura` — o cartao ocupa a altura que sobra, lista tudo sem "Ver mais"
  e rola por dentro. A moldura tem `contain: size` e um piso: 8rem em receitas e, em gastos, a altura
  medida das seis primeiras linhas (`linhasMinimas`, `--altura-minima-lista`). Abaixo de 1100px,
  empilhados, receitas mostra tudo e gastos volta ao "Ver mais".
- **A variacao fica dentro da `BarraResumo`**, no item a que pertence (`variacao` entre valor e dica).
  Com variacao, a barra fica em duas colunas entre 768 e 1099px e o item ocupa a linha abaixo de 600px;
  o `IndicadorVariacao` quebra a frase inteira (`flex-wrap`).
- **Reusa `GraficoFluxoCaixa` e `DistribuicaoCategorias` do dashboard**, com titulo e descricao por prop.
  Saldo, variacao e agrupamento seguem as mesmas regras do dashboard no servidor.

## Telas ocultas

O card "Telas" de Configuracoes (`PainelTelas`) liga e desliga cada tela do menu (as quatro de
Lancamentos, as quatro de Contas e cartoes, as quatro de Planejamento, Investimentos e Relatorios;
Dashboard e Configuracoes nao). A escolha mora no PrismaAPI (`GET`/`PUT /telas/ocultas`,
`TelasOcultasDTO`, enum `Tela`). Interruptor ligado e tela no menu.

- **`ProvedorTelas`/`useTelas`** carrega uma vez, grava cada mudanca em fila e desfaz com toast se o
  `PUT` falhar.
- **A ultima lista fica no `localStorage`** (`CHAVE_TELAS_OCULTAS`, `prisma:hidden-screens`) e vale ja no
  primeiro render: ao recarregar uma tela ocultavel, ela nao espera o `GET /telas/ocultas` para pedir os
  proprios dados. O `GET` continua saindo, em paralelo, e corrige a lista (a escolha mora no servidor, e
  outro navegador pode ter mudado). Cada gravacao atualiza a copia na hora, e o desfazer a devolve. Lista
  guardada com valor fora do enum `Tela` e ignorada. `estaOculto(destino)` aceita qualquer destino (com ou sem query) e o traduz por
  `telaDoDestino` (`constants/tela/tela.ts`) — todo atalho novo passa por ele.
- O grupo do menu some com todas as telas ocultas (`navegacaoVisivel`), a secao some sem itens, e o
  grupo cujo destino padrao sumiu abre na primeira tela restante. Os grupos do card saem da propria
  `navegacao`.
- **Endereco de tela oculta explica, nao redireciona**: o `LayoutAplicacao` troca o `Outlet` por
  `TelaOculta` ("Esta tela está oculta", "Mostrar de novo", "Ir para o Dashboard"). So na primeira
  visita, sem lista guardada, a tela ocultavel espera a lista sem renderizar nada; se o `GET` falhar,
  vale a lista guardada (ou tudo aparece, sem ela) e o card mostra o erro.
- **O que leva a uma tela oculta some junto**: avisos com `rota` nela (filtro do frontend), "Ver todos"
  de Últimos lançamentos, "Ver faturas" do cartao, atalhos da 404, os links dos lancamentos gerados, e,
  com "Todas" de Lancamentos oculta, a busca global e "Novo lançamento". Os numeros do dashboard
  continuam.

## Notificações

Toda confirmacao ou falha passa por `useNotificacoes()` (`ProvedorNotificacoes`), que desenha
`ItemNotificacao` e `AreaNotificacoes` (`components/ui/Notificacao`). Nao existe outro caminho de toast.

- **API: `sucesso`, `erro`, `aviso`, `informacao`.** `erro(titulo, causa)` recebe o erro capturado e
  extrai a mensagem; sem mensagem, a descricao vira "Tente de novo em alguns instantes.". A tela nao
  escreve `erro instanceof Error ? ...`.
- **Texto**: sucesso termina com `!` e nomeia coisa e acao ("Compra parcelada cadastrada com sucesso!"),
  com o item na descricao (`10x — Notebook`); erro e frase com ponto ("Não foi possível excluir a
  conta.") e a descricao e a mensagem do servidor.
- **Tempo** (`constants/notificacoes.ts`): 5 s sucesso e informacao, 7 s aviso, 8 s erro, mais um
  acrescimo por caractere acima de 70, ate 12 s. A barra na base e o tempo restante (animacao de CSS
  pareada com o `setTimeout`); a pilha pausa com mouse, foco dentro ou aba em segundo plano, e pausada a
  barra esmaece para 40% da cor (`--tone-edge`), por cor e nao `opacity`. Sob movimento reduzido a barra
  some e o tempo continua.
- **A cor do tipo fica so na barra de baixo e no icone.** Nao reintroduza borda, faixa lateral nem
  contorno colorido.
- **No toque**: segurar pausa, deslizar para a direita mais que `DISTANCIA_DESLIZE_DISPENSA_PX`
  dispensa; o fechar tem area ampliada.
- **Largura do texto, de 400px a 560px** (`--largura-minima` e `max-width` do `.viewport`), pilha
  alinhada a direita; acima de 560px o texto quebra (720px foi achado grande demais). Abaixo de 600px,
  largura toda com 12px de margem e area segura do iPhone.
- **No maximo tres**: a quarta empurra a mais antiga; mensagem identica a visivel reinicia o tempo dela.
- **Saida animada** por `DURACAO_SAIDA_NOTIFICACAO_MS`: o cartao desliza e a linha colapsa por
  `grid-template-rows` (o espaco entre cartoes e `padding` do item, nao `gap`).
- **Acessibilidade**: lista `aria-live="polite"`, erro `role="alert"`, os demais `role="status"`, tipo
  lido antes do titulo. Fechar pelo botao leva o foco a notificacao seguinte ou ao `<main>`.
- **A pilha vai por portal para o `body`**: o `#root` tem `isolation: isolate`, e dentro dele o
  `--z-toast` ficava atras do modal.

## Avisos

O sino abre o `PainelAvisos` (`avisoService`). O servidor deriva os avisos dos mesmos dados das telas:
faturas nao pagas que vencem dentro da antecedencia escolhida (15 dias por padrao) ou venceram ha ate
15 dias, despesas pendentes, agendamentos, receitas a receber e recorrentes sem lancamento no mes na
mesma antecedencia, cartoes a partir do percentual escolhido (70%), orcamentos a partir de 80%, o
primeiro mes de previsao negativa, e investimentos e metas sem atualizacao ha mais que o lembrete (30
dias).

- **Cada tipo tem o seu texto**: receita e "a receber"; transferencia agendada diz o destino; fatura
  aberta diz ate quando recebe compras. Aviso de limite e de investimento nao tem `valor` (um numero
  solto parecia algo a pagar). Porcentagem arredondada, valores formatados.
- **A urgencia esta na cor do icone** (`critical`/`attention`/`info`), nao no fundo da linha.
- **Ler e adiar marcam a situacao, nao o aviso.** `AvisoDTO.estado` e `NOVO`, `LIDO` ou `ADIADO`
  (`adiadoAte`). O servidor grava em `leituras_avisos` uma assinatura — severidade, data e valor (sem a
  data nos avisos datados de hoje, limite e orcamento) — e o aviso volta a `NOVO` quando ela muda: a
  fatura lida volta se o valor mudar ou a sete e a dois dias do vencimento; o adiado volta em
  `adiadoAte`. O "Tudo lido" diz que eles voltam.
- **O aviso lido desce para "Lidos e adiados"**, grupo recolhido com "Voltar aos novos". "Lido" e
  "Adiar" aparecem sobre a coluna de valor no hover e no foco (a linha continua link) e, em
  `pointer: coarse`, numa fileira propria com rotulo. "Adiar" abre "Amanhã", "Em 3 dias", "Em 1 semana"
  (`opcoesAdiamentoAviso`); Escape fecha so elas (`stopPropagation`). Adiar confirma por toast; ler nao.
  Depois, o foco vai ao aviso novo seguinte ou ao titulo do painel. A resposta do `POST` substitui a
  linha na hora. "Marcar todos como lidos" so com aviso novo.
- **Destinos**: fatura vai a `/faturas?fatura=<id>` (abre o `ModalDetalheFatura`); meta a
  `/planejamento/metas?meta=<id>` (detalhe com foco no preco); investimento a
  `/investimentos?investimento=<id>` (detalhe em "Atualizar saldo", foco no valor); conta vencendo,
  agendamento e receita a receber a `/lancamentos?editar=<id>` (abre o formulario, pelo
  `GET /lancamentos/{id}` quando o lancamento nao esta na pagina). Limite do cartao, orcamento, previsao
  negativa e recorrente levam a tela (`/cartoes`, `/planejamento/orcamento`, `/planejamento/previsao`,
  `/planejamento/recorrentes`).
- **`INVESTIMENTO_DESATUALIZADO`** aparece quando `dataAtualizacao` tem 30 dias ou mais e fica ate o
  usuario registrar aporte ou saldo — dali a contagem recomeca, sem tarefa agendada. Sempre `ATENCAO`; a
  data ao lado e a da ultima atualizacao.
- **A lista de avisos mora no `ProvedorAvisos`** (`useAvisos().avisos`), e nao no sino: o sino e o
  `PainelPreferenciasAvisos` leem a mesma lista, entao `/avisos` e pedido uma vez, inclusive em
  Configuracoes, onde antes eram dois `GET` iguais.
- **Quem muda o que um aviso le chama `useAvisos().atualizarAvisos()`**, que recarrega sem esqueleto: Investimentos (cadastrar, aportar, atualizar saldo, excluir), Metas (preco, situacao,
  excluir), Orcamento (gravar, excluir) e Configuracoes (cada preferencia). As outras telas ainda nao
  chamam; ao mexer nelas, use o mesmo hook.
- **O sino nao recarrega a lista**: "Lido", "Adiar", "Devolver" e "Marcar todos como lidos" poem a
  resposta do `POST` na lista do provedor (`substituirAviso`, `substituirAvisos`), e a contagem de lidos e
  adiados de Configuracoes acompanha sem requisicao. Antes cada clique fazia o `POST` e mais um `GET
  /avisos`, recalculado do zero porque o `POST` limpa o cache do Redis.
- **Os avisos nao ficam guardados no navegador.** `/avisos` sai uma vez por abertura do app, em paralelo
  com a tela, e o PrismaAPI ja o guarda no Redis (15 min, chave com a data, limpa a cada gravacao). Uma
  copia no `localStorage` mostraria no sino um contador de outra hora — fatura que ja foi paga, aviso
  que ja venceu.
- **Preferencias em Configuracoes** (`PainelPreferenciasAvisos`, `GET`/`PUT /avisos/preferencias`): um
  interruptor por tipo em tres grupos (`gruposTiposAviso`); a antecedencia no cabecalho de "Pagamentos e
  agenda", o percentual ao lado de "Limite do cartão" e os lembretes ao lado do tipo — o seletor desliga
  com o tipo. Opcoes fixas (3/7/15/30 dias; 70/80/90%; 15/30/60/90 dias), outro valor e `400`. Grava em
  fila com "Salvando"/"Alterações salvas" e desfaz com toast se falhar. Tipo desligado nao e calculado.
  "Mostrar de novo" (`DELETE /avisos/leitura`) devolve tudo aos novos.
- **Layout de Configuracoes**: largura da tela; "Aparência" e "Versões" na primeira linha (2fr e 1fr,
  empilhando abaixo de 1280px); os grupos de avisos por container query sobre `.layout` — tres colunas a
  partir de 1200px de painel, duas a partir de 640px ("Pagamentos e agenda" ocupando as duas linhas da
  esquerda), uma abaixo. Cabecalho de grupo com `box-sizing: content-box`, para alinhar os sublinhados.

**O sino**

- **Conta so os avisos `NOVO`**, e o cabecalho do painel diz o mesmo numero ("3 novos"). Acima de
  `AVISOS_MAXIMO_NO_CONTADOR` (99) vira "99+"; o `aria-label` diz o numero exato ("Avisos (3 novos)").
  Sem novo, o contador some. E calculado no mount do painel.
- **O contador** se centra num ponto fixo a direita do sino (`left` + `translate`), entra com `scale` e
  repete a entrada pelo `key` da quantidade. Tem 14px de altura, corpo de 11px, peso 700 (`--fs-2xs`,
  unico uso do token; 16/12 chamava atencao demais e 13/10 em 600 ficou ilegivel). Fundo `--counter`
  com numero branco nos dois temas: `#c92a12` no claro (5,49:1) e `#d93025` no escuro (4,77:1, e 3,3:1
  ou mais contra `--surface`, `--canvas` e `--surface-muted`) — o `--negative` do escuro e claro demais
  para branco. Mexeu num, refaca as contas.
- **O numero e centrado pela tinta**: o "1" do Archivo tem 1,05px livres a esquerda e 0,41px a direita,
  entao o `Cabecalho` marca `data-nudge` (`left` quando comeca com "1", `right` no "99+"), que desloca
  0,3px por um `padding` de `0.055em` do lado oposto. A largura sai de `--badge-chars` (14, 20 ou 26px,
  sempre par). Trocou fonte, corpo ou peso, meca de novo.
- **O sino balanca enquanto ha aviso novo** (`data-pending="true"`): a cada 6s o icone gira preso pelo
  topo (`transform-origin: 50% 2px`; 16deg, -14deg, 10deg, -7deg, 4deg e repouso nos primeiros 16% do
  ciclo, `balancarSino`) e o badalo (ultimo `path` do `Bell`) anda de lado no mesmo ritmo
  (`badaloSino`) — os dois keyframes sao uma linha do tempo so. Quando a quantidade sobe, o `key` do
  icone (`bellRing`) reinicia o balanco; descer nao. O contador fica fora do icone.
- **Abaixo de 680px o painel se ancora no header**, nao no sino (`.notifications` em `position:
  static`, largura com `--space-4` de cada lado), senao saia ate 71px da tela. Mexeu na ordem ou na
  largura dos botoes do header, meca de novo.

## Tela de boas-vindas

`components/boasVindas/` desenha a abertura que aparece a cada nova aba ou janela, antes de qualquer
rota (inclusive link direto, que continua valendo depois do "Começar"). Recarregar a aba nao a mostra:
a marca fica em `sessionStorage` (`CHAVE_BOAS_VINDAS_VISTA`, `prisma:welcome-seen`). O portao fica no
`Aplicacao.tsx`, dentro do `ProvedoresAplicacao`, para herdar o tema.

- **O fundo e uma linha de saldo** (`LinhaDoSaldo`): grade fina que se apaga para as bordas e uma serie
  em `--chart-1` que corre baixa sob o conteudo e sobe a direita ate o ponto "hoje", com o selo "Hoje"
  como o tooltip do app, seguindo tracejada como previsao. Uma cor, sem particula — raios coloridos e um
  Sankey foram recusados por exagero.
- **A entrada conta a serie em ordem**: linha e area reveladas juntas (`clip-path`), ponto, selo,
  tracejado por ultimo. Em laco, um brilho percorre a linha a cada `--ciclo-brilho` e o halo pulsa na
  chegada: atraso do halo = `--atraso-brilho + ciclo x --chegada-brilho`, os 70% do keyframe `brilhar` —
  mexeu num, mexa no outro. Sob movimento reduzido, brilho e halo saem.
- **Depois do "hoje" nada pode parecer corte**: o tracejado e parado e o primeiro traco nasce no ponto;
  parte dos mesmos 85% de opacidade da linha e esmaece ate 30%; nao ha cone de previsao; nada fica acima
  do tracejado (o degrade da area usa `userSpaceOnUse`); a serie segue subindo quase na mesma inclinacao.
- **O grafico se ancora na largura**: SVG com `aspect-ratio: 1440 / 900`, largura total, base no
  rodape, escala largura/1440. A parte plana ocupa ate 126 unidades (`8.75vw`), e o `--folga-grafico`
  da `.tela` e isso mais 24px. Conteudo no topo (`place-items: start center`, 48px de respiro); a linha
  passa 20 a 34px abaixo do "Começar" de 1024 a 1920px, e 1920x935 fecha sem rolagem. Mexeu em
  `SALDO_Y`, refaca o 126 e o `8.75vw`. Abaixo de 600px o grafico vira o fechamento da tela
  (`--altura-grafico-compacto`, SVG com 160% de largura, sem selo).
- **Selo e ponto tem tamanho de interface**: um `ResizeObserver` le `getScreenCTM().a` e grava
  `--escala-inversa`, aplicada por `scale` no grupo `.tamanhoFixo`. A entrada do selo usa `translate`.
- **Os tres cards e o "Começar" saltam no hover** (card 4px com `--ease-spring`, borda `--accent`,
  toque de `--accent-soft`, brilho azul, icone preenchido; botao 3px), pela propriedade `translate` para
  nao brigar com as animacoes de `transform`. E so desta tela — nao leve para os cards do app.
- **A frase e `FRASE_BOAS_VINDAS`** ("Veja para onde vai cada real."), com `text-wrap: balance`.
- **A entrada da marca**: tudo soma a `--inicio-marca` (400 ms, na `.marca`) — mexa so nele para
  atrasar ou adiantar. Dali: logo surge aos 80 ms e encaixa as tres faces ate 1120 ms; pulsa
  (`logoPulsar`, 1100 ms, cresce 10% com brilho de `--accent`) e solta a onda (`onda`, 1200 ms); so
  depois as letras de "Prisma" saem de tras dele para a direita em linha reta (`letraEmergir`), o "a"
  primeiro (`--ordem-entrada`), 480 ms cada e 120 ms entre elas, de 1300 a 2380 ms.
- **A saida e em cascata, e so o logo viaja ate o menu.** Logo da tela e `.brandMark` do `MenuLateral`
  dividem a classe global `marca-em-transicao` (`view-transition-name`). Na tela, as letras deslizam
  ate o centro do logo e somem atras dele (`letraRecolher`, `--dx` medido, logo com `z-index` acima),
  uma por vez, o "P" primeiro: 180 ms cada, 100 ms entre elas. **Toda saida termina antes de
  `DURACAO_DESPEDIDA_MS` (760 ms)**, quando a View Transition fotografa a pagina: hoje a ultima letra
  some aos 720 ms e o pulso termina aos 740 ms. Mexeu em atraso, duracao ou numero de letras, refaca.
- **No menu, o nome sai de dentro do logo como palavra inteira** (`nomeEmergir`), depois do pouso, e o
  slogan entra por ultimo (letra por letra e nome voando junto foram recusados). A palavra parte de
  `translateX(calc(-100% - var(--space-3) - var(--space-1)))` (4px antes da borda direita do logo, senao
  a ponta do "a" vazava); `.brandName` tem `align-self: flex-start` para o `-100%` ser a largura do
  nome. Durante a chegada o `.brandText` troca `overflow: hidden` por um `clip-path` na **borda direita**
  do logo (o `.brandMark` real nao e pintado enquanto a copia voa). `transicaoBoasVindas` poe
  `chegando-das-boas-vindas` na raiz antes da troca (nome e slogan pausados com `backwards`) e
  `marca-em-voo` no `ready`; dai conta o atraso do nome (780 ms, logo para aos 740 ms). As classes saem
  em `DURACAO_CHEGADA_MS` (1500 ms) — mexeu no `MenuLateral.module.css`, refaca. Menu recolhido: so o
  logo. Abaixo de 1100px (drawer) a classe perde o nome e a troca e so o esmaecimento.
- **Sem View Transitions, com aba oculta ou movimento reduzido, entra direto.** A transicao espera o
  `h1` de `main#conteudo` por ate 600 ms. No celular, `rolarAteOTopo` sobe a tela antes da despedida, e
  a troca forca `scrollTo(0, 0)` antes e depois da pagina nova, tambem sem View Transitions.

## Pagina 404

A rota `*` e a unica fora do `LayoutAplicacao` (sem sidebar nem header), dentro do
`ProvedoresAplicacao` para herdar o tema. A marca no topo leva ao dashboard e quatro atalhos em pilula
levam as telas de entrada.

- **O heroi e uma serie que sobe e para**: traco cheio ate o ultimo ponto, marca vertical no corte e
  tracejado ate um ponto oco — o tracejado do produto ja significa "nao aconteceu". SVG a mao.
- **Laco de ida e volta** (`sweep-series`): avanca ate 42%, segura ate 62%, recua. Variaveis
  `--draw-length`, `--sweep-duration` e `--draw-duration`. `VARREDURA_IDA` no TSX e o quadro de 42% no
  CSS sao o mesmo numero.
- **O comprimento sai da geometria** (soma das hipotenusas), nao de `getTotalLength()`, e os tracos
  animados **nao** usam `non-scaling-stroke` (com ele a animacao corta a linha no celular).
- **Movimento reduzido tem regra propria**: o traco perde animacao e tracejado e o halo sai — a regra
  global pararia no quadro da linha recolhida.
- **"Voltar" so aparece com historico** (`location.key !== 'default'`).
- E o unico cartao com sombra, porque flutua sozinho. A tela troca o `document.title` e o devolve ao
  sair.
- **Moldura e cena sao compartilhadas** (`components/erro`): `MolduraDeErro` desenha tela, marca,
  cartao, palco e conteudo, e `SerieInterrompida` e a cena. A 404 passa o `CodigoDeErro` ("404") e o
  rodape de atalhos; o resto da pagina mora em `pages/erro`. A cor da serie e `--cor-serie`: `--accent`
  por padrao e `--chart-3` (o par grafico do vermelho) com `data-tom="erro"`.

## Falha geral

Erro de renderizacao ou pacote de tela que nao chegou. Mesma moldura e mesma cena da 404, contando o
proprio erro em tom vermelho. A regra e `utils/falhaDeTela.ts` (testada): `ChunkLoadError` e as mensagens
de import dinamico do Chrome, do Firefox e do Safari sao **"Falha de carregamento" — "O Prisma nao
carregou"**; o resto e **"Erro inesperado" — "O Prisma parou de funcionar"**.

- **Dois limites** (`LimiteDeErro`, componente de classe):
  - um em volta do app inteiro, no `Aplicacao`, **fora do roteador e dos provedores**. Mostra a
    `TelaDeFalha`, que por isso nao usa hook de roteador, tema nem telas: a marca e um `<a href="/">`, o
    tema vem do script do `index.html` e o `main` leva `role="alert"`;
  - outro em volta de cada tela, no `LayoutAplicacao`, com `key` pelo caminho. Mostra a `FalhaNaTela`
    ("Esta tela parou de funcionar") dentro do shell, com menu e header funcionando, e a proxima tela
    comeca limpa.
- **Nunca mostra o texto do erro**, e a unica acao e "Recarregar a página": um "Tentar novamente" nao
  funciona depois que um `lazy()` falhou. A falha geral diz "Nada foi alterado nos seus dados."
- **Pacote que nao chegou passa primeiro pela recarga automatica** de `carregarTela`; so se falhar de
  novo a `FalhaNaTela` aparece.
- A `TelaDeFalha` e o CSS da moldura vao no pacote inicial (2,8 kB comprimidos): a tela que avisa que um
  pacote nao chegou nao pode depender de outro pacote.

## Docker e publicacao

`Dockerfile`, `docker-compose-prismaweb.yml` e `docker/` empacotam o build num `nginx-unprivileged` na
porta `8080`. Esteiras: `ci.yml` (build e imagem em todo PR para a `main`) e `release.yml` (publicacao
no Docker Hub ao mergear). Nomes e arranjo seguem os do PrismaAPI.

- **O compose e de execucao**: sobe `gurudohimalaia/prismaweb:latest`, sem bloco `build` (um build local
  carimbaria uma versao inventada). Em producao publica `5173` no host sobre `8080` e aponta para a API
  em `9027`; o dev nao usa compose (`npm run dev` em `5173`, API em `9017`). A URL da API vem de
  `PRISMA_API_URL` no `.env` ao lado (ignorado pelo git); o `.env.example` documenta `VITE_API_URL` (dev)
  e `PRISMA_API_URL` (container).
- **A URL da API e de execucao, nao de build**: `docker/40-prisma-config.sh` roda no entrypoint e grava
  `config.js` a partir de `PRISMA_API_URL`; o `index.html` o carrega antes do bundle. O nginx serve
  `config.js` com `no-store` e `index.html` com `no-cache`. Configuracao de execucao nova entra no
  script, no tipo `ConfiguracaoExecucaoPrisma` (`vite-env.d.ts`) e em `ambiente.ts`. O script usa `sed`
  com escape de aspas e barra; edite-o pelo editor (por heredoc no Git Bash as barras sumiram).
- **As tags git sao a fonte da versao**, nao o `package.json` (so a primeira versao, sem tag). Incremento
  pelo rotulo do PR (`release:major`, `release:minor`, padrao patch).
- **Duas tags de imagem por release**: `X.Y.Z` e `latest` (as de `{{major}}`, `{{major}}.{{minor}}` e
  `sha` foram removidas).
- **A release so e criada depois da imagem publicada.** As notas sao a descricao do PR (pela variavel
  `DESCRICAO_PR`, nunca interpolada no script), o `docker pull` da versao e o `--generate-notes`.
- **Segredos com os nomes da esteira do PrismaAPI**: `DOCKER_USERNAME`, `DOCKER_PASSWORD`,
  `DOCKER_IMAGE` (`gurudohimalaia/prismaweb`).
- **Configuracoes mostra as duas versoes, API primeiro**, num painel sem descricao: "1.0.1 — Lançada em
  29 de Outubro de 2026", alinhada pela linha de base (`.detailRow`), data em `nowrap`. A web vem de
  `PRISMA_VERSION` e `PRISMA_RELEASE_DATE` (gravados pela esteira a partir de `VERSION` e `BUILD_DATE`);
  sem elas, "Versão de desenvolvimento". A API vem de `GET /sistema/versao` (`sistemaService`), com
  "Tentar de novo" se falhar.

## Conexao com o PrismaAPI

`VITE_API_URL` aponta para `http://localhost:9017/PrismaAPI/v1` no perfil `dev`. O `clienteHttp` tem
timeout de 15 s, um ponto unico (`obterTokenAutenticacao`) para o token quando entrar o Spring Security
e normalizacao de erros em `ErroApi`: o corpo de erro e o `ErrorResponseDTO` (`types/dto/erro/ErrorResponseDTO.ts`), e
`interpretarErro` usa `errors` (validacao) ou `detail` como mensagem, `type` como codigo e `errors` como
detalhe. Cancelamento pelo `AbortSignal` sai como o proprio `AbortError`; so o estouro dos 15 s vira
`ErroApi` de `timeout`.

## Carregamento por tela

Cada pagina, menos o dashboard, e um pacote proprio, carregado ao abrir a tela (`carregarTela` em
`routes/`, sobre `React.lazy`), pedido do usuario para a primeira tela abrir mais rapido. O pacote inicial
leva React, roteador, provedores, layout, boas-vindas, a tela de falha e o dashboard; o Recharts
(`manualChunks.charts`) e pre-carregado em paralelo pelo `index.html`.

- **O dashboard fica no pacote inicial**, importado direto no `RotasAplicacao`: e a tela de entrada (`/`
  redireciona para ele). Sob demanda, ele virava uma fila (pacote inicial, depois o do dashboard, depois
  o Recharts) e abria 0,6 s mais devagar que antes da divisao num celular com 4G lento e CPU 4x mais
  lenta. Estatico, o `index.html` pre-carrega o Recharts em paralelo e ele abre 0,3 s mais rapido.
- **Qualquer outra tela do endereco ja e pedida quando o app inicia** (`precarregarTelas`, no
  carregamento do `RotasAplicacao`), em paralelo com `/telas/ocultas`; sem isso o pacote so era pedido
  depois de o layout receber a lista de telas ocultas. `telaPorCaminho` liga cada caminho a sua tela;
  caminho novo entra la.
- **As outras telas baixam depois, ociosas**: so depois que a tela atual chegou, do evento `load` e de
  mais `ESPERA_ANTES_DE_PRECARREGAR_MS` (2 s), num `requestIdleCallback` (com `setTimeout` onde ele nao
  existe). Antes da espera, o pre-carregamento disputava CPU e rede com a tela abrindo. Medido: navegar
  depois de 4 s na tela custa o mesmo que antes da divisao; nos primeiros 2 s, a primeira visita a uma
  tela ainda espera o pacote.
- **Dois `Suspense` com fallback vazio**: um no `LayoutAplicacao`, em volta do `Outlet`, para menu e
  header ficarem na tela, e outro no `RotasAplicacao`, para a 404. Com `v7_startTransition`, trocar de
  tela segura a anterior ate o pacote novo chegar, sem piscar.
- **Pacote que sumiu recarrega a pagina uma vez**: depois de um deploy, uma aba antiga pede arquivos com
  hash que ja nao existem. `carregarTela` recarrega e marca `CHAVE_RECARGA_TELA` (`prisma:screen-reload`)
  no `sessionStorage`, para nao entrar em laco; a marca sai no proximo carregamento que der certo. Se
  falhar de novo, o erro sobe para o limite da tela (ver "Falha geral").
- Pagina nova entra no `RotasAplicacao` por `carregarTela(() => import('@/pages/<pacote>/X').then((m) => m.X))`.
  Importar uma pagina de forma estatica em outro arquivo a puxa de volta para o pacote inicial.

## Fora de escopo hoje

Autenticacao (por isso a sidebar nao mostra usuario), ESLint/Prettier, testes de componente e de tela e
exportacao de relatorio (PDF, CSV). Nao invente configuracao disso sem o
usuario pedir.
