import { describe, expect, it } from 'vitest';
import { filtroFaturasAtuais, filtroFaturasDesde } from './fatura';

describe('filtroFaturasAtuais', () => {
  it('vai do mês passado ao seguinte', () => {
    expect(filtroFaturasAtuais('2026-11')).toEqual({ dataInicial: '2026-10', dataFinal: '2026-12' });
  });

  it('atravessa a virada do ano', () => {
    expect(filtroFaturasAtuais('2027-01')).toEqual({ dataInicial: '2026-12', dataFinal: '2027-02' });
  });
});

describe('filtroFaturasDesde', () => {
  it('corta o passado na janela e deixa o futuro aberto', () => {
    expect(filtroFaturasDesde(3, '2026-11')).toEqual({ dataInicial: '2026-08' });
    expect(filtroFaturasDesde(6, '2026-02')).toEqual({ dataInicial: '2025-08' });
  });

  it('sem janela não corta nada', () => {
    expect(filtroFaturasDesde(null, '2026-11')).toEqual({});
  });
});
