import { useEffect, useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import { rotuloClasseAtivo, classesAtivo } from '@/constants/investimentos';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { ClasseAtivo, InvestimentoDTO, Opcao, SalvarInvestimentoDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { formatarPercentualComSinal, interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioInvestimento.module.css';

interface ModalFormularioInvestimentoProps {
  aberto: boolean;
  investimento: InvestimentoDTO | null;
  salvando: boolean;
  aoEnviar: (payload: SalvarInvestimentoDTO) => void;
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

const opcoesClasse: Opcao[] = classesAtivo.map((assetClass) => ({ valor: assetClass, rotulo: rotuloClasseAtivo[assetClass],
}));

function estadoInicial(investment: InvestimentoDTO | null): EstadoFormulario {
  return {
    nome: investment?.nome ?? '',
    classeAtivo: investment?.classeAtivo ?? 'RENDA_FIXA',
    instituicao: investment?.instituicao ?? '',
    aportado: investment ? paraEntradaValor(investment.aportado) : '',
    valorAtual: investment ? paraEntradaValor(investment.valorAtual) : '',
    dataInicio: investment?.dataInicio ?? hojeISO(),
    observacoes: investment?.observacoes ?? '',
  };
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
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
    aportado: erroValor(form.aportado, {
      sujeito: 'O total aportado',
      ausente: 'Informe quanto já foi aportado!',
      sinal: 'positive',
    }),
    valorAtual: erroValor(form.valorAtual, {
      sujeito: 'O valor atual',
      ausente: 'Informe quanto a posição vale hoje!',
      sinal: 'non-negative',
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.dataInicio) {
    errors.dataInicio = 'Informe a data do primeiro aporte!';
  } else if (form.dataInicio > hojeISO()) {
    errors.dataInicio = 'O primeiro aporte não pode estar no futuro!';
  }

  return errors;
}

export function ModalFormularioInvestimento({ aberto, investimento, salvando, aoEnviar, aoFechar }: ModalFormularioInvestimentoProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(investimento));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(investimento));
    reiniciar();
  }, [aberto, investimento, reiniciar]);

  const preview = useMemo(() => {
    const invested = interpretarEntradaValor(form.aportado);
    const currentValue = interpretarEntradaValor(form.valorAtual);
    if (invested === undefined || currentValue === undefined || invested <= 0) return null;

    return { profit: currentValue - invested, profitability: ((currentValue - invested) / invested) * 100 };
  }, [form.aportado, form.valorAtual]);

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      nome: form.nome,
      classeAtivo: form.classeAtivo,
      instituicao: form.instituicao,
      aportado: interpretarEntradaValor(form.aportado) ?? 0,
      valorAtual: interpretarEntradaValor(form.valorAtual) ?? 0,
      dataInicio: form.dataInicio,
      observacoes: form.observacoes,
    });
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={investimento ? 'Editar investimento' : 'Novo investimento'}
      descricao="O valor atual é o que a posição vale hoje; o aportado é a soma do que você colocou nela."
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {investimento ? 'Salvar alterações' : 'Cadastrar investimento'}
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
          placeholder="CDB Liquidez Diária, Tesouro IPCA+ 2029..."
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

        <CampoTexto
          required
          rotulo="Total aportado"
          prefixo="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.aportado}
          onChange={(event) => set('aportado', event.target.value)}
          onBlur={() => tocar('aportado')}
          erro={erros.aportado}
          dica="Soma de tudo que já entrou nesta posição."
        />

        <CampoTexto
          required
          rotulo="Valor atual"
          prefixo="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.valorAtual}
          onChange={(event) => set('valorAtual', event.target.value)}
          onBlur={() => tocar('valorAtual')}
          erro={erros.valorAtual}
          dica="Quanto a posição vale hoje, com rendimento."
        />

        <SeletorData
          required
          rotulo="Primeiro aporte"
          max={hojeISO()}
          value={form.dataInicio}
          onChange={(startDate) => set('dataInicio', startDate)}
          erro={erros.dataInicio}
        />

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
              {preview.profit >= 0 ? 'De rendimento acumulado' : 'De prejuízo acumulado'} sobre o valor aportado.
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
