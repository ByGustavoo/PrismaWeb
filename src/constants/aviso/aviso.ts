import type { Opcao, TipoAviso } from '@/types';

export const DIAS_HORIZONTE_AVISOS = 15;
export const AVISOS_MAXIMO_NO_CONTADOR = 99;

export type ControleTipoAviso = 'limiteCartao' | 'lembreteInvestimento' | 'lembreteMeta';

export interface ItemTipoAviso {
  tipo: TipoAviso;
  rotulo: string;
  dica?: string;
  controle?: ControleTipoAviso;
}

export interface GrupoTiposAviso {
  titulo: string;
  usaAntecedencia: boolean;
  itens: ItemTipoAviso[];
}

export const gruposTiposAviso: GrupoTiposAviso[] = [
  {
    titulo: 'Pagamentos e agenda',
    usaAntecedencia: true,
    itens: [
      { tipo: 'FATURA_VENCENDO', rotulo: 'Faturas do cartão' },
      { tipo: 'CONTA_VENCENDO', rotulo: 'Despesas pendentes' },
      { tipo: 'RECORRENTE_VENCENDO', rotulo: 'Despesas recorrentes sem lançamento' },
      { tipo: 'LANCAMENTO_AGENDADO', rotulo: 'Lançamentos agendados' },
      { tipo: 'RECEITA_PREVISTA', rotulo: 'Receitas a receber' },
    ],
  },
  {
    titulo: 'Planejamento',
    usaAntecedencia: false,
    itens: [
      { tipo: 'LIMITE_CARTAO', rotulo: 'Limite do cartão', controle: 'limiteCartao' },
      { tipo: 'ORCAMENTO_NO_LIMITE', rotulo: 'Orçamento perto do limite', dica: 'A partir de 80% do limite da categoria no mês' },
      { tipo: 'SALDO_NEGATIVO_PREVISTO', rotulo: 'Saldo previsto negativo', dica: 'Quando a previsão dos próximos seis meses fica abaixo de zero' },
    ],
  },
  {
    titulo: 'Lembretes',
    usaAntecedencia: false,
    itens: [
      { tipo: 'INVESTIMENTO_DESATUALIZADO', rotulo: 'Investimentos sem atualização', controle: 'lembreteInvestimento' },
      { tipo: 'META_SEM_PRECO', rotulo: 'Metas sem preço novo', controle: 'lembreteMeta' },
    ],
  },
];

export const opcoesAntecedenciaAviso: Opcao[] = [3, 7, 15, 30].map((dias) => ({
  valor: String(dias),
  rotulo: `${dias} dias antes`,
}));

export const opcoesLimiteCartaoAviso: Opcao[] = [70, 80, 90].map((percentual) => ({
  valor: String(percentual),
  rotulo: `A partir de ${percentual}%`,
}));

export const opcoesLembreteAviso: Opcao[] = [15, 30, 60, 90].map((dias) => ({
  valor: String(dias),
  rotulo: `Após ${dias} dias`,
}));

export const opcoesAdiamentoAviso: Array<{ dias: number; rotulo: string }> = [
  { dias: 1, rotulo: 'Amanhã' },
  { dias: 3, rotulo: 'Em 3 dias' },
  { dias: 7, rotulo: 'Em 1 semana' },
];
