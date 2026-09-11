# CLAUDE.md

Guia para o Claude Code trabalhar neste repositorio.

## Sobre o projeto

Frontend de uma aplicacao de financas pessoais (contas, cartoes, lancamentos, investimentos e
planejamento). O nome do produto e **Prisma**, usado de forma consistente no repositorio, no
`package.json`, em `NOME_APLICACAO` (`src/constants/aplicacao.ts`), no `<title>` do `index.html` e nos
prefixos de `localStorage` (`prisma:*`). Ao renomear um deles, renomeie todos.

O estado atual vai ate a **Etapa 6**: fundacao do frontend, dashboard, as telas de lancamentos
(listagem com filtros, cadastro, edicao e exclusao de receitas, despesas e transferencias), o
bloco de contas e cartoes — cadastro de contas, cadastro dos quatro tipos de cartao, faturas com
detalhe de compras e compras parceladas — e o bloco de patrimonio e analise: carteira de
investimentos, orcamento mensal por categoria, despesas recorrentes, previsao financeira, metas e
desejos com historico de precos, e relatorios. O backend e o PrismaAPI (Java / Spring Boot /
PostgreSQL); com `VITE_USE_MOCKS=true` a camada de dados responde com mocks, e a escrita vive em
memoria pelo tempo da sessao.

A Etapa 6 fechou o frontend para integracao: o `API_CONTRACT.md` da raiz especifica os 42 endpoints
que o backend precisa expor — metodo, URL, parametros, corpo, status, validacoes e as regras de
calculo de cada um —, e o `README.md` documenta instalacao, variaveis, como os mocks funcionam e
como virar a chave para a API real. **Ao mudar um contrato em `src/types/financas.ts`, uma rota em
`src/api/rotasApi.ts` ou uma validacao de store, atualize o `API_CONTRACT.md` no mesmo trabalho.**
Tres documentos que divergem valem menos que um so.

## Comandos

```bash
npm install         # instala dependencias
npm run dev         # servidor de desenvolvimento em http://localhost:5173
npm run build       # tsc -b + build de producao
npm run preview     # serve o build de producao
npm run typecheck   # apenas checagem de tipos (tsc -b)
```

Nao existe linter, formatter nem suite de testes configurados. **A verificacao antes de dar uma
tarefa por concluida e `npm run typecheck`** — rode sempre depois de mexer em `.ts`/`.tsx`.

O script usa `tsc -b`, e nao `tsc --noEmit`: o `tsconfig.json` da raiz e uma solucao com
`references` e `files: []`, entao `tsc --noEmit` nao checa arquivo nenhum e passa sempre. Como
`tsconfig.app.json` ja tem `noEmit: true`, o `-b` checa sem gerar saida. Nao volte o script.

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

1. **Variaveis de ambiente so em `src/constants/ambiente.ts`.** Nenhum outro arquivo le
   `import.meta.env`. Precisa de uma flag nova? Adiciona no objeto `ambiente` e consome de la.

2. **URLs da API so em `src/api/rotasApi.ts`.** Nenhuma string de rota de backend escrita fora
   desse arquivo.

3. **Componentes nunca chamam `fetch` nem `clienteHttp`.** Eles chamam services. Quem decide entre
   mock e API real e o service, sempre com o mesmo formato:

   ```ts
   export const dashboardService = {
     buscarResumo(signal?: AbortSignal): Promise<DashboardDTO> {
       if (ambiente.usarMocks) {
         return respostaMock(montarResumoDashboard(), signal);
       }
       return clienteHttp.get<DashboardDTO>(rotasApi.dashboard.resumo, { signal });
     },
   };
   ```

   Todo mock passa por `respostaMock`, que aplica latencia artificial e respeita `AbortSignal`.
   Assim as telas ja exercitam carregamento, erro e cancelamento como fariam contra o backend real.

4. **Nenhum hex em componente.** Toda cor, espacamento, raio e tipografia sai dos tokens em
   `src/styles/tokens.css`, sob `[data-theme='light']` e `[data-theme='dark']`.

5. **Rotas so em `src/routes/caminhos.ts`.** Links usam `caminhos.x`, nunca string literal. A raiz `/`
   nao tem tela propria: ela redireciona para `caminhos.dashboard` (`/dashboard`), para que toda tela
   do app tenha um endereco com nome. O mesmo arquivo guarda os nomes dos query params (`busca`,
   `categoria`, `conta`, `cartao`, `novo`, `editar`) — eles sao contrato entre telas e nao devem
   ser escritos a mao em outro lugar. Todos sao transitorios: a tela os le e limpa a URL.

6. **Contratos de dominio em `src/types/financas.ts`.** Sao o contrato do backend (PrismaAPI);
   mudar um tipo la e uma decisao de API, nao um detalhe de tela.

   **Todo campo do contrato e escrito em portugues**, igual aos DTOs do PrismaAPI: query param e
   campo de JSON em camelCase sem acento (`/dashboard/resumo?dataInicial=&dataFinal=`,
   `?idCartao=`, `saldoAtual`, `limiteComprometido`, `dataVencimento`) e valor de enum em
   MAIUSCULAS (`RECEITA`, `CARTAO_CREDITO`). Inicio e fim de recorte se chamam sempre
   `dataInicial` e `dataFinal`. As rotas continuam em ingles (`/accounts`, `/invoices`), mas os
   tipos TypeScript tem o mesmo nome dos DTOs e enums do backend (`ContaDTO`, `SalvarContaDTO`,
   `TipoConta`, `Situacao`). O banco continua em snake_case e a
   traducao acontece uma vez so, no mapeamento da entidade JPA. Ao renomear um campo, lembre que
   o `dataKey` do Recharts e as chaves de `query` nos services sao string e nao passam pelo
   compilador.

7. **Nada de `<select>` nem de `<input type="date">` nativos.** O navegador desenha a lista do elemento nativo com as cores do
   sistema e ignora os tokens, o que deixa as opcoes ilegiveis no tema escuro. Campos de escolha
   usam `components/ui/CampoSelecao`, um combobox proprio com `role="listbox"`, navegacao por teclado e
   estados de hover, selecao e foco vindos dos tokens. A lista sai num portal no `body` com posicao
   fixa: dentro de um formulario em modal, que rola, uma lista absoluta seria cortada pela borda do
   painel. Por isso `--z-popover` fica acima de `--z-modal` — nao inverta essa ordem.

   O campo de data tem o mesmo problema e a mesma solucao: `components/ui/SeletorData`. O calendario
   nativo e desenhado pelo navegador, ignora os tokens e muda de forma a cada navegador — no tema
   escuro ele abria como uma janela clara no meio de um formulario escuro. O `SeletorData` repete a
   arquitetura do `CampoSelecao`, e nao por gosto: o painel vai para um portal e **o foco fica no
   gatilho**, com o dia sob o cursor anunciado por `aria-activedescendant`. Mover o foco para dentro
   do portal brigaria com a trava de Tab do `Modal`, que so conhece os elementos do proprio painel.
   Pelo mesmo motivo o Escape do calendario chama `stopPropagation`: sem isso ele fecharia o
   formulario inteiro.

