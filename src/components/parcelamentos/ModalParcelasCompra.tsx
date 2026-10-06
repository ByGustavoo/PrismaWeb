import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { tomSituacaoParcela } from '@/components/cartoes';
import { Selo, Botao, BarraProgresso, Modal } from '@/components/ui';
import { ehCompraAVista, rotuloQuantidadeParcelas, rotuloSituacaoParcela } from '@/constants/cartoes';
import type { ParcelaDTO, PlanoCompraParceladaDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarDataCurta, formatarMesCurto } from '@/utils/formatacao';
import { ControlePagamentoParcela } from './ControlePagamentoParcela';
import styles from './ModalParcelasCompra.module.css';

interface ModalParcelasCompraProps {
  plano: PlanoCompraParceladaDTO | null;
  atualizando: boolean;
  parcelaEmEspera: number | null;
  pagamentoBloqueado: boolean;
  aoAlternarPagamento: (plan: PlanoCompraParceladaDTO, installment: ParcelaDTO) => Promise<boolean>;
  aoFechar: () => void;
}

export function ModalParcelasCompra({
  plano,
  atualizando,
  parcelaEmEspera,
  pagamentoBloqueado,
  aoAlternarPagamento,
  aoFechar,
}: ModalParcelasCompraProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterPayment = useRef<number | null>(null);
  const [scroll, setScroll] = useState({ possible: false, above: false, below: false });
  const openId = plano?.compra.id ?? null;

  const measureScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const next = {
      possible: list.scrollHeight > list.clientHeight + 1,
      above: list.scrollTop > 1,
      below: list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    };

    setScroll((current) =>
      current.possible === next.possible && current.above === next.above && current.below === next.below
        ? current
        : next,
    );
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const current = list.querySelector<HTMLElement>('[data-atual]');
    const lead = current?.previousElementSibling;
    const anchor = lead instanceof HTMLElement ? lead : current;

    list.scrollTop = anchor ? anchor.offsetTop : 0;
    measureScroll();
  }, [openId, measureScroll]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const observer = new ResizeObserver(measureScroll);
    observer.observe(list);
    return () => observer.disconnect();
  }, [openId, measureScroll]);

  useEffect(() => {
    const installmentNumber = focusAfterPayment.current;
    const list = listRef.current;
    if (installmentNumber === null || !list) return;
    focusAfterPayment.current = null;

    if (document.activeElement !== document.body) return;

    list.querySelector<HTMLButtonElement>(`[data-parcela="${installmentNumber}"] button:not(:disabled)`)?.focus();
  }, [plano]);

  if (!plano) return null;

  const { compra: purchase } = plano;
  const settled = plano.parcelasRestantes === 0;
  const singlePayment = ehCompraAVista(purchase.parcelas);

  const togglePayment = async (installment: ParcelaDTO) => {
    focusAfterPayment.current = installment.numero;
    const done = await aoAlternarPagamento(plano, installment);
    if (!done) focusAfterPayment.current = null;
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={purchase.descricao}
      descricao={`${purchase.nomeCartao} · ${rotuloQuantidadeParcelas(purchase.parcelas)}`}
      tamanho="md"
      rodape={
        <Botao variante="secondary" onClick={aoFechar}>
          Fechar
        </Botao>
      }
    >
      <header className={styles.summary}>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Já pago</dt>
            <dd>
              <ValorMonetario valor={plano.valorPago} tamanho="md" tom={plano.valorPago > 0 ? 'positive' : 'muted'} />
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>Falta pagar</dt>
            <dd>
              <ValorMonetario valor={plano.valorRestante} tamanho="md" tom={settled ? 'muted' : 'default'} />
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>Total</dt>
            <dd>
              <ValorMonetario valor={purchase.valorTotal} tamanho="md" tom="muted" />
            </dd>
          </div>
        </dl>

        <BarraProgresso
          valor={plano.parcelasPagas / purchase.parcelas}
          tom={settled ? 'positive' : 'accent'}
          segmentos={purchase.parcelas}
          rotulo={`Parcelas pagas de ${purchase.descricao}`}
        />

        <p className={styles.progress}>
          <span className="tabular">{plano.parcelasPagas}</span> de{' '}
          <span className="tabular">{purchase.parcelas}</span>{' '}
          {singlePayment ? 'parcela paga' : 'parcelas pagas'}
        </p>
      </header>

      <div
        className={styles.frame}
        {...(scroll.above ? { 'data-acima': '' } : {})}
        {...(scroll.below ? { 'data-abaixo': '' } : {})}
      >
        <ul
          ref={listRef}
          className={`${styles.schedule} refreshing`}
          aria-busy={atualizando}
          aria-label={singlePayment ? `Parcela de ${purchase.descricao}` : `Parcelas de ${purchase.descricao}`}
          onScroll={measureScroll}
          {...(scroll.possible ? { tabIndex: 0 } : {})}
        >
          {plano.cronograma.map((installment) => {
            const paid = installment.situacao === 'PAGA';

            return (
              <li
                key={installment.numero}
                data-parcela={installment.numero}
                {...(installment.situacao === 'ATUAL' ? { 'data-atual': '' } : {})}
                className={juntarClasses(
                  styles.installment,
                  paid && styles.installmentPaid,
                  installment.situacao === 'ATUAL' && styles.installmentCurrent,
                )}
              >
                <span className={`${styles.number} tabular`}>
                  {installment.numero}/{purchase.parcelas}
                </span>

                <span className={styles.when}>
                  <span className={styles.monthLine}>
                    <span className={`${styles.month} tabular`}>{formatarMesCurto(installment.mes)}</span>
                    {installment.situacao === 'ATUAL' ? (
                      <Selo tom={tomSituacaoParcela.ATUAL} ponto>
                        {rotuloSituacaoParcela.ATUAL}
                      </Selo>
                    ) : null}
                  </span>
                  <span className={`${styles.dueDate} tabular`}>vence {formatarDataCurta(installment.dataVencimento)}</span>
                </span>

                <span className={styles.value}>
                  <ValorMonetario valor={installment.valor} tamanho="sm" tom={paid ? 'muted' : 'default'} />
                </span>

                <span className={styles.status}>
                  <ControlePagamentoParcela
                    discreto
                    paga={paid}
                    pagamentoAntecipado={installment.pagamentoAntecipado}
                    alvo={
                      singlePayment
                        ? `compra ${purchase.descricao}`
                        : `parcela ${installment.numero} de ${purchase.parcelas} de ${purchase.descricao}`
                    }
                    emEspera={parcelaEmEspera === installment.numero}
                    bloqueado={pagamentoBloqueado}
                    aoAlternar={() => togglePayment(installment)}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
