import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Hash, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { HistoricoMovimentacoes, ValorMonetario } from '@/components/comum';
import type { ItemMovimentacao } from '@/components/comum';
import { GraficoEvolucao } from '@/components/graficos';
import { BlocoCarregando, Botao, CampoSelecao, CampoTexto, CampoValor, EstadoVazio, Modal, SeletorData } from '@/components/ui';
import {
  QUANTIDADE_INICIAL_MOVIMENTACOES,
  ehAcaoPorQuantidade,
  ehAcaoSemQuantidade,
  iconeClasseAtivo,
  nomeDoInvestimento,
  rotuloClasseAtivo,
  rotuloQuantidadeAcoes,
} from '@/constants/investimentos';
import type { AcaoPorQuantidade } from '@/constants/investimentos';
import { DIGITOS_MAXIMOS_QUANTIDADE_ACOES, limitesTexto } from '@/constants/validacao';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useIndicadoresRolagem } from '@/hooks/useIndicadoresRolagem';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import { investimentosService } from '@/services';
import type {
  ContaDTO,
  ExtratoInvestimentoDTO,
  InvestimentoDTO,
  MovimentacaoInvestimentoDTO,
  SalvarAporteInvestimentoDTO,
  SalvarCotacaoAcaoDTO,
  SalvarNegociacaoAcaoDTO,
  SalvarResgateInvestimentoDTO,
  SalvarSaldoInvestimentoDTO,
} from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarDataNumerica, formatarMoeda, formatarPercentualComSinal, interpretarEntradaValor } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { apenasDigitos } from '@/utils/mascaraValor';
import { erroQuantidadeInteira, erroTexto, erroValor } from '@/utils/validacao';
import { custoDaCompra, custoDasVendidas, precoMedio, valorDaVenda } from './calculoAcoes';
import { corDaClasse, tomRendimento } from './aparencia';
import { OPCAO_SEM_CONTA, opcoesContaMovimentacao } from './contaMovimentacao';
import styles from './ModalDetalheInvestimento.module.css';

export type AcaoRegistroInvestimento = 'aporte' | 'resgate' | 'saldo';

interface ModalDetalheInvestimentoProps {
  investimentoId: string | null;
  acaoInicial: AcaoRegistroInvestimento;
  versao: number;
  contas: ContaDTO[];
  salvando: boolean;
  aoFechar: () => void;
  aoEditar: (investment: InvestimentoDTO) => void;
  aoExcluir: (statement: ExtratoInvestimentoDTO) => void;
  aoRegistrarAporte: (investment: InvestimentoDTO, payload: SalvarAporteInvestimentoDTO) => Promise<boolean>;
  aoRegistrarResgate: (investment: InvestimentoDTO, payload: SalvarResgateInvestimentoDTO) => Promise<boolean>;
  aoAtualizarSaldo: (investment: InvestimentoDTO, payload: SalvarSaldoInvestimentoDTO) => Promise<boolean>;
  aoRegistrarCompra: (share: AcaoPorQuantidade, payload: SalvarNegociacaoAcaoDTO) => Promise<boolean>;
  aoRegistrarVenda: (share: AcaoPorQuantidade, payload: SalvarNegociacaoAcaoDTO) => Promise<boolean>;
  aoRegistrarCotacao: (share: AcaoPorQuantidade, payload: SalvarCotacaoAcaoDTO) => Promise<boolean>;
}

interface FormularioRegistro {
  valor: string;
  quantidade: string;
  taxas: string;
  data: string;
  idConta: string;
  descricao: string;
}

interface TextoAcao {
  segmento: string;
  dica: string;
  valor: string;
  botao: string;
  data: string;
}

const ordemDasAcoes: AcaoRegistroInvestimento[] = ['aporte', 'resgate', 'saldo'];