8. **Excecao ao token de cor: Recharts.** A biblioteca escreve cor como atributo de SVG, onde
   `var(--token)` nao resolve de forma confiavel. Use o hook `usePaletaGrafico`, que le os tokens
   computados e recalcula quando o tema muda. A serie tem oito cores (`--chart-1` a `--chart-8`);
   as duas ultimas entraram com a distribuicao da carteira, que tem oito classes de ativo e nao
   pode repetir cor entre fatias vizinhas.

## Estrutura

```
src/
├── api/           clienteHttp, ErroApi, rotasApi
├── components/
│   ├── ui/        Botao, Painel, CampoTexto, AreaTexto, CampoSelecao, SeletorData, Interruptor, Modal,
│   │              DialogoConfirmacao, Selo, Tabela, BarraProgresso, Carregamento, EstadoVazio, Notificacao
│   ├── comum/     ValorMonetario, MarcaPrisma, IndicadorVariacao, BarraResumo
│   ├── layout/    MenuLateral, Cabecalho, EspacoCabecalho, CabecalhoPagina, PainelAvisos,
│   │              BuscaGlobal, SeletorPeriodo
│   ├── dashboard/ PainelSaldo, BlocoIndicador, GraficoFluxoCaixa, DistribuicaoCategorias,
│   │              CalendarioGastos, UltimosLancamentos
│   ├── lancamentos/ FiltrosLancamentos, TabelaLancamentos, ListaLancamentos (cartoes),
│   │              AlternadorVisualizacao (densidade da listagem), formularios de lancamento,
│   │              aparencia (icone/cor por tipo e situacao) e consulta (filtro, periodo e ordenacao)
│   ├── contas/    CartaoConta, ModalFormularioConta, aparencia (icone por tipo, tom por situacao)
│   ├── cartoes/   BlocoCartao, ModalFormularioCartao, aparencia (icone, tom de limite, tom de fatura)
│   ├── faturas/   EntradaFatura (destaque e linha), ModalDetalheFatura
│   ├── parcelamentos/ CartaoParcelamento (com cronograma), ModalFormularioParcelamento
│   ├── investimentos/ GraficoAlocacao (rosca), GraficoCarteira, CartaoInvestimento,
│   │              ModalFormularioInvestimento, aparencia (cor da classe, tom do resultado)
│   ├── orcamento/ NavegadorMes, LinhaOrcamento, ModalFormularioOrcamento
│   ├── recorrentes/ CartaoRecorrente, ModalFormularioRecorrente
│   ├── metas/     CartaoMeta, ModalFormularioMeta, ModalDetalheMeta, FiltrosMetas, VariacaoPreco,
│   │              MiniCurvaPreco, GraficoHistoricoPreco, aparencia e consulta (busca, filtro e ordenacao)
│   ├── previsao/  GraficoPrevisao, TabelaPrevisao, ListaPrevisao (versao compacta)
│   ├── relatorios/ SeletorPeriodoRelatorio, DistribuicaoOrigens, GraficoEvolucaoSaldo, GraficoPatrimonio
│   └── graficos/  DicaGrafico
├── constants/     ambiente, aplicacao, navegacao, lancamentos, contas, cartoes, investimentos, orcamento,
│                  recorrentes, metas, previsao, relatorios, validacao
├── hooks/         useDadosAssincronos, useConsultaMidia, useArmazenamentoLocal, useTravarRolagem,
│                  usePaletaGrafico, useContagem, useValidacaoFormulario
├── layouts/       LayoutAplicacao (sidebar + header + conteudo)
├── pages/         PaginaDashboard, PaginaLancamentos, PaginaContas, PaginaCartoes, PaginaFaturas,
│                  PaginaParcelamentos, PaginaInvestimentos, PaginaOrcamento, PaginaRecorrentes,
│                  PaginaPrevisao, PaginaMetas, PaginaRelatorios, PaginaConfiguracoes, PaginaNaoEncontrada
├── providers/     ProvedorTema, ProvedorNotificacoes, ProvedorPeriodo, ProvedoresAplicacao
├── routes/        RotasAplicacao, caminhos
├── services/      dashboard, lancamentos, categorias, contas, cartoes, investimentos, orcamento,
│                  recorrentes, metas, previsao, relatorios, avisos
│   └── mocks/     dados, saldo, agregacao, lancamentos.store, contas.store, cartoes.store,
│                  investimentos.store, orcamento.store, recorrentes.store, metas.store,
│                  dashboard.mock, cartoes.mock, investimentos.mock, orcamento.mock, recorrentes.mock,
│                  metas.mock, previsao.mock, relatorios.mock, avisos.mock, respostaMock
├── styles/        tokens.css, global.css
├── types/         comum, financas
└── utils/         juntarClasses, data, formatacao, validacao
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
- **O que nao aparece na tela continua em ASCII puro:** nomes de variaveis, chaves de objeto, ids
  de mock (`cat-saude`) e as rotas em `src/routes/caminhos.ts` (`/lancamentos`, `/configuracoes`).
  Manter essa separacao evita quebrar referencias no codigo.
- **O projeto nao tem comentarios.** Nem de linha, nem de bloco, nem JSDoc — em `.ts`, `.tsx`,
  `.css`, `index.html` e `.gitignore`. A unica excecao sao as explicacoes das variaveis em
  `.env.example`. O porque das decisoes vive neste arquivo e no `API_CONTRACT.md`, nao no codigo.
  A diretiva `/// <reference types="vite/client" />` de `src/vite-env.d.ts` fica: ela nao e
  comentario, e sem ela `import.meta.env` perde o tipo.
- `tsconfig` roda com `noUnusedLocals`, `noUnusedParameters` e `noUncheckedIndexedAccess`.
  Acesso a indice de array devolve `T | undefined` — trate, nao use `!`.
- Formatacao de moeda, numero e data passa por `src/utils/formatacao.ts`, que usa `Intl` com
  `LOCALIDADE = 'pt-BR'` e `MOEDA = 'BRL'` de `src/constants/aplicacao.ts`. Todo valor exibido sai como
  `R$ 5.000,00`.
- **`ValorMonetario` tem dois modos de movimento, e eles nao se sobrepoem.** `contarAoAparecer` conta de zero ate o
  valor **uma vez**, quando o numero aparece (`hooks/useContagem`); `animar` faz os algarismos
  rolarem quando o valor **muda**. Durante a contagem os digitos sao texto comum e as rodas so
  assumem no fim, ja no valor final: as rodas assentam por transicao de CSS, que precisa de um alvo
  parado. Os dois modos valem so para os indicadores que dao o titulo da tela: no dashboard, o saldo,
  as tres linhas de fluxo e os quatro tiles; em Contas, Cartoes, Faturas e Parcelamentos, os valores
  da `BarraResumo` do topo. O que esta nos cartoes da lista abaixo dela nao conta — uma tela inteira
  contando junto seria festa, nao leitura.
  A trava de "ja contou" fecha na **chegada**, nunca na partida: o `StrictMode` monta duas vezes em
  desenvolvimento, e uma trava fechada na partida faria a contagem existir so no build.
- **Valor monetario na tela sempre pelo componente `ValorMonetario`.** Ele usa `formatarPartesMoeda` para
  separar o simbolo dos algarismos: "R$" fica em um span com a familia de interface e os digitos em
  um span `.tabular` com a familia de numeros. Escrever `{formatarMoeda(x)}` direto no JSX faz o
  cifrao herdar o tracking negativo da familia de numeros e desalinhar em relacao ao resto do app.
