import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao, BarraProgresso } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { ehCompraAVista } from '@/constants/cartoes';
import type { CompraParceladaDTO, PlanoCompraParceladaDTO } from '@/types';
import { formatarDataCompleta, formatarMesCurto } from '@/utils/formatacao';
import styles from './CartaoParcelamento.module.css';

interface CartaoParcelamentoProps {
  plano: PlanoCompraParceladaDTO;
  aoEditar: (purchase: CompraParceladaDTO) => void;
  aoExcluir: (purchase: CompraParceladaDTO) => void;
  aoAbrirParcelas: (plan: PlanoCompraParceladaDTO) => void;
}

export function CartaoParcelamento({ plano, aoEditar, aoExcluir, aoAbrirParcelas }: CartaoParcelamentoProps) {
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
          <>
            <p className={styles.progressMain}>
              <span>
                <strong className="tabular">{purchase.parcelas}</strong> de{' '}
                <span className="tabular">{purchase.parcelas}</span>{' '}
                {singlePayment ? 'parcela paga' : 'parcelas pagas'}
              </span>
            </p>
            {lastInstallment ? (
              <p className={styles.progressSub}>
                {lastInstallment.pagamentoAntecipado ? (
                  'Quitada antes do prazo'
                ) : (
                  <>
                    Quitada em <span className="tabular">{formatarMesCurto(lastInstallment.mes)}</span>
                  </>
                )}
              </p>
            ) : null}
          </>
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
                  Última parcela em <span className="tabular">{formatarMesCurto(lastInstallment.mes)}</span>
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
        data-acao="parcelas"
        aria-haspopup="dialog"
        onClick={() => aoAbrirParcelas(plano)}
      >
        {singlePayment ? 'Ver a parcela' : `Ver as ${purchase.parcelas} parcelas`}
        <ChevronRight className={styles.chevron} size={15} strokeWidth={2} />
      </button>

    </li>
  );
}
