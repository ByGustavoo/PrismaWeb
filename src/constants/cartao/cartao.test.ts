import { describe, expect, it } from 'vitest';
import { type CartaoCredito, limiteComprometido, limiteDisponivel } from './cartao';

function cartao(nome: string, situacao: CartaoCredito['situacao'], limiteCredito: number, comprometido?: number): CartaoCredito {
  return {
    id: nome,
    nome,
    instituicao: 'Banco Aurora',
    tipo: 'CREDITO',
    situacao,
    limiteCredito,
    limiteComprometido: comprometido,
    diaFechamento: 3,
    diaVencimento: 10,
  };
}

describe('limites dos cartões de crédito', () => {
  const cartoes = [cartao('Platinum', 'ATIVO', 12000, 3662.3), cartao('Nexo', 'ATIVO', 5000, 900), cartao('Antigo', 'INATIVO', 8000, 300)];

  it('o disponível soma só os cartões ativos', () => {
    expect(limiteDisponivel(cartoes)).toBeCloseTo(12437.7);
  });

  it('o comprometido soma todos, porque a dívida do inativo continua', () => {
    expect(limiteComprometido(cartoes)).toBeCloseTo(4862.3);
  });

  it('o disponível nunca fica negativo', () => {
    expect(limiteDisponivel([cartao('Estourado', 'ATIVO', 1000, 1500)])).toBe(0);
  });

  it('cartão sem comprometido conta como zero', () => {
    expect(limiteDisponivel([cartao('Novo', 'ATIVO', 2000)])).toBe(2000);
  });
});
