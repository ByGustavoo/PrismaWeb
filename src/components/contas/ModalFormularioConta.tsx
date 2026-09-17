import { useEffect, useState } from 'react';
import { Botao, CampoTexto, Modal, CampoSelecao, Interruptor, CampoValor } from '@/components/ui';
import { rotuloSituacaoConta, situacoesConta, rotuloTipoConta, tiposConta } from '@/constants/contas';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { ContaDTO, Opcao, SalvarContaDTO, Situacao, TipoConta } from '@/types';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioConta.module.css';

interface ModalFormularioContaProps {
  aberto: boolean;
  conta: ContaDTO | null;
  salvando: boolean;
  aoEnviar: (payload: SalvarContaDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo: string;
  situacao: Situacao;
  incluirNoTotal: boolean;
}

const limites = { nome: limitesTexto.nomeConta, instituicao: limitesTexto.instituicao };

const opcoesTipo: Opcao[] = tiposConta.map((type) => ({ valor: type, rotulo: rotuloTipoConta[type] }));

const opcoesSituacao: Opcao[] = situacoesConta.map((status) => ({ valor: status, rotulo: rotuloSituacaoConta[status],
}));

function estadoInicial(account: ContaDTO | null): EstadoFormulario {
  return {
    nome: account?.nome ?? '',
    instituicao: account?.instituicao ?? '',
    tipo: account?.tipo ?? 'CORRENTE',
    saldo: account ? paraEntradaValor(account.saldo) : '',
    situacao: account?.situacao ?? 'ATIVO',
    incluirNoTotal: account?.incluirNoTotal ?? true,
  };
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  return {
    nome: erroTexto(form.nome, {
      sujeito: 'O nome da conta',
      ausente: 'Informe o nome da conta!',
      maximo: limitesTexto.nomeConta,
    }),
    instituicao: erroTexto(form.instituicao, {
      sujeito: 'O nome da instituição',
      ausente: 'Informe o banco ou a instituição da conta!',
      maximo: limitesTexto.instituicao,
    }),
    saldo: erroValor(form.saldo, {
      sujeito: 'O saldo atual',
      ausente: 'Informe o saldo atual da conta!',
      sinal: 'any',
    }),
  };
}

export function ModalFormularioConta({ aberto, conta, salvando, aoEnviar, aoFechar }: ModalFormularioContaProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(conta));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(conta));
    reiniciar();
  }, [aberto, conta, reiniciar]);

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      nome: form.nome,
      instituicao: form.instituicao,
      tipo: form.tipo,
      saldo: interpretarEntradaValor(form.saldo) ?? 0,
      situacao: form.situacao,
      incluirNoTotal: form.incluirNoTotal,
    });
  };

  const inactive = form.situacao === 'INATIVO';

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={conta ? 'Editar conta' : 'Nova conta'}
      descricao={
        conta
          ? 'Altere os dados desta conta. O novo nome aparece também nos lançamentos já registrados.'
          : 'Cadastre uma conta para acompanhar o saldo e usá-la nos lançamentos.'
      }
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {conta ? 'Salvar alterações' : 'Cadastrar conta'}
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
          rotulo="Nome da conta"
          placeholder="Conta corrente, Reserva de emergência..."
          value={form.nome}
          onChange={(event) => set('nome', event.target.value)}
          onBlur={() => tocar('nome')}
          limiteCaracteres={limitesTexto.nomeConta}
          erro={erros.nome}
          autoFocus
        />

        <CampoTexto
          required
          rotulo="Instituição"
          placeholder="Banco, corretora ou carteira"
          value={form.instituicao}
          onChange={(event) => set('instituicao', event.target.value)}
          onBlur={() => tocar('instituicao')}
          limiteCaracteres={limitesTexto.instituicao}
          erro={erros.instituicao}
        />

        <CampoSelecao
          required
          rotulo="Tipo"
          opcoes={opcoesTipo}
          value={form.tipo}
          onChange={(type) => set('tipo', type as TipoConta)}
        />

        <CampoValor
          permitirNegativo
          required
          rotulo="Saldo atual"
          valor={form.saldo}
          aoMudar={(value) => set('saldo', value)}
          onBlur={() => tocar('saldo')}
          erro={erros.saldo}
          dica="Aceita valor negativo, para conta no cheque especial."
        />

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(status) => set('situacao', status as Situacao)}
          dica={
            inactive
              ? 'Sai do saldo total e dos novos lançamentos; o histórico continua.'
              : 'Aparece no saldo e nos formulários de lançamento.'
          }
        />

        <Interruptor
          className={styles.full}
          rotulo="Somar ao saldo total"
          checked={form.incluirNoTotal && !inactive}
          disabled={inactive}
          onChange={(checked) => set('incluirNoTotal', checked)}
          dica={
            inactive
              ? 'Contas inativas ficam sempre fora do saldo total.'
              : 'Desligue para contas que não são dinheiro disponível, como a de uma corretora.'
          }
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
