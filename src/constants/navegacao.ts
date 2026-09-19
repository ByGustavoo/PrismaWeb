import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, ChartPie, CreditCard, LayoutDashboard, Settings, Target, TrendingUp } from 'lucide-react';
import { caminhos } from '@/routes/caminhos';

export interface FilhoNavegacao {
  rotulo: string;
  destino: string;
}

export interface ItemNavegacao {
  rotulo: string;
  icone: LucideIcon;
  destino: string;
  filhos?: FilhoNavegacao[];
}

export interface SecaoNavegacao {
  titulo?: string;
  itens: ItemNavegacao[];
}

export const navegacao: SecaoNavegacao[] = [
  {
    itens: [{ rotulo: 'Dashboard', icone: LayoutDashboard, destino: caminhos.dashboard }],
  },
  {
    titulo: 'Movimentação',
    itens: [
      {
        rotulo: 'Lançamentos',
        icone: ArrowLeftRight,
        destino: caminhos.lancamentos,
        filhos: [
          { rotulo: 'Todas', destino: caminhos.lancamentos },
          { rotulo: 'Receitas', destino: caminhos.receitas },
          { rotulo: 'Despesas', destino: caminhos.despesas },
          { rotulo: 'Transferências', destino: caminhos.transferencias },
        ],
      },
      {
        rotulo: 'Contas e cartões',
        icone: CreditCard,
        destino: caminhos.contas,
        filhos: [
          { rotulo: 'Contas', destino: caminhos.contas },
          { rotulo: 'Cartões', destino: caminhos.cartoes },
          { rotulo: 'Faturas', destino: caminhos.faturas },
          { rotulo: 'Compras parceladas', destino: caminhos.parcelamentos },
        ],
      },
    ],
  },
  {
    titulo: 'Patrimônio',
    itens: [
      {
        rotulo: 'Planejamento',
        icone: Target,
        destino: caminhos.orcamento,
        filhos: [
          { rotulo: 'Metas', destino: caminhos.metas },
          { rotulo: 'Orçamento', destino: caminhos.orcamento },
          { rotulo: 'Previsão financeira', destino: caminhos.previsao },
          { rotulo: 'Despesas recorrentes', destino: caminhos.recorrentes },
        ],
      },
      { rotulo: 'Investimentos', icone: TrendingUp, destino: caminhos.investimentos },
    ],
  },
  {
    titulo: 'Análise',
    itens: [
      { rotulo: 'Relatórios', icone: ChartPie, destino: caminhos.relatorios },
      { rotulo: 'Configurações', icone: Settings, destino: caminhos.configuracoes },
    ],
  },
];
