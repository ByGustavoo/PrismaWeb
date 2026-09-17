import { ArrowDownUp, CircleDot, Search, X } from 'lucide-react';
import { Botao, CampoTexto, CampoSelecao } from '@/components/ui';
import { TODOS, temFiltrosMetaAtivos, opcoesOrdenacao, opcoesSituacao } from './consulta';
import type { ConsultaMeta, OrdenacaoMeta } from './consulta';
import styles from './FiltrosMetas.module.css';

interface FiltrosMetasProps {
  consulta: ConsultaMeta;
  aoAlterar: (patch: Partial<ConsultaMeta>) => void;
  aoLimpar: () => void;
  quantidadeResultados: number;
}

function rotuloQuantidade(count: number): string {
  if (count === 0) return 'Nenhuma meta encontrada';
  return `${count} ${count === 1 ? 'meta encontrada' : 'metas encontradas'}`;
}

export function FiltrosMetas({ consulta, aoAlterar, aoLimpar, quantidadeResultados }: FiltrosMetasProps) {
  const active = temFiltrosMetaAtivos(consulta);

  return (
    <div className={styles.filters}>
      <CampoTexto
        className={styles.search}
        icone={Search}
        placeholder="Buscar nas metas"
        value={consulta.busca}
        onChange={(event) => aoAlterar({ busca: event.target.value })}
        aria-label="Buscar nas metas"
      />

      <CampoSelecao
        className={styles.select}
        larguraPelaMaiorOpcao
        icone={CircleDot}
        prefixo="Situação"
        opcoes={opcoesSituacao}
        value={consulta.situacao}
        onChange={(situacao) => aoAlterar({ situacao })}
        aria-label="Filtrar por situação"
      />

      <CampoSelecao
        className={styles.select}
        larguraPelaMaiorOpcao
        icone={ArrowDownUp}
        prefixo="Ordenar por"
        opcoes={opcoesOrdenacao}
        value={consulta.ordenacao}
        onChange={(sort) => aoAlterar({ ordenacao: sort as OrdenacaoMeta })}
        aria-label="Ordenar as metas"
      />

      {active ? (
        <Botao className={styles.clear} variante="ghost" icone={X} onClick={aoLimpar}>
          Limpar
        </Botao>
      ) : null}

      <p className={styles.count} role="status" aria-live="polite">
        {consulta.busca.trim() || consulta.situacao !== TODOS ? rotuloQuantidade(quantidadeResultados) : ''}
      </p>
    </div>
  );
}
