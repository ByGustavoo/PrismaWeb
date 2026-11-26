import { useId, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, CalendarRange, CircleDot, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import { EspacoCabecalho } from '@/components/layout';
import { Botao, SeletorData, CampoTexto, CampoSelecao } from '@/components/ui';
import { LOCALIDADE } from '@/constants/aplicacao';
import { rotuloPluralTipoLancamento, rotuloSituacaoLancamento } from '@/constants/lancamento/lancamento';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import type { CategoriaDTO, Opcao, OrigemDTO, TipoCategoria } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { TODOS, temFiltrosAtivos, opcoesPeriodo } from './consulta';
import type { ConsultaLancamento } from './consulta';
import styles from './FiltrosLancamentos.module.css';

interface FiltrosLancamentosProps {
  consulta: ConsultaLancamento;
  aoAlterar: (patch: Partial<ConsultaLancamento>) => void;
  aoLimpar: () => void;
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
  tipoCategoria?: TipoCategoria;
  mostrarFiltroTipo: boolean;
  mostrarFiltroCategoria: boolean;
}

const opcoesTipo: Opcao[] = [
  { valor: TODOS, rotulo: 'Todos os tipos' },
  { valor: 'RECEITA', rotulo: rotuloPluralTipoLancamento.RECEITA },
  { valor: 'DESPESA', rotulo: rotuloPluralTipoLancamento.DESPESA },
  { valor: 'TRANSFERENCIA', rotulo: rotuloPluralTipoLancamento.TRANSFERENCIA },
];

const opcoesSituacao: Opcao[] = [
  { valor: TODOS, rotulo: 'Todas as situações' },
  { valor: 'PAGO', rotulo: rotuloSituacaoLancamento.PAGO },
  { valor: 'PENDENTE', rotulo: rotuloSituacaoLancamento.PENDENTE },
  { valor: 'AGENDADO', rotulo: rotuloSituacaoLancamento.AGENDADO },
];

function contarFiltrosAtivos(query: ConsultaLancamento): number {
  return [query.periodo, query.tipo, query.idCategoria, query.idOrigem, query.situacao].filter(
    (value) => value !== TODOS,
  ).length;
}

function paraOpcoes(entries: Array<[string, string]>, allLabel: string): Opcao[] {
  const unique = new Map(entries);
  const sorted = [...unique.entries()]
    .map(([value, label]) => ({ valor: value, rotulo: label }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, LOCALIDADE));

  return [{ valor: TODOS, rotulo: allLabel }, ...sorted];
}

export function FiltrosLancamentos({
  consulta,
  aoAlterar,
  aoLimpar,
  categorias,
  origens,
  tipoCategoria,
  mostrarFiltroTipo,
  mostrarFiltroCategoria,
}: FiltrosLancamentosProps) {
  const categoryOptions = useMemo(
    () =>
      paraOpcoes(
        categorias
          .filter((categoria) => !tipoCategoria || categoria.tipo === tipoCategoria)
          .map((categoria) => [categoria.id, categoria.nome] as [string, string]),
        'Todas as categorias',
      ),
    [categorias, tipoCategoria],
  );

  const accountOptions = useMemo(
    () => paraOpcoes(origens.map((item) => [item.id, item.nome] as [string, string]), 'Todas as contas'),
    [origens],
  );

  const isCompact = useEhCompacto();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCount = contarFiltrosAtivos(consulta);
  const showControls = !isCompact || expanded;

  const search = (
    <CampoTexto
      ref={searchRef}
      className={styles.search}
      icone={Search}
      placeholder={isCompact ? 'Buscar' : 'Buscar nos lançamentos'}
      value={consulta.busca}
      onChange={(event) => aoAlterar({ busca: event.target.value })}
      aria-label="Buscar lançamentos"
    />
  );

  const clearAndFocusSearch = () => {
    aoLimpar();
    searchRef.current?.focus();
  };

  const clear = temFiltrosAtivos(consulta) ? (
    <Botao className={styles.clear} variante="ghost" icone={X} onClick={clearAndFocusSearch}>
      Limpar
    </Botao>
  ) : null;

  return (
    <div className={styles.filters}>
      {isCompact ? (
        <div className={styles.searchRow}>
          {search}

          <Botao
            className={styles.toggle}
            variante="secondary"
            icone={SlidersHorizontal}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((value) => !value)}
          >
            Filtros
            {activeCount > 0 ? <span className={styles.count}>{activeCount}</span> : null}
          </Botao>

          {clear}
        </div>
      ) : (
        <EspacoCabecalho>
          {search}
          {clear}
        </EspacoCabecalho>
      )}

      <div className={juntarClasses(styles.controls, !showControls && styles.controlsHidden)} id={panelId} hidden={!showControls}>
        <CampoSelecao
          className={styles.filter}
          larguraPelaMaiorOpcao
          icone={CalendarRange}
          opcoes={opcoesPeriodo}
          value={consulta.periodo}
          onChange={(period) => aoAlterar({ periodo: period as ConsultaLancamento['periodo'] })}
          aria-label="Filtrar por período"
        />

        {mostrarFiltroTipo ? (
          <CampoSelecao
            className={styles.filter}
            larguraPelaMaiorOpcao
            icone={ArrowLeftRight}
            opcoes={opcoesTipo}
            value={consulta.tipo}
            onChange={(tipo) => aoAlterar({ tipo })}
            aria-label="Filtrar por tipo"
          />
        ) : null}

        {mostrarFiltroCategoria ? (
          <CampoSelecao
            className={styles.filter}
            larguraPelaMaiorOpcao
            icone={Tag}
            opcoes={categoryOptions}
            value={consulta.idCategoria}
            onChange={(idCategoria) => aoAlterar({ idCategoria })}
            aria-label="Filtrar por categoria"
          />
        ) : null}

        <CampoSelecao
          className={styles.filter}
          larguraPelaMaiorOpcao
          icone={Wallet}
          opcoes={accountOptions}
          value={consulta.idOrigem}
          onChange={(idOrigem) => aoAlterar({ idOrigem })}
          aria-label="Filtrar por conta ou cartão"
        />

        <CampoSelecao
          className={styles.filter}
          larguraPelaMaiorOpcao
          icone={CircleDot}
          opcoes={opcoesSituacao}
          value={consulta.situacao}
          onChange={(situacao) => aoAlterar({ situacao })}
          aria-label="Filtrar por situação"
        />
      </div>

      {showControls && consulta.periodo === 'custom' ? (
        <div className={styles.range}>
          <SeletorData
            className={styles.date}
            rotulo="De"
            value={consulta.dataInicial}
            max={consulta.dataFinal || undefined}
            onChange={(dataInicial) => aoAlterar({ dataInicial })}
          />
          <SeletorData
            className={styles.date}
            rotulo="Até"
            value={consulta.dataFinal}
            min={consulta.dataInicial || undefined}
            onChange={(dataFinal) => aoAlterar({ dataFinal })}
          />
        </div>
      ) : null}
    </div>
  );
}
