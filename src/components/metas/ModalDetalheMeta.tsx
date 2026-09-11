import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ExternalLink, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao, SeletorData, CampoTexto, Modal } from '@/components/ui';
import { textoLeituraMeta, rotuloSituacaoMeta, tomSituacaoMeta } from '@/constants/metas';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { AcompanhamentoMetaDTO, MetaDTO, SalvarMetaPrecoDTO, SituacaoMeta } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { hojeISO } from '@/utils/data';
import { formatarDataNumerica, formatarPercentual, interpretarEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import { VariacaoPreco } from './VariacaoPreco';
import { GraficoHistoricoPreco } from './GraficoHistoricoPreco';
import { tomLeitura } from './aparencia';
import styles from './ModalDetalheMeta.module.css';

interface ModalDetalheMetaProps {
  acompanhamento: AcompanhamentoMetaDTO | null;
  salvando: boolean;
  focarFormularioPreco: boolean;
  aoFechar: () => void;
  aoEditar: (tracking: AcompanhamentoMetaDTO) => void;
  aoExcluir: (tracking: AcompanhamentoMetaDTO) => void;
  aoMudarSituacao: (tracking: AcompanhamentoMetaDTO, status: SituacaoMeta) => void;
  aoAdicionarPreco: (tracking: AcompanhamentoMetaDTO, payload: SalvarMetaPrecoDTO) => Promise<boolean>;
}

interface FormularioPreco {
  preco: string;
  data: string;
  observacao: string;
}

function formularioPrecoVazio(): FormularioPreco {
  return { preco: '', data: hojeISO(), observacao: '' };
}

function validarPreco(form: FormularioPreco, goal: MetaDTO): ErrosCampos<FormularioPreco> {
  const errors: ErrosCampos<FormularioPreco> = {
    preco: erroValor(form.preco, {
      sujeito: 'O preço',
      ausente: 'Informe o preço que você consultou!',
      sinal: 'positive',
    }),
    observacao: erroTexto(form.observacao, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.data) {
    errors.data = 'Informe a data da consulta!';
  } else if (form.data > hojeISO()) {
    errors.data = 'A data da consulta não pode estar no futuro!';
  } else if (form.data < goal.dataCriacao) {
    errors.data = `A data da consulta não pode ser anterior ao primeiro preço, de ${formatarDataNumerica(goal.dataCriacao)}!`;
  }

  const price = interpretarEntradaValor(form.preco);
  if (!errors.preco && !errors.data && goal.historico.some((entry) => entry.data === form.data && entry.preco === price)) {
    errors.preco = 'Esse preço já está registrado nessa data!';
  }

  return errors;
}

export function ModalDetalheMeta({
  acompanhamento,
  salvando,
  focarFormularioPreco,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoMudarSituacao,
  aoAdicionarPreco,
}: ModalDetalheMetaProps) {
  const [form, setForm] = useState<FormularioPreco>(formularioPrecoVazio);
  const priceRef = useRef<HTMLInputElement>(null);
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => (acompanhamento ? validarPreco(values, acompanhamento.meta) : {}),
    { limites: { observacao: limitesTexto.observacoes } },
  );

  const goalId = acompanhamento?.meta.id ?? null;

  useEffect(() => {
    if (!goalId) return;
    setForm(formularioPrecoVazio());
    reiniciar();
  }, [goalId, reiniciar]);

  useEffect(() => {
    if (!goalId || !focarFormularioPreco) return;
    priceRef.current?.focus();
  }, [goalId, focarFormularioPreco]);

  const entries = useMemo(() => {
    if (!acompanhamento) return [];

    return acompanhamento.meta.historico
      .map((entry, index) => {
        const previous = index > 0 ? acompanhamento.meta.historico[index - 1] : undefined;
        const change = previous ? Math.round((entry.preco - previous.preco) * 100) / 100 : 0;
        const percentage = previous && previous.preco > 0 ? (change / previous.preco) * 100 : 0;

        return { entry, change, percentage, first: index === 0 };
      })
      .reverse();
  }, [acompanhamento]);

  if (!acompanhamento) return null;

  const { meta: goal, analise: analysis } = acompanhamento;
  const archived = goal.situacao !== 'ACOMPANHANDO';

  const handleRegister = async () => {
    if (!enviar()) return;

    const ok = await aoAdicionarPreco(acompanhamento, {
      preco: interpretarEntradaValor(form.preco) ?? 0,
      data: form.data,
      ...(form.observacao.trim() ? { observacao: form.observacao.trim() } : {}),
    });

    if (ok) {
      setForm(formularioPrecoVazio());
      reiniciar();
    }
  };

  return (
    <Modal
      aberto
      aoFechar={aoFechar}
      titulo={goal.nome}
      descricao={`${analysis.quantidadeRegistros} ${analysis.quantidadeRegistros === 1 ? 'registro' : 'registros'} · atualizado em ${formatarDataNumerica(analysis.ultimaAtualizacao)}`}
      tamanho="lg"
      rodape={
        <>
          <Botao
            className={styles.footerStart}
            variante="ghost"
            icone={Trash2}
            disabled={salvando}
            onClick={() => aoExcluir(acompanhamento)}
          >
            Excluir
          </Botao>
          <Botao variante="secondary" icone={Pencil} disabled={salvando} onClick={() => aoEditar(acompanhamento)}>
            Editar
          </Botao>
          <Botao onClick={aoFechar}>Fechar</Botao>
        </>
      }
    >
      <header className={styles.head}>
        <div className={styles.headMain}>
          <span className={styles.headLabel}>Preço atual</span>
          <ValorMonetario valor={analysis.precoAtual} tamanho="lg" />
          {analysis.quantidadeRegistros > 1 ? (
            <VariacaoPreco variacao={analysis.variacao} percentual={analysis.variacaoPercentual} tendencia={analysis.tendencia} />
          ) : (
            <span className={styles.headHint}>Primeiro registro</span>
          )}
        </div>

        <Selo tom={tomSituacaoMeta[goal.situacao]} ponto={goal.situacao === 'ACOMPANHANDO'}>
          {rotuloSituacaoMeta[goal.situacao]}
        </Selo>
      </header>

      <p className={juntarClasses(styles.insight, styles[tomLeitura[analysis.leitura]])}>
        <span className={styles.insightDot} aria-hidden="true" />
        {textoLeituraMeta[analysis.leitura]}
      </p>

      <dl className={styles.analysis}>
        <div>
          <dt>Preço inicial</dt>
          <dd>
            <ValorMonetario valor={analysis.precoInicial} tamanho="sm" />
          </dd>
        </div>
        <div>
          <dt>Menor preço</dt>
          <dd>
            <ValorMonetario valor={analysis.menorPreco} tamanho="sm" tom="positive" />
          </dd>
        </div>
        <div>
          <dt>Maior preço</dt>
          <dd>
            <ValorMonetario valor={analysis.maiorPreco} tamanho="sm" tom="negative" />
          </dd>
        </div>
        <div>
          <dt>Preço médio</dt>
          <dd>
            <ValorMonetario valor={analysis.precoMedio} tamanho="sm" tom="muted" />
          </dd>
        </div>
        <div>
          <dt>Variação total</dt>
          <dd className={styles.pair}>
            <ValorMonetario valor={analysis.variacao} tamanho="sm" sinal="auto" />
            <span className="tabular">{formatarPercentual(Math.abs(analysis.variacaoPercentual))}</span>
          </dd>
        </div>
        <div>
          <dt>Abaixo do maior preço</dt>
          <dd>
            <ValorMonetario valor={analysis.economia} tamanho="sm" tom={analysis.economia > 0 ? 'positive' : 'muted'} />
          </dd>
        </div>
      </dl>

      {analysis.quantidadeRegistros > 1 ? (
        <GraficoHistoricoPreco historico={goal.historico} precoMedio={analysis.precoMedio} tendencia={analysis.tendencia} />
      ) : (
        <p className={styles.chartHint}>
          A curva de evolução aparece a partir do segundo preço registrado. Consulte o produto de novo em alguns
          dias e anote o valor aqui embaixo.
        </p>
      )}

      <section className={styles.register} aria-labelledby="goal-register-title">
        <h3 className={styles.sectionTitle} id="goal-register-title">
          Registrar preço
        </h3>
        <p className={styles.sectionHint}>
          Consultou de novo? Anote o valor. O preço anterior continua no histórico — é o que permite comparar.
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
          <CampoTexto
            ref={priceRef}
            className={styles.price}
            required
            rotulo="Preço"
            prefixo="R$"
            inputMode="decimal"
            placeholder="0,00"
            value={form.preco}
            onChange={(event) => setForm((current) => ({ ...current, preco: event.target.value }))}
            onBlur={() => tocar('preco')}
            erro={erros.preco}
          />

          <SeletorData
            className={styles.date}
            required
            rotulo="Data"
            min={goal.dataCriacao}
            max={hojeISO()}
            value={form.data}
            onChange={(data) => setForm((current) => ({ ...current, data }))}
            erro={erros.data}
          />

          <CampoTexto
            className={styles.note}
            rotulo="Observação"
            placeholder="Cupom, frete grátis, loja..."
            value={form.observacao}
            onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))}
            onBlur={() => tocar('observacao')}
            limiteCaracteres={limitesTexto.observacoes}
            erro={erros.observacao}
          />

          <Botao type="submit" className={styles.registerButton} carregando={salvando}>
            Registrar
          </Botao>
        </form>
      </section>

      <section className={styles.historySection} aria-labelledby="goal-history-title">
        <h3 className={styles.sectionTitle} id="goal-history-title">
          Histórico de preços
        </h3>

        <ul className={styles.history}>
          {entries.map(({ entry, change, percentage, first }, index) => (
            <li key={entry.id} className={juntarClasses(styles.entry, 'list-item-in')} style={{ '--i': index } as CSSProperties}>
              <span className={`${styles.entryDate} tabular`}>{formatarDataNumerica(entry.data)}</span>

              <span className={styles.entryText}>
                <ValorMonetario valor={entry.preco} tamanho="sm" />
                {entry.observacao ? <span className={styles.entryNote}>{entry.observacao}</span> : null}
              </span>

              {first ? (
                <span className={styles.entryFirst}>Primeiro registro</span>
              ) : (
                <VariacaoPreco
                  tamanho="sm"
                  variacao={change}
                  percentual={percentage}
                  tendencia={change > 0 ? 'ALTA' : change < 0 ? 'BAIXA' : 'ESTAVEL'}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.quickActions}>
        {goal.url ? (
          <a className={styles.link} href={goal.url} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            Abrir a página do produto
          </a>
        ) : null}

        <span className={styles.statusActions}>
          {archived ? (
            <Botao variante="secondary" tamanho="sm" icone={RotateCcw} disabled={salvando} onClick={() => aoMudarSituacao(acompanhamento, 'ACOMPANHANDO')}>
              Voltar a acompanhar
            </Botao>
          ) : (
            <>
              <Botao variante="secondary" tamanho="sm" icone={Check} disabled={salvando} onClick={() => aoMudarSituacao(acompanhamento, 'COMPRADA')}>
                Marcar como comprado
              </Botao>
              <Botao variante="ghost" tamanho="sm" icone={X} disabled={salvando} onClick={() => aoMudarSituacao(acompanhamento, 'CANCELADA')}>
                Cancelar meta
              </Botao>
            </>
          )}
        </span>
      </div>

      {goal.observacoes ? <p className={styles.notes}>{goal.observacoes}</p> : null}
    </Modal>
  );
}
