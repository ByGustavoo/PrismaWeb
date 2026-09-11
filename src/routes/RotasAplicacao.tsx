import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutAplicacao } from '@/layouts';
import {
  PaginaContas,
  PaginaOrcamento,
  PaginaCartoes,
  PaginaDashboard,
  PaginaPrevisao,
  PaginaMetas,
  PaginaParcelamentos,
  PaginaInvestimentos,
  PaginaFaturas,
  PaginaNaoEncontrada,
  PaginaRecorrentes,
  PaginaRelatorios,
  PaginaConfiguracoes,
  PaginaLancamentos,
} from '@/pages';
import { caminhos } from './caminhos';

export function RotasAplicacao() {
  return (
    <Routes>
      <Route element={<LayoutAplicacao />}>
        <Route path="/" element={<Navigate to={caminhos.dashboard} replace />} />
        <Route path={caminhos.dashboard} element={<PaginaDashboard />} />

        <Route
          path={caminhos.lancamentos}
          element={
            <PaginaLancamentos
              key="all"
              titulo="Lançamentos"
              descricao="Todas as movimentações registradas no período"
            />
          }
        />
        <Route
          path={caminhos.receitas}
          element={
            <PaginaLancamentos key="RECEITA" tipo="RECEITA" titulo="Receitas" descricao="Entradas registradas no período" />
          }
        />
        <Route
          path={caminhos.despesas}
          element={
            <PaginaLancamentos key="DESPESA" tipo="DESPESA" titulo="Despesas" descricao="Saídas registradas no período" />
          }
        />
        <Route
          path={caminhos.transferencias}
          element={
            <PaginaLancamentos
              key="TRANSFERENCIA"
              tipo="TRANSFERENCIA"
              titulo="Transferências"
              descricao="Movimentações entre suas próprias contas"
            />
          }
        />

        <Route path={caminhos.contas} element={<PaginaContas />} />
        <Route path={caminhos.cartoes} element={<PaginaCartoes />} />
        <Route path={caminhos.faturas} element={<PaginaFaturas />} />
        <Route path={caminhos.parcelamentos} element={<PaginaParcelamentos />} />

        <Route path={caminhos.investimentos} element={<PaginaInvestimentos />} />

        <Route path={caminhos.orcamento} element={<PaginaOrcamento />} />
        <Route path={caminhos.recorrentes} element={<PaginaRecorrentes />} />
        <Route path={caminhos.previsao} element={<PaginaPrevisao />} />
        <Route path={caminhos.metas} element={<PaginaMetas />} />

        <Route path={caminhos.relatorios} element={<PaginaRelatorios />} />
        <Route path={caminhos.configuracoes} element={<PaginaConfiguracoes />} />
      </Route>

      <Route path="*" element={<PaginaNaoEncontrada />} />
    </Routes>
  );
}