- **Cor de variacao segue a seta, sempre.** No `IndicadorVariacao` subir e verde e cair e vermelho, em
  qualquer tela. Nao reintroduza um modo que inverta so a cor: ele produz seta para baixo em verde,
  e o simbolo passa a contradizer a cor.
- Dados assincronos nas paginas vao por `useDadosAssincronos`, que ja entrega estados de loading, erro e
  cancelamento.

## Tema

- Tres modos: claro, escuro e sistema. Escolha em **Configuracoes**, atalho no header.
- Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de
  tema errado. Se mexer na chave de storage (`CHAVE_TEMA`), atualize esse script tambem.
- O `ProvedorTema` grava `data-theme` no `documentElement` **durante o render**, nao em efeito,
  para que quem le tokens computados (Recharts) enxergue o tema certo no mesmo ciclo.
- Os dois temas usam cinzas neutros, sem desvio de matiz: a cor fica reservada ao acento e aos
  estados semanticos, que assim se destacam. Ao acrescentar um token de superficie, respeite a
  escala de elevacao `canvas < surface < surface-raised < surface-muted`.
- `--chart-2`/`--chart-3` sao parentes de `--positive`/`--negative`, mas nao os mesmos valores: texto
  precisa de 4.5:1 e acaba escuro, enquanto barra e area sao objeto grafico (3:1) e podem ser mais
  claras e saturadas. Nao unifique os dois pares.
- **`--warning-graphic` e o terceiro par dessa familia**, e existe por um motivo que os outros dois
  nao tem: vermelho e verde escurecem sem perder identidade, amarelo nao. O `--warning` de texto
  (`#8a6000`, 5.59:1) numa barra grossa deixa de parecer ambar e passa a parecer marrom. O par
  grafico mantem matiz e saturacao e sobe sete pontos de luminosidade — o mesmo degrau entre
  `--negative` e `--chart-3` —, ficando em `#ab7600` e 3.95:1. Ele vale so onde a cor e forma:
  a barra do `BarraProgresso`, a faixa do mes mais apertado na previsao e a borda do toast de aviso.
  Badge, icone do sino, data de vencimento e titulo de faixa continuam no `--warning` de texto. No
  tema escuro os dois coincidem, porque la a cor de texto ja e clara.
- Contraste e requisito, nao detalhe: texto em 4.5:1 e cor de grafico em 3:1 sobre a superficie em
  que aparece, nos dois temas. Vale tambem para o par cor/fundo dos badges (`--positive` sobre
  `--positive-soft`, e assim por diante), que e o ponto onde isso costuma escapar.
- `--heat-0` a `--heat-4` sao a escala do calendario de gastos por dia. Comecam no cinza de
  superficie (dia sem gasto) e terminam em `--negative`. Sao objeto grafico: o requisito e um
  degrau distinguir do vizinho, nao 4.5:1 de texto. Nao os reaproveite para texto nem para badge.
- Movimento tem tokens proprios: `--ease-out` para cor, borda, sombra e giro de seta;
  `--ease-spring` — o unico com ultrapassagem — para entrada de item de lista, entrada de popover
  (CampoSelecao, avisos, periodo), curso do Interruptor e rolagem de algarismo;
  `--duration-fast/base/slow` e `--stagger-step`, o intervalo entre um item e o seguinte numa
  entrada escalonada. A entrada de lista e a classe **global** `.list-item-in` (`global.css`), usada
  com `style={{ '--i': index }}`: alem de duas listas distantes precisarem da mesma curva, o CSS
  Modules reescreve o nome da animacao dentro de um `.module.css` — `animation: prisma-list-in`
  viraria `_prisma-list-in_hash`, que nao corresponde a keyframe nenhuma, e nada anima.
- **Troca de recorte nao e corte seco.** A classe global `.refreshing` (`global.css`) marca o bloco
  de conteudo de cada tela; enquanto o `aria-busy` que a tela ja mantinha estiver ligado, o bloco
  recua para 55% e volta ao chegar o dado novo. E o que suaviza trocar o mes do orcamento, o
  periodo do dashboard e o recorte de um relatorio. Tres detalhes sustentam a escolha e nao devem
  ser desfeitos: a atenuacao entra com atraso de `--duration-fast` e sai sem atraso, para que uma
  resposta rapida nunca chegue a piscar; so a opacidade se move, porque o `ValorMonetario` precisa continuar
  montado para os algarismos rolarem de um valor ao outro; e sob `prefers-reduced-motion` o recuo e
  cancelado por completo — zerar so a duracao, como faz a regra global, transformaria o efeito no
  pisca que ele existe para evitar. O esqueleto da primeira carga fica de fora da classe de
  proposito: ali nao ha conteudo anterior a atenuar. Filtros aplicados em memoria (cartao em Faturas
  e Parcelamentos, tudo em Lancamentos) nao passam por isso porque nao esperam nada — a troca
  acontece no mesmo quadro do clique.
- Os tokens `--brand-*` sao a excecao a regra de tema: um logotipo nao muda de cor com o tema,
  entao eles ficam no bloco `:root` e valem para claro e escuro.

## Escrita nos mocks

Cadastro, edicao e exclusao de lancamentos passam por `lancamentosService`, que no modo mock
delega a `services/mocks/lancamentos.store.ts`. O store muta o array `lancamentos` de
`mocks/dados.ts` — a mesma fonte que abastece dashboard e avisos, entao um lancamento novo aparece
em todas as telas. O estado vive so ate o reload da pagina, de proposito: nao ha persistencia
enquanto nao houver backend.

Os lancamentos escritos a mao cobrem as ultimas semanas. Os meses anteriores saem de
`modeloMensal`, um modelo de mes tipico que `montarHistorico()` expande para tras com variacao
fixa por mes — o grafico precisa oscilar, mas nao pode mudar a cada recarregamento. O tamanho de
`variacaoMensal` define ate onde o historico vai, e precisa cobrir com folga o mes mais antigo
que o seletor de periodo oferece (`MESES_PERIODO_PERSONALIZADO`), ja que um mes unico ainda desenha os
cinco meses anteriores. O mes corrente para no dia de hoje: um lancamento com data futura marcado
como pago seria incoerente, e os itens pendentes e agendados ja vem da lista escrita a mao.

`montarResumoDashboard(period)` recorta tudo pelo intervalo pedido e calcula as variacoes contra a
janela de mesmo tamanho imediatamente anterior, no lugar dos percentuais fixos que existiam antes.
O saldo de um mes passado e reconstruido a partir dos saldos de hoje, desfazendo o que entrou e
saiu depois daquela data. Nessa conta a transferencia so pesa quando cruza a fronteira do total:
o aporte na corretora, que fica fora de `incluirNoTotal`, reduz o saldo visivel, enquanto uma
transferencia entre duas contas do total nao muda nada.

O contrato de escrita e `SalvarLancamentoDTO`: o cliente manda ids (`idOrigem`, `idCategoria`,
`idContaDestino`) e quem resolve nome de conta e de categoria e o servidor. O store tambem devolve
`ErroApi` nos casos invalidos, com o mesmo formato do `clienteHttp`, para que a tela ja trate erro
como tratara contra a API real.

