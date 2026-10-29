import type { Ref } from 'react';
import { ArrowDownUp, CircleDot, Search } from 'lucide-react';
import { CampoTexto, CampoSelecao } from '@/components/ui';
import { opcoesOrdenacao, opcoesSituacao } from './consulta';
import type { ConsultaMeta, OrdenacaoMeta } from './consulta';
import styles from './FiltrosMetas.module.css';

interface FiltrosMetasProps {
  consulta: ConsultaMeta;
  aoAlterar: (patch: Partial<ConsultaMeta>) => void;
  refBusca?: Ref<HTMLInputElement>;
}

export function FiltrosMetas({ consulta, aoAlterar, refBusca }: FiltrosMetasProps) {
  return (
    <>
      <CampoTexto
        ref={refBusca}
        className={styles.search}
        tamanho="sm"
        icone={Search}
        placeholder="Buscar nas metas"
        value={consulta.busca}
        onChange={(event) => aoAlterar({ busca: event.target.value })}
        aria-label="Buscar nas metas"
      />

      <CampoSelecao
        className={styles.filter}
        larguraPelaMaiorOpcao
        tamanho="sm"
        icone={CircleDot}
        prefixo="Situação:"
        opcoes={opcoesSituacao}
        value={consulta.situacao}
        onChange={(situacao) => aoAlterar({ situacao })}
        aria-label="Filtrar metas por situação"
      />

      <CampoSelecao
        className={styles.filter}
        larguraPelaMaiorOpcao
        tamanho="sm"
        icone={ArrowDownUp}
        prefixo="Ordenar:"
        opcoes={opcoesOrdenacao}
        value={consulta.ordenacao}
        onChange={(ordenacao) => aoAlterar({ ordenacao: ordenacao as OrdenacaoMeta })}
        aria-label="Ordenar as metas"
      />
    </>
  );
}
