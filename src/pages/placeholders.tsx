import { UnderConstruction } from '@/components/common';

/**
 * Telas que ainda serao construidas. Ficam agrupadas aqui de proposito:
 * cada uma vira um arquivo proprio quando ganhar conteudo real.
 */

export function AccountsPage() {
  return (
    <UnderConstruction
      title="Contas"
      description="Saldos e movimentacao das suas contas"
      plannedFor="Aqui voce vai cadastrar contas, acompanhar saldos e conciliar movimentacoes."
    />
  );
}

export function CardsPage() {
  return (
    <UnderConstruction
      title="Cartoes"
      description="Limites, fechamento e vencimento"
      plannedFor="Cadastro de cartoes, limite disponivel e datas de fechamento e vencimento."
    />
  );
}

export function InvoicesPage() {
  return (
    <UnderConstruction
      title="Faturas"
      description="Faturas abertas, fechadas e pagas"
      plannedFor="Detalhe das faturas por cartao, com lancamentos, parcelamentos e pagamento."
    />
  );
}

export function InvestmentsPage() {
  return (
    <UnderConstruction
      title="Investimentos"
      description="Carteira, aportes e rentabilidade"
      plannedFor="Carteira por classe de ativo, aportes, rentabilidade e evolucao do patrimonio."
    />
  );
}

export function BudgetPage() {
  return (
    <UnderConstruction
      title="Orcamento"
      description="Limites planejados por categoria"
      plannedFor="Definicao de limites mensais por categoria e acompanhamento do consumo."
    />
  );
}

export function RecurringPage() {
  return (
    <UnderConstruction
      title="Despesas recorrentes"
      description="Assinaturas e contas fixas"
      plannedFor="Cadastro de despesas fixas, com recorrencia, proximos vencimentos e alertas."
    />
  );
}

export function ForecastPage() {
  return (
    <UnderConstruction
      title="Previsao financeira"
      description="Projecao de saldo dos proximos meses"
      plannedFor="Projecao de saldo a partir de receitas, despesas recorrentes e parcelamentos."
    />
  );
}

export function ReportsPage() {
  return (
    <UnderConstruction
      title="Relatorios"
      description="Analises e graficos das suas financas"
      plannedFor="Relatorios por periodo, categoria e conta, com exportacao dos resultados."
    />
  );
}