**Transferencia nao e receita nem despesa.** Ela tem `categoria: null`, carrega `idContaDestino` e
fica fora do total do periodo (`totalLiquido`) e de `gastoPorCategoria`: o dinheiro so troca de conta e nao
altera o patrimonio. Por isso a tela de Transferencias esconde a coluna e o filtro de categoria —
seriam um traco em toda linha.

A tela de lancamentos busca do service so pelo `tipo` da rota; busca, periodo, categoria, conta,
situacao e ordenacao sao aplicados em memoria por `components/lancamentos/consulta.ts`, para responder
a cada tecla sem uma nova ida ao servidor. Os mesmos filtros existem em `FiltroLancamentoDTO` do
service porque sao os parametros que a API vai receber como query string.

## Contas, cartoes, faturas e parcelamentos

Quatro telas em `/contas`, `/cartoes`, `/faturas` e `/parcelamentos`, todas sob o grupo "Contas e
cartoes" da sidebar. Contas e cartoes sao cadastro (criar, editar, excluir); faturas e
parcelamentos sao leitura calculada, exceto o cadastro da compra parcelada.

- **Um cadastro so para os quatro tipos de cartao.** `CartaoDTO` tem os campos especificos opcionais
  porque nenhum tipo usa todos: credito tem limite e datas de fatura, debito aponta para a conta
  que acessa e os vales carregam saldo proprio. Quem precisa dos campos de credito passa por
  `ehCartaoCredito` (`constants/cartoes.ts`), que estreita o tipo — nunca por `card.limiteCredito!`. O
  formulario tambem so envia os campos do tipo escolhido, senao trocar um cartao de credito para
  vale-refeicao deixaria limite e datas para tras.
- **Fatura nao e cadastro: ela e derivada.** `services/mocks/cartoes.mock.ts` monta as faturas a
  partir das despesas lancadas no cartao e das parcelas das compras parceladas, do mesmo jeito que
  os avisos saem dos lancamentos. O ciclo de um mes vai do fechamento anterior (exclusivo) ate o
  deste mes (inclusivo); o vencimento cai no mes seguinte quando o dia de vencimento e anterior ou
  igual ao de fechamento. Uma compra cadastrada agora aparece na fatura, no limite comprometido e
  no cronograma sem nenhum ajuste manual — e o formato calculado aqui e o que o backend vai ter de
  devolver.
- **`limiteComprometido` do cartao nao fica em `dados.ts`.** Ele e a soma das faturas ainda nao pagas, incluindo
  as futuras: e o unico numero que responde "quanto ainda posso gastar" sem esconder doze parcelas
  ja assumidas. Guardar o valor a mao faria a barra de limite mentir na primeira compra parcelada.
- **As parcelas nao sao lancamentos.** Elas vivem em `comprasParceladas` e entram nas faturas
  pelo calculo. Gravar doze copias de cada compra em `lancamentos` deixaria a listagem de
  lancamentos ilegivel e o resultado do periodo errado, ja que quem sai da conta e a fatura, nao a
  parcela. As primeiras parcelas levam o valor arredondado para baixo e a ultima absorve a sobra,
  para a soma fechar exatamente com o total da compra.
- **Excluir nao apaga historico.** Conta ou cartao com lancamentos (ou com compra parcelada) devolve
  `409` do store, e a mensagem sugere marcar como inativo. Inativo sai do saldo total e dos
  seletores de lancamento, mas o passado continua legivel. Por isso `ContaDTO` e `CartaoDTO` tem `situacao`
  e `listarOrigens()` filtra por ele — enquanto `buscarOrigem(id)` busca em tudo, para
  que editar um lancamento antigo nao falhe por causa de uma conta encerrada.
- **`listarOrigens()` e funcao, nao array.** Uma conta cadastrada agora precisa aparecer no
  proximo lancamento sem recarregar a pagina. O cartao de debito fica de fora da lista: ele e so o
  meio de acessar a conta, que ja esta la.
- **Faturas em quatro blocos.** "A pagar" (ciclo fechado), "Fatura atual" (ciclo em andamento),
  "Proximas faturas" e "Faturas anteriores". A fechada e a aberta sao coisas diferentes — uma exige
  pagamento numa data, a outra ainda acumula compras — e junta-las colocava duas faturas do mesmo
  cartao lado a lado sem explicar por que eram duas.
- **A barra de limite usa as faixas de `constants/cartoes.ts`**, as mesmas que decidem o aviso do
  sino. Separadas, um dia a barra ficaria ambar sem nenhum aviso correspondente no painel.
- **Filtro de tela vai na linha de acoes do `CabecalhoPagina`; filtro de bloco, no cabecalho do bloco.**
  O seletor de cartao de Faturas e de Compras parceladas vale para a tela inteira e divide a linha
  com a acao principal — para isso o `CampoSelecao` tem `tamanho="sm"`, que iguala a altura ao
  `Botao tamanho="sm"`. Sozinho numa faixa entre o resumo e a lista, um campo estreito virava uma
  terceira listra vazia entre dois blocos largos. Ja as janelas de meses de "Proximas faturas" e
  "Faturas anteriores" ficam no cabecalho de cada bloco, porque so recortam aquele bloco — e o
  total ao lado do titulo soma o que esta a vista, nao o grupo inteiro.

## Investimentos

Uma tela em `/investimentos`, sob "Patrimonio" na sidebar. E cadastro (criar, editar, excluir) e
leitura calculada ao mesmo tempo: a carteira guarda posicoes, e distribuicao, rentabilidade e
evolucao saem do calculo.

- **Sao oito classes de ativo** (`ClasseAtivo`), e cada uma tem um token de grafico fixo em
  `constants/investimentos.ts`. A cor e da classe, nao da posicao dela no ranking: se saisse da ordem
  das fatias, a mesma classe mudaria de cor ao ganhar ou perder participacao entre uma carga e
  outra.
- **`dataInicio` nao e enfeite.** A evolucao do patrimonio distribui os aportes linearmente entre o
  primeiro deles e hoje — e a suposicao mais honesta sem uma serie de aportes real, e a unica que
  faz a curva chegar em hoje valendo exatamente o que o cadastro diz. Por isso o store recusa data
  de primeiro aporte no futuro.
- **A oscilacao da curva e fixa** (`ondaMercado` em `investimentos.mock.ts`), como a do historico de
  lancamentos: o grafico precisa balancar, mas nao pode mudar a cada recarregamento. O primeiro
  valor e 1 porque o mes corrente tem de fechar no valor cadastrado. Cada classe sente a oscilacao
  numa amplitude propria (`volatilidadeClasse`) — um CDB nao balanca como uma cripto.
- **A rosca guarda o total no centro.** Sem ele, quem le "32%" teria de procurar o patrimonio em
  outro bloco para saber de quanto sao esses 32%. A legenda e uma lista ao lado, e nao a `Legend`
  do Recharts: com oito classes os rotulos em volta do circulo se sobrepoem.
- **A evolucao desenha duas series**: a area do patrimonio e a linha tracejada do total aportado. A
  distancia entre elas e o rendimento, e se le sem nenhum numero. A tracejada e deliberada — o
  aporte e a referencia, nao uma segunda medida de mesmo peso.

