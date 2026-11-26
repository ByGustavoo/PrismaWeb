import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consultaVazia, paraFiltroDoServidor } from './consulta';

describe('paraFiltroDoServidor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 25, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sem filtro manda só página, tamanho e ordenação', () => {
    expect(paraFiltroDoServidor(consultaVazia, undefined, 0, 25)).toEqual({
      tipo: undefined,
      busca: undefined,
      dataInicial: undefined,
      dataFinal: undefined,
      idCategoria: undefined,
      idOrigem: undefined,
      situacao: undefined,
      pagina: 0,
      tamanho: 25,
      ordenacao: 'DATA',
      direcao: 'DESC',
    });
  });

  it('o tipo da tela vale mais que o filtro de tipo', () => {
    const consulta = { ...consultaVazia, tipo: 'DESPESA' };
    expect(paraFiltroDoServidor(consulta, 'RECEITA', 0, 25).tipo).toBe('RECEITA');
    expect(paraFiltroDoServidor(consulta, undefined, 0, 25).tipo).toBe('DESPESA');
  });

  it('a busca vai sem espaços nas pontas, e vazia não vai', () => {
    expect(paraFiltroDoServidor({ ...consultaVazia, busca: '  água ' }, undefined, 0, 25).busca).toBe('água');
    expect(paraFiltroDoServidor({ ...consultaVazia, busca: '   ' }, undefined, 0, 25).busca).toBeUndefined();
  });

  it('transforma o atalho de período em datas', () => {
    const filtro = paraFiltroDoServidor({ ...consultaVazia, periodo: 'this-month' }, undefined, 0, 25);
    expect(filtro.dataInicial).toBe('2026-11-01');
    expect(filtro.dataFinal).toBe('2026-11-30');
  });

  it('período personalizado manda só as datas preenchidas', () => {
    const filtro = paraFiltroDoServidor({ ...consultaVazia, periodo: 'custom', dataInicial: '2026-10-05' }, undefined, 0, 25);
    expect(filtro.dataInicial).toBe('2026-10-05');
    expect(filtro.dataFinal).toBeUndefined();
  });

  it('repassa categoria, conta, situação, página e ordenação', () => {
    const consulta = {
      ...consultaVazia,
      idCategoria: 'cat-1',
      idOrigem: 'conta-1',
      situacao: 'PENDENTE',
      campoOrdenacao: 'VALOR' as const,
      direcaoOrdenacao: 'ASC' as const,
    };
    expect(paraFiltroDoServidor(consulta, undefined, 3, 25)).toMatchObject({
      idCategoria: 'cat-1',
      idOrigem: 'conta-1',
      situacao: 'PENDENTE',
      pagina: 3,
      ordenacao: 'VALOR',
      direcao: 'ASC',
    });
  });
});
