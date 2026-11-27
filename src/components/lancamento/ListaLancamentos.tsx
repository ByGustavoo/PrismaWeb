import type { CSSProperties } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { ehLancamentoGerado, notaLancamentoGerado, rotuloTipoLancamento, rotuloSituacaoLancamento } from '@/constants/lancamento/lancamento';
import type { LancamentoDTO } from '@/types';
import { formatarDataCurta } from '@/utils/formatacao';
import { classePorTipo, iconePorTipo, sinalPorTipo, tomPorTipo, tomPorSituacao } from './aparencia';
import styles from './ListaLancamentos.module.css';

interface ListaLancamentosProps {
  lancamentos: LancamentoDTO[];
  mostrarCategoria: boolean;
  aoEditar: (transaction: LancamentoDTO) => void;
  aoExcluir: (transaction: LancamentoDTO) => void;
}

export function ListaLancamentos({
  lancamentos,
  mostrarCategoria,
  aoEditar,
  aoExcluir,
}: ListaLancamentosProps) {
  return (
    <ul className={styles.list}>
      {lancamentos.map((transaction, indice) => {
        const Icon = iconePorTipo[transaction.tipo];
        const generatedNote = notaLancamentoGerado(transaction);

        return (
          <li key={transaction.id} className={styles.card} style={{ '--i': indice } as CSSProperties}>
            <button type="button" className={styles.open} onClick={() => aoEditar(transaction)}>
              <span className="visually-hidden">
                {transaction.parcela ? 'Ver as parcelas de' : transaction.investimento ? 'Ver o investimento de' : 'Editar'}{' '}
                {transaction.descricao}
              </span>
            </button>

            <div className={styles.content}>
              <div className={styles.top}>
                <span className={`${styles.kindIcon} ${styles[classePorTipo[transaction.tipo]]}`} aria-hidden="true">
                  <Icon size={15} strokeWidth={2} />
                </span>

                <span className={styles.text}>
                  <span className={styles.description}>{transaction.descricao}</span>
                  <span className={styles.meta}>
                    <span className="tabular">{formatarDataCurta(transaction.data)}</span>
                    <span className={styles.separator} aria-hidden="true">
                      —
                    </span>
                    {transaction.nomeContaDestino ? (
                      <span className={styles.route}>
                        {transaction.nomeOrigem}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                        {transaction.nomeContaDestino}
                      </span>
                    ) : (
                      transaction.nomeOrigem
                    )}
                    {generatedNote ? (
                      <>
                        <span className={styles.separator} aria-hidden="true">
                          —
                        </span>
                        <span className={styles.note}>{generatedNote}</span>
                      </>
                    ) : null}
                    {transaction.observacoes ? (
                      <>
                        <span className={styles.separator} aria-hidden="true">
                          —
                        </span>
                        <span className={styles.note}>{transaction.observacoes}</span>
                      </>
                    ) : null}
                  </span>
                </span>

                <ValorMonetario
                  valor={transaction.valor}
                  tom={tomPorTipo[transaction.tipo]}
                  sinal={sinalPorTipo[transaction.tipo]}
                />
              </div>

              <div className={styles.bottom}>
                <span className={styles.tags}>
                  {mostrarCategoria && transaction.categoria ? (
                    <span className={styles.category}>
                      <span
                        className={styles.categoryDot}
                        style={{ backgroundColor: corDaPaleta(transaction.categoria.tokenCor) }}
                        aria-hidden="true"
                      />
                      {transaction.categoria.nome}
                    </span>
                  ) : null}
                  <Selo tom={tomPorSituacao[transaction.situacao]} ponto>
                    {rotuloSituacaoLancamento[transaction.situacao]}
                  </Selo>
                  {transaction.tipo === 'TRANSFERENCIA' ? (
                    <span className={styles.kindLabel}>{rotuloTipoLancamento[transaction.tipo]}</span>
                  ) : null}
                </span>

                {ehLancamentoGerado(transaction) ? null : (
                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`Excluir ${transaction.descricao}`}
                    onClick={() => aoExcluir(transaction)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
