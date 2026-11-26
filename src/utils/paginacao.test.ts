import { describe, expect, it } from 'vitest';
import { faixaDaPagina, paginasVisiveis } from './paginacao';

describe('paginasVisiveis', () => {
  it('mostra todas quando cabem sem reticências', () => {
    expect(paginasVisiveis(0, 1)).toEqual([0]);
    expect(paginasVisiveis(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('no começo mostra as primeiras e a última', () => {
    expect(paginasVisiveis(0, 12)).toEqual([0, 1, 2, 3, 'reticencias-fim', 11]);
  });

  it('no meio mostra a primeira, as vizinhas da atual e a última', () => {
    expect(paginasVisiveis(5, 12)).toEqual([0, 'reticencias-inicio', 4, 5, 6, 'reticencias-fim', 11]);
  });

  it('no fim mostra a primeira e as últimas', () => {
    expect(paginasVisiveis(11, 12)).toEqual([0, 'reticencias-inicio', 8, 9, 10, 11]);
  });

  it('mantém sempre a mesma quantidade de itens para o paginador não mudar de largura', () => {
    const tamanhos = Array.from({ length: 12 }, (_, atual) => paginasVisiveis(atual, 12).length);
    expect(new Set(tamanhos).size).toBeLessThanOrEqual(2);
  });
});

describe('faixaDaPagina', () => {
  it('calcula do primeiro ao último item da página', () => {
    expect(faixaDaPagina(0, 25, 279)).toEqual({ primeiro: 1, ultimo: 25 });
    expect(faixaDaPagina(1, 25, 279)).toEqual({ primeiro: 26, ultimo: 50 });
  });

  it('a última página termina no total', () => {
    expect(faixaDaPagina(11, 25, 279)).toEqual({ primeiro: 276, ultimo: 279 });
  });

  it('sem itens fica zerada', () => {
    expect(faixaDaPagina(0, 25, 0)).toEqual({ primeiro: 0, ultimo: 0 });
  });
});
