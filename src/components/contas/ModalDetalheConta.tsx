import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, ListFilter, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { HistoricoMovimentacoes, ValorMonetario } from '@/components/comum';
import type { ItemMovimentacao } from '@/components/comum';
import { GraficoEvolucao } from '@/components/graficos';
import { Botao, EstadoVazio, Modal } from '@/components/ui';
import { MESES_EVOLUCAO_CONTA, rotuloTipoConta } from '@/constants/contas';
import { PARAMETRO_CONTA, PARAMETRO_NOVO_LANCAMENTO, caminhos } from '@/routes/caminhos';
import type { EvolucaoContaDTO, MovimentacaoContaDTO } from '@/types';
import { formatarDataNumerica, formatarPercentualComSinal } from '@/utils/formatacao';
import { iconeTipoConta } from './aparencia';
import styles from './ModalDetalheConta.module.css';

interface ModalDetalheContaProps {
  evolucao: EvolucaoContaDTO | null;
  salvando: boolean;
  aoFechar: () => void;
  aoEditar: (evolution: EvolucaoContaDTO) => void;
  aoExcluir: (evolution: EvolucaoContaDTO) => void;
}

function paraItem(movement: MovimentacaoContaDTO): ItemMovimentacao {
  if (movement.tipo === 'RENDIMENTO') {
    return {
      id: movement.id,
      data: movement.data,
      titulo: movement.descricao,
      detalhe: 'Rendimento',
      valor: movement.valor,
      sinal: 'plus',
      tom: 'positive',
      icone: TrendingUp,
      saldoApos: movement.saldoApos,
    };
  }

  const contribution = movement.tipo === 'APORTE';
  return {
    id: movement.id,
    data: movement.data,
    titulo: movement.descricao,
    detalhe: contribution ? 'Aporte' : 'Resgate',
    valor: movement.valor,
    sinal: contribution ? 'plus' : 'minus',
    tom: contribution ? 'accent' : 'neutral',
    icone: contribution ? ArrowDownToLine : ArrowUpFromLine,
    saldoApos: movement.saldoApos,
  };
}

