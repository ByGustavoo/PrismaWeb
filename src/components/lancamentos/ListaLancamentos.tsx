import { ArrowDown, ArrowRight, ArrowUp, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, CampoSelecao } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { rotuloTipoLancamento, rotuloSituacaoLancamento } from '@/constants/lancamentos';
import type { LancamentoDTO, Opcao } from '@/types';
import { formatarDataCurta } from '@/utils/formatacao';
import { classePorTipo, iconePorTipo, sinalPorTipo, tomPorTipo, tomPorSituacao } from './aparencia';
import type { DirecaoOrdenacao, CampoOrdenacao } from './consulta';
import styles from './ListaLancamentos.module.css';

interface ListaLancamentosProps {
  lancamentos: LancamentoDTO[];
  campoOrdenacao: CampoOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
  aoOrdenar: (field: CampoOrdenacao) => void;
  mostrarCategoria: boolean;
  aoEditar: (transaction: LancamentoDTO) => void;
  aoExcluir: (transaction: LancamentoDTO) => void;
}

const opcoesOrdenacao: Opcao[] = [
  { valor: 'date', rotulo: 'Data' },
  { valor: 'description', rotulo: 'Descrição' },
  { valor: 'amount', rotulo: 'Valor' },
];

export function ListaLancamentos({
  lancamentos,
  campoOrdenacao,
  direcaoOrdenacao,
  aoOrdenar,
  mostrarCategoria,
  aoEditar,
  aoExcluir,
}: ListaLancamentosProps) {
  const ascending = direcaoOrdenacao === 'asc';

  return (
    <div className={styles.wrapper}>
      <div className={styles.sortBar}>
        <span className={styles.sortLabel} aria-hidden="true">
          Ordenar por
        </span>
        <CampoSelecao
          className={styles.sortSelect}
          opcoes={opcoesOrdenacao}
          value={campoOrdenacao}
          onChange={(field) => aoOrdenar(field as CampoOrdenacao)}
          aria-label="Ordenar por"
        />
        <button
          type="button"
          className={styles.direction}
          onClick={() => aoOrdenar(campoOrdenacao)}
          aria-label={ascending ? 'Ordem crescente. Inverter para decrescente' : 'Ordem decrescente. Inverter para crescente'}
        >
          {ascending ? <ArrowUp size={16} strokeWidth={2} /> : <ArrowDown size={16} strokeWidth={2} />}
        </button>
      </div>

      <ul className={styles.list}>
        {lancamentos.map((transaction) => {
          const Icon = iconePorTipo[transaction.tipo];

          return (
            <li key={transaction.id} className={styles.card}>
              <button type="button" className={styles.open} onClick={() => aoEditar(transaction)}>
                <span className="visually-hidden">Editar {transaction.descricao}</span>
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
                        ·
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
                    </span>
                  </span>

                  <ValorMonetario
                    valor={transaction.valor}
                    tom={tomPorTipo[transaction.tipo]}
                    sinal={sinalPorTipo[transaction.tipo]}
                  />
                </div>

                {transaction.observacoes ? <p className={styles.notes}>{transaction.observacoes}</p> : null}

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

                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`Excluir ${transaction.descricao}`}
                    onClick={() => aoExcluir(transaction)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
