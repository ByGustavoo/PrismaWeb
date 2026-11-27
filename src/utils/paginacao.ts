export type ItemPaginacao = number | 'reticencias-inicio' | 'reticencias-fim';

const VIZINHAS = 1;
const LIMITE_SEM_RETICENCIAS = 6;

export function paginasVisiveis(atual: number, quantidade: number): ItemPaginacao[] {
  if (quantidade <= LIMITE_SEM_RETICENCIAS) return Array.from({ length: quantidade }, (_, indice) => indice);

  const ultima = quantidade - 1;
  const inicio = Math.max(1, Math.min(atual - VIZINHAS, ultima - 1 - VIZINHAS * 2));
  const fim = Math.min(ultima - 1, Math.max(atual + VIZINHAS, 1 + VIZINHAS * 2));

  const itens: ItemPaginacao[] = [0];
  if (inicio > 1) itens.push('reticencias-inicio');
  for (let pagina = inicio; pagina <= fim; pagina++) itens.push(pagina);
  if (fim < ultima - 1) itens.push('reticencias-fim');
  itens.push(ultima);

  return itens;
}

export function faixaDaPagina(pagina: number, tamanho: number, total: number): { primeiro: number; ultimo: number } {
  if (total === 0) return { primeiro: 0, ultimo: 0 };
  const primeiro = pagina * tamanho + 1;
  return { primeiro, ultimo: Math.min(total, primeiro + tamanho - 1) };
}
