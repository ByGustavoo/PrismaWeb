import { useEffect, useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import { ocorrenciasMensais, frequencias, rotuloFrequencia, rotuloSituacaoRecorrente, situacoesRecorrente } from '@/constants/recorrentes';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { CategoriaDTO, DespesaRecorrenteDTO, Frequencia, Opcao, OrigemDTO, SalvarDespesaRecorrenteDTO, SituacaoDespesaRecorrente } from '@/types';
import { hojeISO } from '@/utils/data';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioRecorrente.module.css';

interface ModalFormularioRecorrenteProps {
  aberto: boolean;
  despesa: DespesaRecorrenteDTO | null;
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarDespesaRecorrenteDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  descricao: string;
  valor: string;
  idCategoria: string;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: string;
  situacao: SituacaoDespesaRecorrente;
  observacoes: string;
}

const limites = { descricao: limitesTexto.descricao, observacoes: limitesTexto.observacoes };

const opcoesFrequencia: Opcao[] = frequencias.map((frequency) => ({ valor: frequency, rotulo: rotuloFrequencia[frequency],
}));

const opcoesSituacao: Opcao[] = situacoesRecorrente.map((status) => ({ valor: status, rotulo: rotuloSituacaoRecorrente[status],
}));

function estadoInicial(expense: DespesaRecorrenteDTO | null): EstadoFormulario {
  return {
    descricao: expense?.descricao ?? '',
    valor: expense ? paraEntradaValor(expense.valor) : '',
    idCategoria: expense?.categoria?.id ?? '',
    frequencia: expense?.frequencia ?? 'MENSAL',
    proximoVencimento: expense?.proximoVencimento ?? hojeISO(),
    idOrigem: expense?.idOrigem ?? '',
    situacao: expense?.situacao ?? 'ATIVO',
    observacoes: expense?.observacoes ?? '',
  };
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    descricao: erroTexto(form.descricao, {
      sujeito: 'A descrição da despesa',
      ausente: 'Informe a descrição da despesa!',
      maximo: limitesTexto.descricao,
    }),
    valor: erroValor(form.valor, {
      sujeito: 'O valor da despesa',
      ausente: 'Informe o valor da despesa!',
      sinal: 'positive',
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.proximoVencimento) {
    errors.proximoVencimento = 'Informe a data do próximo vencimento!';
  }
  if (!form.idOrigem) {
    errors.idOrigem = 'Escolha a conta ou o cartão que paga esta despesa!';
  }

  return errors;
}

export function ModalFormularioRecorrente({
  aberto,
  despesa,
  categorias,
  origens,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioRecorrenteProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(despesa));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(despesa));
    reiniciar();
  }, [aberto, despesa, reiniciar]);

  const categoryOptions = useMemo<Opcao[]>(
    () => categorias.filter((item) => item.tipo === 'DESPESA').map((item) => ({ valor: item.id, rotulo: item.nome })),
    [categorias],
  );

  const sourceOptions = useMemo<Opcao[]>(
    () =>
      origens.map((source) => ({ valor: source.id, rotulo: source.grupo === 'CARTAO' ? `${source.nome} (cartão)` : source.nome,
      })),
    [origens],
  );

  const amount = interpretarEntradaValor(form.valor);
  const monthlyEquivalent = amount ? amount * ocorrenciasMensais[form.frequencia] : undefined;

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      descricao: form.descricao,
      valor: amount ?? 0,
      idCategoria: form.idCategoria || undefined,
      frequencia: form.frequencia,
      proximoVencimento: form.proximoVencimento,
      idOrigem: form.idOrigem,
      situacao: form.situacao,
      observacoes: form.observacoes,
    });
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={despesa ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}
      descricao="Despesas fixas alimentam a previsão dos próximos meses e o aviso de vencimento."
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {despesa ? 'Salvar alterações' : 'Cadastrar despesa'}
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
        <CampoTexto
          className={styles.full}
          required
          rotulo="Descrição"
          placeholder="Aluguel, internet, assinatura..."
          value={form.descricao}
          onChange={(event) => set('descricao', event.target.value)}
          onBlur={() => tocar('descricao')}
          limiteCaracteres={limitesTexto.descricao}
          erro={erros.descricao}
          autoFocus
        />

        <CampoTexto
          required
          rotulo="Valor"
          prefixo="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.valor}
          onChange={(event) => set('valor', event.target.value)}
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
          rotulo="Próximo vencimento"
          value={form.proximoVencimento}
          onChange={(nextDueDate) => set('proximoVencimento', nextDueDate)}
          erro={erros.proximoVencimento}
          dica="A partir dele, as próximas datas são calculadas."
        />

        <CampoSelecao
          required
          rotulo="Conta ou cartão"
          placeholder="De onde sai o dinheiro"
          opcoes={sourceOptions}
          value={form.idOrigem}
          onChange={(accountId) => set('idOrigem', accountId)}
          erro={erros.idOrigem}
        />

        <CampoSelecao
          rotulo="Categoria"
          placeholder="Opcional: ajuda a classificar o gasto"
          opcoes={categoryOptions}
          value={form.idCategoria}
          onChange={(categoryId) => set('idCategoria', categoryId)}
        />

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(value) => set('situacao', value as SituacaoDespesaRecorrente)}
          dica="Pausada sai do custo mensal e da previsão."
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder="Opcional: reajuste, número do contrato ou o que ajudar a lembrar."
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
            <span>É quanto esta despesa {rotuloFrequencia[form.frequencia].toLowerCase()} pesa no custo mensal.</span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