const textoPorValor: Record<AcaoRegistroInvestimento, TextoAcao> = {
  aporte: {
    segmento: 'Aportar',
    dica: 'Dinheiro novo que você colocou. Soma no saldo e no total aportado; não conta como rendimento.',
    valor: 'Valor do aporte',
    botao: 'Adicionar',
    data: 'Informe a data do aporte!',
  },
  resgate: {
    segmento: 'Resgatar',
    dica: 'Dinheiro que você tirou. Sai do saldo e do total aportado na mesma proporção, então a rentabilidade não muda.',
    valor: 'Valor do resgate',
    botao: 'Resgatar',
    data: 'Informe a data do resgate!',
  },
  saldo: {
    segmento: 'Atualizar saldo',
    dica: 'O saldo que a instituição mostra hoje. A diferença para o saldo anterior vira rendimento.',
    valor: 'Saldo atual',
    botao: 'Atualizar',
    data: 'Informe a data do saldo!',
  },
};

const textoPorQuantidade: Record<AcaoRegistroInvestimento, TextoAcao> = {
  aporte: {
    segmento: 'Comprar',
    dica: 'Ações que você comprou. A quantidade e o total investido sobem, e o preço pago vira a cotação.',
    valor: 'Preço por ação',
    botao: 'Comprar',
    data: 'Informe a data da compra!',
  },
  resgate: {
    segmento: 'Vender',
    dica: 'Ações que você vendeu. O total investido cai pelo preço médio das vendidas, e o preço da venda vira a cotação.',
    valor: 'Preço de venda',
    botao: 'Vender',
    data: 'Informe a data da venda!',
  },
  saldo: {
    segmento: 'Atualizar cotação',
    dica: 'O preço de uma ação hoje, como aparece na corretora. O saldo passa a ser a quantidade vezes a cotação.',
    valor: 'Cotação de hoje',
    botao: 'Atualizar',
    data: 'Informe a data da cotação!',
  },
};

function formularioVazio(): FormularioRegistro {
  return { valor: '', quantidade: '', taxas: '', data: hojeISO(), idConta: OPCAO_SEM_CONTA, descricao: '' };
}

function aportadoDepoisDoResgate(investment: InvestimentoDTO, amount: number): number {
  if (investment.valorAtual <= 0 || amount >= investment.valorAtual) return 0;
  return investment.aportado * ((investment.valorAtual - amount) / investment.valorAtual);
}

function limiteDaVenda(share: AcaoPorQuantidade): string {
  return share.quantidade === 1 ? 'da 1 ação' : `das ${rotuloQuantidadeAcoes(share.quantidade)}`;
}

function validarPorValor(
  form: FormularioRegistro,
  action: AcaoRegistroInvestimento,
  investment: InvestimentoDTO | undefined,
): ErrosCampos<FormularioRegistro> {
  const errors: ErrosCampos<FormularioRegistro> = {
    valor:
      action === 'aporte'
        ? erroValor(form.valor, { sujeito: 'O valor do aporte', ausente: 'Informe o valor do aporte!', sinal: 'positive' })
        : action === 'resgate'
          ? erroValor(form.valor, { sujeito: 'O valor do resgate', ausente: 'Informe o valor do resgate!', sinal: 'positive' })
          : erroValor(form.valor, { sujeito: 'O saldo atual', ausente: 'Informe o saldo que a instituição mostra hoje!', sinal: 'non-negative' }),
  };

  const amount = interpretarEntradaValor(form.valor);
  if (!errors.valor && action === 'resgate' && investment && amount !== undefined && amount > investment.valorAtual) {
    errors.valor = `O resgate não pode passar do saldo atual, de ${formatarMoeda(investment.valorAtual)}!`;
  }

  return errors;
}

