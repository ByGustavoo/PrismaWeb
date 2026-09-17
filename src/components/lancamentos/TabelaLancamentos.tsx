import { ArrowRight, ArrowUpDown, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao, CorpoTabela, CabecaTabela, Tabela, ContainerTabela, Celula, CelulaCabecalho, LinhaTabela } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { rotuloTipoLancamento, rotuloSituacaoLancamento } from '@/constants/lancamentos';
import type { LancamentoDTO } from '@/types';
import { formatarDataCurta } from '@/utils/formatacao';
import { classePorTipo, iconePorTipo, sinalPorTipo, tomPorTipo, tomPorSituacao } from './aparencia';
import type { DirecaoOrdenacao, CampoOrdenacao } from './consulta';
import styles from './TabelaLancamentos.module.css';

interface TabelaLancamentosProps {
  lancamentos: LancamentoDTO[];
  campoOrdenacao: CampoOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
  aoOrdenar: (field: CampoOrdenacao) => void;
  mostrarCategoria: boolean;
  aoEditar: (transaction: LancamentoDTO) => void;
  aoExcluir: (transaction: LancamentoDTO) => void;
}

interface CabecalhoOrdenavelProps {
  campo: CampoOrdenacao;
  rotulo: string;
  numerico?: boolean;
  ativo: boolean;
  direcao: DirecaoOrdenacao;
  aoOrdenar: (field: CampoOrdenacao) => void;
}

function CabecalhoOrdenavel({ campo, rotulo, numerico = false, ativo, direcao, aoOrdenar }: CabecalhoOrdenavelProps) {
  const Icon = !ativo ? ArrowUpDown : direcao === 'asc' ? ChevronUp : ChevronDown;

  return (
    <CelulaCabecalho numerico={numerico} aria-sort={ativo ? (direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`${styles.sortButton} ${ativo ? styles.sortActive : ''}`}
        onClick={() => aoOrdenar(campo)}
      >
        {rotulo}
        <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </CelulaCabecalho>
  );
}

export function TabelaLancamentos({
  lancamentos,
  campoOrdenacao,
  direcaoOrdenacao,
  aoOrdenar,
  aoEditar,
  aoExcluir,
  mostrarCategoria,
}: TabelaLancamentosProps) {
  return (
    <ContainerTabela>
      <Tabela className={styles.table}>
        <CabecaTabela>
          <LinhaTabela>
            <CabecalhoOrdenavel
              campo="date"
              rotulo="Data"
              ativo={campoOrdenacao === 'date'}
              direcao={direcaoOrdenacao}
              aoOrdenar={aoOrdenar}
            />
            <CabecalhoOrdenavel
              campo="description"
              rotulo="Descrição"
              ativo={campoOrdenacao === 'description'}
              direcao={direcaoOrdenacao}
              aoOrdenar={aoOrdenar}
            />
            {mostrarCategoria ? <CelulaCabecalho>Categoria</CelulaCabecalho> : null}
            <CelulaCabecalho>Conta/cartão</CelulaCabecalho>
            <CelulaCabecalho>Tipo</CelulaCabecalho>
            <CabecalhoOrdenavel
              campo="amount"
              rotulo="Valor"
              numerico
              ativo={campoOrdenacao === 'amount'}
              direcao={direcaoOrdenacao}
              aoOrdenar={aoOrdenar}
            />
            <CelulaCabecalho>Situação</CelulaCabecalho>
            <CelulaCabecalho numerico>Ações</CelulaCabecalho>
          </LinhaTabela>
        </CabecaTabela>

        <CorpoTabela>
          {lancamentos.map((transaction) => {
            const Icon = iconePorTipo[transaction.tipo];

            return (
              <LinhaTabela key={transaction.id} interativo onClick={() => aoEditar(transaction)}>
                <Celula className={`${styles.muted} tabular`}>{formatarDataCurta(transaction.data)}</Celula>

                <Celula onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.descriptionButton}
                    onClick={() => aoEditar(transaction)}
                  >
                    <span className={styles.description}>{transaction.descricao}</span>
                    {transaction.observacoes ? <span className={styles.notes}>{transaction.observacoes}</span> : null}
                  </button>
                </Celula>

                {mostrarCategoria ? (
                  <Celula>
                    {transaction.categoria ? (
                      <span className={styles.category}>
                        <span
                          className={styles.categoryDot}
                          style={{ backgroundColor: corDaPaleta(transaction.categoria.tokenCor) }}
                          aria-hidden="true"
                        />
                        {transaction.categoria.nome}
                      </span>
                    ) : (
                      <span className={styles.empty}>—</span>
                    )}
                  </Celula>
                ) : null}

                <Celula className={styles.muted}>
                  {transaction.nomeContaDestino ? (
                    <span className={styles.route}>
                      {transaction.nomeOrigem}
                      <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                      {transaction.nomeContaDestino}
                    </span>
                  ) : (
                    transaction.nomeOrigem
                  )}
                </Celula>

                <Celula>
                  <span className={`${styles.kind} ${styles[classePorTipo[transaction.tipo]]}`}>
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {rotuloTipoLancamento[transaction.tipo]}
                  </span>
                </Celula>

                <Celula numerico>
                  <ValorMonetario
                    valor={transaction.valor}
                    tom={tomPorTipo[transaction.tipo]}
                    tamanho="sm"
                    sinal={sinalPorTipo[transaction.tipo]}
                  />
                </Celula>

                <Celula>
                  <Selo tom={tomPorSituacao[transaction.situacao]} ponto>
                    {rotuloSituacaoLancamento[transaction.situacao]}
                  </Selo>
                </Celula>

                <Celula numerico onClick={(event) => event.stopPropagation()}>
                  <div className={styles.actions}>
                    <Botao
                      variante="ghost"
                      tamanho="sm"
                      icone={Pencil}
                      aria-label={`Editar ${transaction.descricao}`}
                      onClick={() => aoEditar(transaction)}
                    />
                    <Botao
                      variante="ghost"
                      tamanho="sm"
                      icone={Trash2}
                      className={styles.delete}
                      aria-label={`Excluir ${transaction.descricao}`}
                      onClick={() => aoExcluir(transaction)}
                    />
                  </div>
                </Celula>
              </LinhaTabela>
            );
          })}
        </CorpoTabela>
      </Tabela>
    </ContainerTabela>
  );
}