## Orcamento, recorrentes e previsao

Tres telas sob "Planejamento": `/planejamento/orcamento`, `/planejamento/recorrentes` e
`/planejamento/previsao`. As duas primeiras sao cadastro; a previsao e leitura calculada a partir
delas, dos parcelamentos e do historico.

- **O orcamento e recorrente e nao tem mes.** Um `OrcamentoDTO` guarda categoria e limite, e vale de um
  mes para o outro ate ser alterado. Guardar uma linha por mes obrigaria a redigitar o mesmo numero
  doze vezes por ano e deixaria todo mes seguinte comecando sem orcamento. O consumo, esse sim, e
  por mes: `montarVisaoGeralOrcamento(month)` soma as despesas daquele mes.
- **Uma categoria tem no maximo um limite.** O store devolve `409` na duplicata e o formulario nem
  oferece as categorias ja orcadas — melhor nao oferecer a opcao do que deixar escolher e falhar
  depois de preencher o valor.
- **O bloco "gasto fora do orcamento" nao e detalhe.** Sem ele, a soma dos limites seria lida como o
  gasto total do mes, e nao e: o que nao tem limite tambem saiu da conta.
- **A projecao de ritmo tem piso** (`DIAS_MINIMOS_PROJECAO_ORCAMENTO`, dez dias). Extrapolar linearmente
  o dia 4 multiplica por sete um aluguel que acontece uma vez no mes, e "no ritmo atual, R$ 21.700
  de moradia" nao e um aviso, e um erro de leitura. Antes disso a tela projeta nada, e o cabecalho
  continua dizendo quantos dias do mes ja passaram.
- **As faixas do orcamento ficam em `constants/orcamento.ts`**, junto das que pintam a barra e o badge
  — separadas, a barra ficaria ambar sem que o rotulo dissesse "perto do limite".
- **A tela de orcamento navega por mes com setas**, nao com o `SeletorPeriodo` do header (que so
  existe no dashboard) nem com uma lista: o orcamento se consulta em sequencia — "e no mes
  passado?" — e um seletor pediria dois cliques para a pergunta mais comum. O rotulo tem largura
  fixa para as setas nao se deslocarem entre "Maio" e "Setembro".
- **Recorrencia normaliza para o mes** (`ocorrenciasMensais`): a anual entra dividida por doze e a
  semanal multiplicada por 4,3452 — a media real de semanas num mes. Sem isso, somar assinatura
  mensal com seguro anual daria um numero que nao corresponde a mes nenhum. Ja a previsao usa
  `ocorrenciasEm(item, mes)`, que poe o seguro do carro no mes exato em que ele vence, em vez de
  diluir um doze avos por todos os meses.
- **Pausar existe para nao apagar.** A recorrente pausada continua no cadastro, sai do custo mensal
  e da previsao, e volta com um clique — por isso o cartao tem o botao proprio, sem passar pelo
  formulario inteiro.
- **A previsao comeca no mes que vem.** Metade do mes corrente ja aconteceu: somar realizado com
  previsto na mesma linha produziria um numero que nao e nem um nem outro, e o dashboard ja
  responde pelo mes em curso. O saldo de partida, esse sim, e o de hoje.
- **O gasto variavel e um resto, nao uma media solta.** Ele e a media de despesa dos tres meses
  fechados menos as recorrentes e as parcelas medias do mesmo periodo. Sem esse desconto, aluguel e
  parcelas apareceriam duas vezes — uma na sua linha, outra dentro da media — e a projecao ficaria
  pessimista o bastante para nao servir para nada.
- **A tela de previsao diz como ela foi feita.** A nota de metodo ao fim nao e enfeite: um numero
  apresentado como certeza vira decisao errada quando erra.

## Metas e desejos

Uma tela em `/planejamento/metas`, listada na sidebar como **Metas**, dentro do grupo
"Planejamento". O titulo da tela e "Metas e desejos" de proposito: so "Metas" abriria espaco para
ler a tela como uma lista de compras de e-commerce, e o que ela faz e acompanhar quanto custa o
que se pretende comprar — planejamento, nao vitrine.

- **O historico e a tela; o preco atual e so a ultima linha dele.** Registrar um preco novo nunca
  sobrescreve o anterior (`adicionarPrecoMeta`, nunca um update de preco): sem a serie inteira nao ha
  menor preco, media, variacao nem grafico — sobra o ultimo numero digitado, que um campo de texto
  qualquer ja daria. Por isso a edicao (`AtualizarMetaDTO`) nao carrega preco: ela mexe em nome,
  link, imagem, situacao e observacao, e o preco tem caminho proprio (`POST /goals/{id}/prices`).
- **Aqui a cor segue a noticia, nao a direcao do numero.** Preco que cai e a boa noticia de quem
  quer comprar, entao a queda e verde. Isso nao contradiz a regra do `IndicadorVariacao` — que
  continua sendo "subiu e verde" em toda variacao financeira — porque este indicador e outro
  componente (`VariacaoPreco`) e nunca mostra uma seta sozinha: ele escreve "Baixou" ou "Subiu" ao
  lado dela. Seta, palavra e cor dizem a mesma coisa, e nao existe seta para baixo em verde sem a
  palavra que a explica. Nao unifique os dois componentes.
- **A analise e conta de servidor; a frase e interface.** `AnaliseMetaDTO` devolve em `leitura` um
  `LeituraMeta` (`PRIMEIRO`, `MENOR`, `ABAIXO_DA_MEDIA`, `ACIMA_DA_MEDIA`, `MAIOR`, `ESTAVEL`) e o
  texto de cada caso vive em `constants/metas.ts`. Traduzir a tela nao pode exigir mexer na API.
- **A media sozinha nao bastaria.** Numa serie que desceu de 900 para 750 e voltou a 780, "abaixo
  da media" e verdade e ainda assim esconde que o fundo foi bem mais baixo. Por isso o insight olha
  primeiro a posicao dentro da faixa (`TOLERANCIA_EXTREMOS_META`) e so depois a media.
- **Uma meta com um registro so nao tem variacao.** Cartao, cabecalho do detalhe e insight dizem
  "Primeiro registro" em vez de "Preco estavel": afirmar estabilidade sobre uma unica observacao e
  falso. No lugar da curva entra o convite a registrar de novo — um vao entre o preco e o rodape do
  cartao nao informa nada.
- **Os totais olham so o que esta em acompanhamento.** Somar no "custo da lista" o que ja foi
  comprado ou cancelado daria um numero que nao corresponde a decisao nenhuma. Comprada e cancelada
  continuam no cadastro porque o historico delas e o que responde se a compra saiu na hora certa.
- **O registro de preco fica embutido no modal de detalhe, e nao num segundo modal.** Dois paineis
  empilhados disputariam a trava de Tab e o Escape do `Modal`. Pelo mesmo motivo, "Editar" e
  "Excluir" fecham o detalhe antes de abrir o painel seguinte.
- **O modal de detalhe le a meta pelo id, nao por um retrato.** `PaginaMetas` guarda `detailId` e
  encontra a meta na lista recarregada; guardar o objeto faria o modal continuar mostrando o
  historico de antes do preco que o usuario acabou de registrar.
