import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts';
import {
  AccountsPage,
  BudgetPage,
  CardsPage,
  DashboardPage,
  ForecastPage,
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
            <TransactionsPage key="income" kind="income" title="Receitas" description="Entradas registradas no período" />
          }
        />
        <Route
          path={paths.expenses}
          element={
            <TransactionsPage key="expense" kind="expense" title="Despesas" description="Saídas registradas no período" />
          }
        />
        <Route
          path={paths.transfers}
          element={
            <TransactionsPage
              key="transfer"
              kind="transfer"
              title="Transferências"
              description="Movimentações entre suas próprias contas"
            />
          }
        />

        <Route path={paths.accounts} element={<AccountsPage />} />
        <Route path={paths.cards} element={<CardsPage />} />
        <Route path={paths.invoices} element={<InvoicesPage />} />

        <Route path={paths.investments} element={<InvestmentsPage />} />

        <Route path={paths.budget} element={<BudgetPage />} />
        <Route path={paths.recurring} element={<RecurringPage />} />
        <Route path={paths.forecast} element={<ForecastPage />} />

        <Route path={paths.reports} element={<ReportsPage />} />
        <Route path={paths.settings} element={<SettingsPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
