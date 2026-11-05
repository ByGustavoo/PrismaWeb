import { Pause, Play, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { DIAS_VENCIMENTO_PROXIMO, ROTULO_LANCAMENTO_AUTOMATICO, rotuloFrequencia, rotuloSituacaoRecorrente, tomSituacaoRecorrente } from '@/constants/recorrentes';
import type { RecorrenteDTO } from '@/types';
import { diasEntre, hojeISO } from '@/utils/data';
import { capitalizar, formatarRotuloRecebimento, formatarRotuloVencimento, formatarDataNumerica } from '@/utils/formatacao';
import styles from './CartaoRecorrente.module.css';

interface CartaoRecorrenteProps {
  recorrente: RecorrenteDTO;
  aoEditar: (recurring: RecorrenteDTO) => void;
  aoAlternar: (recurring: RecorrenteDTO) => void;
  aoExcluir: (recurring: RecorrenteDTO) => void;
}

export function CartaoRecorrente({ recorrente, aoEditar, aoAlternar, aoExcluir }: CartaoRecorrenteProps) {
  const paused = recorrente.situacao === 'PAUSADO';
  const days = diasEntre(hojeISO(), recorrente.proximoVencimento);
  const income = recorrente.tipo === 'RECEITA';
  const dueSoon = !income && !paused && days >= 0 && days <= DIAS_VENCIMENTO_PROXIMO;
  const dueLabel = income ? formatarRotuloRecebimento(recorrente.proximoVencimento) : formatarRotuloVencimento(recorrente.proximoVencimento);

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => aoEditar(recorrente)}>
        <span className="visually-hidden">Editar {recorrente.descricao}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.identity}>
            <span className={styles.name}>{recorrente.descricao}</span>
            <span className={styles.meta}>
              {recorrente.categoria ? (
                <>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: corDaPaleta(recorrente.categoria.tokenCor) }}
                    aria-hidden="true"
                  />
                  {recorrente.categoria.nome}
                  <span className={styles.separator} aria-hidden="true">
                    —
                  </span>
                </>
              ) : null}
              <span className={styles.origin}>{recorrente.nomeOrigem}</span>
            </span>
          </span>

          <span className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              aria-label={paused ? `Retomar ${recorrente.descricao}` : `Pausar ${recorrente.descricao}`}
              onClick={() => aoAlternar(recorrente)}
            >
              {paused ? <Play size={16} strokeWidth={2} /> : <Pause size={16} strokeWidth={2} />}
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.delete}`}
              aria-label={`Excluir ${recorrente.descricao}`}
              onClick={() => aoExcluir(recorrente)}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </span>
        </div>

        <div className={styles.figures}>
          <ValorMonetario valor={recorrente.valor} tamanho="lg" tom={paused ? 'muted' : income ? 'positive' : 'default'} />
          <span className={styles.tags}>
            {!paused && recorrente.lancarAutomaticamente ? (
              <Selo tom="accent">{ROTULO_LANCAMENTO_AUTOMATICO}</Selo>
            ) : null}
            <Selo tom="neutral">{rotuloFrequencia[recorrente.frequencia]}</Selo>
          </span>
        </div>

        <div className={styles.bottom}>
          <span className={`${styles.due} ${dueSoon ? styles.dueSoon : ''}`}>
            {paused ? (
              income ? 'Sem recebimento enquanto pausada' : 'Sem vencimento enquanto pausada'
            ) : (
              <>
                {formatarDataNumerica(recorrente.proximoVencimento)}
                <span className={styles.separator} aria-hidden="true">
                  —
                </span>
                {capitalizar(dueLabel)}
              </>
            )}
          </span>

          {paused ? (
            <Selo tom={tomSituacaoRecorrente[recorrente.situacao]} ponto>
              {rotuloSituacaoRecorrente[recorrente.situacao]}
            </Selo>
          ) : null}
        </div>
      </div>
    </li>
  );
}
