import { describe, expect, it } from 'vitest';
import type { FaturaDTO } from '@/types';
import {
  dentroDosProximosMeses,
  dentroDosUltimosMeses,
  filtroFaturasAtuais,
  filtroFaturasDesde,
  notaDaFatura,
  valorEmDestaqueDaFatura,
} from './fatura';

describe('filtroFaturasAtuais', () => {
  it('vai do mês passado ao seguinte', () => {
    expect(filtroFaturasAtuais('2026-11')).toEqual({ dataInicial: '2026-10', dataFinal: '2026-12' });
  });

  it('atravessa a virada do ano', () => {
    expect(filtroFaturasAtuais('2027-01')).toEqual({ dataInicial: '2026-12', dataFinal: '2027-02' });
  });
});

describe('filtroFaturasDesde', () => {
  it('corta o passado na janela, contando o mês atual, e deixa o futuro aberto', () => {
    expect(filtroFaturasDesde(3, '2026-11')).toEqual({ dataInicial: '2026-09' });
    expect(filtroFaturasDesde(6, '2026-02')).toEqual({ dataInicial: '2025-09' });
  });

  it('sem janela não corta nada', () => {
    expect(filtroFaturasDesde(null, '2026-11')).toEqual({});
  });
});

describe('dentroDosUltimosMeses', () => {
  it('conta o mês atual dentro da janela', () => {
    expect(['2026-08', '2026-09', '2026-10', '2026-11'].filter((mes) => dentroDosUltimosMeses(mes, '2026-11', 3))).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('atravessa a virada do ano', () => {
    expect(dentroDosUltimosMeses('2025-09', '2026-02', 6)).toBe(true);
    expect(dentroDosUltimosMeses('2025-08', '2026-02', 6)).toBe(false);
  });

  it('sem janela mostra todas', () => {
    expect(dentroDosUltimosMeses('2020-01', '2026-11', null)).toBe(true);
  });
});

describe('dentroDosProximosMeses', () => {
  it('começa no mês seguinte e não conta o atual', () => {
    expect(['2026-12', '2027-01', '2027-02', '2027-03'].filter((mes) => dentroDosProximosMeses(mes, '2026-11', 3))).toEqual([
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('sem janela mostra todas', () => {
    expect(dentroDosProximosMeses('2030-01', '2026-11', null)).toBe(true);
  });
});

describe('fatura em destaque no dashboard', () => {
  const fatura: FaturaDTO = {
    total: 3142.8,
    valorRestante: 0,
    nomeCartao: 'Aurora Platinum',
    mes: '2026-10',
    dataVencimento: '2026-10-10',
    situacao: 'PAGA',
  };

  it('paga mostra o total e diz que foi paga', () => {
    expect(valorEmDestaqueDaFatura(fatura)).toBe(3142.8);
    expect(notaDaFatura(fatura)).toBe('Aurora Platinum — Paga, com vencimento em 10 de Outubro de 2026');
  });

  it('vencida mostra o que falta pagar e diz que venceu', () => {
    const vencida = { ...fatura, valorRestante: 1200, situacao: 'VENCIDA' as const };
    expect(valorEmDestaqueDaFatura(vencida)).toBe(1200);
    expect(notaDaFatura(vencida)).toBe('Aurora Platinum — Venceu em 10 de Outubro de 2026');
  });

  it('aberta mostra o que falta pagar e quando vence', () => {
    const aberta = { ...fatura, valorRestante: 850.5, situacao: 'ABERTA' as const };
    expect(valorEmDestaqueDaFatura(aberta)).toBe(850.5);
    expect(notaDaFatura(aberta)).toBe('Aurora Platinum — Vence em 10 de Outubro de 2026');
  });

  it('sem fatura mostra zero', () => {
    expect(valorEmDestaqueDaFatura(null)).toBe(0);
    expect(notaDaFatura(null)).toBe('Sem compras no cartão de crédito');
  });
});
