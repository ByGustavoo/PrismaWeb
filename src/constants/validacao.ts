export const TAMANHO_MINIMO_TEXTO = 2;

export const limitesTexto = {
  nomeConta: 80,
  nomeCartao: 80,
  instituicao: 80,
  bandeiraCartao: 40,
  descricao: 160,
  nomeInvestimento: 120,
  codigoAcao: 12,
  nomeMeta: 120,
  link: 2048,
  observacoes: 500,
} as const;

export const DIGITOS_INTEIROS_MAXIMOS_VALOR = 12;
export const DIGITOS_MAXIMOS_QUANTIDADE_ACOES = 10;
export const PADRAO_CODIGO_ACAO = /^[A-Z0-9]{4,12}$/;
export const CASAS_DECIMAIS_MAXIMAS_VALOR = 2;

export const LIMIAR_CONTADOR_CARACTERES = 0.8;
