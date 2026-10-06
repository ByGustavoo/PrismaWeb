import { useCallback, useEffect, useRef } from 'react';
import { Check, Receipt } from 'lucide-react';
import { aceitaPagamentoDaFatura, rotuloDaFatura, tomDaFatura } from '@/components/cartoes/aparencia';
import { ValorMonetario } from '@/components/comum';
import { ControlePagamentoParcela, MarcaPagamento } from '@/components/parcelamentos';
import { Selo, Botao, EstadoVazio, BlocoCarregando, Modal } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { usePagamentoFatura } from '@/hooks/usePagamentoFatura';
import { usePagamentoParcela } from '@/hooks/usePagamentoParcela';
import { cartoesService } from '@/services';
import type { FaturaCartaoDTO, ItemFaturaDTO, ParcelaItemFaturaDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { capitalizar, formatarDataCompleta, formatarRotuloMes, formatarDataCurta } from '@/utils/formatacao';
import styles from './ModalDetalheFatura.module.css';

interface ModalDetalheFaturaProps {
  fatura: FaturaCartaoDTO | null;
  aoAlterar: () => void;
  aoFechar: () => void;
}

const FOCO_NA_FATURA = 'fatura';

function aceitaPagamento(installment: ParcelaItemFaturaDTO | undefined): installment is ParcelaItemFaturaDTO {
  return installment !== undefined && (installment.situacao !== 'PAGA' || installment.pagamentoAntecipado);
}

function descreverParcela(item: ItemFaturaDTO, installment: ParcelaItemFaturaDTO): string {
  return installment.total === 1
    ? `compra ${item.descricao}`
    : `parcela ${installment.numero} de ${installment.total} de ${item.descricao}`;
}

export function ModalDetalheFatura({ fatura, aoAlterar, aoFechar }: ModalDetalheFaturaProps) {
  const invoiceId = fatura?.id ?? null;
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterPayment = useRef<string | null>(null);

  const fetchDetail = useCallback(
    (signal: AbortSignal) => (invoiceId ? cartoesService.buscarFatura(invoiceId, signal) : Promise.resolve(null)),
    [invoiceId],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchDetail, [invoiceId]);

  const refresh = useCallback(() => {
    recarregar();
    aoAlterar();
  }, [recarregar, aoAlterar]);

  const pagamento = usePagamentoParcela(dados, refresh);
  const pagamentoFatura = usePagamentoFatura(dados, refresh);

  useEffect(() => {
    const target = focusAfterPayment.current;
    const dialog = listRef.current?.closest<HTMLElement>('[role="dialog"]');
    if (target === null || !dialog) return;
    focusAfterPayment.current = null;

    if (document.activeElement !== document.body) return;

    if (target === FOCO_NA_FATURA) {
      dialog.querySelector<HTMLButtonElement>('[data-acao="pagamento-fatura"]:not(:disabled)')?.focus();
      return;
    }

    [...dialog.querySelectorAll<HTMLElement>('[data-item]')]
      .find((row) => row.dataset.item === target)
      ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      ?.focus();
  }, [dados]);

  if (!fatura) return null;

  const detail = dados?.id === fatura.id ? dados : null;
  const invoice = detail ?? fatura;
  const items = detail?.itens ?? [];
  const withPayment = items.some((item) => item.paga || aceitaPagamento(item.parcela));
  const busy = pagamento.emEspera !== null || pagamentoFatura.emEspera;
  const canPay = detail !== null && aceitaPagamentoDaFatura(detail);
  const canUndo =
    detail !== null &&
    detail.valorPago > 0 &&
    (detail.valorRestante <= 0 || items.some((item) => item.paga && !item.parcela));

  const toggleInvoicePayment = async (undo: boolean) => {
    if (!detail) return;
    focusAfterPayment.current = FOCO_NA_FATURA;

    const done = await pagamentoFatura.alternar(detail, undo);
    if (!done) focusAfterPayment.current = null;
  };

  const togglePayment = async (item: ItemFaturaDTO, installment: ParcelaItemFaturaDTO) => {
    focusAfterPayment.current = item.id;

    const done = await pagamento.alternar({
      idCompra: installment.idCompra,
      descricao: item.descricao,
      numero: installment.numero,
      totalParcelas: installment.total,
      pagamentoAntecipado: installment.pagamentoAntecipado,
    });

    if (!done) focusAfterPayment.current = null;
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={`Fatura de ${capitalizar(formatarRotuloMes(fatura.mes))}`}
      descricao={fatura.nomeCartao}
      tamanho="lg"
      rodape={
        <>
          {canUndo ? (
            <Botao
              variante="ghost"
              data-acao="pagamento-fatura"
              carregando={pagamentoFatura.emEspera && !canPay}
              disabled={busy}
              onClick={() => toggleInvoicePayment(true)}
            >
              Desfazer pagamento
            </Botao>
          ) : null}
          <Botao variante="secondary" onClick={aoFechar}>
            Fechar
          </Botao>
          {canPay ? (
            <Botao
              icone={Check}
              data-acao="pagamento-fatura"
              carregando={pagamentoFatura.emEspera}
              disabled={busy}
              onClick={() => toggleInvoicePayment(false)}
            >
              Já paguei esta fatura
            </Botao>
          ) : null}
        </>
      }
    >
      <header className={styles.summary}>
        <div className={styles.summaryMain}>
          <span className={styles.summaryLabel}>Total da fatura</span>
          <ValorMonetario valor={invoice.total} tamanho="lg" />
          {invoice.valorPago > 0 ? (
            <span className={styles.summaryPaid}>
              <span>
                Já pago <ValorMonetario valor={invoice.valorPago} tamanho="sm" tom="positive" />
              </span>
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              <span>
                Falta pagar <ValorMonetario valor={invoice.valorRestante} tamanho="sm" />
              </span>
            </span>
          ) : null}
        </div>

        <dl className={styles.summaryDates}>
          <div>
            <dt>Fechamento</dt>
            <dd>{formatarDataCompleta(invoice.dataFechamento)}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{formatarDataCompleta(invoice.dataVencimento)}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <Selo tom={tomDaFatura(invoice)} ponto>
                {rotuloDaFatura(invoice)}
              </Selo>
            </dd>
          </div>
        </dl>
      </header>

      {!detail && carregando ? (
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
        <ul
          ref={listRef}
          className={juntarClasses(styles.items, withPayment && styles.itemsWithPayment, 'refreshing')}
          aria-busy={carregando}
        >
          {items.map((item) => {
            const installment = item.parcela;

            return (
              <li key={item.id} className={styles.item} data-item={item.id}>
                <span className={`${styles.itemDate} tabular`}>{formatarDataCurta(item.data)}</span>

                <span className={styles.itemText}>
                  <span className={styles.itemDescription}>
                    {item.descricao}
                    {installment && installment.total > 1 ? (
                      <span className={styles.installment}>
                        {installment.numero}/{installment.total}
                      </span>
                    ) : null}
                  </span>

                  {item.categoria ? (
                    <span className={styles.category}>
                      <span
                        className={styles.categoryDot}
                        style={{ backgroundColor: corDaPaleta(item.categoria.tokenCor) }}
                        aria-hidden="true"
                      />
                      {item.categoria.nome}
                    </span>
                  ) : null}
                </span>

                <span className={styles.itemValue}>
                  <ValorMonetario
                    valor={item.valor}
                    tamanho="sm"
                    tom={item.paga ? 'muted' : 'default'}
                  />
                </span>

                {aceitaPagamento(installment) ? (
                  <span className={styles.itemPayment}>
                    <ControlePagamentoParcela
                      paga={installment.situacao === 'PAGA'}
                      pagamentoAntecipado={installment.pagamentoAntecipado}
                      alvo={descreverParcela(item, installment)}
                      emEspera={
                        pagamento.emEspera?.idCompra === installment.idCompra &&
                        pagamento.emEspera.numero === installment.numero
                      }
                      bloqueado={busy}
                      aoAlternar={() => togglePayment(item, installment)}
                    />
                  </span>
                ) : item.paga ? (
                  <span className={styles.itemPayment}>
                    <MarcaPagamento />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
