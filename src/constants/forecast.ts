/**
 * Meses projetados na previsao. Seis alcancam o horizonte em que decisoes ainda
 * sao possiveis (adiar uma compra, cortar uma assinatura) sem estender a
 * projecao ate onde a media historica deixa de significar alguma coisa.
 */
export const FORECAST_MONTHS = 6;

/**
 * Meses fechados usados como base das medias de receita e de gasto variavel.
 * Tres suavizam o mes atipico sem diluir uma mudanca recente de padrao.
 */
export const FORECAST_BASELINE_MONTHS = 3;