- **A minicurva do cartao e SVG escrito a mao** (`MiniCurvaPreco`), nao Recharts: para quatro
  pontos sem eixo, rotulo nem tooltip, montar um grafico inteiro custaria mais do que informa — e a
  cor sai de `currentColor`, entao ela segue o tema sem passar pelo `usePaletaGrafico`. O grafico do
  detalhe, esse sim, e Recharts como os demais, com a media em tracejado: e contra ela que se le a
  frase da analise.
- **O eixo de valores usa marcas redondas** (`eixoRedondo` em `GraficoHistoricoPreco`). Deixar o Recharts
  dividir o intervalo cru produzia "R$ 989,9" num eixo de precos — um numero que ninguem escreveria,
  e que faz conferir a casa decimal em vez de olhar a curva.
- **Busca, situacao e ordenacao sao aplicadas em memoria** (`components/metas/consulta.ts`), como em
  Lancamentos. Os mesmos parametros existem em `FiltroMeta` do service porque sao os que a API vai
  receber como query string quando a lista crescer. A busca ignora acento (`normalizarBusca`, em
  `utils/formatacao.ts`, compartilhado com a busca global).
- **O campo de busca da tela e estreito de proposito e diz "Buscar nas metas".** Ele mora na faixa
  de filtros, ao lado dos dois seletores, e nao numa barra larga: assim nao compete com a busca
  global do header, que procura outra coisa. Metas nao entra em `pageOwnsControls`.
- **Nao ha scraping nem atualizacao automatica de preco.** Todo valor e digitado por quem consultou.
  O link do produto so abre a pagina numa aba nova.

## Relatorios

Uma tela em `/relatorios`, com o recorte escolhido em `SeletorPeriodoRelatorio`.

- **Relatorio se pede por dia, nao por mes.** `PeriodoRelatorio` carrega duas datas ISO, ao contrario do
  `PeriodoDashboard`, que trabalha em `YYYY-MM`: "ultimos 7 dias" e "de 12/03 a 04/05" nao cabem numa
  chave de mes. Todo atalho termina hoje — incluir dias que ainda nao aconteceram dividiria os
  totais por um periodo maior que o vivido.
- **Os seis recortes ficam a vista como botoes**, e nao dentro de um seletor: eles sao a acao
  principal da tela, que nao tem nada para cadastrar. Abaixo de 900px viram um `CampoSelecao`, e as duas
  datas do recorte proprio so aparecem quando "Personalizado" esta escolhido — um controle presente
  que nao responde e pior que um ausente.
- **O agrupamento do grafico segue a duracao**: por dia ate dez dias, por semana ate quarenta e
  cinco, por mes acima disso (`constants/relatorios.ts`). Uma semana em baldes semanais viraria uma
  barra sozinha; um ano em baldes diarios, trezentas e sessenta.
- **A evolucao do patrimonio e empilhada em conta e investimento.** O topo continua sendo o total,
  mas a divisao mostra dinheiro migrando de um lado para o outro — que e o que um aporte faz todo
  mes, e o que um total estavel esconderia.
- **Gasto por origem usa uma cor so.** Ali a comparacao e de tamanho, nao de identidade: dar uma cor
  a cada conta faria a barra competir com o codigo de cores das categorias, que e o unico do
  produto.
- **A tela reusa `GraficoFluxoCaixa` e `DistribuicaoCategorias` do dashboard**, com titulo e descricao por
  prop. Duplicar o desenho para trocar um rotulo criaria um segundo grafico para o mesmo problema —
  e e assim que dois blocos iguais comecam a divergir.
- **Saldo, variacao e agrupamento por categoria saem dos mesmos modulos que o dashboard usa**
  (`mocks/saldo.ts` e `mocks/agregacao.ts`). Duas telas que somam a mesma coisa de dois jeitos
  acabam com dois resultados, e o usuario descobre isso antes de nos.

## Pagina 404

A rota `*` e a unica do app que fica **fora do `LayoutAplicacao`**: um endereco que nao existe nao e uma
tela do produto, e cerca-lo de sidebar, busca e seletor de periodo seria mostrar o mobiliario de um
lugar onde nao ha nada. Por isso a propria pagina assume a navegacao — a marca no topo leva ao
dashboard e quatro atalhos em pilula apontam para as telas de entrada. Ela continua dentro do
`ProvedoresAplicacao`, entao herda o tema escolhido como qualquer outra tela, inclusive numa carga direta
pela barra de enderecos, em que o script inline do `index.html` ja aplica o tema salvo.

- **O erro se conta no vocabulario do produto.** O heroi e uma serie que sobe e para: traco cheio
  ate o ultimo ponto que existe, marca vertical no corte e tracejado ate um ponto oco. Nas telas de
  previsao e da carteira o tracejado ja significa "isto nao aconteceu", entao aqui ele diz que o
  endereco pedido nao tem historia. E SVG escrito a mao, como o `MiniCurvaPreco`, e nao Recharts:
  sem eixo, rotulo nem tooltip, montar um grafico inteiro custaria mais do que informa.
- **A serie e um laco de ida e volta.** O keyframe `sweep-series` avanca ate 42% do ciclo, segura
  ate 62% e recua ate o comeco. Tres variaveis vindas do componente sustentam a cena:
  `--draw-length` (o comprimento da poligonal), `--sweep-duration` (o ciclo) e `--draw-duration` (o
  instante em que a ida termina), de onde saem os atrasos de tudo que entra junto com o vazio. A
  constante `VARREDURA_IDA` do TSX e o quadro de 42% do CSS sao o mesmo numero em dois lugares —
  ao mexer em um, mexa no outro.
- **O comprimento sai da geometria, nao do DOM.** A serie e uma poligonal, entao a soma das
  hipotenusas e exata e ja esta pronta no primeiro quadro; medir com `getTotalLength()` depois da
  montagem faria a linha aparecer inteira antes de se esconder para animar. Como o valor vale em
  unidades do `viewBox`, os tracos animados **nao** usam `non-scaling-stroke`: com ele o tracejado
  passa a ser medido em pixels de tela e a mesma animacao corta a linha pela metade num celular.
- **Movimento reduzido pede uma regra propria aqui.** A regra global reduz qualquer animacao a um
  instante, e um laco reduzido assim para no ultimo quadro — que neste caso e a linha recolhida, ou
  seja, um grafico vazio. Sob `prefers-reduced-motion` o traco perde a animacao e o tracejado, e o
  halo do ponto final, que so existe enquanto pulsa, sai de cena.
- **O botao "Voltar" so aparece quando ha para onde voltar** (`location.key !== 'default'`). Quem
  colou a URL errada direto na barra do navegador nao tem pagina anterior dentro do app, e o botao
  ali ou nao faria nada ou jogaria a pessoa para fora.
- **E o unico cartao do produto com sombra**, porque e o unico que flutua sozinho sobre o canvas,
  sem vizinhos. Dentro do app a moldura continua chapada.
- A tela troca o `document.title` enquanto esta montada e o devolve ao sair: ela costuma chegar por
  link externo, e o titulo e a primeira coisa que se le no historico do navegador.

## Periodo do dashboard e busca

O `SeletorPeriodo` e a busca global sao os dois pontos em que o header conversa com as telas.

