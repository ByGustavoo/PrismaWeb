import type { ReactNode } from 'react';
import { Botao } from './Botao';
import { Modal } from './Modal';
import styles from './DialogoConfirmacao.module.css';

export interface DialogoConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  children?: ReactNode;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  tom?: 'danger' | 'primary';
  carregando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

export function DialogoConfirmacao({
  aberto,
  titulo,
  descricao,
  children,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  tom = 'danger',
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: DialogoConfirmacaoProps) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={carregando ? () => {} : aoCancelar}
      titulo={titulo}
      {...(descricao ? { descricao } : {})}
      tamanho="sm"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoCancelar} disabled={carregando}>
            {rotuloCancelar}
          </Botao>
          <Botao variante={tom} onClick={aoConfirmar} carregando={carregando}>
            {rotuloConfirmar}
          </Botao>
        </>
      }
    >
      {children ? <div className={styles.detail}>{children}</div> : null}
    </Modal>
  );
}
