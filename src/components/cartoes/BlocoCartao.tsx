import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao, BarraProgresso } from '@/components/ui';
import { rotuloSituacaoCartao, rotuloCurtoTipoCartao, ehCartaoCredito, ehCartaoVale } from '@/constants/cartoes';
import type { CartaoDTO, FaturaCartaoDTO } from '@/types';
import { formatarDataCompleta } from '@/utils/formatacao';
import { tomSituacaoCartao, iconeTipoCartao, tomLimite } from './aparencia';
import styles from './BlocoCartao.module.css';

interface BlocoCartaoProps {
  cartao: CartaoDTO;
  fatura?: FaturaCartaoDTO | undefined;
  saldoConta?: number | undefined;
  aoEditar: (card: CartaoDTO) => void;
  aoExcluir: (card: CartaoDTO) => void;
  aoAbrirFaturas: (card: CartaoDTO) => void;
}

export function BlocoCartao({ cartao, fatura, saldoConta, aoEditar, aoExcluir, aoAbrirFaturas }: BlocoCartaoProps) {
  const Icon = iconeTipoCartao[cartao.tipo];
  const credit = ehCartaoCredito(cartao);
  const used = cartao.limiteComprometido ?? 0;
  const ratio = credit ? Math.min(used / cartao.limiteCredito, 1) : 0;

  return (
    <li className={`${styles.tile} card-hover-accent`}>
      <header className={styles.header}>
        <span className={styles.iconBox} aria-hidden="true">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <span className={styles.nameRow}>
          <span className={styles.name}>{cartao.nome}</span>
          <Selo>{rotuloCurtoTipoCartao[cartao.tipo]}</Selo>
          {cartao.situacao === 'INATIVO' ? (
            <Selo tom={tomSituacaoCartao.INATIVO} ponto>
              {rotuloSituacaoCartao.INATIVO}
            </Selo>
          ) : null}
        </span>

        <span className={styles.actions}>
          <Botao
            variante="ghost"
            tamanho="sm"
            icone={Pencil}
            aria-label={`Editar ${cartao.nome}`}
            onClick={() => aoEditar(cartao)}
          />
          <Botao
            variante="ghost"
            tamanho="sm"
            icone={Trash2}
            className={styles.delete}
            aria-label={`Excluir ${cartao.nome}`}
            onClick={() => aoExcluir(cartao)}
          />
        </span>

        <span className={styles.meta}>
          {[cartao.instituicao, cartao.bandeira, cartao.ultimosDigitos ? `•••• ${cartao.ultimosDigitos}` : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </header>

      {credit ? (
        <>
          <div className={styles.limit}>
            <div className={styles.limitTop}>
              <span className={styles.limitLabel}>Limite disponível</span>
              <span className={styles.limitTotal}>
                de <ValorMonetario valor={cartao.limiteCredito} tamanho="sm" tom="muted" />
              </span>
            </div>

            <ValorMonetario valor={Math.max(cartao.limiteCredito - used, 0)} tamanho="lg" />

            <BarraProgresso
              valor={ratio}
              tom={tomLimite(ratio)}
              rotulo={`Limite utilizado de ${cartao.nome}`}
              className={styles.bar}
            />

            <span className={styles.limitFoot}>
              <span className="tabular">{Math.round(ratio * 100)}%</span> do limite comprometido
            </span>
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Fatura atual</dt>
              <dd>
                <ValorMonetario valor={fatura?.total ?? 0} tamanho="sm" />
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Fechamento</dt>
              <dd className="tabular">Dia {cartao.diaFechamento}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Vencimento</dt>
              <dd className="tabular">Dia {cartao.diaVencimento}</dd>
            </div>
          </dl>

          <footer className={styles.footer}>
            <span className={styles.due}>
              {fatura ? `Vence em ${formatarDataCompleta(fatura.dataVencimento)}` : 'Sem fatura em aberto'}
            </span>
            <Botao
              variante="secondary"
              tamanho="sm"
              icone={ArrowRight}
              posicaoIcone="right"
              onClick={() => aoAbrirFaturas(cartao)}
            >
              Ver faturas
            </Botao>
          </footer>
        </>
      ) : (
        <div className={styles.simple}>
          {ehCartaoVale(cartao) ? (
            <>
              <span className={styles.simpleLabel}>Saldo disponível</span>
              <ValorMonetario valor={cartao.saldo ?? 0} tamanho="lg" />
            </>
          ) : saldoConta === undefined ? (
            <>
              <span className={styles.simpleLabel}>Debita direto na conta</span>
              <span className={styles.linked}>{cartao.nomeConta ?? 'Conta não vinculada'}</span>
            </>
          ) : (
            <>
              <span className={styles.simpleLabel}>Disponível na conta</span>
              <ValorMonetario valor={saldoConta} tamanho="lg" />
              <span className={styles.linked}>{cartao.nomeConta}</span>
            </>
          )}
        </div>
      )}
    </li>
  );
}
