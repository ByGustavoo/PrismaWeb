import { useId, useState } from 'react';
import { Check, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { tomSituacaoParcela } from '@/components/cartoes';
import { Selo, Botao, BarraProgresso } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { ehCompraAVista, rotuloSituacaoParcela } from '@/constants/cartoes';
import type { CompraParceladaDTO, PlanoCompraParceladaDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarDataCompleta, formatarDataCurta, formatarMesCurto } from '@/utils/formatacao';
import styles from './CartaoParcelamento.module.css';

interface CartaoParcelamentoProps {
  plano: PlanoCompraParceladaDTO;
  aoEditar: (purchase: CompraParceladaDTO) => void;
  aoExcluir: (purchase: CompraParceladaDTO) => void;
}

export function CartaoParcelamento({ plano, aoEditar, aoExcluir }: CartaoParcelamentoProps) {
  const [expanded, setExpanded] = useState(false);
  const scheduleId = useId();
  const { compra: purchase, parcelaAtual: current } = plano;

  const settled = plano.parcelasRestantes === 0;
  const singlePayment = ehCompraAVista(purchase.parcelas);
  const lastInstallment = plano.cronograma[plano.cronograma.length - 1];

  return (
    <li className={`${styles.card} card-hover-accent`}>
      <header className={styles.header}>
        <span className={styles.identity}>
          <span className={styles.titleRow}>
            <span className={styles.title}>{purchase.descricao}</span>
            {singlePayment ? <Selo tom="neutral">À vista</Selo> : null}
            {settled ? (
              <Selo tom="positive" ponto>
                Quitada
              </Selo>
            ) : null}
          </span>
          <span className={styles.meta}>
            {purchase.nomeCartao}
            {purchase.categoria ? (
              <>
                <span className={styles.separator} aria-hidden="true">
                  ·
                </span>
                <span className={styles.category}>
                  <span
                    className={styles.categoryDot}
                    style={{ backgroundColor: corDaPaleta(purchase.categoria.tokenCor) }}
                    aria-hidden="true"
                  />
                  {purchase.categoria.nome}
                </span>
              </>
            ) : null}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            {formatarDataCompleta(purchase.dataCompra)}
          </span>
        </span>

        <span className={styles.actions}>
          <Botao
            variante="ghost"
            tamanho="sm"
            icone={Pencil}
            aria-label={`Editar ${purchase.descricao}`}
            onClick={() => aoEditar(purchase)}
          />
          <Botao
            variante="ghost"
            tamanho="sm"
            icone={Trash2}
            className={styles.delete}
            aria-label={`Excluir ${purchase.descricao}`}
            onClick={() => aoExcluir(purchase)}
          />
        </span>
      </header>

      <div className={styles.headline}>
        <span className={styles.plan}>
          <span className="tabular">{purchase.parcelas}x</span> de{' '}
          <ValorMonetario valor={plano.valorParcela} tamanho="md" />
        </span>
        <span className={styles.total}>
          Total <ValorMonetario valor={purchase.valorTotal} tamanho="sm" tom="muted" />
        </span>
      </div>

      <div className={styles.progress}>
        <BarraProgresso
          valor={plano.parcelasPagas / purchase.parcelas}
          tom={settled ? 'positive' : 'accent'}
          segmentos={purchase.parcelas}
          rotulo={`Parcelas pagas de ${purchase.descricao}`}
        />

        {settled ? (
          <p className={styles.progressMain}>
            <span>
              <strong className="tabular">{purchase.parcelas}</strong> de{' '}
              <span className="tabular">{purchase.parcelas}</span>{' '}
              {singlePayment ? 'parcela paga' : 'parcelas pagas'}
            </span>
            {lastInstallment ? (
              <span className={styles.progressAside}>Quitada em {formatarMesCurto(lastInstallment.mes)}</span>
            ) : null}
          </p>
        ) : (
          <>
            <p className={styles.progressMain}>
              <span>
                Parcela <strong className="tabular">{current?.numero ?? plano.parcelasPagas + 1}</strong> de{' '}
                <span className="tabular">{purchase.parcelas}</span>
              </span>
              <span className={styles.remaining}>
                <strong className="tabular">{plano.parcelasRestantes}</strong>{' '}
                {plano.parcelasRestantes === 1 ? 'restante' : 'restantes'}
              </span>
            </p>
            <p className={styles.progressSub}>
              <span className="tabular">{plano.parcelasPagas}</span>{' '}
              {plano.parcelasPagas === 1 ? 'paga' : 'pagas'}
              {lastInstallment ? (
                <>
                  <span className={styles.separator} aria-hidden="true">
                    ·
                  </span>
                  última em <span className="tabular">{formatarMesCurto(lastInstallment.mes)}</span>
                </>
              ) : null}
            </p>
          </>
        )}
      </div>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Já pago</dt>
          <dd>
            <ValorMonetario valor={plano.valorPago} tamanho="sm" tom={plano.valorPago > 0 ? 'positive' : 'muted'} />
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Falta pagar</dt>
          <dd>
            <ValorMonetario valor={plano.valorRestante} tamanho="sm" tom={settled ? 'muted' : 'default'} />
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Próxima parcela</dt>
          <dd className="tabular">{current ? formatarMesCurto(current.mes) : '—'}</dd>
        </div>
      </dl>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={scheduleId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded
          ? singlePayment
            ? 'Ocultar parcela'
            : 'Ocultar parcelas'
          : singlePayment
            ? 'Ver a parcela'
            : `Ver as ${purchase.parcelas} parcelas`}
        <ChevronDown className={juntarClasses(styles.chevron, expanded && styles.chevronOpen)} size={15} strokeWidth={2} />
    </button>

    <ul id={scheduleId} className={styles.schedule} hidden={!expanded}>
      {plano.cronograma.map((installment) => {
        const paid = installment.situacao === 'PAGA';

        return (
          <li
            key={installment.numero}
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
              <span className={`${styles.month} tabular`}>{formatarMesCurto(installment.mes)}</span>
              <span className={styles.dueDate}>vence {formatarDataCurta(installment.dataVencimento)}</span>
            </span>

            <ValorMonetario valor={installment.valor} tamanho="sm" tom={paid ? 'muted' : 'default'} />

            <span className={styles.installmentStatus}>
              {installment.situacao === 'ATUAL' ? (
                <Selo tom={tomSituacaoParcela.ATUAL} ponto>
                  {rotuloSituacaoParcela.ATUAL}
                </Selo>
              ) : paid ? (
                <span className={styles.paidMark}>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span className={styles.paidLabel}>{rotuloSituacaoParcela.PAGA}</span>
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  </li>
);
}
