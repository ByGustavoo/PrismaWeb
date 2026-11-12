import type { AcaoPorQuantidade } from '@/constants/investimentos';

function centavos(value: number): number {
  return Math.round(value * 100) / 100;
}

export function custoDaCompra(quantidade: number, precoUnitario: number, taxas = 0): number {
  return centavos(quantidade * precoUnitario + taxas);
}

export function valorDaVenda(quantidade: number, precoUnitario: number, taxas = 0): number {
  return centavos(quantidade * precoUnitario - taxas);
}

export function precoMedio(aportado: number, quantidade: number): number {
  return quantidade > 0 ? centavos(aportado / quantidade) : 0;
}

export function custoDasVendidas(acao: AcaoPorQuantidade, quantidade: number): number {
  return acao.quantidade > 0 ? centavos((acao.aportado * quantidade) / acao.quantidade) : 0;
}
