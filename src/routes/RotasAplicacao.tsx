import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutAplicacao } from '@/layouts';
import { PaginaDashboard } from '@/pages/dashboard/PaginaDashboard';
import { caminhos } from './caminhos';
import { carregarTela, precarregarTelas } from './carregarTela';

const PaginaLancamentos = carregarTela(() => import('@/pages/lancamento/PaginaLancamentos').then((modulo) => modulo.PaginaLancamentos));
const PaginaContas = carregarTela(() => import('@/pages/conta/PaginaContas').then((modulo) => modulo.PaginaContas));
const PaginaCartoes = carregarTela(() => import('@/pages/cartao/PaginaCartoes').then((modulo) => modulo.PaginaCartoes));
const PaginaFaturas = carregarTela(() => import('@/pages/fatura/PaginaFaturas').then((modulo) => modulo.PaginaFaturas));
const PaginaParcelamentos = carregarTela(() => import('@/pages/compraparcelada/PaginaParcelamentos').then((modulo) => modulo.PaginaParcelamentos));
const PaginaInvestimentos = carregarTela(() => import('@/pages/investimento/PaginaInvestimentos').then((modulo) => modulo.PaginaInvestimentos));
const PaginaOrcamento = carregarTela(() => import('@/pages/orcamento/PaginaOrcamento').then((modulo) => modulo.PaginaOrcamento));
const PaginaRecorrentes = carregarTela(() => import('@/pages/recorrente/PaginaRecorrentes').then((modulo) => modulo.PaginaRecorrentes));
const PaginaPrevisao = carregarTela(() => import('@/pages/previsao/PaginaPrevisao').then((modulo) => modulo.PaginaPrevisao));
const PaginaMetas = carregarTela(() => import('@/pages/meta/PaginaMetas').then((modulo) => modulo.PaginaMetas));
const PaginaRelatorios = carregarTela(() => import('@/pages/relatorio/PaginaRelatorios').then((modulo) => modulo.PaginaRelatorios));
const PaginaConfiguracoes = carregarTela(() => import('@/pages/configuracao/PaginaConfiguracoes').then((modulo) => modulo.PaginaConfiguracoes));
const PaginaNaoEncontrada = carregarTela(() => import('@/pages/erro/PaginaNaoEncontrada').then((modulo) => modulo.PaginaNaoEncontrada));

const telaPorCaminho: Record<string, { precarregar: () => Promise<void> }> = {
  [caminhos.lancamentos]: PaginaLancamentos,
  [caminhos.receitas]: PaginaLancamentos,
  [caminhos.despesas]: PaginaLancamentos,
  [caminhos.transferencias]: PaginaLancamentos,
  [caminhos.contas]: PaginaContas,
  [caminhos.cartoes]: PaginaCartoes,
  [caminhos.faturas]: PaginaFaturas,
  [caminhos.parcelamentos]: PaginaParcelamentos,
  [caminhos.investimentos]: PaginaInvestimentos,
  [caminhos.orcamento]: PaginaOrcamento,
  [caminhos.recorrentes]: PaginaRecorrentes,
  [caminhos.previsao]: PaginaPrevisao,
  [caminhos.metas]: PaginaMetas,
  [caminhos.relatorios]: PaginaRelatorios,
  [caminhos.configuracoes]: PaginaConfiguracoes,
};

const caminhoInicial = window.location.pathname;
precarregarTelas(caminhoInicial === '/' || caminhoInicial === caminhos.dashboard ? undefined : (telaPorCaminho[caminhoInicial] ?? PaginaNaoEncontrada));

export function RotasAplicacao() {
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
