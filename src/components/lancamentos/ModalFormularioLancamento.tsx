import { useEffect, useMemo, useState } from 'react';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import {
  rotuloFormaLancamento,
  formasLancamento,
  rotuloSituacaoLancamento,
  situacoesLancamento,
} from '@/constants/lancamentos';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { CategoriaDTO, FormaLancamento, LancamentoDTO, Opcao, OrigemDTO, SalvarLancamentoDTO, SituacaoLancamento } from '@/types';
import { hojeISO } from '@/utils/data';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioLancamento.module.css';

interface ModalFormularioLancamentoProps {
  aberto: boolean;
  tipo: 'RECEITA' | 'DESPESA';
  lancamento: LancamentoDTO | null;
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarLancamentoDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  descricao: string;
  valor: string;
  data: string;
  idCategoria: string;
  idOrigem: string;
  forma: FormaLancamento;
  situacao: SituacaoLancamento;
  observacoes: string;
}

const limites = { descricao: limitesTexto.descricao, observacoes: limitesTexto.observacoes };

function estadoInicial(transaction: LancamentoDTO | null): EstadoFormulario {
  return {
    descricao: transaction?.descricao ?? '',
    valor: transaction ? paraEntradaValor(transaction.valor) : '',
    data: transaction?.data ?? hojeISO(),
    idCategoria: transaction?.categoria?.id ?? '',
    idOrigem: transaction?.idOrigem ?? '',
    forma: transaction?.forma ?? 'CONTA',
    situacao: transaction?.situacao ?? 'PAGO',
    observacoes: transaction?.observacoes ?? '',
  };
}

function validar(form: EstadoFormulario, isExpense: boolean): ErrosCampos<EstadoFormulario> {
  const noun = isExpense ? 'despesa' : 'receita';
  const errors: ErrosCampos<EstadoFormulario> = {
    descricao: erroTexto(form.descricao, {
      sujeito: `A descrição da ${noun}`,
      ausente: `Informe a descrição da ${noun}!`,
      maximo: limitesTexto.descricao,
    }),
    valor: erroValor(form.valor, {
      sujeito: `O valor da ${noun}`,
      ausente: `Informe o valor da ${noun}!`,
      sinal: 'positive',
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.data) {
    errors.data = `Informe a data da ${noun}!`;
  }
  if (!form.idCategoria) {
    errors.idCategoria = `Escolha a categoria da ${noun}!`;
  }
  if (!form.idOrigem) {
    errors.idOrigem = isExpense ? 'Escolha a conta ou o cartão da despesa!' : 'Escolha a conta da receita!';
  }

  return errors;
}

const opcoesSituacao: Opcao[] = situacoesLancamento.map((status) => ({ valor: status, rotulo: rotuloSituacaoLancamento[status],
}));

const opcoesForma: Opcao[] = formasLancamento.map((method) => ({ valor: method, rotulo: rotuloFormaLancamento[method],
}));

export function ModalFormularioLancamento({
  aberto,
  tipo,
  lancamento,
  categorias,
  origens,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioLancamentoProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(lancamento));
  const isExpense = tipo === 'DESPESA';
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => validar(values, isExpense),
    { limites },
  );

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(lancamento));
    reiniciar();
  }, [aberto, lancamento, reiniciar]);

  const categoryOptions = useMemo<Opcao[]>(
    () => categorias.filter((item) => item.tipo === tipo).map((item) => ({ valor: item.id, rotulo: item.nome })),
    [categorias, tipo],
  );

  const sourceOptions = useMemo<Opcao[]>(
    () =>
      origens
        .filter((item) => (isExpense ? true : item.grupo === 'CONTA'))
        .map((item) => ({ valor: item.id, rotulo: item.grupo === 'CARTAO' ? `${item.nome} · cartão` : item.nome,
        })),
    [origens, isExpense],
  );

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      descricao: form.descricao,
      valor: interpretarEntradaValor(form.valor) ?? 0,
      tipo: tipo,
      situacao: form.situacao,
      forma: form.forma,
      data: form.data,
      idCategoria: form.idCategoria,
      idOrigem: form.idOrigem,
      observacoes: form.observacoes,
    });
  };

  const noun = isExpense ? 'despesa' : 'receita';

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={lancamento ? `Editar ${noun}` : `Nova ${noun}`}
      descricao={
        isExpense
          ? 'Registre uma saída de dinheiro da sua conta ou do cartão.'
          : 'Registre uma entrada de dinheiro em uma das suas contas.'
      }
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {lancamento ? 'Salvar alterações' : `Cadastrar ${noun}`}
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
          placeholder={isExpense ? 'Conta de luz, mercado, aluguel...' : 'Salário, freelance, reembolso...'}
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

        <SeletorData
          required
          rotulo="Data"
          value={form.data}
          onChange={(date) => set('data', date)}
          erro={erros.data}
        />

        <CampoSelecao
          required
          rotulo="Categoria"
          placeholder="Selecione a categoria"
          opcoes={categoryOptions}
          value={form.idCategoria}
          onChange={(categoryId) => set('idCategoria', categoryId)}
          erro={erros.idCategoria}
        />

        <CampoSelecao
          required
          rotulo={isExpense ? 'Conta ou cartão' : 'Conta'}
          placeholder={isExpense ? 'Selecione a conta ou o cartão' : 'Selecione a conta'}
          opcoes={sourceOptions}
          value={form.idOrigem}
          onChange={(accountId) => set('idOrigem', accountId)}
          erro={erros.idOrigem}
        />

        {isExpense ? (
          <CampoSelecao
            rotulo="Forma de pagamento"
            opcoes={opcoesForma}
            value={form.forma}
            onChange={(method) => set('forma', method as FormaLancamento)}
          />
        ) : null}

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(status) => set('situacao', status as SituacaoLancamento)}
          dica={form.situacao === 'PAGO' ? 'Já entrou ou saiu da conta.' : 'Ainda não afetou o saldo.'}
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar deste lançamento."
          value={form.observacoes}
          onChange={(event) => set('observacoes', event.target.value)}
          onBlur={() => tocar('observacoes')}
          limiteCaracteres={limitesTexto.observacoes}
          erro={erros.observacoes}
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
