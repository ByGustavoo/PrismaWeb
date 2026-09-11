import type { ID, Tendencia, VariacaoDTO } from './comum';

export type TipoLancamento = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export type SituacaoLancamento = 'PAGO' | 'PENDENTE' | 'AGENDADO';

export type FormaLancamento = 'CONTA' | 'CARTAO_CREDITO' | 'PIX' | 'DINHEIRO';

export type TipoCategoria = 'RECEITA' | 'DESPESA';

export interface CategoriaDTO {
  id: ID;
  nome: string;
  tipo: TipoCategoria;
  tokenCor: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface LancamentoDTO {
  id: ID;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaLancamento;
  data: string;
  categoria: CategoriaDTO | null;
  idOrigem: ID;
  nomeOrigem: string;
  idContaDestino?: ID;
  nomeContaDestino?: string;
  observacoes?: string;
}

export interface SalvarLancamentoDTO {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaLancamento;
  data: string;
  idCategoria?: ID;
  idOrigem: ID;
  idContaDestino?: ID;
  observacoes?: string;
}

export type GrupoOrigem = 'CONTA' | 'CARTAO';

export interface OrigemDTO {
  id: ID;
  nome: string;
  grupo: GrupoOrigem;
}

export type TipoConta = 'CORRENTE' | 'SALARIO' | 'EMERGENCIA' | 'OUTRA';

export type Situacao = 'ATIVO' | 'INATIVO';

export interface ContaDTO {
  id: ID;
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo: number;
  situacao: Situacao;
  incluirNoTotal: boolean;
}

export interface SalvarContaDTO {
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo: number;
  situacao: Situacao;
  incluirNoTotal: boolean;
}

export type TipoCartao = 'CREDITO' | 'DEBITO' | 'VALE_ALIMENTACAO' | 'VALE_REFEICAO';

export interface CartaoDTO {
  id: ID;
  nome: string;
  instituicao: string;
  tipo: TipoCartao;
  situacao: Situacao;
  bandeira?: string;
  ultimosDigitos?: string;
  limiteCredito?: number;
  limiteComprometido?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  idConta?: ID;
  nomeConta?: string;
  saldo?: number;
}

export interface SalvarCartaoDTO {
  nome: string;
  instituicao: string;
  tipo: TipoCartao;
  situacao: Situacao;
  bandeira?: string;
  ultimosDigitos?: string;
  limiteCredito?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  idConta?: ID;
  saldo?: number;
}

export type SituacaoFatura = 'FUTURA' | 'ABERTA' | 'FECHADA' | 'PAGA' | 'VENCIDA';

export interface FaturaCartaoDTO {
  id: ID;
  idCartao: ID;
  nomeCartao: string;
  mes: string;
  total: number;
  situacao: SituacaoFatura;
  dataFechamento: string;
  dataVencimento: string;
  quantidadeItens: number;
  totalAnterior?: number;
}

export interface ParcelaItemFaturaDTO {
  numero: number;
  total: number;
  idCompra: ID;
}

export interface ItemFaturaDTO {
  id: ID;
  descricao: string;
  data: string;
  valor: number;
  categoria: CategoriaDTO | null;
  parcela?: ParcelaItemFaturaDTO;
}

export interface DetalheFaturaDTO extends FaturaCartaoDTO {
  itens: ItemFaturaDTO[];
}

export type SituacaoParcela = 'PAGA' | 'ATUAL' | 'FUTURA';

export interface ParcelaDTO {
  numero: number;
  mes: string;
  dataVencimento: string;
  valor: number;
  situacao: SituacaoParcela;
}

export interface CompraParceladaDTO {
  id: ID;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  dataCompra: string;
  primeiroMes: string;
  idCartao: ID;
  nomeCartao: string;
  categoria: CategoriaDTO | null;
  observacoes?: string;
}

export interface PlanoCompraParceladaDTO {
  compra: CompraParceladaDTO;
  valorParcela: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  valorPago: number;
  valorRestante: number;
  parcelaAtual: ParcelaDTO | null;
  cronograma: ParcelaDTO[];
}

export interface SalvarCompraParceladaDTO {
  descricao: string;
  valorTotal: number;
  parcelas: number;
  dataCompra: string;
  primeiroMes: string;
  idCartao: ID;
  idCategoria?: ID;
  observacoes?: string;
}

export type ClasseAtivo =
  | 'RENDA_FIXA'
  | 'CDB'
  | 'TESOURO'
  | 'ACOES'
  | 'ETF'
  | 'FUNDOS'
  | 'CRIPTO'
  | 'OUTROS';

export interface InvestimentoDTO {
  id: ID;
  nome: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  aportado: number;
  valorAtual: number;
  dataInicio: string;
  observacoes?: string;
}

export interface SalvarInvestimentoDTO {
  nome: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  aportado: number;
  valorAtual: number;
  dataInicio: string;
  observacoes?: string;
}

export interface PosicaoDTO {
  investimento: InvestimentoDTO;
  rendimento: number;
  rentabilidade: number;
  participacao: number;
}

export interface AlocacaoDTO {
  classeAtivo: ClasseAtivo;
  aportado: number;
  valorAtual: number;
  rendimento: number;
  participacao: number;
  quantidade: number;
}

export interface EvolucaoCarteiraDTO {
  rotulo: string;
  mes: string;
  aportado: number;
  valor: number;
}

export interface CarteiraDTO {
  aportado: number;
  valorAtual: number;
  rendimento: number;
  rentabilidade: number;
  variacaoValorAtual: VariacaoDTO;
  alocacao: AlocacaoDTO[];
  historico: EvolucaoCarteiraDTO[];
  posicoes: PosicaoDTO[];
}

export interface GastoCategoriaDTO {
  categoria: CategoriaDTO;
  valor: number;
  participacao: number;
}

export interface FluxoDTO {
  rotulo: string;
  receitas: number;
  despesas: number;
}

export interface SaldoDTO {
  rotulo: string;
  saldo: number;
}

export interface GastoDiarioDTO {
  data: string;
  valor: number;
}

export type TipoAviso = 'FATURA_VENCENDO' | 'CONTA_VENCENDO' | 'LANCAMENTO_AGENDADO' | 'LIMITE_CARTAO';

export type SeveridadeAviso = 'CRITICO' | 'ATENCAO' | 'INFO';

export interface AvisoDTO {
  id: ID;
  tipo: TipoAviso;
  severidade: SeveridadeAviso;
  titulo: string;
  descricao: string;
  data: string;
  valor?: number;
  rota?: string;
}

export interface FaturaDTO {
  total: number;
  nomeCartao: string;
  dataVencimento: string;
  situacao: SituacaoFatura;
}

export interface DashboardDTO {
  dataInicial: string;
  dataFinal: string;
  saldoAtual: number;
  variacaoSaldo: VariacaoDTO;
  receitasMes: number;
  variacaoReceitas: VariacaoDTO;
  despesasMes: number;
  variacaoDespesas: VariacaoDTO;
  totalInvestido: number;
  variacaoInvestimentos: VariacaoDTO;
  faturaAtual: FaturaDTO | null;
  historicoSaldo: SaldoDTO[];
  fluxoCaixa: FluxoDTO[];
  gastoDiario: GastoDiarioDTO[];
  gastoPorCategoria: GastoCategoriaDTO[];
  lancamentosRecentes: LancamentoDTO[];
}

export type SituacaoOrcamento = 'SEGURO' | 'ALERTA' | 'ESTOURADO';

export interface OrcamentoDTO {
  id: ID;
  categoria: CategoriaDTO;
  limiteMensal: number;
}

export interface SalvarOrcamentoDTO {
  idCategoria: ID;
  limiteMensal: number;
}

export interface ConsumoOrcamentoDTO {
  orcamento: OrcamentoDTO;
  gasto: number;
  restante: number;
  consumo: number;
  projecao: number;
  situacao: SituacaoOrcamento;
}

export interface VisaoGeralOrcamentoDTO {
  mes: string;
  planejado: number;
  gasto: number;
  restante: number;
  consumo: number;
  diasRestantes: number;
  diasDecorridos: number;
  diasNoMes: number;
  itens: ConsumoOrcamentoDTO[];
  foraDoOrcamento: GastoCategoriaDTO[];
}

export type Frequencia =
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type SituacaoDespesaRecorrente = 'ATIVO' | 'PAUSADO';

export interface DespesaRecorrenteDTO {
  id: ID;
  descricao: string;
  valor: number;
  categoria: CategoriaDTO | null;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: ID;
  nomeOrigem: string;
  situacao: SituacaoDespesaRecorrente;
  observacoes?: string;
}

export interface SalvarDespesaRecorrenteDTO {
  descricao: string;
  valor: number;
  idCategoria?: ID;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: ID;
  situacao: SituacaoDespesaRecorrente;
  observacoes?: string;
}

export interface ResumoDespesasRecorrentesDTO {
  itens: DespesaRecorrenteDTO[];
  custoMensal: number;
  custoAnual: number;
  vencendoEmBreve: DespesaRecorrenteDTO[];
}

export interface MesPrevisaoDTO {
  mes: string;
  rotulo: string;
  receita: number;
  recorrentes: number;
  parcelas: number;
  variavel: number;
  despesa: number;
  resultado: number;
  saldoFinal: number;
}

export interface MenorSaldoDTO {
  mes: string;
  saldo: number;
}

export interface PrevisaoDTO {
  saldoInicial: number;
  meses: MesPrevisaoDTO[];
  saldoFinal: number;
  resultadoMedio: number;
  menorSaldo: MenorSaldoDTO;
}

export interface PeriodoRelatorio {
  dataInicial: string;
  dataFinal: string;
}

export interface GastoOrigemDTO {
  id: ID;
  nome: string;
  grupo: GrupoOrigem;
  valor: number;
  participacao: number;
}

export interface PatrimonioDTO {
  rotulo: string;
  mes: string;
  contas: number;
  investimentos: number;
  total: number;
}

export interface RelatorioDTO {
  dataInicial: string;
  dataFinal: string;
  receitas: number;
  despesas: number;
  resultado: number;
  variacaoReceitas: VariacaoDTO;
  variacaoDespesas: VariacaoDTO;
  quantidadeLancamentos: number;
  despesasPorCategoria: GastoCategoriaDTO[];
  receitasPorCategoria: GastoCategoriaDTO[];
  fluxoCaixa: FluxoDTO[];
  despesasPorOrigem: GastoOrigemDTO[];
  historicoSaldo: SaldoDTO[];
  patrimonio: PatrimonioDTO[];
}

export type SituacaoMeta = 'ACOMPANHANDO' | 'COMPRADA' | 'CANCELADA';

export interface MetaPrecoDTO {
  id: ID;
  data: string;
  preco: number;
  observacao?: string;
}

export interface MetaDTO {
  id: ID;
  nome: string;
  url?: string;
  urlImagem?: string;
  situacao: SituacaoMeta;
  observacoes?: string;
  dataCriacao: string;
  historico: MetaPrecoDTO[];
}

export interface SalvarMetaDTO {
  nome: string;
  url?: string;
  urlImagem?: string;
  preco: number;
  data: string;
  situacao: SituacaoMeta;
  observacoes?: string;
}

export interface AtualizarMetaDTO {
  nome: string;
  url?: string;
  urlImagem?: string;
  situacao: SituacaoMeta;
  observacoes?: string;
}

export interface SalvarMetaPrecoDTO {
  preco: number;
  data: string;
  observacao?: string;
}

export type LeituraMeta = 'PRIMEIRO' | 'MENOR' | 'ABAIXO_DA_MEDIA' | 'ACIMA_DA_MEDIA' | 'MAIOR' | 'ESTAVEL';

export interface AnaliseMetaDTO {
  precoInicial: number;
  precoAtual: number;
  menorPreco: number;
  maiorPreco: number;
  precoMedio: number;
  variacao: number;
  variacaoPercentual: number;
  tendencia: Tendencia;
  economia: number;
  ultimaAtualizacao: string;
  quantidadeRegistros: number;
  leitura: LeituraMeta;
}

export interface AcompanhamentoMetaDTO {
  meta: MetaDTO;
  analise: AnaliseMetaDTO;
}

export interface ResumoMetasDTO {
  itens: AcompanhamentoMetaDTO[];
  quantidadeAcompanhando: number;
  quantidadeCompradas: number;
  totalAtual: number;
  totalInicial: number;
  variacaoTotal: number;
  economiaTotal: number;
}
