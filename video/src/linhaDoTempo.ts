export const PASSOS_POR_SEGUNDO = 30;
export const QUADROS_POR_SEGUNDO = 60;
export const QUADROS_POR_PASSO = QUADROS_POR_SEGUNDO / PASSOS_POR_SEGUNDO;
export const LARGURA = 1920;
export const ALTURA = 1080;
export const PASSOS_POR_BATIDA = 12;
export const SOBREPOSICAO = 12;

const inicios = {
  abertura: 0,
  gancho: 108,
  dashboard: 288,
  gastosDia: 444,
  lancamentos: 660,
  contas: 852,
  cartoes: 1128,
  faturas: 1260,
  parcelas: 1428,
  orcamento: 1584,
  previsao: 1716,
  recorrentes: 1860,
  metas: 2016,
  investimentos: 2148,
  relatorios: 2388,
  avisos: 2568,
  configuracoes: 2700,
  confianca: 2952,
  encerramento: 3096,
} as const;

export const DURACAO_TOTAL = 3216;
export const ANTECEDENCIA_SAIDA_NOTIFICACAO = 26;

export type NomeCena = keyof typeof inicios;

const ordem = Object.keys(inicios) as NomeCena[];

export const cenas = Object.fromEntries(
  ordem.map((nome, indice) => {
    const proxima = ordem[indice + 1];
    const fim = proxima ? inicios[proxima] + SOBREPOSICAO : DURACAO_TOTAL;
    return [nome, { inicio: inicios[nome], duracao: fim - inicios[nome] }];
  }),
) as Record<NomeCena, { inicio: number; duracao: number }>;

export const ordemCenas = ordem;

export const abertura = {
  linhaFundo: 0,
  marca: 6,
  faces: [12, 18, 24],
  brilho: 44,
  nome: 44,
  intervaloLetras: 3,
  legenda: 58,
} as const;

export const SALDO_ATUAL = 12480.35;

export const gancho = {
  titulo: 4,
  portas: [22, 27, 32, 37, 42],
  convergencia: 72,
  saldo: 80,
  conclusao: 96,
} as const;

export const HISTORICO_SALDO = [
  { rotulo: 'Mai', saldo: 8920.1 },
  { rotulo: 'Jun', saldo: 9415.8 },
  { rotulo: 'Jul', saldo: 9102.45 },
  { rotulo: 'Ago', saldo: 10268.9 },
  { rotulo: 'Set', saldo: 11342.75 },
  { rotulo: 'Out', saldo: SALDO_ATUAL },
] as const;

export const PATRIMONIO = 60800.85;

export const dashboard = {
  titulo: 6,
  cartao: 10,
  contagem: 16,
  duracaoContagem: 30,
  patrimonio: 20,
  linhas: [26, 32, 38],
  grafico: 30,
  duracaoGrafico: 36,
  indicadores: [48, 54, 60, 66],
  legendas: 84,
} as const;

export const HOJE = '2026-10-25';
export const PRIMEIRO_DIA_CALENDARIO = '2026-05-01';
export const ULTIMO_DIA_CALENDARIO = '2026-10-31';
export const DESPESAS_MES = 5912.4;

export const gastosDia = {
  titulo: 6,
  cartao: 10,
  meses: [20, 25, 30, 35, 40, 45],
  duracaoMes: 14,
  estatisticas: [40, 44, 48, 52],
  contagem: 40,
  duracaoContagem: 24,
  legenda: 58,
  focos: [84, 120, 156],
} as const;

export const DESCRICAO_LANCAMENTO = 'Supermercado';
export const DIGITOS_VALOR = '48790';
export const PASSOS_POR_LETRA = 2;

export const lancamentos = {
  titulo: 6,
  cartao: 10,
  linhas: [18, 22, 26, 30],
  formulario: 30,
  descricao: 40,
  digitos: [72, 78, 84, 90, 96],
  salvar: 108,
  novaLinha: 112,
  notificacao: 114,
} as const;

export function passoDaLetra(indice: number): number {
  return lancamentos.descricao + indice * PASSOS_POR_LETRA;
}

export const contas = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22],
  contagem: 16,
  duracaoContagem: 30,
  contas: [24, 30, 36, 42],
  lancamento: 60,
  debito: 96,
  duracaoDebito: 20,
  transferencia: 136,
  chegadaTransferencia: 208,
  duracaoTransferencia: 24,
} as const;

export const cartoes = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22],
  blocos: [24, 32],
  barra: 36,
  duracaoBarra: 30,
  contaPagamento: 72,
} as const;

export const ITENS_FATURA = 3;

export const faturas = {
  titulo: 6,
  cartao: 10,
  cabecalho: 16,
  itens: [24, 29, 34],
  rodape: 40,
  clique: 72,
  pagos: [78, 84, 90],
  contagem: 78,
  duracaoContagem: 18,
  selo: 96,
  notificacao: 100,
} as const;

export const PARCELAS_COMPRA = 10;
export const PARCELAS_JA_PAGAS = 6;
export const VALOR_PARCELA = 540;

export const parcelas = {
  titulo: 6,
  cartao: 10,
  resumo: 16,
  segmentos: 20,
  intervaloSegmentos: 1,
  linhas: [26, 30, 34, 38, 42],
  clique: 72,
  pagamento: 74,
  duracaoPagamento: 16,
  notificacao: 84,
} as const;

export const orcamento = {
  titulo: 6,
  cartao: 10,
  resumo: 16,
  linhas: [24, 30, 36, 42],
  duracaoBarra: 40,
} as const;

export const previsao = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22, 26],
  barras: 30,
  intervaloBarras: 6,
  linha: 36,
  duracaoLinha: 40,
  mesApertado: 84,
} as const;

export const recorrentes = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22],
  cartoes: [24, 28, 32, 36, 40, 44],
  clique: 84,
  pausa: 86,
  duracaoPausa: 18,
} as const;

export const metas = {
  titulo: 6,
  cartao: 10,
  pontos: [24, 36, 48, 60],
  duracaoTrecho: 8,
  duracaoMedia: 20,
  selo: 64,
  leitura: 76,
} as const;

export const investimentos = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22, 26],
  grafico: 24,
  duracaoGrafico: 40,
  rosca: 36,
  duracaoRosca: 36,
  legenda: [48, 52, 56, 60, 64],
  reserva: 72,
  focos: [90, 132, 174],
  fimFoco: 214,
} as const;

export const relatorios = {
  titulo: 6,
  cartao: 10,
  periodos: 16,
  dados: 22,
  cliques: [48, 84, 120],
  troca: 2,
  duracaoTroca: 16,
  intervaloBarras: 2,
  duracaoBarra: 14,
} as const;

export const TOTAL_AVISOS = 25;

export const avisos = {
  titulo: 6,
  cartao: 10,
  sino: 24,
  contador: 30,
  painel: 42,
  itens: [50, 56, 62, 68],
  destaque: 84,
} as const;

export const configuracoes = {
  titulo: 6,
  cartao: 10,
  menu: 16,
  paineis: [20, 26],
  cliqueClaro: 52,
  cliqueEscuro: 104,
  duracaoTema: 16,
  rolagem: 132,
  duracaoRolagem: 24,
  clique: 170,
  destaqueMenu: 174,
  saidaMenu: 192,
  duracaoSaida: 16,
  salvo: 192,
  resumo: 192,
} as const;

export const confianca = {
  titulo: 4,
  selos: [20, 25, 30, 35, 40],
  rodape: 48,
} as const;

export const encerramento = {
  marca: 12,
  nome: 20,
  slogan: 30,
  fechoSlogan: 48,
} as const;
