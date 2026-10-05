export const QUADROS_POR_SEGUNDO = 30;
export const LARGURA = 1920;
export const ALTURA = 1080;
export const QUADROS_POR_BATIDA = 12;
export const SOBREPOSICAO = 12;

const inicios = {
  abertura: 0,
  gancho: 108,
  dashboard: 288,
  parcelas: 432,
  orcamento: 600,
  previsao: 732,
  investimentos: 876,
  metas: 1008,
  confianca: 1140,
  encerramento: 1284,
} as const;

export const DURACAO_TOTAL = 1404;

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

export const dashboard = {
  titulo: 6,
  cartao: 10,
  contagem: 16,
  duracaoContagem: 30,
  linhas: [24, 30, 36],
  grafico: 30,
  duracaoGrafico: 36,
  indicadores: [48, 54, 60, 66],
} as const;

export const PARCELA = 299.83;

export const PARCELAS_TOTAIS = 12;
export const PARCELAS_PAGAS = 2;

export const parcelas = {
  titulo: 6,
  cartao: 10,
  segmentos: 18,
  intervaloSegmentos: 1,
  faturas: [22, 26, 30],
  pagamentos: [48, 60],
  duracaoPagamento: 10,
  voos: [84, 96, 108],
  duracaoVoo: 12,
  atrasoRastro: 5,
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

export const investimentos = {
  titulo: 6,
  cartao: 10,
  resumo: [14, 18, 22, 26],
  grafico: 24,
  duracaoGrafico: 40,
  rosca: 36,
  duracaoRosca: 36,
  legenda: [48, 52, 56, 60],
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
