import { useEffect, useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto, CampoValor } from '@/components/ui';
import { rotuloClasseAtivo, classesAtivo, dicaClasseAtivo } from '@/constants/investimentos';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { AtualizarInvestimentoDTO, ClasseAtivo, InvestimentoDTO, Opcao, SalvarInvestimentoDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarPercentualComSinal, interpretarEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioInvestimento.module.css';

export type ResultadoFormularioInvestimento =
  | { modo: 'create'; dados: SalvarInvestimentoDTO }
  | { modo: 'update'; dados: AtualizarInvestimentoDTO };

interface ModalFormularioInvestimentoProps {
  aberto: boolean;
  investimento: InvestimentoDTO | null;
  salvando: boolean;
  aoEnviar: (resultado: ResultadoFormularioInvestimento) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  nome: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  aportado: string;
  valorAtual: string;
  dataInicio: string;
  observacoes: string;
}

const limites = {
  nome: limitesTexto.nomeInvestimento,
  instituicao: limitesTexto.instituicao,
  observacoes: limitesTexto.observacoes,
};

const opcoesClasse: Opcao[] = classesAtivo.map((assetClass) => ({ valor: assetClass, rotulo: rotuloClasseAtivo[assetClass] }));

function estadoInicial(investment: InvestimentoDTO | null): EstadoFormulario {
  return {
    nome: investment?.nome ?? '',
    classeAtivo: investment?.classeAtivo ?? 'RENDA_FIXA',
    instituicao: investment?.instituicao ?? '',
    aportado: '',
    valorAtual: '',
    dataInicio: hojeISO(),
    observacoes: investment?.observacoes ?? '',
  };
}

function validar(form: EstadoFormulario, editing: boolean): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    nome: erroTexto(form.nome, {
      sujeito: 'O nome do investimento',
      ausente: 'Informe o nome do investimento!',
      maximo: limitesTexto.nomeInvestimento,
    }),
    instituicao: erroTexto(form.instituicao, {
      sujeito: 'O nome da instituição',
      ausente: 'Informe onde o dinheiro está aplicado!',
      maximo: limitesTexto.instituicao,
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (editing) return errors;

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

  if (!form.dataInicio) {
    errors.dataInicio = 'Informe a data da aplicação inicial!';
  } else if (form.dataInicio > hojeISO()) {
    errors.dataInicio = 'A aplicação inicial não pode estar no futuro!';
  }

  return errors;
}

export function ModalFormularioInvestimento({ aberto, investimento, salvando, aoEnviar, aoFechar }: ModalFormularioInvestimentoProps) {
  const editing = investimento !== null;
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(investimento));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => validar(values, editing),
    { limites },
  );

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(investimento));
    reiniciar();
  }, [aberto, investimento, reiniciar]);

  const preview = useMemo(() => {
    if (editing) return null;
    const invested = interpretarEntradaValor(form.aportado);
    const currentValue = interpretarEntradaValor(form.valorAtual);
    if (invested === undefined || currentValue === undefined || invested <= 0) return null;

    return { profit: currentValue - invested, profitability: ((currentValue - invested) / invested) * 100 };
  }, [editing, form.aportado, form.valorAtual]);

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    const base = {
      nome: form.nome,
      classeAtivo: form.classeAtivo,
      instituicao: form.instituicao,
      observacoes: form.observacoes,
    };

    if (editing) {
      aoEnviar({ modo: 'update', dados: base });
      return;
    }

    aoEnviar({
      modo: 'create',
      dados: {
        ...base,
        aportado: interpretarEntradaValor(form.aportado) ?? 0,
        valorAtual: interpretarEntradaValor(form.valorAtual) ?? 0,
        dataInicio: form.dataInicio,
      },
    });
  };

  const classHint = dicaClasseAtivo[form.classeAtivo];

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editing ? 'Editar investimento' : 'Novo investimento'}
      descricao={
        editing
          ? 'Aportes e saldo têm registro próprio, no detalhe do investimento, para o histórico não se perder.'
          : 'Informe quanto você aplicou no começo e quanto o investimento vale hoje.'
      }
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {editing ? 'Salvar alterações' : 'Cadastrar investimento'}
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
          rotulo="Nome"
          placeholder="CDB Liquidez Diária, Caixinha da viagem, PGBL..."
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
          opcoes={opcoesClasse}
          value={form.classeAtivo}
          onChange={(value) => set('classeAtivo', value as ClasseAtivo)}
          {...(classHint ? { dica: classHint } : {})}
        />

        <CampoTexto
          required
          rotulo="Instituição"
          placeholder="Banco, corretora ou seguradora"
          value={form.instituicao}
          onChange={(event) => set('instituicao', event.target.value)}
          onBlur={() => tocar('instituicao')}
          limiteCaracteres={limitesTexto.instituicao}
          erro={erros.instituicao}
        />

        {editing ? null : (
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
          </>
        )}

        <AreaTexto
          className={styles.full}
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
            <span>
              {preview.profit >= 0 ? 'De rendimento' : 'De perda'} sobre a aplicação inicial, registrado hoje como
              atualização de saldo.
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
