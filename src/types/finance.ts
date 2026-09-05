import type { ID, Tendencia, Variacao } from './common';

/*
 * Categorias e lancamentos estao em portugues porque e assim que o backend vai
 * responder — ver docs/api/01-dashboard-resumo.pdf. Os nomes saem das colunas
 * de docs/api/sql/00-schema-completo.sql: o banco escreve em snake_case e a API
 * em camelCase, e a traducao acontece uma vez so, no mapeamento da entidade JPA.
 *
 * Os demais dominios deste arquivo continuam em ingles ate cada um ganhar o seu
 * documento de contrato. Migrar um dominio sem documento seria decidir no escuro
 * o nome de campo que o backend teria de honrar depois.
 */

export type TipoLancamento = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export type SituacaoLancamento = 'PAGO' | 'PENDENTE' | 'AGENDADO';

export type FormaPagamento = 'CONTA' | 'CARTAO_CREDITO' | 'PIX' | 'DINHEIRO';

/** Receita e despesa nao compartilham categoria: cada formulario oferece so as do seu lado. */
export type TipoCategoria = 'RECEITA' | 'DESPESA';

export interface Categoria {
  id: ID;
  nome: string;
  tipo: TipoCategoria;
  /** Indice do token de cor de grafico (--chart-1 ... --chart-6). */
  tokenCor: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Lancamento {
  id: ID;
  descricao: string;
  /** Valor sempre positivo. A direcao do dinheiro vem de `tipo`. */
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaPagamento;
  /** Data ISO (YYYY-MM-DD). */
  data: string;
  /** Transferencia so move dinheiro entre contas proprias, entao nao tem categoria. */
  categoria: Categoria | null;
  /**
   * Origem do dinheiro: uma conta ou um cartao. A API expoe um campo so, mas no
   * banco sao duas chaves estrangeiras de verdade (`id_conta` e `id_cartao`) e a
   * resposta emite o COALESCE das duas — seguro porque ambas sao UUID.
   */
  idOrigem: ID;
  nomeOrigem: string;
  /** Conta de destino; presente apenas em transferencias. */
  idContaDestino?: ID;
  nomeContaDestino?: string;
  observacoes?: string;
}

/**
 * Corpo enviado ao criar ou editar um lancamento. O cliente manda ids: quem
 * resolve nome de conta e de categoria e o servidor (hoje, a camada de mock).
 */
export interface LancamentoPayload {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaPagamento;
  data: string;
  idCategoria?: ID;
  idOrigem: ID;
  idContaDestino?: ID;
  observacoes?: string;
}

/** Origem de dinheiro escolhivel num lancamento: uma conta propria ou um cartao. */
export interface PaymentSource {
  id: ID;
  name: string;
  group: 'CONTA' | 'CARTAO';
}

/* -------------------------------------------------------------------------- */
/* Contas                                                                     */
/* -------------------------------------------------------------------------- */

export type AccountType = 'CORRENTE' | 'SALARIO' | 'EMERGENCIA' | 'OUTRA';

/**
 * Conta inativa continua no cadastro e no historico, mas sai do saldo total e
 * deixa de ser oferecida em lancamentos novos. E a alternativa a exclusao para
 * quem encerrou uma conta que ainda tem passado.
 */
export type AccountStatus = 'ATIVO' | 'INATIVO';

export interface Account {
  id: ID;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  /** Fora do total ficam contas que nao sao dinheiro disponivel, como a corretora. */
  includeInTotal: boolean;
}

export interface AccountPayload {
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  includeInTotal: boolean;
}

/* -------------------------------------------------------------------------- */
/* Cartoes                                                                    */
/* -------------------------------------------------------------------------- */

export type CardType = 'CREDITO' | 'DEBITO' | 'VALE_ALIMENTACAO' | 'VALE_REFEICAO';

export type CardStatus = 'ATIVO' | 'INATIVO';

/**
 * Um cadastro para os quatro tipos de cartao. Os campos especificos sao
 * opcionais porque nenhum tipo usa todos: credito tem limite e datas de fatura,
 * debito aponta para a conta que ele acessa e os vales carregam saldo proprio.
 * O guarda `isCreditCard` (constants/cards.ts) estreita o tipo onde a tela
 * precisa dos campos de credito.
 */
export interface Card {
  id: ID;
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  /** Bandeira impressa no cartao; vales de rede propria nao tem uma. */
  brand?: string;
  /** Quatro ultimos digitos, quando informados. */
  lastDigits?: string;
  /** Credito: limite total contratado. */
  limit?: number;
  /** Credito: limite ja comprometido. Vem calculado do servidor; o cliente nao envia. */
  used?: number;
  /** Credito: dia do mes em que a fatura fecha. */
  closingDay?: number;
  /** Credito: dia do mes em que a fatura vence. */
  dueDay?: number;
  /** Debito: conta de onde o dinheiro sai. */
  accountId?: ID;
  accountName?: string;
  /** Vale-alimentacao e vale-refeicao: saldo disponivel no cartao. */
  balance?: number;
}

export interface CardPayload {
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  brand?: string;
  lastDigits?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  accountId?: ID;
  balance?: number;
}

/* -------------------------------------------------------------------------- */
/* Faturas                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `future` e a fatura de um ciclo que ainda nem comecou: ela existe porque as
 * parcelas ja estao comprometidas. `open` e o ciclo em andamento, que continua
 * aceitando compras.
 */
export type SituacaoFatura = 'FUTURA' | 'ABERTA' | 'FECHADA' | 'PAGA' | 'VENCIDA';

export interface Invoice {
  id: ID;
  cardId: ID;
  cardName: string;
  /** Mes de referencia YYYY-MM. */
  month: string;
  total: number;
  status: SituacaoFatura;
  /** Data ISO em que o ciclo fecha. */
  closingDate: string;
  /** Data ISO de vencimento. */
  dueDate: string;
  itemCount: number;
  /**
   * Total da fatura anterior do mesmo cartao, quando existe. E o que responde
   * "este mes pesou mais?" sem obrigar quem le a procurar a fatura passada no
   * bloco de anteriores. Nem sempre e o mes imediatamente anterior: um mes sem
   * nenhuma compra nao gera fatura.
   */
  previousTotal?: number;
}

export interface InvoiceItem {
  id: ID;
  description: string;
  date: string;
  amount: number;
  category: Categoria | null;
  /** Presente quando o item e uma parcela de uma compra parcelada. */
  installment?: {
    number: number;
    total: number;
    purchaseId: ID;
  };
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
}

/* -------------------------------------------------------------------------- */
/* Compras parceladas                                                         */
/* -------------------------------------------------------------------------- */

export type InstallmentStatus = 'PAGA' | 'ATUAL' | 'FUTURA';

export interface Installment {
  /** Comeca em 1. */
  number: number;
  /** Mes da fatura em que a parcela cai, YYYY-MM. */
  month: string;
  /** Vencimento da fatura correspondente, data ISO. */
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
}

export interface InstallmentPurchase {
  id: ID;
  description: string;
  /** Valor total da compra, nao o da parcela. */
  totalAmount: number;
  /** Quantidade de parcelas. */
  count: number;
  purchaseDate: string;
  /** Mes da primeira parcela, YYYY-MM. */
  firstMonth: string;
  cardId: ID;
  cardName: string;
  category: Categoria | null;
  notes?: string;
}

/** Visao calculada de uma compra parcelada: e o que a tela precisa mostrar. */
export interface InstallmentPlan {
  purchase: InstallmentPurchase;
  /** Valor de cada parcela; a ultima absorve o arredondamento e pode diferir. */
  installmentAmount: number;
  paidCount: number;
  remainingCount: number;
  paidAmount: number;
  remainingAmount: number;
  /** Parcela em curso; ausente quando a compra ja foi quitada. */
  current: Installment | null;
  schedule: Installment[];
}

export interface InstallmentPayload {
  description: string;
  totalAmount: number;
  count: number;
  purchaseDate: string;
  firstMonth: string;
  cardId: ID;
  categoryId?: ID;
  notes?: string;
}

/* -------------------------------------------------------------------------- */
/* Investimentos                                                              */
/* -------------------------------------------------------------------------- */

export type InvestmentClass =
  | 'RENDA_FIXA'
  | 'CDB'
  | 'TESOURO'
  | 'ACOES'
  | 'ETF'
  | 'FUNDOS'
  | 'CRIPTO'
  | 'OUTROS';

export interface Investment {
  id: ID;
  name: string;
  assetClass: InvestmentClass;
  institution: string;
  /** Total aportado ate hoje. */
  invested: number;
  /** Quanto a posicao vale agora. */
  currentValue: number;
  /** Data ISO do primeiro aporte; e o que da idade a posicao. */
  startDate: string;
  notes?: string;
}

export interface InvestmentPayload {
  name: string;
  assetClass: InvestmentClass;
  institution: string;
  invested: number;
  currentValue: number;
  startDate: string;
  notes?: string;
}

/** Uma posicao com os numeros da tela ja calculados, como a API devolveria. */
export interface InvestmentPosition {
  investment: Investment;
  /** Patrimonio atual menos o investido; negativo em prejuizo. */
  profit: number;
  /** Rentabilidade sobre o investido: 0.082 e 8,2%. */
  profitability: number;
  /** Participacao no patrimonio da carteira (0 a 1). */
  share: number;
}

/** Uma fatia da distribuicao por tipo de ativo. */
export interface InvestmentAllocation {
  assetClass: InvestmentClass;
  invested: number;
  currentValue: number;
  profit: number;
  share: number;
  /** Quantas posicoes a classe reune. */
  count: number;
}

export interface PortfolioPoint {
  /** Rotulo curto do mes, com inicial maiuscula: "Jan", "Fev"... */
  label: string;
  /** Mes de referencia, YYYY-MM. */
  month: string;
  invested: number;
  value: number;
}

export interface PortfolioSummary {
  invested: number;
  currentValue: number;
  profit: number;
  profitability: number;
  /** Variacao do patrimonio em relacao ao mes anterior. */
  valueDelta: Variacao;
  allocation: InvestmentAllocation[];
  history: PortfolioPoint[];
  positions: InvestmentPosition[];
}

export interface GastoPorCategoria {
  categoria: Categoria;
  valor: number;
  /** Participacao no total de despesas do periodo (0 a 1). */
  participacao: number;
}

export interface PontoFluxo {
  /** Rotulo curto do mes, com inicial maiuscula e sem ponto: "Jan", "Fev"... */
  rotulo: string;
  receitas: number;
  despesas: number;
}

export interface PontoSaldo {
  rotulo: string;
  saldo: number;
}

/**
 * Despesas somadas de um dia do periodo. O dia sem gasto vem com zero, e nao
 * ausente: o calendario precisa desenhar a casa vazia, e uma sequencia de dias
 * sem gasto e informacao — nao um buraco na serie.
 */
export interface GastoDiario {
  /** Data ISO (YYYY-MM-DD). */
  data: string;
  valor: number;
}

export type AlertKind = 'FATURA_VENCENDO' | 'CONTA_VENCENDO' | 'LANCAMENTO_AGENDADO' | 'LIMITE_CARTAO';

export type AlertSeverity = 'CRITICO' | 'ATENCAO' | 'INFO';

export interface Alert {
  id: ID;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Data ISO (YYYY-MM-DD) a que o aviso se refere. */
  date: string;
  /** Valor envolvido, quando o aviso tiver um. */
  amount?: number;
  /** Rota que responde ao aviso. */
  to?: string;
}

/** Resposta de GET /dashboard/resumo. Ver docs/api/01-dashboard-resumo.pdf. */
export interface ResumoDashboard {
  /** Primeiro mes do periodo, YYYY-MM. */
  de: string;
  /** Ultimo mes do periodo, YYYY-MM. Igual a `de` quando o recorte e um mes so. */
  ate: string;
  saldoAtual: number;
  variacaoSaldo: Variacao;
  receitasMes: number;
  variacaoReceitas: Variacao;
  despesasMes: number;
  variacaoDespesas: Variacao;
  totalInvestido: number;
  variacaoInvestimentos: Variacao;
  /**
   * Nunca nulo, e `nomeCartao` nunca vazio: sem cartao movimentado no mes vem
   * "Nenhum cartao", porque a tela monta o rodape do bloco concatenando nome e
   * vencimento e uma string vazia deixaria um "·" solto na frente da data.
   */
  faturaAtual: {
    total: number;
    nomeCartao: string;
    dataVencimento: string;
    situacao: SituacaoFatura;
  };
  historicoSaldo: PontoSaldo[];
  fluxoCaixa: PontoFluxo[];
  /** Todos os dias da janela dos graficos, do primeiro ao ultimo, em ordem. */
  gastoDiario: GastoDiario[];
  gastoPorCategoria: GastoPorCategoria[];
  lancamentosRecentes: Lancamento[];
}

/* -------------------------------------------------------------------------- */
/* Orcamento                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `warning` comeca na faixa de atencao e `exceeded` so depois de o gasto passar
 * do limite. As faixas ficam em `constants/budget.ts`, junto das que pintam a
 * barra, para que cor e rotulo nunca discordem.
 */
export type BudgetStatus = 'SEGURO' | 'ALERTA' | 'ESTOURADO';

/**
 * Limite mensal de uma categoria de despesa. O orcamento e recorrente: vale
 * todo mes ate ser alterado, e nao um registro por mes — quem planeja gasto de
 * alimentacao nao quer redigitar o mesmo numero em janeiro, fevereiro e marco.
 */
export interface Budget {
  id: ID;
  category: Categoria;
  limit: number;
}

export interface BudgetPayload {
  categoryId: ID;
  limit: number;
}

export interface BudgetUsage {
  budget: Budget;
  spent: number;
  /** Quanto ainda cabe no limite; negativo quando estourou. */
  remaining: number;
  /** Consumo do limite; passa de 1 no estouro. */
  ratio: number;
  /**
   * Onde o gasto chega no fim do mes mantido o ritmo atual. E o que torna a
   * tela util no dia 5, quando toda barra ainda esta vazia e nenhum limite
   * disparou: 30% consumidos em 10% do mes ja e um aviso.
   */
  projected: number;
  status: BudgetStatus;
}

export interface BudgetOverview {
  /** Mes de referencia, YYYY-MM. */
  month: string;
  planned: number;
  spent: number;
  remaining: number;
  ratio: number;
  /** Dias que ainda faltam no mes; zero quando o mes ja se encerrou. */
  daysLeft: number;
  /** Dias ja vividos do mes, base da projecao de ritmo. */
  daysElapsed: number;
  daysInMonth: number;
  items: BudgetUsage[];
  /**
   * Categorias com gasto no mes e sem limite definido. Sem elas, a soma dos
   * orcamentos pareceria o gasto total do mes, e nao e.
   */
  unplanned: GastoPorCategoria[];
}

/* -------------------------------------------------------------------------- */
/* Despesas recorrentes                                                       */
/* -------------------------------------------------------------------------- */

export type RecurrenceFrequency =
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

/** Pausada continua no cadastro, mas sai do custo mensal e da previsao. */
export type RecurringStatus = 'ATIVO' | 'PAUSADO';

export interface RecurringExpense {
  id: ID;
  description: string;
  amount: number;
  category: Categoria | null;
  frequency: RecurrenceFrequency;
  /** Data ISO do proximo vencimento. */
  nextDueDate: string;
  /** Conta ou cartao de onde o dinheiro sai. */
  accountId: ID;
  accountName: string;
  status: RecurringStatus;
  notes?: string;
}

export interface RecurringPayload {
  description: string;
  amount: number;
  categoryId?: ID;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  accountId: ID;
  status: RecurringStatus;
  notes?: string;
}

export interface RecurringSummary {
  items: RecurringExpense[];
  /**
   * Custo mensal equivalente das ativas: a anual entra dividida por doze, a
   * semanal multiplicada por 4,33. Sem essa normalizacao, somar assinatura
   * mensal com seguro anual daria um numero que nao corresponde a mes nenhum.
   */
  monthlyCost: number;
  yearlyCost: number;
  /** As que vencem dentro da janela de atencao, da mais proxima em diante. */
  dueSoon: RecurringExpense[];
}

/* -------------------------------------------------------------------------- */
/* Previsao financeira                                                        */
/* -------------------------------------------------------------------------- */

export interface ForecastMonth {
  /** Mes projetado, YYYY-MM. */
  month: string;
  /** Rotulo curto do mes, com inicial maiuscula: "Jan", "Fev"... */
  label: string;
  income: number;
  /** Despesas recorrentes que caem no mes. */
  recurring: number;
  /** Parcelas de compras parceladas que caem nas faturas do mes. */
  installments: number;
  /** O gasto variavel que sobra depois de descontar recorrentes e parcelas. */
  variable: number;
  /** Soma das tres linhas de despesa. */
  expense: number;
  net: number;
  /** Saldo projetado no fim do mes. */
  endingBalance: number;
}

export interface ForecastSummary {
  /** Saldo de hoje; e de onde a projecao parte. */
  startingBalance: number;
  months: ForecastMonth[];
  /** Saldo projetado no fim da janela. */
  endingBalance: number;
  /** Resultado medio dos meses projetados. */
  averageNet: number;
  /** O mes mais apertado da janela — o que a tela existe para antecipar. */
  lowest: { month: string; balance: number };
}

/* -------------------------------------------------------------------------- */
/* Relatorios                                                                 */
/* -------------------------------------------------------------------------- */

/** Recorte de datas de um relatorio; aqui o dia importa, nao so o mes. */
export interface ReportRange {
  /** Data ISO inicial, inclusiva. */
  from: string;
  /** Data ISO final, inclusiva. */
  to: string;
}

/** Gasto somado por origem do dinheiro: uma conta ou um cartao. */
export interface SourceSpending {
  id: ID;
  name: string;
  group: 'CONTA' | 'CARTAO';
  amount: number;
  /** Participacao no total de despesas do recorte (0 a 1). */
  share: number;
}

/**
 * Patrimonio de um mes separado em suas duas metades: o que esta em conta e o
 * que esta investido. Somadas elas dao o total, mas a divisao e a informacao —
 * um total estavel pode esconder dinheiro migrando de um lado para o outro.
 */
export interface NetWorthPoint {
  label: string;
  month: string;
  accounts: number;
  investments: number;
  total: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  income: number;
  expense: number;
  net: number;
  incomeDelta: Variacao;
  expenseDelta: Variacao;
  /** Quantos lancamentos entraram na conta, transferencias a parte. */
  transactionCount: number;
  expenseByCategory: GastoPorCategoria[];
  incomeByCategory: GastoPorCategoria[];
  /**
   * Entradas e saidas agrupadas. O balde e a semana em recortes curtos e o mes
   * nos longos: doze barras de um ano se leem, trezentas e sessenta nao.
   */
  cashflow: PontoFluxo[];
  expenseBySource: SourceSpending[];
  balanceHistory: PontoSaldo[];
  netWorth: NetWorthPoint[];
}

/* -------------------------------------------------------------------------- */
/* Metas e desejos                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `tracking` e a meta viva, a unica que entra nos totais da tela. `purchased` e
 * `cancelled` saem do acompanhamento mas continuam no cadastro: o historico ja
 * registrado e o que responde se a compra aconteceu no momento certo.
 */
export type GoalStatus = 'ACOMPANHANDO' | 'COMPRADA' | 'CANCELADA';

/**
 * Um preco consultado num dia. O registro nunca substitui o anterior — e a
 * regra que sustenta a tela inteira: sem a serie completa nao ha menor preco,
 * media nem grafico de evolucao, so o ultimo numero digitado.
 */
export interface GoalPriceEntry {
  id: ID;
  /** Data ISO (YYYY-MM-DD) da consulta. */
  date: string;
  price: number;
  note?: string;
}

export interface Goal {
  id: ID;
  name: string;
  /** Endereco da pagina do produto, quando informado. */
  url?: string;
  imageUrl?: string;
  status: GoalStatus;
  notes?: string;
  /** Data ISO do primeiro registro. */
  createdAt: string;
  /** Do registro mais antigo ao mais recente; nunca vazio. */
  history: GoalPriceEntry[];
}

/**
 * Cadastro de uma meta. Leva o primeiro preco junto porque uma meta sem nenhum
 * registro nao teria preco atual para mostrar — o cadastro e, ao mesmo tempo,
 * a primeira consulta.
 */
export interface GoalPayload {
  name: string;
  url?: string;
  imageUrl?: string;
  price: number;
  /** Data do primeiro registro; sem ela o servidor usa hoje. */
  date: string;
  status: GoalStatus;
  notes?: string;
}

/**
 * Edicao nao mexe em preco. Corrigir o valor pela edicao apagaria um ponto do
 * historico; preco novo e sempre um registro novo.
 */
export interface GoalUpdatePayload {
  name: string;
  url?: string;
  imageUrl?: string;
  status: GoalStatus;
  notes?: string;
}

export interface GoalPricePayload {
  price: number;
  date: string;
  note?: string;
}

/**
 * Leitura do preco atual dentro da faixa ja registrada. O texto de cada caso
 * fica em `constants/goals.ts`: a analise e conta de servidor, a frase e
 * interface.
 */
export type GoalInsight = 'PRIMEIRO' | 'MENOR' | 'ABAIXO_DA_MEDIA' | 'ACIMA_DA_MEDIA' | 'MAIOR' | 'ESTAVEL';

export interface GoalAnalysis {
  /** Preco do primeiro registro; e a referencia de toda a variacao. */
  initialPrice: number;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  /** Diferenca em reais entre o preco atual e o primeiro registrado. */
  change: number;
  /** Variacao percentual sobre o primeiro registro: -10 e uma queda de 10%. */
  changePercentage: number;
  /** Direcao do preco. Aqui `down` e a boa noticia de quem pretende comprar. */
  trend: Tendencia;
  /** Quanto o preco atual esta abaixo do maior ja registrado; nunca negativo. */
  savings: number;
  /** Data ISO do registro mais recente. */
  lastUpdate: string;
  /** Quantos precos ja foram registrados, contando o inicial. */
  entryCount: number;
  insight: GoalInsight;
}

/** Uma meta com os numeros da tela ja calculados, como a API devolveria. */
export interface GoalTracking {
  goal: Goal;
  analysis: GoalAnalysis;
}

/**
 * Os totais olham apenas as metas em acompanhamento: somar o preco de algo ja
 * comprado ou cancelado num "quanto custa a minha lista" seria contar duas
 * vezes o que ja saiu da conta ou nunca vai sair.
 */
export interface GoalsSummary {
  items: GoalTracking[];
  trackingCount: number;
  purchasedCount: number;
  /** Soma dos precos atuais das metas em acompanhamento. */
  currentTotal: number;
  /** Soma dos precos iniciais das mesmas metas. */
  initialTotal: number;
  /** Quanto o conjunto barateou (negativo) ou encareceu desde o registro. */
  totalChange: number;
  /** Soma do quanto cada meta esta abaixo do proprio pico. */
  totalSavings: number;
}