- **O header tem um miolo com a caixa do conteudo.** A faixa vai de ponta a ponta — fundo e borda
  inferior precisam atravessar a tela —, mas os controles ficam num `.inner` com a mesma
  `max-width: var(--content-max)`, o mesmo `margin-inline: auto` e o mesmo `padding-inline` do
  `.container` do `LayoutAplicacao`. Sem isso, em telas mais largas que `--content-max` a pagina
  centraliza e o header nao, e a busca (ou o seletor de periodo) fica recuada a esquerda do titulo
  da tela logo abaixo dela. Barra fixa nova repete esse arranjo.

- **Periodo.** O caso comum — um mes de cada vez — fica nas setas; o painel do seletor guarda os
  atalhos ("Ultimos 3 meses", "Este ano") e o intervalo proprio, montado com dois `CampoSelecao` de mes.
  As setas deslocam a janela inteira: de "maio a agosto" chega-se a "janeiro a abril". O seletor
  so aparece no dashboard — as outras telas ou nao tem nocao de periodo ou tem o proprio filtro,
  como Lancamentos.
- **O esqueleto e so da primeira carga** — no dashboard e tambem em Contas, Cartoes, Faturas e
  Parcelamentos (`carregando && !dados`). Trocar de periodo — ou cadastrar, editar e excluir — mantem os
  numeros anteriores na tela enquanto a nova carga vem; quem diz que ainda esta carregando e o spinner de
  "Atualizar" e o `aria-busy` do grid. Apagar a tela inteira a cada clique na seta custava mais
  atencao do que informava, e desmontava os valores no exato momento em que eles deveriam rolar de
  um numero ao outro (`ValorMonetario animar`) — e, nas telas de cadastro, faria a contagem de entrada
  recomecar do zero a cada gravacao. Em troca, **os rotulos do conteudo seguem `data.dataInicial`/
  `data.dataFinal`, nao o periodo selecionado**: durante a carga os numeros ainda sao os do recorte
  anterior, e "Saldo no fim de Agosto de 2026" sobre o saldo de setembro seria falso. So o titulo
  da pagina acompanha a selecao na hora — ele fica ao lado do botao que gira.
- **O periodo nao vai para a URL.** Ele vive no `ProvedorPeriodo` (`usePeriodo`), em memoria. O
  endereco de uma tela diz que tela e, nao qual filtro esta aberto nela, e um `?dataInicial=&dataFinal=` colado
  no fim de `/dashboard` era ruido em todo print e em todo link compartilhado. O preco assumido e
  que recarregar a pagina volta ao mes corrente — que e o ponto de partida esperado de quem abre
  o app. Se um dia o recorte precisar sobreviver ao reload, o caminho e `localStorage` com a
  chave `prisma:*`, como a sidebar recolhida, e nao a query string.
- **A janela dos graficos nao e sempre o periodo.** Um mes sozinho nao conta historia nenhuma numa
  linha, entao o recorte de mes unico desenha os cinco meses anteriores como contexto. Um periodo
  de varios meses ja e a propria janela — mostrar meses de fora dele confundiria. Vale igualmente
  para o calendario de gastos por dia (`CalendarioGastos`): trinta quadradinhos sozinhos nao
  mostram habito nenhum, e seis meses lado a lado tambem preenchem a faixa de largura inteira em
  vez de deixar dois tercos do cartao vazios.
- **Rotulo segue o recorte.** Fora do mes corrente, "Saldo atual" vira "Saldo no fim de agosto de
  2026"; num intervalo, "Receitas do mes" vira "Receitas do periodo" e a variacao passa a ser "em
  relacao ao periodo anterior", comparada com a janela de mesmo tamanho imediatamente anterior.
  Rotulo que diz "atual" num mes passado e uma mentira barata de evitar: os componentes recebem o
  substantivo (`substantivoPeriodo`) e o texto pronto por prop.
- **O header cede o que a tela ja tem.** Em Lancamentos (`pageOwnsControls` no `Cabecalho`) somem a
  busca global e o "Novo lancamento": as duas caixas de busca ficavam lado a lado, quase
  identicas, uma navegando e a outra filtrando, e o botao era um quarto caminho para o mesmo
  formulario que os tres da tela ja abrem por tipo. No lugar da busca o header expoe um
  `EspacoCabecalho`, e a tela renderiza ali o proprio campo por portal: o estado continua sendo da tela
  (o que viaja e o no, nao o valor) e a busca aparece onde o usuario ja procura por busca em todas
  as outras telas. Abaixo de 900px o header nao tem folga para o campo, entao ele volta para a
  tela, ao lado do botao que abre os filtros. **Ceder so vale quando a tela realmente substitui o
  controle** — esconder sem substituto e o erro que isso evita.
- **Busca global.** `BuscaGlobal` procura em lancamentos, categorias e contas ao mesmo tempo e
  entrega cada resultado como destino: lancamento abre `?editar=<id>`, categoria abre
  `?categoria=<id>` e conta abre `?conta=<id>`, todos em `/lancamentos`. A ultima linha leva a
  `?busca=<termo>`. A comparacao ignora acento (`normalizarBusca`), porque quem digita "saude" espera achar
  "Saude". Chegar pela busca **reseta** os filtros da tela antes de aplicar o que veio na URL: um
  filtro esquecido da navegacao anterior zeraria o resultado que o usuario acabou de escolher.
- **Os parametros da busca saem da URL assim que sao lidos**
  (`setSearchParams({}, { replace: true })`), para que voltar no historico nao reabra um
  formulario nem refiltre a lista. Sao os unicos query params do app, e todos transitorios.

## Avisos

O sino do header abre o `PainelAvisos`, alimentado por `avisosService`. Os avisos nao sao
uma lista fixa: `montarAvisos()` os deriva dos mesmos mocks que abastecem as telas — faturas ainda
nao pagas que vencem em ate 15 dias ou venceram ha ate 15 dias, lancamentos pendentes ou agendados
dentro de
15 dias, e cartoes com 70% ou mais do limite. O PrismaAPI deriva os mesmos avisos com as mesmas
regras, entao trocar para a API real so muda o service.

A urgencia aparece na cor do icone (`critical` / `attention` / `info`), nao no fundo da linha: uma
lista com tres fundos coloridos vira ruido. O ponto no sino conta apenas os avisos que nao sao
`info`, e e calculado no mount do painel — nao depende de o usuario abri-lo.

## Responsividade

- Desktop: sidebar fixa, com modo recolhido (76px) persistido em `localStorage`.
- Abaixo de 1100px: sidebar vira drawer com scrim, fecha ao navegar (e no Esc) e trava o scroll
  do fundo. Fechado, o drawer fica `visibility: hidden` — fora da tela **e** fora do fluxo de
  foco, para o Tab nao entrar num menu invisivel.
- Grid do dashboard: 4 → 2 → 1 coluna.
- **Abaixo de 900px a listagem de lancamentos troca a tabela por cartoes** (`ListaLancamentos`,
  escolhido por `useEhCompacto`). A tabela tem `min-width: 1000px`: rolar de lado ate o valor, que
  e o dado mais importante da linha, nao e leitura. O cartao traz um controle proprio de
  ordenacao, para que o celular nao perca o que o cabecalho da tabela oferece.
