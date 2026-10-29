import type { Ref } from 'react';
import { ArrowDownUp, CircleDot, CreditCard, Search } from 'lucide-react';
import { CampoTexto, CampoSelecao } from '@/components/ui';
import type { Opcao } from '@/types';
import { opcoesOrdenacaoCompra, opcoesSituacaoCompra } from './consulta';
import type { ConsultaCompra, OrdenacaoCompra, SituacaoCompraFiltro } from './consulta';
import styles from './FiltrosParcelamentos.module.css';

interface FiltroCartao {
  opcoes: Opcao[];
  valor: string;
  aoAlterar: (valor: string) => void;
}

interface FiltrosParcelamentosProps {
  consulta: ConsultaCompra;
  aoAlterar: (patch: Partial<ConsultaCompra>) => void;
  cartao?: FiltroCartao;
  mostrarConsulta: boolean;
  refBusca?: Ref<HTMLInputElement>;
}

export function FiltrosParcelamentos({ consulta, aoAlterar, cartao, mostrarConsulta, refBusca }: FiltrosParcelamentosProps) {
  return (
    <>
      {mostrarConsulta ? (
        <CampoTexto
          ref={refBusca}
          className={styles.search}
          tamanho="sm"
          icone={Search}
          placeholder="Buscar nas compras"
          value={consulta.busca}
          onChange={(event) => aoAlterar({ busca: event.target.value })}
          aria-label="Buscar nas compras"
        />
      ) : null}

      {cartao ? (
        <CampoSelecao
          className={styles.filter}
          larguraPelaMaiorOpcao
          tamanho="sm"
          prefixo="Cartão:"
          icone={CreditCard}
          opcoes={cartao.opcoes}
          value={cartao.valor}
          onChange={cartao.aoAlterar}
          aria-label="Filtrar compras por cartão"
        />
      ) : null}

      {mostrarConsulta ? (
        <>
          <CampoSelecao
            className={styles.filter}
            larguraPelaMaiorOpcao
            tamanho="sm"
            icone={CircleDot}
            prefixo="Situação:"
            opcoes={opcoesSituacaoCompra}
            value={consulta.situacao}
            onChange={(situacao) => aoAlterar({ situacao: situacao as SituacaoCompraFiltro })}
            aria-label="Filtrar compras por situação"
          />
          <CampoSelecao
            className={styles.filter}
            larguraPelaMaiorOpcao
            tamanho="sm"
            icone={ArrowDownUp}
            prefixo="Ordenar:"
            opcoes={opcoesOrdenacaoCompra}
            value={consulta.ordenacao}
            onChange={(ordenacao) => aoAlterar({ ordenacao: ordenacao as OrdenacaoCompra })}
            aria-label="Ordenar compras"
          />
        </>
      ) : null}
    </>
  );
}