function validarPorQuantidade(
  form: FormularioRegistro,
  action: AcaoRegistroInvestimento,
  share: AcaoPorQuantidade,
): ErrosCampos<FormularioRegistro> {
  if (action === 'saldo') {
    return { valor: erroValor(form.valor, { sujeito: 'A cotação', ausente: 'Informe a cotação de hoje!', sinal: 'positive' }) };
  }

  const purchase = action === 'aporte';
  const errors: ErrosCampos<FormularioRegistro> = {
    quantidade: erroQuantidadeInteira(form.quantidade, purchase ? 'Informe quantas ações você comprou!' : 'Informe quantas ações você vendeu!'),
    valor: erroValor(form.valor, {
      sujeito: purchase ? 'O preço por ação' : 'O preço de venda',
      ausente: purchase ? 'Informe o preço pago por ação!' : 'Informe o preço de venda por ação!',
      sinal: 'positive',
    }),
    taxas: form.taxas.trim() ? erroValor(form.taxas, { sujeito: 'As taxas', ausente: '', sinal: 'non-negative' }) : undefined,
  };

  const quantity = Number(form.quantidade);
  if (!errors.quantidade && !purchase && quantity > share.quantidade) {
    errors.quantidade = `A venda não pode passar ${limiteDaVenda(share)} que você tem!`;
  }

  const price = interpretarEntradaValor(form.valor);
  const fees = interpretarEntradaValor(form.taxas) ?? 0;
  if (!purchase && !errors.quantidade && !errors.valor && !errors.taxas && price !== undefined && valorDaVenda(quantity, price, fees) <= 0) {
    errors.taxas = 'As taxas não podem passar do valor da venda!';
  }

  return errors;
}

function validarRegistro(
  form: FormularioRegistro,
  action: AcaoRegistroInvestimento,
  investment: InvestimentoDTO | undefined,
): ErrosCampos<FormularioRegistro> {
  const errors =
    investment && ehAcaoPorQuantidade(investment)
      ? validarPorQuantidade(form, action, investment)
      : validarPorValor(form, action, investment);

  errors.descricao = erroTexto(form.descricao, { sujeito: 'A descrição', maximo: limitesTexto.descricao });

  const texts = investment && ehAcaoPorQuantidade(investment) ? textoPorQuantidade : textoPorValor;
  if (!form.data) {
    errors.data = texts[action].data;
  } else if (form.data > hojeISO()) {
    errors.data = 'A data não pode estar no futuro!';
  } else if (investment && form.data < investment.dataAtualizacao) {
    errors.data = `A data não pode ser anterior à última atualização, de ${formatarDataNumerica(investment.dataAtualizacao)}!`;
  }

  return errors;
}

function juntarDetalhes(parts: ReactNode[]): ReactNode {
  const present = parts.filter((part) => part !== undefined && part !== null && part !== '');
  if (present.length === 0) return undefined;
  return present.map((part, index) => (
    <span key={index}>
      {index > 0 ? ' — ' : null}
      {part}
    </span>
  ));
}

function negociacao(movement: MovimentacaoInvestimentoDTO): ReactNode {
  if (movement.quantidade === undefined || movement.precoUnitario === undefined) return undefined;
  return (
    <>
      {rotuloQuantidadeAcoes(movement.quantidade)} a{' '}
      <ValorMonetario className={styles.detailValue} valor={movement.precoUnitario} tamanho="sm" />
      {movement.taxas ? (
        <>
          {' '}mais <ValorMonetario className={styles.detailValue} valor={movement.taxas} tamanho="sm" /> de taxas
        </>
      ) : null}
    </>
  );
}