- **Contas, cartoes e parcelamentos usam `auto-fill` com largura minima**, nao um numero fixo de
  colunas: o conteudo de cada cartao e que define quando vale quebrar. As faturas futuras e antigas
  sao linhas que viram duas abaixo de 900px, em vez de uma tabela que rola de lado ate o valor.
- **A troca de tabela por cartoes tambem e escolha, nao so largura.** No desktop o `AlternadorVisualizacao` da
  linha de resumo guarda a preferencia em `prisma:transactions-view`; abaixo de 900px a largura tem
  a ultima palavra (cartoes) e o seletor sai da tela, porque um seletor com uma opcao viavel so e
  um botao que nao faz nada.
- **Nada de esconder acao sem substituto.** Na mesma faixa o campo de busca do header vira um
  botao que abre a busca sobre o header, e "Novo lancamento" perde o rotulo mas continua la como
  botao de icone. Antes os dois sumiam com `display: none`.
- **A previsao troca a tabela de sete colunas por cartoes abaixo de 900px** (`ListaPrevisao`), pelo
  mesmo motivo da listagem de lancamentos: rolar de lado ate o saldo previsto, que e o dado mais
  importante da linha, nao e leitura. O mesmo limite decide se o filtro de relatorios e uma fileira
  de botoes ou um `CampoSelecao`.
- **Investimentos, orcamento e recorrentes usam `auto-fill` com largura minima.** A rosca da
  carteira sobe para cima da legenda abaixo de 900px: lado a lado, nessa faixa, sobrariam duas
  colunas estreitas demais para nome da classe e valor na mesma linha.
- `prefers-reduced-motion` e respeitado globalmente — nao adicione animacao sem cobrir esse caso.

## Validacao de formulario

Todo formulario passa por `useValidacaoFormulario` (`hooks/`), com as regras de `utils/validacao.ts`
(`erroTexto`, `erroValor`) e os limites de `constants/validacao.ts`.

- **Os limites sao os do banco, num lugar so.** `limitesTexto` repete o tamanho das colunas VARCHAR, e
  `DIGITOS_INTEIROS_MAXIMOS_VALOR` e `CASAS_DECIMAIS_MAXIMAS_VALOR`, o `NUMERIC(14,2)`. Formulario, store e `API_CONTRACT.md` usam a mesma regra: um
  formulario que aceita mais que a coluna so revela o limite com um `500`, depois de tudo preenchido.
  Campo novo com limite entra em `limitesTexto` e nas tres camadas no mesmo trabalho. A excecao e a
  observacao: a coluna e `TEXT`, e os 500 caracteres de `limitesTexto.observacoes` sao regra de produto.
- **Quando o erro aparece e decisao, nao acaso.** Durante a primeira digitacao, nada; ao sair de um
  campo preenchido e invalido, o erro aparece; dali em diante ele acompanha cada tecla e some assim que
  o valor fica valido. Campo obrigatorio vazio so e cobrado no envio — senao o foco automatico no
  primeiro campo pintaria de vermelho quem apenas clicou num seletor. A excecao e passar do limite de
  caracteres, que acusa na hora: cada letra a mais e trabalho que vai ser apagado.
- **Os erros sao recalculados dos valores a cada render**; o hook guarda so quais campos ja podem
  mostrar o seu. Guardar a mensagem em estado fazia o erro sumir na primeira tecla, com o valor ainda
  errado. Por isso, depois de um envio que deu certo sem fechar o formulario (o registro de preco da
  meta), chame `reiniciar()` junto com a limpeza dos campos.
- **Texto livre nao usa `maxLength`.** Ele corta o fim de um texto colado sem avisar. O `CampoTexto` recebe
  `limiteCaracteres` e mostra um contador a partir de 80% do limite; `maxLength` fica so nos campos de
  formato fixo, como dia do mes e ultimos 4 digitos.
- **Valor em dinheiro nao passa pelo `Number` cru.** `interpretarEntradaValor` confere o formato antes:
  `Number` aceitaria "1e5" e "0x10", e "1.500" num campo em reais e mil e quinhentos, nao um e meio.
  Quem digita "12abc" le "precisa ser um número", nunca "informe o valor", que soaria como campo vazio.

## Alvos de toque e campos

Os tokens `--control-height`, `--control-height-sm`, `--control-font` e `--tap-size` mudam de
valor em `@media (pointer: coarse)`, no fim de `tokens.css`. Campo e botao usam esses tokens em
vez de altura fixa, entao no desktop a interface segue densa e no celular tudo cresce junto: alvo
de 44px (referencia do iOS) e corpo de campo de 16px. **O corpo de 16px nao e preferencia**: com
menos que isso o Safari no iOS aplica zoom na pagina inteira ao focar um input, e o usuario cai
num layout deslocado que precisa desfazer a mao.

## Acessibilidade

- `LayoutAplicacao` abre com um link "Pular para o conteudo" (`.skip-link` no `global.css`), que salta
  a sidebar inteira e leva ao `<main id="conteudo">`.
- `Modal` prende o Tab dentro do painel e devolve o foco a quem o abriu. O elemento que abriu e
  lido **no render**, nao num efeito: quando `aberto` vira true o React ainda nao aplicou o
  `autoFocus` do primeiro campo, e depois disso `document.activeElement` ja seria o campo. O foco so
  volta quando o painel ja saiu do DOM: o `StrictMode` ensaia desmontar os efeitos de um modal que
  nasce aberto, e devolver o foco nesse ensaio o tirava do campo escolhido (o preco da meta).
- Formulario de lancamento marca campo obrigatorio no rotulo e, ao reprovar, leva o foco ao
  primeiro `[aria-invalid="true"]` em vez de so pintar as mensagens.
- Contraste, foco visivel e navegacao por teclado sao requisito, nao acabamento.

## Ao trocar mocks pela API real

Basta `VITE_USE_MOCKS=false`, com `VITE_API_URL` apontando para o PrismaAPI
(`http://localhost:9017/PrismaAPI/v1` no perfil `dev`). Os contratos de `src/types/financas.ts` sao
os mesmos DTOs do backend, entao nenhum componente muda. O `clienteHttp` ja tem timeout de 15s, um
ponto unico (`obterTokenAutenticacao`) para plugar o token quando entrar o Spring Security e normalizacao de
erros em `ErroApi`: o corpo de erro do servidor e o `ErrorResponseDTO` (`types/comum.ts`), e o
`interpretarErro` usa `detail` como mensagem, `type` como codigo e `errors` como detalhe.

## Fora de escopo hoje

Autenticacao, ESLint/Prettier, testes e code-splitting por rota ainda nao existem. Nao ha pagamento de fatura nem registro de quitacao — a fatura vencida e tratada como
paga —, nem historico de cotacao por ativo: a evolucao do patrimonio e reconstruida a partir do
valor atual e da idade da posicao. Exportacao de relatorio (PDF, CSV) tambem ficou de fora. Nao
invente configuracao dessas sem o usuario pedir.

`components/common/UnderConstruction` e o tipo `Page<T>` de `types/comum.ts` foram removidos na
revisao da Etapa 6: os dois estavam sem consumidor. O `Page<T>` era o mais arriscado, e nao por
ocupar espaco — um tipo de paginacao exposto no contrato sugere ao backend que a listagem e
paginada, e nenhuma e.
