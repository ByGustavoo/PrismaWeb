import { UnderConstruction } from '@/components/common';

/**
 * Telas que ainda serao construidas. Ficam agrupadas aqui de proposito:
 * cada uma vira um arquivo proprio quando ganhar conteudo real.
 */

export function AccountsPage() {
  return (
    <UnderConstruction
      title="Contas"
      description="Saldos e movimentação das suas contas"
      plannedFor="Aqui você vai cadastrar contas, acompanhar saldos e conciliar movimentações."
    />
  );
}

export function CardsPage() {
  return (
    <UnderConstruction
      title="Cartões"
      description="Limites, fechamento e vencimento"
      plannedFor="Cadastro de cartões, limite disponível e datas de fechamento e vencimento."
    />
  );
}

export function InvoicesPage() {
  return (
    <UnderConstruction
      title="Faturas"
      description="Faturas abertas, fechadas e pagas"
      plannedFor="Detalhe das faturas por cartão, com lançamentos, parcelamentos e pagamento."
    />
  );
}

export function InvestmentsPage() {
  return (
    <UnderConstruction
      title="Investimentos"
      description="Carteira, aportes e rentabilidade"
      plannedFor="Carteira por classe de ativo, aportes, rentabilidade e evolução do patrimônio."
    />
  );
}

export function BudgetPage() {
  return (
    <UnderConstruction
      title="Orçamento"
      description="Limites planejados por categoria"
      plannedFor="Definição de limites mensais por categoria e acompanhamento do consumo."
    />
  );
}

export function RecurringPage() {
  return (
    <UnderConstruction
      title="Despesas recorrentes"
      description="Assinaturas e contas fixas"
      plannedFor="Cadastro de despesas fixas, com recorrência, próximos vencimentos e alertas."
    />
  );
}

export function ForecastPage() {
  return (
    <UnderConstruction
      title="Previsão financeira"
      description="Projeção de saldo dos próximos meses"
      plannedFor="Projeção de saldo a partir de receitas, despesas recorrentes e parcelamentos."
    />
  );
}

export function ReportsPage() {
  return (
    <UnderConstruction
      title="Relatórios"
      description="Análises e gráficos das suas finanças"
      plannedFor="Relatórios por período, categoria e conta, com exportação dos resultados."
    />
  );
}
