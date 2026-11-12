import { useEffect, useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto, CampoValor, Interruptor } from '@/components/ui';
import { rotuloClasseAtivo, classesAtivo, dicaClasseAtivo, ehAcaoSemQuantidade, rotuloQuantidadeAcoes } from '@/constants/investimentos';
import { DIGITOS_MAXIMOS_QUANTIDADE_ACOES, limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type {
  AtualizarInvestimentoDTO,
  ClasseAtivo,
  ContaDTO,
  InvestimentoDTO,
  Opcao,
  SalvarAcaoDTO,
  SalvarInvestimentoDTO,
} from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarPercentualComSinal, interpretarEntradaValor } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { apenasDigitos } from '@/utils/mascaraValor';
import { erroCodigoAcao, erroQuantidadeInteira, erroValor, erroTexto } from '@/utils/validacao';
import { custoDaCompra, precoMedio } from './calculoAcoes';
import { tomRendimento } from './aparencia';
import { OPCAO_SEM_CONTA, opcoesContaMovimentacao } from './contaMovimentacao';
import styles from './FormularioInvestimento.module.css';

export type ResultadoFormularioInvestimento =
  | { modo: 'create'; dados: SalvarInvestimentoDTO }
  | { modo: 'createAcao'; dados: SalvarAcaoDTO }
  | { modo: 'update'; dados: AtualizarInvestimentoDTO };

interface ModalFormularioInvestimentoProps {
  aberto: boolean;
  investimento: InvestimentoDTO | null;
  contas: ContaDTO[];
  salvando: boolean;
  aoEnviar: (resultado: ResultadoFormularioInvestimento) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  nome: string;
  codigo: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  aportado: string;
  valorAtual: string;
  quantidade: string;
  precoUnitario: string;
  taxas: string;
  cotacao: string;
  dataInicio: string;
  idConta: string;
  reservaEmergencia: boolean;
  observacoes: string;
}

interface Contexto {
  editando: boolean;
  semQuantidade: boolean;
}

const limites = {
  nome: limitesTexto.nomeInvestimento,
  instituicao: limitesTexto.instituicao,
  observacoes: limitesTexto.observacoes,
};

function opcaoDaClasse(assetClass: ClasseAtivo): Opcao {
  return { valor: assetClass, rotulo: rotuloClasseAtivo[assetClass] };
}

const opcoesClasse: Opcao[] = classesAtivo.map(opcaoDaClasse);
const opcoesClasseSemAcoes: Opcao[] = classesAtivo.filter((assetClass) => assetClass !== 'ACOES').map(opcaoDaClasse);
const opcoesSoAcoes: Opcao[] = [opcaoDaClasse('ACOES')];

function estadoInicial(investment: InvestimentoDTO | null): EstadoFormulario {
  return {
    nome: investment?.nome ?? '',
    codigo: investment?.codigo ?? '',
    classeAtivo: investment?.classeAtivo ?? 'RENDA_FIXA',
    instituicao: investment?.instituicao ?? '',
    aportado: '',
    valorAtual: '',
    quantidade: '',
    precoUnitario: '',
    taxas: '',
    cotacao: '',
    dataInicio: hojeISO(),
    idConta: OPCAO_SEM_CONTA,
    reservaEmergencia: investment?.reservaEmergencia ?? false,
    observacoes: investment?.observacoes ?? '',
  };
}

function erroValorOpcional(raw: string, sujeito: string, sinal: 'positive' | 'non-negative'): string | undefined {
  if (!raw.trim()) return undefined;
  return erroValor(raw, { sujeito, ausente: '', sinal });
}