export function ModalDetalheConta({ evolucao, salvando, aoFechar, aoEditar, aoExcluir }: ModalDetalheContaProps) {
  const navigate = useNavigate();
  const items = useMemo(() => (evolucao ? evolucao.movimentacoes.map(paraItem) : []), [evolucao]);

  if (!evolucao) return null;

  const { conta: account } = evolucao;
  const Icon = iconeTipoConta[account.tipo];
  const netContributions = evolucao.aportes - evolucao.resgates;

  const goTo = (path: string) => {
    aoFechar();
    navigate(path);
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={account.nome}
      descricao={`${rotuloTipoConta[account.tipo]} · ${account.instituicao}`}
      tamanho="lg"
      rodape={
        <>
          <Botao
            className={styles.footerStart}
            variante="ghost"
            icone={Trash2}
            disabled={salvando}
            onClick={() => aoExcluir(evolucao)}
          >
            Excluir
          </Botao>
          <Botao variante="secondary" icone={Pencil} disabled={salvando} onClick={() => aoEditar(evolucao)}>
            Editar
          </Botao>
          <Botao onClick={aoFechar}>Fechar</Botao>
        </>
      }
    >
      <div className={styles.body}>
        <header className={styles.head}>
          <span className={styles.iconBox} aria-hidden="true">
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <div className={styles.headMain}>
            <span className={styles.headLabel}>Saldo atual</span>
            <ValorMonetario valor={evolucao.saldoAtual} tamanho="lg" />
          </div>
          <div className={styles.headResult}>
            <span className={styles.headLabel}>Rendimento em {MESES_EVOLUCAO_CONTA} meses</span>
            <span className={styles.pair}>
              <ValorMonetario
                valor={evolucao.rendimentos}
                sinal="auto"
                tom={evolucao.rendimentos > 0 ? 'positive' : 'muted'}
              />
              <span className="tabular">{formatarPercentualComSinal(evolucao.rentabilidade * 100)}</span>
            </span>
          </div>
        </header>

        <section className={styles.equation} aria-label="Como o saldo chegou até aqui">
          <div className={styles.term}>
            <span className={styles.termLabel}>Saldo em {formatarDataNumerica(evolucao.dataInicial)}</span>
            <ValorMonetario valor={evolucao.saldoInicial} tamanho="sm" />
          </div>
          <span className={styles.operator} aria-hidden="true">
            +
          </span>
          <div className={styles.term}>
            <span className={styles.termLabel}>Aportes</span>
            <ValorMonetario valor={evolucao.aportes} tamanho="sm" />
          </div>
          <span className={styles.operator} aria-hidden="true">
            −
          </span>
          <div className={styles.term}>
            <span className={styles.termLabel}>Resgates</span>
            <ValorMonetario valor={evolucao.resgates} tamanho="sm" tom={evolucao.resgates > 0 ? 'default' : 'muted'} />
          </div>
          <span className={styles.operator} aria-hidden="true">
            +
          </span>
          <div className={styles.term}>
            <span className={styles.termLabel}>Rendimentos</span>
            <ValorMonetario valor={evolucao.rendimentos} tamanho="sm" tom="positive" />
          </div>
          <span className={styles.operator} aria-hidden="true">
            =
          </span>
          <div className={styles.term}>
            <span className={styles.termLabel}>Saldo hoje</span>
            <ValorMonetario valor={evolucao.saldoAtual} tamanho="sm" />
          </div>
        </section>

        <section className={styles.block} aria-labelledby="account-evolution-title">
          <h3 className={styles.sectionTitle} id="account-evolution-title">
            Evolução do saldo
          </h3>
          <p className={styles.sectionHint}>
            O tracejado é o saldo sem os rendimentos: o que você guardou. A distância até a área é o que o dinheiro rendeu.
          </p>
          <GraficoEvolucao
            dados={evolucao.evolucao}
            altura={220}
            rotuloValor="Saldo"
            rotuloAportado={netContributions >= 0 ? 'Guardado por você' : 'Saldo sem rendimento'}
          />
        </section>

        <div className={styles.actions}>
          <Botao
            variante="secondary"
            tamanho="sm"
            icone={ArrowDownToLine}
            onClick={() => goTo(`${caminhos.lancamentos}?${PARAMETRO_NOVO_LANCAMENTO}=transferencia`)}
          >
            Registrar aporte
          </Botao>
          <Botao
            variante="secondary"
            tamanho="sm"
            icone={ArrowDownLeft}
            onClick={() => goTo(`${caminhos.lancamentos}?${PARAMETRO_NOVO_LANCAMENTO}=receita`)}
          >
            Registrar rendimento
          </Botao>
          <Botao
            variante="ghost"
            tamanho="sm"
            icone={ListFilter}
            onClick={() => goTo(`${caminhos.lancamentos}?${PARAMETRO_CONTA}=${account.id}`)}
          >
            Ver lançamentos
          </Botao>
        </div>
        <p className={styles.actionsHint}>
          Aporte é uma transferência para esta conta; rendimento é uma receita na categoria Rendimentos. Os dois viram
          lançamentos, e a evolução se atualiza sozinha.
        </p>

        <section className={styles.block} aria-labelledby="account-history-title">
          <h3 className={styles.sectionTitle} id="account-history-title">
            Movimentações dos últimos {MESES_EVOLUCAO_CONTA} meses
          </h3>
          {items.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma movimentação no período"
              descricao="Quando houver aportes, resgates ou rendimentos nesta conta, eles aparecem aqui."
            />
          ) : (
            <HistoricoMovimentacoes itens={items} />
          )}
        </section>
      </div>
    </Modal>
  );
}