function paraItem(movement: MovimentacaoInvestimentoDTO): ItemMovimentacao {
  const byQuantity = movement.quantidade !== undefined;

  if (movement.tipo === 'APORTE' || movement.tipo === 'RESGATE') {
    const contribution = movement.tipo === 'APORTE';
    const account = movement.nomeConta ? `${contribution ? 'De' : 'Para'} ${movement.nomeConta}` : undefined;
    const detail = juntarDetalhes([negociacao(movement), account, movement.descricao]);
    return {
      id: movement.id,
      data: movement.data,
      titulo: byQuantity ? (contribution ? 'Compra' : 'Venda') : contribution ? 'Aporte' : 'Resgate',
      ...(detail ? { detalhe: detail } : {}),
      valor: movement.valor,
      sinal: contribution ? 'plus' : 'auto',
      tom: contribution ? 'accent' : 'neutral',
      icone: contribution ? ArrowDownToLine : ArrowUpFromLine,
      saldoApos: movement.saldoApos,
    };
  }

  if (byQuantity) {
    const detail = juntarDetalhes([negociacao(movement), movement.descricao]);
    return {
      id: movement.id,
      data: movement.data,
      titulo: 'Posição informada',
      ...(detail ? { detalhe: detail } : {}),
      valor: movement.valor,
      sinal: 'auto',
      tom: 'neutral',
      icone: Hash,
      saldoApos: movement.saldoApos,
    };
  }

  const gain = movement.valor >= 0;
  const quote =
    movement.precoUnitario !== undefined ? (
      <>
        Cotação de <ValorMonetario className={styles.detailValue} valor={movement.precoUnitario} tamanho="sm" />
      </>
    ) : undefined;
  const detail = juntarDetalhes([quote, movement.descricao]);
  return {
    id: movement.id,
    data: movement.data,
    titulo: gain ? 'Rendimento' : 'Desvalorização',
    ...(detail ? { detalhe: detail } : {}),
    valor: movement.valor,
    sinal: 'auto',
    tom: movement.valor === 0 ? 'neutral' : gain ? 'positive' : 'negative',
    icone: gain ? TrendingUp : TrendingDown,
    saldoApos: movement.saldoApos,
  };
}