function validar(form: EstadoFormulario, { editando, semQuantidade }: Contexto): ErrosCampos<EstadoFormulario> {
  const acao = form.classeAtivo === 'ACOES';
  const errors: ErrosCampos<EstadoFormulario> = {
    nome: erroTexto(form.nome, {
      sujeito: acao ? 'O nome da empresa' : 'O nome do investimento',
      ausente: acao ? 'Informe o nome da empresa!' : 'Informe o nome do investimento!',
      maximo: limitesTexto.nomeInvestimento,
    }),
    instituicao: erroTexto(form.instituicao, {
      sujeito: acao ? 'O nome da corretora' : 'O nome da instituição',
      ausente: acao ? 'Informe a corretora onde as ações estão!' : 'Informe onde o dinheiro está aplicado!',
      maximo: limitesTexto.instituicao,
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (acao) errors.codigo = erroCodigoAcao(form.codigo);

  if (semQuantidade) errors.quantidade = erroQuantidadeInteira(form.quantidade, 'Informe quantas ações você tem!');

  if (editando) return errors;

  if (acao) {
    errors.quantidade = erroQuantidadeInteira(form.quantidade, 'Informe quantas ações você comprou!');
    errors.precoUnitario = erroValor(form.precoUnitario, {
      sujeito: 'O preço por ação',
      ausente: 'Informe o preço pago por ação!',
      sinal: 'positive',
    });
    errors.taxas = erroValorOpcional(form.taxas, 'As taxas', 'non-negative');
    errors.cotacao = erroValorOpcional(form.cotacao, 'A cotação', 'positive');
  } else {
    errors.aportado = erroValor(form.aportado, {
      sujeito: 'A aplicação inicial',
      ausente: 'Informe o valor da aplicação inicial!',
      sinal: 'positive',
    });
    errors.valorAtual = erroValor(form.valorAtual, {
      sujeito: 'O saldo atual',
      ausente: 'Informe quanto o investimento vale hoje!',
      sinal: 'non-negative',
    });
  }

  if (!form.dataInicio) {
    errors.dataInicio = acao ? 'Informe a data da compra!' : 'Informe a data da aplicação inicial!';
  } else if (form.dataInicio > hojeISO()) {
    errors.dataInicio = acao ? 'A compra não pode estar no futuro!' : 'A aplicação inicial não pode estar no futuro!';
  }

  return errors;
}

function descricaoDoModal(editando: boolean, acao: boolean, semQuantidade: boolean): string {
  if (semQuantidade) return 'Informe o código e quantas ações você tem para passar a acompanhar esta ação pela cotação.';
  if (editando && acao) return 'Compras, vendas e cotações têm registro próprio, no detalhe da ação, para o histórico não se perder.';
  if (editando) return 'Aportes e saldo têm registro próprio, no detalhe do investimento, para o histórico não se perder.';
  if (acao) return 'Informe quantas ações você comprou e por quanto. O total, o preço médio e o saldo saem dessa conta.';
  return 'Informe quanto você aplicou no começo e quanto o investimento vale hoje.';
}

export function ModalFormularioInvestimento({ aberto, investimento, contas, salvando, aoEnviar, aoFechar }: ModalFormularioInvestimentoProps) {
  const editing = investimento !== null;
  const withoutQuantity = investimento !== null && ehAcaoSemQuantidade(investimento);
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(investimento));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => validar(values, { editando: editing, semQuantidade: withoutQuantity }),
    { limites },
  );

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(investimento));
    reiniciar();
  }, [aberto, investimento, reiniciar]);

  const isShare = form.classeAtivo === 'ACOES';

  const preview = useMemo(() => {
    if (editing || isShare) return null;
    const invested = interpretarEntradaValor(form.aportado);
    const currentValue = interpretarEntradaValor(form.valorAtual);
    if (invested === undefined || currentValue === undefined || invested <= 0) return null;

    return { profit: currentValue - invested, profitability: ((currentValue - invested) / invested) * 100 };
  }, [editing, isShare, form.aportado, form.valorAtual]);

  const purchasePreview = useMemo(() => {
    if (editing || !isShare) return null;
    const quantity = Number(form.quantidade);
    const price = interpretarEntradaValor(form.precoUnitario);
    const fees = interpretarEntradaValor(form.taxas) ?? 0;
    if (!form.quantidade || quantity <= 0 || price === undefined || price <= 0 || fees < 0) return null;

    const total = custoDaCompra(quantity, price, fees);
    const quote = interpretarEntradaValor(form.cotacao);
    const today = quote !== undefined && quote > 0 && quote !== price ? quote * quantity : null;

    return { quantity, price, fees, total, averagePrice: precoMedio(total, quantity), today };
  }, [editing, isShare, form.quantidade, form.precoUnitario, form.taxas, form.cotacao]);

  const conversionPreview = useMemo(() => {
    if (!withoutQuantity || !investimento) return null;
    const quantity = Number(form.quantidade);
    if (!form.quantidade || quantity <= 0) return null;

    return {
      averagePrice: precoMedio(investimento.aportado, quantity),
      quote: precoMedio(investimento.valorAtual, quantity),
    };
  }, [withoutQuantity, investimento, form.quantidade]);

  const accountOptions = useMemo(() => opcoesContaMovimentacao(contas, 'Nenhuma — Já estava investido'), [contas]);
  const chosenAccount = contas.find((account) => account.id === form.idConta);

  const classOptions = !editing ? opcoesClasse : investimento.classeAtivo === 'ACOES' ? opcoesSoAcoes : opcoesClasseSemAcoes;

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    const base = {
      nome: form.nome,
      classeAtivo: form.classeAtivo,
      instituicao: form.instituicao,
      reservaEmergencia: form.reservaEmergencia,
      observacoes: form.observacoes,
    };

    if (editing) {
      aoEnviar({
        modo: 'update',
        dados: {
          ...base,
          ...(isShare ? { codigo: form.codigo } : {}),
          ...(withoutQuantity ? { quantidade: Number(form.quantidade) } : {}),
        },
      });
      return;
    }

    const account = chosenAccount ? { idConta: chosenAccount.id } : {};

    if (isShare) {
      const fees = interpretarEntradaValor(form.taxas);
      const quote = interpretarEntradaValor(form.cotacao);
      aoEnviar({
        modo: 'createAcao',
        dados: {
          codigo: form.codigo,
          nome: form.nome,
          instituicao: form.instituicao,
          quantidade: Number(form.quantidade),
          precoUnitario: interpretarEntradaValor(form.precoUnitario) ?? 0,
          ...(fees !== undefined && fees > 0 ? { taxas: fees } : {}),
          ...(quote !== undefined ? { cotacao: quote } : {}),
          dataInicio: form.dataInicio,
          reservaEmergencia: form.reservaEmergencia,
          observacoes: form.observacoes,
          ...account,
        },
      });
      return;
    }

    aoEnviar({
      modo: 'create',
      dados: {
        ...base,
        aportado: interpretarEntradaValor(form.aportado) ?? 0,
        valorAtual: interpretarEntradaValor(form.valorAtual) ?? 0,
        dataInicio: form.dataInicio,
        ...account,
      },
    });
  };

  const classHint =
    editing && investimento.classeAtivo === 'ACOES'
      ? 'Ações não trocam de classe depois do cadastro.'
      : editing
        ? dicaClasseAtivo[form.classeAtivo]
        : isShare
          ? 'Acompanhada pela quantidade e cotação.'
          : dicaClasseAtivo[form.classeAtivo];

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editing ? (investimento.classeAtivo === 'ACOES' ? 'Editar ação' : 'Editar investimento') : 'Novo investimento'}
      descricao={descricaoDoModal(editing, isShare, withoutQuantity)}
      tamanho="lgPlus"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {editing ? 'Salvar alterações' : isShare ? 'Cadastrar ação' : 'Cadastrar investimento'}
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
          className={styles.wide}
          required
          rotulo={isShare ? 'Nome da empresa' : 'Nome'}
          placeholder={isShare ? 'Petrobras, Itaú Unibanco, Vale...' : 'CDB Liquidez Diária, Caixinha da viagem, PGBL...'}
          value={form.nome}
          onChange={(event) => set('nome', event.target.value)}
          onBlur={() => tocar('nome')}
          limiteCaracteres={limitesTexto.nomeInvestimento}
          erro={erros.nome}
          autoFocus
        />

        <CampoSelecao
          required
          rotulo="Tipo de ativo"
          opcoes={classOptions}
          value={form.classeAtivo}
          onChange={(value) => set('classeAtivo', value as ClasseAtivo)}
          disabled={editing && investimento.classeAtivo === 'ACOES'}
          {...(classHint ? { dica: classHint } : {})}
        />

        <CampoTexto
          required
          rotulo={isShare ? 'Corretora' : 'Instituição'}
          placeholder={isShare ? 'Nome da corretora' : 'Banco, corretora ou seguradora'}
          value={form.instituicao}
          onChange={(event) => set('instituicao', event.target.value)}
          onBlur={() => tocar('instituicao')}
          limiteCaracteres={limitesTexto.instituicao}
          erro={erros.instituicao}
        />

        {isShare ? (
          <CampoTexto
            required
            rotulo="Código"
            placeholder="PETR4"
            value={form.codigo}
            onChange={(event) => set('codigo', event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            onBlur={() => tocar('codigo')}
            maxLength={limitesTexto.codigoAcao}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            erro={erros.codigo}
            dica="Como aparece na corretora."
          />
        ) : null}

        {isShare && (!editing || withoutQuantity) ? (
          <CampoTexto
            required
            rotulo={withoutQuantity ? 'Quantas ações você tem' : 'Quantidade de ações'}
            placeholder="100"
            inputMode="numeric"
            value={form.quantidade}
            onChange={(event) => set('quantidade', apenasDigitos(event.target.value))}
            onBlur={() => tocar('quantidade')}
            maxLength={DIGITOS_MAXIMOS_QUANTIDADE_ACOES}
            erro={erros.quantidade}
            {...(withoutQuantity && investimento
              ? { dica: 'O preço médio sai do total aportado, e a cotação, do saldo atual.' }
              : {})}
          />
        ) : null}

        {editing ? null : isShare ? (
          <>
            <CampoValor
              required
              rotulo="Preço por ação"
              valor={form.precoUnitario}
              aoMudar={(value) => set('precoUnitario', value)}
              onBlur={() => tocar('precoUnitario')}
              erro={erros.precoUnitario}
            />

            <CampoValor
              rotulo="Taxas"
              valor={form.taxas}
              aoMudar={(value) => set('taxas', value)}
              onBlur={() => tocar('taxas')}
              erro={erros.taxas}
              dica="Corretagem e emolumentos, se houver."
            />

            <SeletorData
              required
              rotulo="Data da compra"
              max={hojeISO()}
              value={form.dataInicio}
              onChange={(startDate) => set('dataInicio', startDate)}
              erro={erros.dataInicio}
            />

            <CampoValor
              rotulo="Cotação de hoje"
              valor={form.cotacao}
              aoMudar={(value) => set('cotacao', value)}
              onBlur={() => tocar('cotacao')}
              erro={erros.cotacao}
              dica="Sem ela, vale o preço pago."
            />

            <CampoSelecao
              className={styles.wide}
              rotulo="Saiu de qual conta?"
              opcoes={accountOptions}
              value={form.idConta}
              onChange={(value) => set('idConta', value)}
              dica={
                chosenAccount
                  ? `O total da compra sai do saldo de ${chosenAccount.nome} e aparece como transferência em Lançamentos.`
                  : 'O saldo das suas contas não muda.'
              }
            />
          </>
        ) : (
          <>
            <CampoValor
              required
              rotulo="Aplicação inicial"
              valor={form.aportado}
              aoMudar={(value) => set('aportado', value)}
              onBlur={() => tocar('aportado')}
              erro={erros.aportado}
              dica="O dinheiro que você colocou no começo. Os próximos aportes entram pelo detalhe."
            />

            <CampoValor
              required
              rotulo="Saldo atual"
              valor={form.valorAtual}
              aoMudar={(value) => set('valorAtual', value)}
              onBlur={() => tocar('valorAtual')}
              erro={erros.valorAtual}
              dica="Quanto vale hoje, já com o rendimento."
            />

            <SeletorData
              required
              rotulo="Data da aplicação inicial"
              max={hojeISO()}
              value={form.dataInicio}
              onChange={(startDate) => set('dataInicio', startDate)}
              erro={erros.dataInicio}
            />

            <CampoSelecao
              rotulo="Saiu de qual conta?"
              opcoes={accountOptions}
              value={form.idConta}
              onChange={(value) => set('idConta', value)}
              dica={
                chosenAccount
                  ? `A aplicação inicial sai do saldo de ${chosenAccount.nome} e aparece como transferência em Lançamentos.`
                  : 'O saldo das suas contas não muda.'
              }
            />
          </>
        )}

        <Interruptor
          className={juntarClasses(styles.wide, styles.rowStart)}
          rotulo="Faz parte da reserva de emergência"
          checked={form.reservaEmergencia}
          onChange={(checked) => set('reservaEmergencia', checked)}
          dica="Dinheiro guardado para imprevistos. Ele soma no total da reserva, no topo de Investimentos."
        />

        <AreaTexto
          className={juntarClasses(styles.wide, styles.note)}
          rotulo="Observação"
          placeholder="Opcional: estratégia, prazo de resgate ou o que ajudar a lembrar."
          value={form.observacoes}
          onChange={(event) => set('observacoes', event.target.value)}
          onBlur={() => tocar('observacoes')}
          limiteCaracteres={limitesTexto.observacoes}
          erro={erros.observacoes}
        />

        {preview ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <ValorMonetario valor={preview.profit} tamanho="md" sinal="auto" />
              <span className="tabular">{formatarPercentualComSinal(preview.profitability)}</span>
            </strong>
            <span className={styles.previewText}>
              {preview.profit >= 0 ? 'De rendimento' : 'De perda'} sobre a aplicação inicial, registrado hoje como
              atualização de saldo.
            </span>
          </p>
        ) : null}

        {purchasePreview ? (
          <div className={styles.preview} aria-live="polite">
            <span className={styles.previewText}>Total da compra</span>
            <strong className={styles.previewValue}>
              <ValorMonetario valor={purchasePreview.total} tamanho="md" />
            </strong>
            <span className={styles.previewText}>
              {rotuloQuantidadeAcoes(purchasePreview.quantity)} a{' '}
              <ValorMonetario valor={purchasePreview.price} tamanho="sm" />
              {purchasePreview.fees > 0 ? (
                <>
                  {' '}mais <ValorMonetario valor={purchasePreview.fees} tamanho="sm" /> de taxas
                </>
              ) : null}{' '}
              — Preço médio de <ValorMonetario valor={purchasePreview.averagePrice} tamanho="sm" />.
            </span>
            {purchasePreview.today !== null ? (
              <span className={styles.previewText}>
                Hoje valem <ValorMonetario valor={purchasePreview.today} tamanho="sm" />, com resultado de{' '}
                <ValorMonetario
                  valor={purchasePreview.today - purchasePreview.total}
                  tamanho="sm"
                  sinal="auto"
                  tom={tomRendimento(purchasePreview.today - purchasePreview.total)}
                />
                .
              </span>
            ) : null}
          </div>
        ) : null}

        {conversionPreview ? (
          <p className={styles.preview} aria-live="polite">
            <span className={styles.previewText}>
              Preço médio de <ValorMonetario valor={conversionPreview.averagePrice} tamanho="sm" /> e cotação de{' '}
              <ValorMonetario valor={conversionPreview.quote} tamanho="sm" />. Daqui em diante, registre compras, vendas e
              cotações no detalhe da ação.
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
