import { ArrowDown, ArrowUp } from 'lucide-react';
import { CampoSelecao } from '@/components/ui';
import type { DirecaoOrdenacao, Opcao, OrdenacaoLancamento } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './OrdenacaoLancamentos.module.css';

interface OrdenacaoLancamentosProps {
  campoOrdenacao: OrdenacaoLancamento;
  direcaoOrdenacao: DirecaoOrdenacao;
  aoOrdenar: (field: OrdenacaoLancamento) => void;
  saindo?: boolean;
  tamanho?: 'sm' | 'md';
  className?: string;
}

const opcoesOrdenacao: Opcao[] = [
  { valor: 'DATA', rotulo: 'Data' },
  { valor: 'DESCRICAO', rotulo: 'Descrição' },
  { valor: 'VALOR', rotulo: 'Valor' },
];

export function OrdenacaoLancamentos({
  campoOrdenacao,
  direcaoOrdenacao,
  aoOrdenar,
  saindo = false,
  tamanho = 'md',
  className,
}: OrdenacaoLancamentosProps) {
  const ascending = direcaoOrdenacao === 'ASC';

  return (
    <div
      className={juntarClasses(styles.ordenacao, tamanho === 'sm' && styles.pequena, saindo && styles.saindo, className)}
      data-ordenacao
    >
      <CampoSelecao
        className={styles.campo}
        tamanho={tamanho}
        larguraPelaMaiorOpcao
        prefixo="Ordenar por:"
        opcoes={opcoesOrdenacao}
        value={campoOrdenacao}
        onChange={(field) => aoOrdenar(field as OrdenacaoLancamento)}
        aria-label="Ordenar por"
      />
      <button
        type="button"
        className={styles.direcao}
        onClick={() => aoOrdenar(campoOrdenacao)}
        aria-label={ascending ? 'Ordem crescente. Inverter para decrescente' : 'Ordem decrescente. Inverter para crescente'}
      >
        {ascending ? <ArrowUp size={16} strokeWidth={2} /> : <ArrowDown size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}
