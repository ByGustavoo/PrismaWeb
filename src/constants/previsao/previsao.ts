import type { MesPrevisaoDTO } from '@/types';

export type ChaveLinhaPrevisao = keyof Pick<
  MesPrevisaoDTO,
  'receita' | 'recorrentes' | 'parcelas' | 'variavel' | 'agendados' | 'aportes'
>;

export interface LinhaPrevisao {
  chave: ChaveLinhaPrevisao;
  rotulo: string;
  entrada: boolean;
}

export const linhasPrevisao: LinhaPrevisao[] = [
  { chave: 'receita', rotulo: 'Receitas', entrada: true },
  { chave: 'recorrentes', rotulo: 'Recorrentes', entrada: false },
  { chave: 'parcelas', rotulo: 'Parcelas', entrada: false },
  { chave: 'variavel', rotulo: 'Variável', entrada: false },
  { chave: 'agendados', rotulo: 'Agendados', entrada: false },
  { chave: 'aportes', rotulo: 'Aportes', entrada: false },
];
