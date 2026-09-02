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
              title="Lancamentos"
              description="Todas as movimentacoes registradas no periodo"
            />
          }
        />
        <Route
          path={paths.income}
          element={
            <TransactionsPage kind="income" title="Receitas" description="Entradas registradas no periodo" />
          }
        />
        <Route
          path={paths.expenses}
          element={
            <TransactionsPage kind="expense" title="Despesas" description="Saidas registradas no periodo" />
          }
        />
        <Route
          path={paths.transfers}
          element={
            <TransactionsPage
              kind="transfer"
              title="Transferencias"
              description="Movimentacoes entre suas proprias contas"
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
