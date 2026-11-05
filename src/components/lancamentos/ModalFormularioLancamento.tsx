import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import { ehCartaoVale, ExplicacaoLancamentoAutomatico } from '@/components/recorrentes';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto, CampoValor, Interruptor } from '@/components/ui';
import {
  rotuloFormaLancamento,
  formasLancamento,
  rotuloSituacaoLancamento,
  situacoesLancamento,
} from '@/constants/lancamentos';
import { frequencias, proximaOcorrenciaAPartirDeHoje, rotuloFrequencia } from '@/constants/recorrentes';
import { limitesTexto } from '@/constants/validacao';
import { caminhos } from '@/routes/caminhos';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type {
  CategoriaDTO,
  FormaLancamento,
  Frequencia,
  LancamentoDTO,
  Opcao,
  OrigemDTO,
  SalvarLancamentoDTO,
  SituacaoLancamento,
} from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarDataNumerica, interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
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
  repetir: boolean;
  repeticao: Frequencia;
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
    repetir: false,
    repeticao: 'MENSAL',
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
    errors.idOrigem = isExpense ? 'Escolha a conta ou o cartão da despesa!' : 'Escolha a conta ou o vale da receita!';
  }
  if (form.data && form.situacao === 'PAGO' && form.data > hojeISO()) {
    errors.situacao = `Uma ${noun} com data futura não pode estar concluída!`;
  }

  return errors;
}

const opcoesSituacao: Opcao[] = situacoesLancamento.map((status) => ({ valor: status, rotulo: rotuloSituacaoLancamento[status],
}));

const opcoesFrequencia: Opcao[] = frequencias.map((frequency) => ({ valor: frequency, rotulo: rotuloFrequencia[frequency] }));

const opcoesFormaNaConta: Opcao[] = formasLancamento
  .filter((method) => method !== 'CARTAO_CREDITO')
  .map((method) => ({ valor: method, rotulo: rotuloFormaLancamento[method] }));

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
        .filter((item) => (isExpense ? true : item.grupo === 'CONTA' || ehCartaoVale(item)))
        .map((item) => ({ valor: item.id, rotulo: item.grupo === 'CARTAO' ? `${item.nome} — Cartão` : item.nome,
        })),
    [origens, isExpense],
  );

  const selectedSource = origens.find((item) => item.id === form.idOrigem);
  const paidWithCard = selectedSource?.grupo === 'CARTAO';
  const nextOccurrence = form.data ? proximaOcorrenciaAPartirDeHoje(form.data, form.repeticao) : undefined;
  const sourceHint = !paidWithCard
    ? undefined
    : isExpense
      ? 'A forma de pagamento é o próprio cartão.'
      : 'Soma no saldo do vale, que fica fora do saldo total.';
  const accountMethod: FormaLancamento = form.forma === 'CARTAO_CREDITO' ? 'CONTA' : form.forma;

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDateChange = (date: string) => {
    setForm((current) => ({
      ...current,
      data: date,
      situacao: current.situacao === 'PAGO' && date > hojeISO() ? 'AGENDADO' : current.situacao,
    }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      descricao: form.descricao,
      valor: interpretarEntradaValor(form.valor) ?? 0,
      tipo: tipo,
      situacao: form.situacao,
      forma: paidWithCard ? 'CARTAO_CREDITO' : accountMethod,
      data: form.data,
      idCategoria: form.idCategoria,
      idOrigem: form.idOrigem,
      ...(form.repetir && !lancamento?.recorrente ? { repeticao: form.repeticao } : {}),
      observacoes: form.observacoes,
    });
  };

  const noun = isExpense ? 'despesa' : 'receita';
  const situationBesideDate = !isExpense;

  const situationField = (
    <CampoSelecao
      className={juntarClasses(situationBesideDate && styles.third)}
      rotulo="Situação"
      opcoes={opcoesSituacao}
      value={form.situacao}
      onChange={(status) => set('situacao', status as SituacaoLancamento)}
      erro={erros.situacao}
      dica={form.situacao === 'PAGO' ? 'Já entrou ou saiu da conta.' : 'Ainda não afetou o saldo.'}
    />
  );

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={lancamento ? `Editar ${noun}` : `Nova ${noun}`}
      descricao={
        isExpense
          ? 'Registre uma saída de dinheiro da sua conta ou do cartão.'
          : 'Registre uma entrada de dinheiro numa conta ou num vale.'
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
        className={juntarClasses(styles.form, situationBesideDate && styles.trio)}
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

        <CampoValor
          className={juntarClasses(situationBesideDate && styles.third)}
          required
          rotulo="Valor"
          valor={form.valor}
          aoMudar={(value) => set('valor', value)}
          onBlur={() => tocar('valor')}
          erro={erros.valor}
        />

        <SeletorData
          className={juntarClasses(situationBesideDate && styles.third)}
          required
          rotulo="Data"
          value={form.data}
          onChange={handleDateChange}
          erro={erros.data}
        />

        {situationBesideDate ? situationField : null}

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
          rotulo={isExpense ? 'Conta ou cartão' : 'Conta ou vale'}
          placeholder={isExpense ? 'Selecione a conta ou o cartão' : 'Selecione a conta ou o vale'}
          opcoes={sourceOptions}
          value={form.idOrigem}
          onChange={(accountId) => set('idOrigem', accountId)}
          erro={erros.idOrigem}
          {...(sourceHint ? { dica: sourceHint } : {})}
        />

        {isExpense && !paidWithCard ? (
          <CampoSelecao
            rotulo="Forma de pagamento"
            opcoes={opcoesFormaNaConta}
            value={accountMethod}
            onChange={(method) => set('forma', method as FormaLancamento)}
          />
        ) : null}

        {situationBesideDate ? null : situationField}

        {lancamento?.recorrente ? (
          <p className={juntarClasses(styles.full, styles.recurring)}>
            <Repeat size={16} strokeWidth={2} aria-hidden="true" />
            <span>
              Esta {noun} se repete — {rotuloFrequencia[lancamento.recorrente.frequencia]}. Para mudar o valor, pausar ou
              parar, use <Link to={caminhos.recorrentes}>Recorrentes</Link>.
            </span>
          </p>
        ) : (
          <>
            <Interruptor
              className={styles.full}
              rotulo={`Repetir esta ${noun}`}
              checked={form.repetir}
              onChange={(checked) => set('repetir', checked)}
              dica={
                form.repetir && nextOccurrence
                  ? `O próximo lançamento entra sozinho em ${formatarDataNumerica(nextOccurrence)}.`
                  : isExpense
                    ? 'Aluguel, assinatura ou conta fixa: o Prisma lança a despesa sozinho nas próximas datas.'
                    : 'Salário, vale ou auxílio: o Prisma lança a receita sozinho nas próximas datas.'
              }
              explicacao={
                <ExplicacaoLancamentoAutomatico
                  tipo={tipo}
                  origem={selectedSource}
                  {...(nextOccurrence ? { proximaData: formatarDataNumerica(nextOccurrence) } : {})}
                />
              }
            />

            {form.repetir ? (
              <CampoSelecao
                rotulo="Periodicidade"
                opcoes={opcoesFrequencia}
                value={form.repeticao}
                onChange={(value) => set('repeticao', value as Frequencia)}
              />
            ) : null}
          </>
        )}

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
