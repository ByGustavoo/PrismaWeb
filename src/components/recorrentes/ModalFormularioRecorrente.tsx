import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto, CampoValor, Interruptor } from '@/components/ui';
import {
  ocorrenciasMensais,
  frequencias,
  rotuloFrequencia,
  rotuloSituacaoRecorrente,
  rotuloTipoRecorrente,
  situacoesRecorrente,
  tiposRecorrente,
} from '@/constants/recorrentes';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type {
  CategoriaDTO,
  RecorrenteDTO,
  Frequencia,
  Opcao,
  OrigemDTO,
  SalvarRecorrenteDTO,
  SituacaoRecorrente,
  TipoRecorrente,
} from '@/types';
import { hojeISO } from '@/utils/data';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { erroValor, erroTexto } from '@/utils/validacao';
import { dicaLancamentoAutomatico, ehCartaoCredito, ehCartaoVale, ExplicacaoLancamentoAutomatico } from './lancamentoAutomatico';
import styles from './FormularioRecorrente.module.css';

interface ModalFormularioRecorrenteProps {
  aberto: boolean;
  recorrente: RecorrenteDTO | null;
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarRecorrenteDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  tipo: TipoRecorrente;
  descricao: string;
  valor: string;
  idCategoria: string;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: string;
  situacao: SituacaoRecorrente;
  lancarAutomaticamente: boolean;
  observacoes: string;
}

const limites = { descricao: limitesTexto.descricao, observacoes: limitesTexto.observacoes };

const opcoesFrequencia: Opcao[] = frequencias.map((frequency) => ({ valor: frequency, rotulo: rotuloFrequencia[frequency] }));

const opcoesSituacao: Opcao[] = situacoesRecorrente.map((status) => ({ valor: status, rotulo: rotuloSituacaoRecorrente[status] }));

function estadoInicial(recorrente: RecorrenteDTO | null): EstadoFormulario {
  return {
    tipo: recorrente?.tipo ?? 'DESPESA',
    descricao: recorrente?.descricao ?? '',
    valor: recorrente ? paraEntradaValor(recorrente.valor) : '',
    idCategoria: recorrente?.categoria?.id ?? '',
    frequencia: recorrente?.frequencia ?? 'MENSAL',
    proximoVencimento: recorrente?.proximoVencimento ?? hojeISO(),
    idOrigem: recorrente?.idOrigem ?? '',
    situacao: recorrente?.situacao ?? 'ATIVO',
    lancarAutomaticamente: recorrente?.lancarAutomaticamente ?? false,
    observacoes: recorrente?.observacoes ?? '',
  };
}

