import { useCallback, useMemo, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import {
  GraficoAlocacao,
  CartaoInvestimento,
  ModalDetalheInvestimento,
  ModalFormularioInvestimento,
  GraficoCarteira,
  tomRendimento,
} from '@/components/investimentos';
import type { AcaoRegistroInvestimento, ResultadoFormularioInvestimento } from '@/components/investimentos';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { investimentosService } from '@/services';
import type {
  InvestimentoDTO,
  PosicaoDTO,
  SalvarAporteInvestimentoDTO,
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

  const fetchData = useCallback((signal: AbortSignal) => investimentosService.buscarCarteira(signal), []);
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

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
        toast.sucesso('Investimento atualizado com sucesso!', result.dados.nome);
      } else if (result.modo === 'create') {
        await investimentosService.criar(result.dados);
        toast.sucesso('Investimento cadastrado com sucesso!', result.dados.nome);
      }
      closeForm();
      recarregar();
      setDetailVersion((value) => value + 1);
    } catch (submitError) {
      toast.erro('Não foi possível salvar o investimento.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleContribution = async (investment: InvestimentoDTO, payload: SalvarAporteInvestimentoDTO): Promise<boolean> => {
    setSaving(true);

    try {
      await investimentosService.adicionarAporte(investment.id, payload);
      toast.sucesso('Aporte adicionado com sucesso!', `${investment.nome} · ${formatarMoeda(payload.valor)}`);
      recarregar();
      setDetailVersion((value) => value + 1);
      return true;
    } catch (contributionError) {
      toast.erro('Não foi possível adicionar o aporte.', contributionError);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleBalance = async (investment: InvestimentoDTO, payload: SalvarSaldoInvestimentoDTO): Promise<boolean> => {
    setSaving(true);

    try {
      await investimentosService.atualizarSaldo(investment.id, payload);
      toast.sucesso('Saldo atualizado com sucesso!', `${investment.nome} · ${formatarMoeda(payload.valorAtual)}`);
      recarregar();
      setDetailVersion((value) => value + 1);
      return true;
    } catch (balanceError) {
      toast.erro('Não foi possível atualizar o saldo.', balanceError);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await investimentosService.excluir(removing.investimento.id);
      toast.sucesso('Investimento excluído com sucesso!', removing.investimento.nome);
      setRemoving(null);
      recarregar();
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
                rotulo: 'Patrimônio atual',
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
        aoAtualizarSaldo={handleBalance}
      />

      <ModalFormularioInvestimento
        aberto={formOpen}
        investimento={editing}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir investimento"
        descricao="A posição sai da carteira junto com todo o histórico de aportes e rendimentos. Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.investimento.nome}</strong>
            <span className={styles.confirmMeta}>{removing.investimento.instituicao}</span>
            <ValorMonetario valor={removing.investimento.valorAtual} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
