const LARGURA_ICONE_SELECAO = 15;

export interface LargurasDosFiltros {
  natural: number;
  justa: number;
  semIcone: number;
}

function largurasDoCampo(campo: HTMLElement): LargurasDosFiltros {
  const largura = campo.getBoundingClientRect().width;
  const ajustavel = campo.querySelector<HTMLElement>('[data-valor-ajustavel]');
  if (!ajustavel) return { natural: largura, justa: largura, semIcone: largura };

  const icone = campo.querySelector<SVGElement>('[data-icone]');
  const gatilho = icone?.parentElement;
  const espacoIcone = gatilho ? Number.parseFloat(getComputedStyle(gatilho).columnGap) || 0 : 0;
  const iconeVisivel = icone ? icone.getBoundingClientRect().width : 0;
  const larguraIcone = icone ? LARGURA_ICONE_SELECAO + espacoIcone : 0;
  const moldura = largura - ajustavel.getBoundingClientRect().width - (iconeVisivel > 0 ? larguraIcone : 0);

  const medidas = [...ajustavel.querySelectorAll<HTMLElement>('[data-medida]')].map(
    (medida) => medida.getBoundingClientRect().width,
  );
  const visivel = ajustavel.lastElementChild instanceof HTMLElement ? ajustavel.lastElementChild.scrollWidth : 0;

  return {
    natural: moldura + larguraIcone + Math.max(visivel, ...medidas),
    justa: moldura + larguraIcone + visivel,
    semIcone: moldura + visivel,
  };
}

export function espacoEntreFiltros(linha: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(linha).columnGap) || 0;
}

export function largurasDosFiltros(linha: HTMLElement): LargurasDosFiltros {
  const filtros = [...linha.children].filter(
    (filho): filho is HTMLElement => filho instanceof HTMLElement && !filho.matches('[data-ordenacao]'),
  );
  const espacos = espacoEntreFiltros(linha) * Math.max(0, filtros.length - 1);
  return filtros.map(largurasDoCampo).reduce(
    (total, campo) => ({
      natural: total.natural + campo.natural,
      justa: total.justa + campo.justa,
      semIcone: total.semIcone + campo.semIcone,
    }),
    { natural: espacos, justa: espacos, semIcone: espacos },
  );
}
