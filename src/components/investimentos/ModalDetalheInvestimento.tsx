import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { HistoricoMovimentacoes, ValorMonetario } from '@/components/comum';
import type { ItemMovimentacao } from '@/components/comum';
import { GraficoEvolucao } from '@/components/graficos';
import { BlocoCarregando, Botao, CampoTexto, CampoValor, EstadoVazio, Modal, SeletorData } from '@/components/ui';
import { QUANTIDADE_INICIAL_MOVIMENTACOES, iconeClasseAtivo, rotuloClasseAtivo } from '@/constants/investimentos';
import { limitesTexto } from '@/constants/validacao';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import { investimentosService } from '@/services';
import type {
  ExtratoInvestimentoDTO,
  InvestimentoDTO,
  MovimentacaoInvestimentoDTO,
  SalvarAporteInvestimentoDTO,
  SalvarSaldoInvestimentoDTO,
} from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarDataNumerica, formatarPercentualComSinal, interpretarEntradaValor } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { erroTexto, erroValor } from '@/utils/validacao';
import { corDaClasse, tomRendimento } from './aparencia';
import styles from './ModalDetalheInvestimento.module.css';

export type AcaoRegistroInvestimento = 'aporte' | 'saldo';

interface ModalDetalheInvestimentoProps {
  investimentoId: string | null;
  acaoInicial: AcaoRegistroInvestimento;
  versao: number;
  salvando: boolean;
  aoFechar: () => void;
  aoEditar: (investment: InvestimentoDTO) => void;
  aoExcluir: (statement: ExtratoInvestimentoDTO) => void;
  aoRegistrarAporte: (investment: InvestimentoDTO, payload: SalvarAporteInvestimentoDTO) => Promise<boolean>;
  aoAtualizarSaldo: (investment: InvestimentoDTO, payload: SalvarSaldoInvestimentoDTO) => Promise<boolean>;
}

interface FormularioRegistro {
  valor: string;
  data: string;
  descricao: string;
}

function formularioVazio(): FormularioRegistro {
  return { valor: '', data: hojeISO(), descricao: '' };
}

function validarRegistro(
  form: FormularioRegistro,
  action: AcaoRegistroInvestimento,
  investment: InvestimentoDTO | undefined,
): ErrosCampos<FormularioRegistro> {
  const errors: ErrosCampos<FormularioRegistro> = {
    valor:
      action === 'aporte'
        ? erroValor(form.valor, { sujeito: 'O valor do aporte', ausente: 'Informe o valor do aporte!', sinal: 'positive' })
        : erroValor(form.valor, { sujeito: 'O saldo atual', ausente: 'Informe o saldo que a instituição mostra hoje!', sinal: 'non-negative' }),
    descricao: erroTexto(form.descricao, { sujeito: 'A descrição', maximo: limitesTexto.descricao }),
  };

  if (!form.data) {
    errors.data = action === 'aporte' ? 'Informe a data do aporte!' : 'Informe a data do saldo!';
  } else if (form.data > hojeISO()) {
    errors.data = 'A data não pode estar no futuro!';
  } else if (investment && form.data < investment.dataAtualizacao) {
    errors.data = `A data não pode ser anterior à última atualização, de ${formatarDataNumerica(investment.dataAtualizacao)}!`;
  }

  return errors;
}

