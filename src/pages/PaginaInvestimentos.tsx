import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import {
  GraficoAlocacao,
  CartaoInvestimento,
  ModalDetalheInvestimento,
  ModalFormularioInvestimento,
  GraficoCarteira,
  custoDaCompra,
  tomRendimento,
  valorDaVenda,
} from '@/components/investimentos';
import type { AcaoRegistroInvestimento, ResultadoFormularioInvestimento } from '@/components/investimentos';
import { nomeDoInvestimento, rotuloQuantidadeAcoes } from '@/constants/investimentos';
import type { AcaoPorQuantidade } from '@/constants/investimentos';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useAvisos } from '@/providers/ProvedorAvisos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { PARAMETRO_INVESTIMENTO } from '@/routes/caminhos';
import { contasService, investimentosService } from '@/services';
import type {
  InvestimentoDTO,
  PosicaoDTO,
  SalvarAporteInvestimentoDTO,
  SalvarCotacaoAcaoDTO,
  SalvarNegociacaoAcaoDTO,
  SalvarResgateInvestimentoDTO,
  SalvarSaldoInvestimentoDTO,
} from '@/types';
import { formatarMoeda, formatarPercentualComSinal } from '@/utils/formatacao';
import styles from './PaginaInvestimentos.module.css';

export function PaginaInvestimentos() {
  const [editing, setEditing] = useState<InvestimentoDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<PosicaoDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<{ id: string; acao: AcaoRegistroInvestimento } | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const toast = useNotificacoes();
  const { atualizarAvisos } = useAvisos();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const requested = searchParams.get(PARAMETRO_INVESTIMENTO);
    if (!requested) return;
    setDetail({ id: requested, acao: 'saldo' });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback((signal: AbortSignal) => investimentosService.buscarCarteira(signal), []);
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const fetchAccounts = useCallback((signal: AbortSignal) => contasService.listar(signal), []);
  const { dados: contas } = useDadosAssincronos(fetchAccounts);
  const accounts = useMemo(() => contas ?? [], [contas]);

  const positions = useMemo(() => dados?.posicoes ?? [], [dados]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (result: ResultadoFormularioInvestimento) => {
    setSaving(true);

    try {
      if (result.modo === 'update' && editing) {
        await investimentosService.atualizar(editing.id, result.dados);
        if (result.dados.codigo) {
          toast.sucesso('Ação atualizada com sucesso!', `${result.dados.codigo} — ${result.dados.nome}`);
        } else {
          toast.sucesso('Investimento atualizado com sucesso!', result.dados.nome);
        }
      } else if (result.modo === 'createAcao') {
        await investimentosService.criarAcao(result.dados);
        toast.sucesso('Ação cadastrada com sucesso!', `${result.dados.codigo} — ${result.dados.nome}`);
      } else if (result.modo === 'create') {
        await investimentosService.criar(result.dados);
        toast.sucesso('Investimento cadastrado com sucesso!', result.dados.nome);
      }
      closeForm();
      recarregar();
      atualizarAvisos();
      setDetailVersion((value) => value + 1);
    } catch (submitError) {
      toast.erro('Não foi possível salvar o investimento.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const registerMovement = async (
    request: () => Promise<unknown>,
    success: { titulo: string; descricao: string },
    failure: string,
  ): Promise<boolean> => {
    setSaving(true);

    try {
      await request();
      toast.sucesso(success.titulo, success.descricao);
      recarregar();
      atualizarAvisos();
      setDetailVersion((value) => value + 1);
      return true;
    } catch (movementError) {
      toast.erro(failure, movementError);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleContribution = (investment: InvestimentoDTO, payload: SalvarAporteInvestimentoDTO) =>
    registerMovement(
      () => investimentosService.adicionarAporte(investment.id, payload),
      { titulo: 'Aporte adicionado com sucesso!', descricao: `${investment.nome} — ${formatarMoeda(payload.valor)}` },
      'Não foi possível adicionar o aporte.',
    );

  const handleWithdrawal = (investment: InvestimentoDTO, payload: SalvarResgateInvestimentoDTO) =>
    registerMovement(
      () => investimentosService.registrarResgate(investment.id, payload),
      { titulo: 'Resgate registrado com sucesso!', descricao: `${investment.nome} — ${formatarMoeda(payload.valor)}` },
      'Não foi possível registrar o resgate.',
    );

  const handleBalance = (investment: InvestimentoDTO, payload: SalvarSaldoInvestimentoDTO) =>
    registerMovement(
      () => investimentosService.atualizarSaldo(investment.id, payload),
      { titulo: 'Saldo atualizado com sucesso!', descricao: `${investment.nome} — ${formatarMoeda(payload.valorAtual)}` },
      'Não foi possível atualizar o saldo.',
    );

  const handlePurchase = (share: AcaoPorQuantidade, payload: SalvarNegociacaoAcaoDTO) =>
    registerMovement(
      () => investimentosService.registrarCompra(share.id, payload),
      {
        titulo: 'Compra registrada com sucesso!',
        descricao: `${share.codigo} — ${rotuloQuantidadeAcoes(payload.quantidade)} por ${formatarMoeda(custoDaCompra(payload.quantidade, payload.precoUnitario, payload.taxas))}`,
      },
      'Não foi possível registrar a compra.',
    );

  const handleSale = (share: AcaoPorQuantidade, payload: SalvarNegociacaoAcaoDTO) =>
    registerMovement(
      () => investimentosService.registrarVenda(share.id, payload),
      {
        titulo: 'Venda registrada com sucesso!',
        descricao: `${share.codigo} — ${rotuloQuantidadeAcoes(payload.quantidade)} por ${formatarMoeda(valorDaVenda(payload.quantidade, payload.precoUnitario, payload.taxas))}`,
      },
      'Não foi possível registrar a venda.',
    );

  const handleQuote = (share: AcaoPorQuantidade, payload: SalvarCotacaoAcaoDTO) =>
    registerMovement(
      () => investimentosService.registrarCotacao(share.id, payload),
      { titulo: 'Cotação atualizada com sucesso!', descricao: `${share.codigo} — ${formatarMoeda(payload.cotacao)} por ação` },
      'Não foi possível atualizar a cotação.',
    );

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await investimentosService.excluir(removing.investimento.id);
      toast.sucesso('Investimento excluído com sucesso!', nomeDoInvestimento(removing.investimento));
      setRemoving(null);
      recarregar();
      atualizarAvisos();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir o investimento.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Investimentos"
        descricao="Quanto você aportou, quanto a carteira vale hoje e onde o dinheiro está"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Novo investimento
          </Botao>
        }
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <div className={styles.charts}>
            <Painel espacamento="none">
              <BlocoCarregando linhas={3} altura={280} />
            </Painel>
            <Painel espacamento="none">
              <BlocoCarregando linhas={3} altura={280} />
            </Painel>
          </div>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar a carteira"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !dados || positions.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={TrendingUp}
            titulo="Nenhum investimento cadastrado"
            descricao="Cadastre suas posições para acompanhar quanto rendem, como o patrimônio evolui e em que tipo de ativo o dinheiro está."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Novo investimento
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Total investido',
                valor: <ValorMonetario valor={dados.aportado} contarAoAparecer />,
                dica: `${positions.length} ${positions.length === 1 ? 'posição' : 'posições'} em ${dados.alocacao.length} ${dados.alocacao.length === 1 ? 'tipo de ativo' : 'tipos de ativo'}`,
              },
              {
                rotulo: 'Valor atual',
                valor: <ValorMonetario valor={dados.valorAtual} tamanho="lg" animar contarAoAparecer />,
                dica: 'Soma do valor de mercado das posições',
              },
              {
                rotulo: dados.rendimento >= 0 ? 'Lucro' : 'Prejuízo',
                valor: <ValorMonetario valor={dados.rendimento} tom={tomRendimento(dados.rendimento)} sinal="auto" contarAoAparecer />,
                dica: 'Diferença entre o valor atual e o aportado',
              },
              {
                rotulo: 'Rentabilidade',
                valor: (
                  <span className={`${styles.percent} ${dados.rendimento >= 0 ? styles.up : styles.down} tabular`}>
                    {formatarPercentualComSinal(dados.rentabilidade * 100)}
                  </span>
                ),
                dica: 'Sobre o total aportado, desde o primeiro aporte',
              },
              {
                rotulo: 'Reserva de emergência',
                valor: <ValorMonetario valor={dados.reserva.valorAtual} animar contarAoAparecer />,
                dica:
                  dados.reserva.quantidade === 0 ? (
                    'Nenhum investimento marcado como reserva'
                  ) : (
                    <>
                      {dados.reserva.quantidade} {dados.reserva.quantidade === 1 ? 'investimento' : 'investimentos'} — Rendeu{' '}
                      <ValorMonetario
                        valor={dados.reserva.rendimento}
                        tamanho="sm"
                        tom={tomRendimento(dados.reserva.rendimento)}
                        sinal="auto"
                      />
                    </>
                  ),
              },
            ]}
          />

          <div className={styles.charts}>
            <GraficoCarteira dados={dados.historico} />
            <GraficoAlocacao dados={dados.alocacao} total={dados.valorAtual} />
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Posições</h2>
            <ul className={styles.grid}>
              {positions.map((position) => (
                <CartaoInvestimento
                  key={position.investimento.id}
                  posicao={position}
                  aoAbrir={(item) => setDetail({ id: item.investimento.id, acao: 'saldo' })}
                  aoAdicionarAporte={(item) => setDetail({ id: item.investimento.id, acao: 'aporte' })}
                  aoExcluir={setRemoving}
                />
              ))}
            </ul>
          </section>
        </div>
      )}

      <ModalDetalheInvestimento
        investimentoId={detail?.id ?? null}
        acaoInicial={detail?.acao ?? 'aporte'}
        versao={detailVersion}
        contas={accounts}
        salvando={saving}
        aoFechar={() => setDetail(null)}
        aoEditar={(investment) => {
          setDetail(null);
          setEditing(investment);
        }}
        aoExcluir={(statement) => {
          setDetail(null);
          setRemoving(statement.posicao);
        }}
        aoRegistrarAporte={handleContribution}
        aoRegistrarResgate={handleWithdrawal}
        aoAtualizarSaldo={handleBalance}
        aoRegistrarCompra={handlePurchase}
        aoRegistrarVenda={handleSale}
        aoRegistrarCotacao={handleQuote}
      />

      <ModalFormularioInvestimento
        aberto={formOpen}
        investimento={editing}
        contas={accounts}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir investimento"
        descricao="A posição sai da carteira com todo o histórico, e as transferências que ela fez nas suas contas também saem. Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{nomeDoInvestimento(removing.investimento)}</strong>
            <span className={styles.confirmMeta}>{removing.investimento.instituicao}</span>
            <ValorMonetario valor={removing.investimento.valorAtual} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
