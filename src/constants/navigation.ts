import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ChartPie,
  CreditCard,
  LayoutDashboard,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
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
    title: 'Movimentacao',
    items: [
      {
        label: 'Lancamentos',
        icon: ArrowLeftRight,
        to: paths.transactions,
        children: [
          { label: 'Todas', to: paths.transactions },
          { label: 'Receitas', to: paths.income },
          { label: 'Despesas', to: paths.expenses },
          { label: 'Transferencias', to: paths.transfers },
        ],
      },
      {
        label: 'Contas e cartoes',
        icon: CreditCard,
        to: paths.accounts,
        children: [
          { label: 'Contas', to: paths.accounts },
          { label: 'Cartoes', to: paths.cards },
          { label: 'Faturas', to: paths.invoices },
        ],
      },
    ],
  },
  {
    title: 'Patrimonio',
    items: [
      { label: 'Investimentos', icon: TrendingUp, to: paths.investments },
      {
        label: 'Planejamento',
        icon: Target,
        to: paths.budget,
        children: [
          { label: 'Orcamento', to: paths.budget },
          { label: 'Despesas recorrentes', to: paths.recurring },
          { label: 'Previsao financeira', to: paths.forecast },
        ],
      },
    ],
  },
  {
    title: 'Analise',
    items: [
      { label: 'Relatorios', icon: ChartPie, to: paths.reports },
      { label: 'Configuracoes', icon: Settings, to: paths.settings },
    ],
  },
];

/** Icone usado no logotipo da marca. */
export const brandIcon: LucideIcon = Wallet;