function aceitaOrigem(tipo: TipoRecorrente, origem: OrigemDTO): boolean {
  if (tipo === 'DESPESA') return true;
  return origem.grupo === 'CONTA' || ehCartaoVale(origem);
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  const nome = form.tipo === 'RECEITA' ? 'receita' : 'despesa';

  const errors: ErrosCampos<EstadoFormulario> = {
    descricao: erroTexto(form.descricao, {
      sujeito: `A descrição da ${nome}`,
      ausente: `Informe a descrição da ${nome}!`,
      maximo: limitesTexto.descricao,
    }),
    valor: erroValor(form.valor, {
      sujeito: `O valor da ${nome}`,
      ausente: `Informe o valor da ${nome}!`,
      sinal: 'positive',
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.proximoVencimento) {
    errors.proximoVencimento = form.tipo === 'RECEITA' ? 'Informe a data do próximo recebimento!' : 'Informe a data do próximo vencimento!';
  }
  if (!form.idOrigem) {
    errors.idOrigem = form.tipo === 'RECEITA' ? 'Escolha a conta ou o vale em que a receita entra!' : 'Escolha a conta ou o cartão que paga esta despesa!';
  }
  if (form.lancarAutomaticamente && !form.idCategoria) {
    errors.idCategoria = `Escolha a categoria para a ${nome} ser lançada automaticamente!`;
  }

  return errors;
}

export function ModalFormularioRecorrente({
  aberto,
  recorrente,
  categorias,
  origens,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioRecorrenteProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(recorrente));
  const [automaticoEscolhido, setAutomaticoEscolhido] = useState(false);
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(recorrente));
    setAutomaticoEscolhido(false);
    reiniciar();
  }, [aberto, recorrente, reiniciar]);

  const receita = form.tipo === 'RECEITA';

  const categoryOptions = useMemo<Opcao[]>(
    () => categorias.filter((item) => item.tipo === form.tipo).map((item) => ({ valor: item.id, rotulo: item.nome })),
    [categorias, form.tipo],
  );

  const sourceOptions = useMemo<Opcao[]>(
    () =>
      origens
        .filter((source) => aceitaOrigem(form.tipo, source))
        .map((source) => ({ valor: source.id, rotulo: source.grupo === 'CARTAO' ? `${source.nome} (cartão)` : source.nome })),
    [origens, form.tipo],
  );

  const selectedSource = origens.find((source) => source.id === form.idOrigem);

  const automaticoPadrao = (tipo: TipoRecorrente, source: OrigemDTO | undefined) =>
    tipo === 'RECEITA' ? Boolean(source) : ehCartaoCredito(source);

  const changeSource = (sourceId: string) => {
    const source = origens.find((item) => item.id === sourceId);

    setForm((current) => ({
      ...current,
      idOrigem: sourceId,
      lancarAutomaticamente:
        recorrente || automaticoEscolhido ? current.lancarAutomaticamente : automaticoPadrao(current.tipo, source),
    }));
  };

  const changeType = (tipo: TipoRecorrente) => {
    setForm((current) => {
      const source = origens.find((item) => item.id === current.idOrigem);
      const keepSource = source ? aceitaOrigem(tipo, source) : false;

      return {
        ...current,
        tipo,
        idCategoria: '',
        idOrigem: keepSource ? current.idOrigem : '',
        lancarAutomaticamente: automaticoEscolhido
          ? current.lancarAutomaticamente
          : automaticoPadrao(tipo, keepSource ? source : undefined),
      };
    });
  };

  const handleTypeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = form.tipo === 'DESPESA' ? 'RECEITA' : 'DESPESA';
    changeType(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tipo='${next}']`)?.focus();
  };

  const amount = interpretarEntradaValor(form.valor);
  const monthlyEquivalent = amount ? amount * ocorrenciasMensais[form.frequencia] : undefined;

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      tipo: form.tipo,
      descricao: form.descricao,
      valor: amount ?? 0,
      idCategoria: form.idCategoria || undefined,
      frequencia: form.frequencia,
      proximoVencimento: form.proximoVencimento,
      idOrigem: form.idOrigem,
      situacao: form.situacao,
      lancarAutomaticamente: form.lancarAutomaticamente,
      observacoes: form.observacoes,
    });
  };

  const nome = receita ? 'receita' : 'despesa';

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={recorrente ? `Editar ${nome} recorrente` : 'Nova recorrente'}
      descricao={
        receita
          ? 'Salário, vale e outros valores que chegam sempre na mesma data.'
          : 'Despesas fixas alimentam a previsão dos próximos meses e o aviso de vencimento.'
      }
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {recorrente ? 'Salvar alterações' : `Cadastrar ${nome}`}
          </Botao>
        </>
      }
    >
      <form
        ref={refFormulario}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {recorrente ? null : (
          <div className={styles.full}>
            <div className={styles.types} role="radiogroup" aria-label="Tipo da recorrente" onKeyDown={handleTypeKey}>
              <span className={styles.typeIndicator} data-tipo={form.tipo} aria-hidden="true" />
              {tiposRecorrente.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  role="radio"
                  data-tipo={tipo}
                  aria-checked={form.tipo === tipo}
                  tabIndex={form.tipo === tipo ? 0 : -1}
                  className={juntarClasses(styles.type, form.tipo === tipo && styles.typeSelected)}
                  onClick={() => changeType(tipo)}
                >
                  {rotuloTipoRecorrente[tipo]}
                </button>
              ))}
            </div>
          </div>
        )}

        <CampoTexto
          className={styles.full}
          required
          rotulo="Descrição"
          placeholder={receita ? 'Salário, vale-alimentação, auxílio...' : 'Aluguel, internet, assinatura...'}
          value={form.descricao}
          onChange={(event) => set('descricao', event.target.value)}
          onBlur={() => tocar('descricao')}
          limiteCaracteres={limitesTexto.descricao}
          erro={erros.descricao}
          autoFocus
        />

        <CampoValor
          required
          rotulo="Valor"
          valor={form.valor}
          aoMudar={(value) => set('valor', value)}
          onBlur={() => tocar('valor')}
          erro={erros.valor}
        />

        <CampoSelecao
          required
          rotulo="Periodicidade"
          opcoes={opcoesFrequencia}
          value={form.frequencia}
          onChange={(value) => set('frequencia', value as Frequencia)}
        />

        <SeletorData
          required
          rotulo={receita ? 'Próximo recebimento' : 'Próximo vencimento'}
          value={form.proximoVencimento}
          onChange={(nextDueDate) => set('proximoVencimento', nextDueDate)}
          erro={erros.proximoVencimento}
          dica="A partir dela, as próximas datas são calculadas."
        />

        <CampoSelecao
          required
          rotulo={receita ? 'Conta ou vale' : 'Conta ou cartão'}
          placeholder={receita ? 'Onde o dinheiro entra' : 'De onde sai o dinheiro'}
          opcoes={sourceOptions}
          value={form.idOrigem}
          onChange={changeSource}
          erro={erros.idOrigem}
        />

        <CampoSelecao
          required={form.lancarAutomaticamente}
          rotulo="Categoria"
          placeholder={
            form.lancarAutomaticamente
              ? `Escolha a categoria da ${nome}`
              : `Opcional: ajuda a classificar a ${nome}`
          }
          opcoes={categoryOptions}
          value={form.idCategoria}
          onChange={(categoryId) => set('idCategoria', categoryId)}
          erro={erros.idCategoria}
        />

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(value) => set('situacao', value as SituacaoRecorrente)}
          dica={receita ? 'Pausada sai do total recebido por mês.' : 'Pausada sai do custo mensal e da previsão.'}
        />

        <Interruptor
          className={styles.full}
          rotulo={receita ? 'Lançar automaticamente na data' : 'Lançar automaticamente no vencimento'}
          checked={form.lancarAutomaticamente}
          onChange={(checked) => {
            setAutomaticoEscolhido(true);
            set('lancarAutomaticamente', checked);
          }}
          dica={dicaLancamentoAutomatico(form.tipo, selectedSource)}
          explicacao={<ExplicacaoLancamentoAutomatico tipo={form.tipo} origem={selectedSource} />}
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder={
            receita
              ? 'Opcional: empresa, benefício ou o que ajudar a lembrar.'
              : 'Opcional: reajuste, número do contrato ou o que ajudar a lembrar.'
          }
          value={form.observacoes}
          onChange={(event) => set('observacoes', event.target.value)}
          onBlur={() => tocar('observacoes')}
          limiteCaracteres={limitesTexto.observacoes}
          erro={erros.observacoes}
        />

        {monthlyEquivalent !== undefined && form.frequencia !== 'MENSAL' ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <ValorMonetario valor={monthlyEquivalent} tamanho="md" />
              <span>por mês</span>
            </strong>
            <span>
              {receita
                ? `É quanto esta receita ${rotuloFrequencia[form.frequencia].toLowerCase()} soma no total recebido por mês.`
                : `É quanto esta despesa ${rotuloFrequencia[form.frequencia].toLowerCase()} pesa no custo mensal.`}
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
