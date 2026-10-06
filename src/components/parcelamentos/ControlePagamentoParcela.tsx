import { Check } from 'lucide-react';
import { Botao } from '@/components/ui';
import { rotuloSituacaoParcela } from '@/constants/cartoes';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './ControlePagamentoParcela.module.css';

interface ControlePagamentoParcelaProps {
  paga: boolean;
  pagamentoAntecipado: boolean;
  alvo: string;
  emEspera: boolean;
  bloqueado: boolean;
  discreto?: boolean;
  aoAlternar: () => void;
}

function MarcaPaga() {
  return (
    <span className={styles.paid}>
      <Check size={14} strokeWidth={2.5} aria-hidden="true" />
      {rotuloSituacaoParcela.PAGA}
    </span>
  );
}

export function MarcaPagamento() {
  return (
    <span className={styles.control}>
      <MarcaPaga />
    </span>
  );
}

export function ControlePagamentoParcela({
  paga,
  pagamentoAntecipado,
  alvo,
  emEspera,
  bloqueado,
  discreto = false,
  aoAlternar,
}: ControlePagamentoParcelaProps) {
  if (!paga) {
    return (
      <span className={styles.control}>
        <Botao
          variante={discreto ? 'ghost' : 'secondary'}
          tamanho="sm"
          {...(discreto ? {} : { icone: Check })}
          className={juntarClasses(discreto && styles.compact, discreto && styles.quiet)}
          carregando={emEspera}
          disabled={bloqueado}
          aria-label={`Marcar a ${alvo} como paga`}
          onClick={aoAlternar}
        >
          Já paguei
        </Botao>
      </span>
    );
  }

  return (
    <span className={styles.control}>
      <MarcaPaga />
      {pagamentoAntecipado ? (
        <Botao
          variante="ghost"
          tamanho="sm"
          className={styles.compact}
          carregando={emEspera}
          disabled={bloqueado}
          aria-label={`Desfazer o pagamento da ${alvo}`}
          onClick={aoAlternar}
        >
          Desfazer
        </Botao>
      ) : null}
    </span>
  );
}
