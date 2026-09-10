/*
 * Limites de campo impostos pelo esquema do banco. Ficam num lugar so porque
 * tres camadas precisam concordar: o formulario avisa enquanto a pessoa digita,
 * o store (e depois o backend) recusa com 422, e a coluna guarda. Se o
 * formulario aceitar mais do que a coluna, o usuario descobre o limite por um
 * erro 500 depois de preencher tudo.
 */

/** Minimo de caracteres de nome e descricao, igual ao CHECK do esquema. */
export const TEXT_MIN_LENGTH = 2;

/** Tamanho das colunas VARCHAR, em caracteres. */
export const textLimits = {
  accountName: 80,
  cardName: 80,
  institution: 80,
  cardBrand: 40,
  description: 160,
  investmentName: 120,
  goalName: 120,
  link: 2048,
  /*
   * Observacao e a excecao: a coluna e TEXT e nao limita nada. O limite e de
   * produto — cabe um paragrafo de contexto, nao um contrato colado inteiro.
   */
  notes: 500,
} as const;

/** Colunas de dinheiro sao NUMERIC(14,2): doze digitos inteiros e duas casas decimais. */
export const AMOUNT_MAX_INTEGER_DIGITS = 12;
export const AMOUNT_MAX_DECIMALS = 2;

/*
 * A partir de quanto do limite o contador de caracteres aparece. Sempre a
 * vista, "0/2048" num campo de link seria ruido; so perto do fim ele informa.
 */
export const CHARACTER_COUNTER_THRESHOLD = 0.8;
