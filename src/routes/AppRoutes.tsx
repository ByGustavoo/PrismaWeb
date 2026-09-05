import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts';
import {
  AccountsPage,
  BudgetPage,
  CardsPage,
  DashboardPage,
  ForecastPage,
  GoalsPage,
  InstallmentsPage,
  InvestmentsPage,
  InvoicesPage,
  NotFoundPage,
  RecurringPage,
  ReportsPage,
  SettingsPage,
  TransactionsPage,
} from '@/pages';
import { paths } from './paths';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* A raiz nao tem tela propria: quem abre o app cai no dashboard. */}
        <Route path="/" element={<Navigate to={paths.dashboard} replace />} />
        <Route path={paths.dashboard} element={<DashboardPage />} />

        <Route
          path={paths.transactions}
          element={
            <TransactionsPage
              key="all"
              title="Lançamentos"
              description="Todas as movimentações registradas no período"
            />
          }
        />
        <Route
          path={paths.income}
          element={
            <TransactionsPage key="RECEITA" kind="RECEITA" title="Receitas" description="Entradas registradas no período" />
          }
        />
        <Route
          path={paths.expenses}
          element={
            <TransactionsPage key="DESPESA" kind="DESPESA" title="Despesas" description="Saídas registradas no período" />
          }
        />
        <Route
          path={paths.transfers}
          element={
            <TransactionsPage
              key="TRANSFERENCIA"
              kind="TRANSFERENCIA"
              title="Transferências"
              description="Movimentações entre suas próprias contas"
            />
          }
        />

        <Route path={paths.accounts} element={<AccountsPage />} />
        <Route path={paths.cards} element={<CardsPage />} />
        <Route path={paths.invoices} element={<InvoicesPage />} />
        <Route path={paths.installments} element={<InstallmentsPage />} />

        <Route path={paths.investments} element={<InvestmentsPage />} />

        <Route path={paths.budget} element={<BudgetPage />} />
        <Route path={paths.recurring} element={<RecurringPage />} />
        <Route path={paths.forecast} element={<ForecastPage />} />
        <Route path={paths.goals} element={<GoalsPage />} />

        <Route path={paths.reports} element={<ReportsPage />} />
        <Route path={paths.settings} element={<SettingsPage />} />
      </Route>

      {/*
        A 404 fica fora do `AppLayout` de proposito: um endereco que nao existe
        nao e uma tela do produto, e cerca-lo de sidebar, busca e seletor de
        periodo seria mostrar o mobiliario de um lugar onde nao ha nada. A propria
        pagina assume a navegacao, com a marca no topo e atalhos para as telas de
        entrada.
      */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
