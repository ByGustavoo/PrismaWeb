import { Pause, Play, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { DIAS_VENCIMENTO_PROXIMO, rotuloFrequencia, rotuloSituacaoRecorrente, tomSituacaoRecorrente } from '@/constants/recorrentes';
import type { DespesaRecorrenteDTO } from '@/types';
import { diasEntre, hojeISO } from '@/utils/data';
import { capitalizar, formatarRotuloVencimento, formatarDataNumerica } from '@/utils/formatacao';
import styles from './CartaoRecorrente.module.css';

interface CartaoRecorrenteProps {
  despesa: DespesaRecorrenteDTO;
  aoEditar: (expense: DespesaRecorrenteDTO) => void;
  aoAlternar: (expense: DespesaRecorrenteDTO) => void;
  aoExcluir: (expense: DespesaRecorrenteDTO) => void;
}

export function CartaoRecorrente({ despesa, aoEditar, aoAlternar, aoExcluir }: CartaoRecorrenteProps) {
  const paused = despesa.situacao === 'PAUSADO';
  const days = diasEntre(hojeISO(), despesa.proximoVencimento);
  const dueSoon = !paused && days >= 0 && days <= DIAS_VENCIMENTO_PROXIMO;

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => aoEditar(despesa)}>
        <span className="visually-hidden">Editar {despesa.descricao}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.identity}>
            <span className={styles.name}>{despesa.descricao}</span>
            <span className={styles.meta}>
              {despesa.categoria ? (
                <>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: corDaPaleta(despesa.categoria.tokenCor) }}
                    aria-hidden="true"
                  />
                  {despesa.categoria.nome}
                  <span className={styles.separator} aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              {despesa.nomeOrigem}
            </span>
          </span>

          <span className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              aria-label={paused ? `Retomar ${despesa.descricao}` : `Pausar ${despesa.descricao}`}
              onClick={() => aoAlternar(despesa)}
            >
              {paused ? <Play size={16} strokeWidth={2} /> : <Pause size={16} strokeWidth={2} />}
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.delete}`}
              aria-label={`Excluir ${despesa.descricao}`}
              onClick={() => aoExcluir(despesa)}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </span>
        </div>

        <div className={styles.figures}>
          <ValorMonetario valor={despesa.valor} tamanho="lg" tom={paused ? 'muted' : 'default'} />
          <Selo tom="neutral">{rotuloFrequencia[despesa.frequencia]}</Selo>
        </div>

        <div className={styles.bottom}>
          <span className={`${styles.due} ${dueSoon ? styles.dueSoon : ''}`}>
            {paused ? (
              'Sem vencimento enquanto pausada'
            ) : (
              <>
                {formatarDataNumerica(despesa.proximoVencimento)}
                <span className={styles.separator} aria-hidden="true">
                  ·
                </span>
                {capitalizar(formatarRotuloVencimento(despesa.proximoVencimento))}
              </>
            )}
          </span>

          {paused ? (
            <Selo tom={tomSituacaoRecorrente[despesa.situacao]} ponto>
              {rotuloSituacaoRecorrente[despesa.situacao]}
            </Selo>
          ) : null}
        </div>
      </div>
    </li>
  );
}
