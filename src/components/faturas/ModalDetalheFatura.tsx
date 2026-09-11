import { useCallback } from 'react';
import { Receipt } from 'lucide-react';
import { tomSituacaoFatura } from '@/components/cartoes';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao, EstadoVazio, BlocoCarregando, Modal } from '@/components/ui';
import { rotuloSituacaoFatura } from '@/constants/cartoes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { cartoesService } from '@/services';
import type { FaturaCartaoDTO } from '@/types';
import { capitalizar, formatarDataCompleta, formatarRotuloMes, formatarDataCurta } from '@/utils/formatacao';
import styles from './ModalDetalheFatura.module.css';

interface ModalDetalheFaturaProps {
  fatura: FaturaCartaoDTO | null;
  aoFechar: () => void;
}

export function ModalDetalheFatura({ fatura, aoFechar }: ModalDetalheFaturaProps) {
  const invoiceId = fatura?.id ?? null;

  const fetchDetail = useCallback(
    (signal: AbortSignal) => (invoiceId ? cartoesService.buscarFatura(invoiceId, signal) : Promise.resolve(null)),
    [invoiceId],
  );

  const { dados, carregando, erro } = useDadosAssincronos(fetchDetail, [invoiceId]);

  if (!fatura) return null;

  const items = dados?.itens ?? [];

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={`Fatura de ${capitalizar(formatarRotuloMes(fatura.mes))}`}
      descricao={fatura.nomeCartao}
      tamanho="lg"
      rodape={
        <Botao variante="secondary" onClick={aoFechar}>
          Fechar
        </Botao>
      }
    >
      <header className={styles.summary}>
        <div className={styles.summaryMain}>
          <span className={styles.summaryLabel}>Total da fatura</span>
          <ValorMonetario valor={fatura.total} tamanho="lg" />
        </div>

        <dl className={styles.summaryDates}>
          <div>
            <dt>Fechamento</dt>
            <dd>{formatarDataCompleta(fatura.dataFechamento)}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{formatarDataCompleta(fatura.dataVencimento)}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <Selo tom={tomSituacaoFatura[fatura.situacao]} ponto>
                {rotuloSituacaoFatura[fatura.situacao]}
              </Selo>
            </dd>
          </div>
        </dl>
      </header>

      {carregando ? (
        <BlocoCarregando linhas={5} altura={220} />
      ) : erro ? (
        <EstadoVazio titulo="Não foi possível carregar as compras" descricao={erro.message} />
      ) : items.length === 0 ? (
        <EstadoVazio
          icone={Receipt}
          titulo="Nenhuma compra nesta fatura"
          descricao="O ciclo ainda não recebeu lançamentos neste cartão."
        />
      ) : (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={`${styles.itemDate} tabular`}>{formatarDataCurta(item.data)}</span>

              <span className={styles.itemText}>
                <span className={styles.itemDescription}>
                  {item.descricao}
                  {item.parcela ? (
                    <span className={styles.installment}>
                      {item.parcela.numero}/{item.parcela.total}
                    </span>
                  ) : null}
                </span>

                {item.categoria ? (
                  <span className={styles.category}>
                    <span
                      className={styles.categoryDot}
                      style={{ backgroundColor: `var(--chart-${item.categoria.tokenCor})` }}
                      aria-hidden="true"
                    />
                    {item.categoria.nome}
                  </span>
                ) : null}
              </span>

              <ValorMonetario valor={item.valor} tamanho="sm" />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