function paraItem(movement: MovimentacaoInvestimentoDTO): ItemMovimentacao {
  if (movement.tipo === 'APORTE') {
    return {
      id: movement.id,
      data: movement.data,
      titulo: 'Aporte',
      ...(movement.descricao ? { detalhe: movement.descricao } : {}),
      valor: movement.valor,
      sinal: 'plus',
      tom: 'accent',
      icone: ArrowDownToLine,
      saldoApos: movement.saldoApos,
    };
  }

  const gain = movement.valor >= 0;
  return {
    id: movement.id,
    data: movement.data,
    titulo: gain ? 'Rendimento' : 'Desvalorização',
    ...(movement.descricao ? { detalhe: movement.descricao } : {}),
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
  salvando,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoRegistrarAporte,
  aoAtualizarSaldo,
}: ModalDetalheInvestimentoProps) {
  const [action, setAction] = useState<AcaoRegistroInvestimento>(acaoInicial);
  const [form, setForm] = useState<FormularioRegistro>(formularioVazio);
  const valueRef = useRef<HTMLInputElement>(null);

  const fetchStatement = useCallback(
    (signal: AbortSignal) =>
      investimentoId ? investimentosService.buscarExtrato(investimentoId, signal) : Promise.resolve(null),
    [investimentoId],
  );
  const { dados: statement, carregando, erro, recarregar } = useDadosAssincronos(fetchStatement, [investimentoId, versao]);

  const investment = statement?.posicao.investimento;

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
    valueRef.current?.focus();
  }, [investimentoId, statement === null]);

  const items = useMemo(() => (statement ? statement.movimentacoes.map(paraItem) : []), [statement]);

  const typedValue = interpretarEntradaValor(form.valor);
  const balancePreview =
    action === 'saldo' && investment && typedValue !== undefined ? typedValue - investment.valorAtual : null;
  const contributionPreview = action === 'aporte' && investment && typedValue !== undefined && typedValue > 0 ? investment.valorAtual + typedValue : null;

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
    const ok =
      action === 'aporte'
        ? await aoRegistrarAporte(investment, {
            valor: amount,
            data: form.data,
            ...(description ? { descricao: description } : {}),
          })
        : await aoAtualizarSaldo(investment, {
            valorAtual: amount,
            data: form.data,
            ...(description ? { descricao: description } : {}),
          });

    if (ok) {
      setForm(formularioVazio());
      reiniciar();
    }
  };

  const Icon = investment ? iconeClasseAtivo[investment.classeAtivo] : null;

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={investment?.nome ?? 'Investimento'}
      descricao={
        investment
          ? `${rotuloClasseAtivo[investment.classeAtivo]} · ${investment.instituicao} · saldo atualizado em ${formatarDataNumerica(investment.dataAtualizacao)}`
          : undefined
      }
      tamanho="lg"
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

          <section className={styles.block} aria-labelledby="investment-evolution-title">
            <h3 className={styles.sectionTitle} id="investment-evolution-title">
              Evolução
            </h3>
            <p className={styles.sectionHint}>
              A distância entre a área e a linha tracejada é o rendimento: o tracejado soma só o dinheiro que você colocou.
            </p>
            <GraficoEvolucao dados={statement.evolucao} altura={220} rotuloValor="Saldo" />
          </section>

          <section className={styles.register} aria-labelledby="investment-register-title">
            <div className={styles.registerHead}>
              <h3 className={styles.sectionTitle} id="investment-register-title">
                Registrar movimentação
              </h3>
              <div className={styles.segmented} role="group" aria-label="Tipo de registro">
                <button
                  type="button"
                  className={juntarClasses(styles.segment, action === 'aporte' && styles.segmentActive)}
                  aria-pressed={action === 'aporte'}
                  onClick={() => switchAction('aporte')}
                >
                  Adicionar aporte
                </button>
                <button
                  type="button"
                  className={juntarClasses(styles.segment, action === 'saldo' && styles.segmentActive)}
                  aria-pressed={action === 'saldo'}
                  onClick={() => switchAction('saldo')}
                >
                  Atualizar saldo
                </button>
              </div>
            </div>
            <p className={styles.sectionHint}>
              {action === 'aporte'
                ? 'Dinheiro novo que você colocou. Soma no saldo e no total aportado; não conta como rendimento.'
                : 'O saldo que a instituição mostra hoje. A diferença para o saldo anterior vira rendimento.'}
            </p>

            <form
              ref={refFormulario}
              className={styles.registerFields}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegister();
              }}
            >
              <CampoValor
                ref={valueRef}
                required
                rotulo={action === 'aporte' ? 'Valor do aporte' : 'Saldo atual'}
                valor={form.valor}
                aoMudar={(value) => setForm((current) => ({ ...current, valor: value }))}
                onBlur={() => tocar('valor')}
                erro={erros.valor}
              />

              <SeletorData
                required
                rotulo="Data"
                min={investment.dataAtualizacao}
                max={hojeISO()}
                value={form.data}
                onChange={(data) => setForm((current) => ({ ...current, data }))}
                erro={erros.data}
              />

              <CampoTexto
                className={styles.note}
                rotulo="Descrição"
                placeholder={action === 'aporte' ? 'Salário, 13º, bônus...' : 'Extrato, app do banco...'}
                value={form.descricao}
                onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                onBlur={() => tocar('descricao')}
                limiteCaracteres={limitesTexto.descricao}
                erro={erros.descricao}
              />

              <Botao type="submit" className={styles.registerButton} carregando={salvando}>
                {action === 'aporte' ? 'Adicionar' : 'Atualizar'}
              </Botao>
            </form>

            {contributionPreview !== null ? (
              <p className={styles.preview}>
                O saldo passa para <ValorMonetario valor={contributionPreview} tamanho="sm" /> e o total aportado para{' '}
                <ValorMonetario valor={investment.aportado + (typedValue ?? 0)} tamanho="sm" />.
              </p>
            ) : null}
            {balancePreview !== null && form.valor ? (
              <p className={styles.preview}>
                {balancePreview >= 0 ? 'Rendimento de ' : 'Desvalorização de '}
                <ValorMonetario valor={balancePreview} tamanho="sm" sinal="auto" tom={tomRendimento(balancePreview)} /> desde{' '}
                {formatarDataNumerica(investment.dataAtualizacao)}.
              </p>
            ) : null}
          </section>

          <section className={styles.block} aria-labelledby="investment-history-title">
            <h3 className={styles.sectionTitle} id="investment-history-title">
              Histórico
            </h3>
            <p className={styles.sectionHint}>Aportes e rendimentos em linhas separadas, do mais recente ao mais antigo.</p>
            <HistoricoMovimentacoes itens={items} quantidadeInicial={QUANTIDADE_INICIAL_MOVIMENTACOES} />
          </section>
        </div>
      )}
    </Modal>
  );
}
