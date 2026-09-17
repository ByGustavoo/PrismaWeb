import { useId, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarRange, CircleDot, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import { EspacoCabecalho } from '@/components/layout';
import { Botao, SeletorData, CampoTexto, CampoSelecao } from '@/components/ui';
import { LOCALIDADE } from '@/constants/aplicacao';
import { rotuloPluralTipoLancamento, rotuloSituacaoLancamento } from '@/constants/lancamentos';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import type { LancamentoDTO, Opcao } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { TODOS, temFiltrosAtivos, opcoesPeriodo } from './consulta';
import type { ConsultaLancamento } from './consulta';
import styles from './FiltrosLancamentos.module.css';

interface FiltrosLancamentosProps {
  consulta: ConsultaLancamento;
  aoAlterar: (patch: Partial<ConsultaLancamento>) => void;
  aoLimpar: () => void;
  origem: LancamentoDTO[];
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
  origem,
  mostrarFiltroTipo,
  mostrarFiltroCategoria,
}: FiltrosLancamentosProps) {
  const categoryOptions = useMemo(
    () =>
      paraOpcoes(
        origem.flatMap((item) => (item.categoria ? [[item.categoria.id, item.categoria.nome] as [string, string]] : [])),
        'Todas as categorias',
      ),
    [origem],
  );

  const accountOptions = useMemo(
    () =>
      paraOpcoes(
        origem.flatMap((item) => {
          const entries: Array<[string, string]> = [[item.idOrigem, item.nomeOrigem]];
          if (item.idContaDestino && item.nomeContaDestino) entries.push([item.idContaDestino, item.nomeContaDestino]);
          return entries;
        }),
        'Todas as contas',
      ),
    [origem],
  );

  const isCompact = useEhCompacto();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const activeCount = contarFiltrosAtivos(consulta);
  const showControls = !isCompact || expanded;

  const search = (
    <CampoTexto
      className={styles.search}
      icone={Search}
      placeholder="Buscar nos lançamentos"
      value={consulta.busca}
      onChange={(event) => aoAlterar({ busca: event.target.value })}
      aria-label="Buscar lançamentos"
    />
  );

  const clear = temFiltrosAtivos(consulta) ? (
    <Botao className={styles.clear} variante="ghost" icone={X} onClick={aoLimpar}>
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