export function ModalDetalheInvestimento({
  investimentoId,
  acaoInicial,
  versao,
  contas,
  salvando,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoRegistrarAporte,
  aoRegistrarResgate,
  aoAtualizarSaldo,
  aoRegistrarCompra,
  aoRegistrarVenda,
  aoRegistrarCotacao,
}: ModalDetalheInvestimentoProps) {
  const [action, setAction] = useState<AcaoRegistroInvestimento>(acaoInicial);
  const [form, setForm] = useState<FormularioRegistro>(formularioVazio);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const fetchStatement = useCallback(
    (signal: AbortSignal) =>
      investimentoId ? investimentosService.buscarExtrato(investimentoId, signal) : Promise.resolve(null),
    [investimentoId],
  );
  const { dados: statement, carregando, erro, recarregar } = useDadosAssincronos(fetchStatement, [investimentoId, versao]);

  const investment = statement?.posicao.investimento;
  const share = investment && ehAcaoPorQuantidade(investment) ? investment : null;
  const legacyShare = investment ? ehAcaoSemQuantidade(investment) : false;
  const texts = share ? textoPorQuantidade : textoPorValor;
  const trade = share !== null && action !== 'saldo';

  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => validarRegistro(values, action, investment),
    { limites: { descricao: limitesTexto.descricao } },
  );

  useEffect(() => {
    if (!investimentoId) return;
    setAction(acaoInicial);
    setForm(formularioVazio());
    reiniciar();
  }, [investimentoId, acaoInicial, reiniciar]);

  useEffect(() => {
    if (!investimentoId || !statement) return;
    firstFieldRef.current?.focus();
  }, [investimentoId, statement === null]);

  const historyScroll = useIndicadoresRolagem<HTMLDivElement>([investimentoId, statement !== null]);

  const items = useMemo(() => (statement ? statement.movimentacoes.map(paraItem) : []), [statement]);

  const typedValue = interpretarEntradaValor(form.valor);
  const typedQuantity = /^\d+$/.test(form.quantidade) ? Number(form.quantidade) : undefined;
  const typedFees = interpretarEntradaValor(form.taxas) ?? 0;
  const accountOptions = useMemo(() => opcoesContaMovimentacao(contas, 'Nenhuma — Fora do Prisma'), [contas]);
  const chosenAccount = contas.find((account) => account.id === form.idConta);

  const balancePreview =
    !share && action === 'saldo' && investment && typedValue !== undefined ? typedValue - investment.valorAtual : null;
  const contributionPreview =
    !share && action === 'aporte' && investment && typedValue !== undefined && typedValue > 0 ? investment.valorAtual + typedValue : null;
  const withdrawalPreview =
    !share && action === 'resgate' && investment && typedValue !== undefined && typedValue > 0 && typedValue <= investment.valorAtual
      ? { saldo: investment.valorAtual - typedValue, aportado: aportadoDepoisDoResgate(investment, typedValue) }
      : null;

  const tradeReady = share !== null && typedQuantity !== undefined && typedQuantity > 0 && typedValue !== undefined && typedValue > 0 && typedFees >= 0;
  const purchasePreview =
    tradeReady && share && action === 'aporte' && typedQuantity !== undefined && typedValue !== undefined
      ? (() => {
          const total = custoDaCompra(typedQuantity, typedValue, typedFees);
          const quantity = share.quantidade + typedQuantity;
          return { total, quantity, averagePrice: precoMedio(share.aportado + total, quantity) };
        })()
      : null;
  const salePreview =
    tradeReady && share && action === 'resgate' && typedQuantity !== undefined && typedValue !== undefined && typedQuantity <= share.quantidade
      ? (() => {
          const received = valorDaVenda(typedQuantity, typedValue, typedFees);
          return { received, result: received - custoDasVendidas(share, typedQuantity), remaining: share.quantidade - typedQuantity };
        })()
      : null;
  const quotePreview =
    share && action === 'saldo' && typedValue !== undefined && typedValue > 0
      ? (() => {
          const balance = Math.round(share.quantidade * typedValue * 100) / 100;
          return { balance, difference: balance - share.valorAtual };
        })()
      : null;

  if (!investimentoId) return null;

  const switchAction = (next: AcaoRegistroInvestimento) => {
    if (next === action) return;
    setAction(next);
    setForm(formularioVazio());
    reiniciar();
  };

  const handleRegister = async () => {
    if (!investment || !enviar()) return;

    const amount = interpretarEntradaValor(form.valor) ?? 0;
    const description = form.descricao.trim();
    const optional = {
      ...(chosenAccount ? { idConta: chosenAccount.id } : {}),
      ...(description ? { descricao: description } : {}),
    };

    let ok: boolean;
    if (share) {
      if (action === 'saldo') {
        ok = await aoRegistrarCotacao(share, { cotacao: amount, data: form.data, ...(description ? { descricao: description } : {}) });
      } else {
        const fees = interpretarEntradaValor(form.taxas);
        const payload: SalvarNegociacaoAcaoDTO = {
          quantidade: Number(form.quantidade),
          precoUnitario: amount,
          ...(fees !== undefined && fees > 0 ? { taxas: fees } : {}),
          data: form.data,
          ...optional,
        };
        ok = action === 'aporte' ? await aoRegistrarCompra(share, payload) : await aoRegistrarVenda(share, payload);
      }
    } else {
      const movement = { valor: amount, data: form.data, ...optional };
      ok =
        action === 'aporte'
          ? await aoRegistrarAporte(investment, movement)
          : action === 'resgate'
            ? await aoRegistrarResgate(investment, movement)
            : await aoAtualizarSaldo(investment, {
                valorAtual: amount,
                data: form.data,
                ...(description ? { descricao: description } : {}),
              });
    }

    if (ok) {
      setForm(formularioVazio());
      reiniciar();
    }
  };

  const Icon = investment ? iconeClasseAtivo[investment.classeAtivo] : null;

  const valueField = (
    <CampoValor
      ref={trade ? undefined : firstFieldRef}
      required
      rotulo={texts[action].valor}
      valor={form.valor}
      aoMudar={(value) => setForm((current) => ({ ...current, valor: value }))}
      onBlur={() => tocar('valor')}
      erro={erros.valor}
    />
  );

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={investment ? nomeDoInvestimento(investment) : 'Investimento'}
      descricao={
        investment
          ? `${rotuloClasseAtivo[investment.classeAtivo]} — ${investment.instituicao} — ${share ? 'Cotação atualizada' : 'Saldo atualizado'} em ${formatarDataNumerica(investment.dataAtualizacao)}`
          : undefined
      }
      tamanho="xl"
      rodape={
        <>
          <Botao
            className={styles.footerStart}
            variante="ghost"
            icone={Trash2}
            disabled={salvando || !statement}
            onClick={() => statement && aoExcluir(statement)}
          >
            Excluir
          </Botao>
          <Botao
            variante="secondary"
            icone={Pencil}
            disabled={salvando || !investment}
            onClick={() => investment && aoEditar(investment)}
          >
            Editar
          </Botao>
          <Botao onClick={aoFechar}>Fechar</Botao>
        </>
      }
    >
      {!statement && carregando ? (
        <BlocoCarregando linhas={4} altura={320} />
      ) : erro || !statement || !investment ? (
        <EstadoVazio
          titulo="Não foi possível carregar o investimento"
          descricao={erro?.message ?? 'Tente de novo em alguns instantes.'}
          acao={
            <Botao variante="secondary" onClick={recarregar}>
              Tentar de novo
            </Botao>
          }
        />
      ) : (
        <div className={juntarClasses(styles.body, 'refreshing')} aria-busy={carregando}>
          <div className={styles.overview}>
            <header className={styles.head}>
              {Icon ? (
                <span className={styles.iconBox} style={{ color: corDaClasse(investment.classeAtivo) }} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
              ) : null}
              <div className={styles.headMain}>
                <span className={styles.headLabel}>Saldo atual</span>
                <ValorMonetario valor={investment.valorAtual} tamanho="lg" animar />
              </div>
              <div className={styles.headResult}>
                <span className={styles.headLabel}>Rendimento acumulado</span>
                <span className={styles.pair}>
                  <ValorMonetario
                    valor={statement.posicao.rendimento}
                    tom={tomRendimento(statement.posicao.rendimento)}
                    sinal="auto"
                    animar
                  />
                  <span className="tabular">{formatarPercentualComSinal(statement.posicao.rentabilidade * 100)}</span>
                </span>
              </div>
            </header>

            {share ? (
              <dl className={styles.facts}>
                <div>
                  <dt>Quantidade</dt>
                  <dd className="tabular">{rotuloQuantidadeAcoes(share.quantidade)}</dd>
                </div>
                <div>
                  <dt>Preço médio</dt>
                  <dd>{share.precoMedio !== undefined ? <ValorMonetario valor={share.precoMedio} tamanho="sm" /> : '—'}</dd>
                </div>
                <div>
                  <dt>Cotação atual</dt>
                  <dd>{share.cotacao !== undefined ? <ValorMonetario valor={share.cotacao} tamanho="sm" /> : '—'}</dd>
                </div>
                <div>
                  <dt>Total investido</dt>
                  <dd>
                    <ValorMonetario valor={share.aportado} tamanho="sm" />
                  </dd>
                </div>
              </dl>
            ) : (
              <dl className={styles.facts}>
                <div>
                  <dt>Total aportado</dt>
                  <dd>
                    <ValorMonetario valor={investment.aportado} tamanho="sm" />
                  </dd>
                </div>
                <div>
                  <dt>Aportes</dt>
                  <dd className="tabular">
                    {statement.quantidadeAportes} {statement.quantidadeAportes === 1 ? 'registro' : 'registros'}
                  </dd>
                </div>
                <div>
                  <dt>Último aporte</dt>
                  <dd className="tabular">{statement.ultimoAporte ? formatarDataNumerica(statement.ultimoAporte) : '—'}</dd>
                </div>
                <div>
                  <dt>Aplicado desde</dt>
                  <dd className="tabular">{formatarDataNumerica(investment.dataInicio)}</dd>
                </div>
              </dl>
            )}
          </div>

          <section className={juntarClasses(styles.block, styles.evolution)} aria-labelledby="investment-evolution-title">
            <h3 className={styles.sectionTitle} id="investment-evolution-title">
              Evolução
            </h3>
            <p className={styles.sectionHint}>
              A distância entre a área e a linha tracejada é o rendimento: o tracejado soma só o dinheiro que você colocou.
            </p>
            <GraficoEvolucao dados={statement.evolucao} altura={220} rotuloValor="Saldo" />
          </section>

          <section className={styles.register} aria-labelledby="investment-register-title">
            {legacyShare ? (
              <div className={styles.notice}>
                <p className={styles.noticeText}>
                  Esta ação ainda é acompanhada pelo valor. Informe o código e quantas ações você tem para registrar compras,
                  vendas e cotações.
                </p>
                <Botao variante="secondary" tamanho="sm" icone={Hash} onClick={() => aoEditar(investment)}>
                  Informar quantidade
                </Botao>
              </div>
            ) : null}

            <div className={styles.registerHead}>
              <h3 className={styles.sectionTitle} id="investment-register-title">
                Registrar movimentação
              </h3>
              <div className={styles.segmented} role="group" aria-label="Tipo de registro">
                {ordemDasAcoes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={juntarClasses(styles.segment, action === option && styles.segmentActive)}
                    aria-pressed={action === option}
                    onClick={() => switchAction(option)}
                  >
                    {texts[option].segmento}
                  </button>
                ))}
              </div>
            </div>
            <p className={styles.sectionHint}>{texts[action].dica}</p>

            <form
              ref={refFormulario}
              className={juntarClasses(
                styles.registerFields,
                trade ? styles.registerFieldsTrade : action !== 'saldo' && styles.registerFieldsWithAccount,
              )}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegister();
              }}
            >
              {trade ? (
                <CampoTexto
                  ref={firstFieldRef}
                  required
                  rotulo="Quantidade"
                  placeholder="100"
                  inputMode="numeric"
                  value={form.quantidade}
                  onChange={(event) => setForm((current) => ({ ...current, quantidade: apenasDigitos(event.target.value) }))}
                  onBlur={() => tocar('quantidade')}
                  maxLength={DIGITOS_MAXIMOS_QUANTIDADE_ACOES}
                  erro={erros.quantidade}
                />
              ) : null}

              {valueField}

              {trade ? (
                <CampoValor
                  rotulo="Taxas"
                  valor={form.taxas}
                  aoMudar={(value) => setForm((current) => ({ ...current, taxas: value }))}
                  onBlur={() => tocar('taxas')}
                  erro={erros.taxas}
                />
              ) : null}

              <SeletorData
                required
                rotulo="Data"
                min={investment.dataAtualizacao}
                max={hojeISO()}
                value={form.data}
                onChange={(data) => setForm((current) => ({ ...current, data }))}
                erro={erros.data}
              />

              {action === 'saldo' ? null : (
                <CampoSelecao
                  className={styles.account}
                  rotulo={action === 'aporte' ? 'Saiu de qual conta?' : 'Voltou para qual conta?'}
                  opcoes={accountOptions}
                  value={form.idConta}
                  onChange={(idConta) => setForm((current) => ({ ...current, idConta }))}
                />
              )}

              <CampoTexto
                className={styles.note}
                rotulo="Descrição"
                placeholder={
                  share
                    ? action === 'saldo'
                      ? 'Home broker, app da corretora...'
                      : action === 'aporte'
                        ? 'Aproveitando a queda...'
                        : 'Realizando lucro...'
                    : action === 'aporte'
                      ? 'Salário, 13º, bônus...'
                      : action === 'resgate'
                        ? 'Conserto do carro, viagem...'
                        : 'Extrato, app do banco...'
                }
                value={form.descricao}
                onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                onBlur={() => tocar('descricao')}
                limiteCaracteres={limitesTexto.descricao}
                erro={erros.descricao}
              />

              <Botao type="submit" className={styles.registerButton} carregando={salvando}>
                {texts[action].botao}
              </Botao>
            </form>

            {contributionPreview !== null ? (
              <p className={styles.preview}>
                O saldo passa para <ValorMonetario valor={contributionPreview} tamanho="sm" /> e o total aportado para{' '}
                <ValorMonetario valor={investment.aportado + (typedValue ?? 0)} tamanho="sm" />
                {chosenAccount ? `, e ${chosenAccount.nome} perde o mesmo valor` : ''}.
              </p>
            ) : null}
            {withdrawalPreview !== null ? (
              <p className={styles.preview}>
                O saldo passa para <ValorMonetario valor={withdrawalPreview.saldo} tamanho="sm" /> e o total aportado para{' '}
                <ValorMonetario valor={withdrawalPreview.aportado} tamanho="sm" />
                {chosenAccount ? `, e o valor volta para ${chosenAccount.nome}` : ''}.
              </p>
            ) : null}
            {balancePreview !== null && form.valor ? (
              <p className={styles.preview}>
                {balancePreview >= 0 ? 'Rendimento de ' : 'Desvalorização de '}
                <ValorMonetario valor={balancePreview} tamanho="sm" sinal="auto" tom={tomRendimento(balancePreview)} /> desde{' '}
                {formatarDataNumerica(investment.dataAtualizacao)}.
              </p>
            ) : null}

            {purchasePreview !== null ? (
              <p className={styles.preview}>
                Total de <ValorMonetario valor={purchasePreview.total} tamanho="sm" />. Você passa a ter{' '}
                {rotuloQuantidadeAcoes(purchasePreview.quantity)}, a preço médio de{' '}
                <ValorMonetario valor={purchasePreview.averagePrice} tamanho="sm" />
                {chosenAccount ? `, e ${chosenAccount.nome} perde o total` : ''}.
              </p>
            ) : null}
            {salePreview !== null ? (
              <p className={styles.preview}>
                Você recebe <ValorMonetario valor={salePreview.received} tamanho="sm" />, com{' '}
                {salePreview.result >= 0 ? 'lucro' : 'prejuízo'} de{' '}
                <ValorMonetario valor={salePreview.result} tamanho="sm" sinal="auto" tom={tomRendimento(salePreview.result)} /> sobre o
                preço médio.{' '}
                {salePreview.remaining > 0 ? `Ficam ${rotuloQuantidadeAcoes(salePreview.remaining)}` : 'A posição fica zerada'}
                {chosenAccount ? `, e o valor volta para ${chosenAccount.nome}` : ''}.
              </p>
            ) : null}
            {quotePreview !== null ? (
              <p className={styles.preview}>
                O saldo passa para <ValorMonetario valor={quotePreview.balance} tamanho="sm" />, com{' '}
                {quotePreview.difference >= 0 ? 'rendimento' : 'desvalorização'} de{' '}
                <ValorMonetario valor={quotePreview.difference} tamanho="sm" sinal="auto" tom={tomRendimento(quotePreview.difference)} />{' '}
                desde {formatarDataNumerica(investment.dataAtualizacao)}.
              </p>
            ) : null}
          </section>

          <section className={juntarClasses(styles.block, styles.history)} aria-labelledby="investment-history-title">
            <h3 className={styles.sectionTitle} id="investment-history-title">
              Histórico
            </h3>
            <p className={styles.sectionHint}>
              {share
                ? 'Compras, vendas e cotações em linhas separadas, do mais recente ao mais antigo.'
                : 'Aportes, resgates e rendimentos em linhas separadas, do mais recente ao mais antigo.'}
            </p>
            <div
              className={styles.historyFrame}
              {...(historyScroll.acima ? { 'data-acima': '' } : {})}
              {...(historyScroll.abaixo ? { 'data-abaixo': '' } : {})}
            >
              <div
                ref={historyScroll.ref}
                className={styles.historyScroll}
                role="region"
                aria-labelledby="investment-history-title"
                onScroll={historyScroll.medir}
                {...(historyScroll.rolavel ? { tabIndex: 0 } : {})}
              >
                <HistoricoMovimentacoes itens={items} quantidadeInicial={QUANTIDADE_INICIAL_MOVIMENTACOES} />
              </div>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
