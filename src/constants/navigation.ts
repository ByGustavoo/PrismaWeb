import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, ChartPie, CreditCard, LayoutDashboard, Settings, Target, TrendingUp } from 'lucide-react';
import { paths } from '@/routes/paths';

export interface NavChild {
  label: string;
  to: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  /** Quando presente, o item vira um grupo expansivel na sidebar. */
  children?: NavChild[];
}

export interface NavSection {
  /** Titulo do bloco; ausente no primeiro bloco. */
  title?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    items: [{ label: 'Dashboard', icon: LayoutDashboard, to: paths.dashboard }],
  },
  {
    title: 'Movimentação',
    items: [
      {
        label: 'Lançamentos',
        icon: ArrowLeftRight,
        to: paths.transactions,
        children: [
          { label: 'Todas', to: paths.transactions },
          { label: 'Receitas', to: paths.income },
          { label: 'Despesas', to: paths.expenses },
          { label: 'Transferências', to: paths.transfers },
        ],
      },
      {
        label: 'Contas e cartões',
        icon: CreditCard,
        to: paths.accounts,
        children: [
          { label: 'Contas', to: paths.accounts },
          { label: 'Cartões', to: paths.cards },
          { label: 'Faturas', to: paths.invoices },
          { label: 'Compras parceladas', to: paths.installments },
        ],
      },
    ],
  },
  {
    title: 'Patrimônio',
    items: [
      { label: 'Investimentos', icon: TrendingUp, to: paths.investments },
      {
        label: 'Planejamento',
        icon: Target,
        to: paths.budget,
        children: [
          { label: 'Orçamento', to: paths.budget },
          { label: 'Despesas recorrentes', to: paths.recurring },
          { label: 'Previsão financeira', to: paths.forecast },
        ],
      },
    ],
  },
  {
    title: 'Análise',
    items: [
      { label: 'Relatórios', icon: ChartPie, to: paths.reports },
      { label: 'Configurações', icon: Settings, to: paths.settings },
    ],
  },
];
