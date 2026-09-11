import { Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, BarraProgresso } from '@/components/ui';
import { tomProgressoOrcamento, rotuloSituacaoOrcamento, tomSituacaoOrcamento } from '@/constants/orcamento';
import type { ConsumoOrcamentoDTO } from '@/types';
import { formatarPercentual } from '@/utils/formatacao';
import styles from './LinhaOrcamento.module.css';

interface LinhaOrcamentoProps {
  consumo: ConsumoOrcamentoDTO;
  mostrarProjecao: boolean;
  aoEditar: (usage: ConsumoOrcamentoDTO) => void;
  aoExcluir: (usage: ConsumoOrcamentoDTO) => void;
}

export function LinhaOrcamento({ consumo, mostrarProjecao, aoEditar, aoExcluir }: LinhaOrcamentoProps) {
  const { orcamento: budget, gasto: spent, restante: remaining, consumo: ratio, projecao: projected, situacao: status } = consumo;
  const exceeded = status === 'ESTOURADO';

  return (
    <li className={styles.row}>
      <button type="button" className={styles.open} onClick={() => aoEditar(consumo)}>
        <span className="visually-hidden">Editar o limite de {budget.categoria.nome}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span
            className={styles.marker}
            style={{ backgroundColor: `var(--chart-${budget.categoria.tokenCor})` }}
            aria-hidden="true"
          />
          <span className={styles.name}>{budget.categoria.nome}</span>

          <Selo tom={tomSituacaoOrcamento[status]} className={styles.badge}>
            {rotuloSituacaoOrcamento[status]}
          </Selo>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir o limite de ${budget.categoria.nome}`}
            onClick={() => aoExcluir(consumo)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.figures}>
          <span className={styles.amounts}>
            <ValorMonetario valor={spent} tamanho="md" />
            <span className={styles.divider} aria-hidden="true">
              /
            </span>
            <ValorMonetario valor={budget.limiteMensal} tamanho="sm" tom="muted" />
          </span>
          <span className={`${styles.ratio} tabular`}>{formatarPercentual(ratio * 100, 0)}</span>
        </div>

        <BarraProgresso
          valor={ratio}
          tom={tomProgressoOrcamento[status]}
          rotulo={`${budget.categoria.nome}: ${formatarPercentual(ratio * 100, 0)} do limite`}
        />

        <p className={styles.note}>
          {exceeded ? (
            <>
              Passou do limite em{' '}
              <ValorMonetario className={styles.inline} valor={Math.abs(remaining)} tamanho="sm" tom="negative" />.
            </>
          ) : (
            <>
              Ainda cabem <ValorMonetario className={styles.inline} valor={remaining} tamanho="sm" />.
            </>
          )}
          {mostrarProjecao ? (
            <span className={styles.projection}>
              No ritmo atual, <ValorMonetario className={styles.inline} valor={projected} tamanho="sm" tom="muted" /> até o fim
              do mês.
            </span>
          ) : null}
        </p>
      </div>
    </li>
  );
}
