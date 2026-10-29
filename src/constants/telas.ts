import { caminhos } from '@/routes/caminhos';
import type { Tela } from '@/types';
import { navegacao } from './navegacao';
import type { SecaoNavegacao } from './navegacao';

export const caminhoDaTela: Record<Tela, string> = {
  LANCAMENTOS: caminhos.lancamentos,
  RECEITAS: caminhos.receitas,
  DESPESAS: caminhos.despesas,
  TRANSFERENCIAS: caminhos.transferencias,
  CONTAS: caminhos.contas,
  CARTOES: caminhos.cartoes,
  FATURAS: caminhos.faturas,
  PARCELAMENTOS: caminhos.parcelamentos,
  METAS: caminhos.metas,
  ORCAMENTO: caminhos.orcamento,
  PREVISAO: caminhos.previsao,
  RECORRENTES: caminhos.recorrentes,
  INVESTIMENTOS: caminhos.investimentos,
  RELATORIOS: caminhos.relatorios,
};

export const rotuloTela: Record<Tela, string> = {
  LANCAMENTOS: 'Lançamentos',
  RECEITAS: 'Receitas',
  DESPESAS: 'Despesas',
  TRANSFERENCIAS: 'Transferências',
  CONTAS: 'Contas',
  CARTOES: 'Cartões',
  FATURAS: 'Faturas',
  PARCELAMENTOS: 'Compras parceladas',
  METAS: 'Metas',
  ORCAMENTO: 'Orçamento',
  PREVISAO: 'Previsão financeira',
  RECORRENTES: 'Despesas recorrentes',
  INVESTIMENTOS: 'Investimentos',
  RELATORIOS: 'Relatórios',
};

const telasPorCaminho = new Map(
  (Object.entries(caminhoDaTela) as Array<[Tela, string]>).map(([tela, caminho]) => [caminho, tela]),
);

export function telaDoDestino(destino: string): Tela | null {
  const caminho = destino.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? '';
  return telasPorCaminho.get(caminho) ?? null;
}

export function navegacaoVisivel(secoes: SecaoNavegacao[], estaOculto: (destino: string) => boolean): SecaoNavegacao[] {
  return secoes
    .map((secao) => ({
      ...secao,
      itens: secao.itens.flatMap((item) => {
        if (!item.filhos) return estaOculto(item.destino) ? [] : [item];

        const filhos = item.filhos.filter((filho) => !estaOculto(filho.destino));
        const primeiro = filhos[0];
        if (!primeiro) return [];

        return [{ ...item, filhos, destino: estaOculto(item.destino) ? primeiro.destino : item.destino }];
      }),
    }))
    .filter((secao) => secao.itens.length > 0);
}

export interface OpcaoTela {
  tela: Tela;
  rotulo: string;
}

export interface GrupoTelas {
  titulo: string;
  telas: OpcaoTela[];
}

function opcaoDoDestino(destino: string, rotulo: string): OpcaoTela[] {
  const tela = telaDoDestino(destino);
  return tela ? [{ tela, rotulo }] : [];
}

const itensDoMenu = navegacao.flatMap((secao) => secao.itens);

export const gruposTelas: GrupoTelas[] = [
  ...itensDoMenu
    .filter((item) => item.filhos)
    .map((item) => ({
      titulo: item.rotulo,
      telas: (item.filhos ?? []).flatMap((filho) => opcaoDoDestino(filho.destino, filho.rotulo)),
    })),
  {
    titulo: 'Outras telas',
    telas: itensDoMenu.filter((item) => !item.filhos).flatMap((item) => opcaoDoDestino(item.destino, item.rotulo)),
  },
].filter((grupo) => grupo.telas.length > 0);
