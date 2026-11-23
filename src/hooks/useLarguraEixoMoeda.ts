import { useMemo } from 'react';
import { formatarMoedaCompacta } from '@/utils/formatacao';

const LARGURA_MINIMA_EIXO = 78;
const FOLGA_EIXO = 22;
const TAMANHO_FONTE_EIXO = 12;
const MARCAS_ESTIMADAS = 6;

let contexto: CanvasRenderingContext2D | null | undefined;

function medirTexto(texto: string): number {
  if (contexto === undefined) contexto = document.createElement('canvas').getContext('2d');
  if (!contexto) return texto.length * TAMANHO_FONTE_EIXO * 0.6;
  contexto.font = `${TAMANHO_FONTE_EIXO}px ${getComputedStyle(document.body).fontFamily}`;
  return contexto.measureText(texto).width;
}

export function useLarguraEixoMoeda(valores: number[]): number {
  const chave = valores.join('|');

  return useMemo(() => {
    const finitos = valores.filter((valor) => Number.isFinite(valor));
    if (finitos.length === 0) return LARGURA_MINIMA_EIXO;

    const menor = Math.min(0, ...finitos);
    const maior = Math.max(...finitos);
    const passo = (maior - menor) / (MARCAS_ESTIMADAS - 1);
    const rotulos = Array.from({ length: MARCAS_ESTIMADAS }, (_, indice) =>
      formatarMoedaCompacta(menor + passo * indice),
    );
    const maisLargo = Math.max(...rotulos.map(medirTexto));

    return Math.max(LARGURA_MINIMA_EIXO, Math.ceil(maisLargo) + FOLGA_EIXO);
  }, [chave]);
}
