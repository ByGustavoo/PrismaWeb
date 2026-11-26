import type { CartaoDTO, Situacao, TipoCartao } from '@/types';

export const rotuloTipoCartao: Record<TipoCartao, string> = {
  CREDITO: 'Cartão de crédito',
  DEBITO: 'Cartão de débito',
  'VALE_ALIMENTACAO': 'Vale-alimentação',
  'VALE_REFEICAO': 'Vale-refeição',
};

export const rotuloCurtoTipoCartao: Record<TipoCartao, string> = {
  CREDITO: 'Crédito',
  DEBITO: 'Débito',
  'VALE_ALIMENTACAO': 'Alimentação',
  'VALE_REFEICAO': 'Refeição',
};

export const tiposCartao: TipoCartao[] = ['CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO'];

export const rotuloSituacaoCartao: Record<Situacao, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};

export const situacoesCartao: Situacao[] = ['ATIVO', 'INATIVO'];

export type CartaoCredito = CartaoDTO & {
  tipo: 'CREDITO';
  limiteCredito: number;
  diaFechamento: number;
  diaVencimento: number;
};

export function ehCartaoCredito(card: CartaoDTO): card is CartaoCredito {
  return (
    card.tipo === 'CREDITO' &&
    typeof card.limiteCredito === 'number' &&
    typeof card.diaFechamento === 'number' &&
    typeof card.diaVencimento === 'number'
  );
}

export function ehCartaoVale(card: CartaoDTO): boolean {
  return card.tipo === 'VALE_ALIMENTACAO' || card.tipo === 'VALE_REFEICAO';
}

export const TODOS_CARTOES = 'all';

export const PROPORCAO_ALERTA_LIMITE_CARTAO = 0.7;
export const PROPORCAO_CRITICA_LIMITE_CARTAO = 0.9;

export function limiteComprometido(cartoes: CartaoCredito[]): number {
  return cartoes.reduce((soma, cartao) => soma + (cartao.limiteComprometido ?? 0), 0);
}

export function limiteDisponivel(cartoes: CartaoCredito[]): number {
  const ativos = cartoes.filter((cartao) => cartao.situacao === 'ATIVO');
  const limite = ativos.reduce((soma, cartao) => soma + cartao.limiteCredito, 0);
  return Math.max(limite - limiteComprometido(ativos), 0);
}
