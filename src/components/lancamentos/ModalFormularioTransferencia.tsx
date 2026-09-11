import { useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import { rotuloSituacaoLancamento, situacoesLancamento } from '@/constants/lancamentos';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { LancamentoDTO, Opcao, OrigemDTO, SalvarLancamentoDTO, SituacaoLancamento } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { hojeISO } from '@/utils/data';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioLancamento.module.css';

interface ModalFormularioTransferenciaProps {
  aberto: boolean;
  lancamento: LancamentoDTO | null;
  origens: OrigemDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarLancamentoDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  idOrigem: string;
  idContaDestino: string;
  valor: string;
  data: string;
  descricao: string;
  situacao: SituacaoLancamento;
  observacoes: string;
}

const limites = { descricao: limitesTexto.descricao, observacoes: limitesTexto.observacoes };

function estadoInicial(transaction: LancamentoDTO | null): EstadoFormulario {
  return {
    idOrigem: transaction?.idOrigem ?? '',
    idContaDestino: transaction?.idContaDestino ?? '',
    valor: transaction ? paraEntradaValor(transaction.valor) : '',
    data: transaction?.data ?? hojeISO(),
    descricao: transaction?.descricao ?? '',
    situacao: transaction?.situacao ?? 'PAGO',
    observacoes: transaction?.observacoes ?? '',
  };
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    valor: erroValor(form.valor, {
      sujeito: 'O valor da transferência',
      ausente: 'Informe o valor da transferência!',
      sinal: 'positive',
    }),
    descricao: erroTexto(form.descricao, {
      sujeito: 'A descrição da transferência',
      ausente: 'Informe a descrição da transferência!',
      maximo: limitesTexto.descricao,
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.idOrigem) {
    errors.idOrigem = 'Escolha a conta de origem!';
  }
  if (!form.idContaDestino) {
    errors.idContaDestino = 'Escolha a conta de destino!';
  } else if (form.idContaDestino === form.idOrigem) {
    errors.idContaDestino = 'A conta de destino precisa ser diferente da origem!';
  }
  if (!form.data) {
    errors.data = 'Informe a data da transferência!';
  }

  return errors;
}

const opcoesSituacao: Opcao[] = situacoesLancamento.map((status) => ({ valor: status, rotulo: rotuloSituacaoLancamento[status],
}));

export function ModalFormularioTransferencia({
  aberto,
  lancamento,
  origens,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioTransferenciaProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(lancamento));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(lancamento));
    reiniciar();
  }, [aberto, lancamento, reiniciar]);

  const accountOptions = useMemo<Opcao[]>(
    () =>
      origens
        .filter((item) => item.grupo === 'CONTA')
        .map((item) => ({ valor: item.id, rotulo: item.nome })),
    [origens],
  );

  const destinationOptions = useMemo<Opcao[]>(
    () => accountOptions.filter((option) => option.valor !== form.idOrigem),
    [accountOptions, form.idOrigem],
  );

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleOriginChange = (accountId: string) => {
    set('idOrigem', accountId);
    if (form.idContaDestino === accountId) set('idContaDestino', '');
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      descricao: form.descricao,
      valor: interpretarEntradaValor(form.valor) ?? 0,
      tipo: 'TRANSFERENCIA',
      situacao: form.situacao,
      forma: 'CONTA',
      data: form.data,
      idOrigem: form.idOrigem,
      idContaDestino: form.idContaDestino,
      observacoes: form.observacoes,
    });
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={lancamento ? 'Editar transferência' : 'Nova transferência'}
      descricao="Movimente dinheiro entre as suas contas. O valor não entra no resultado do período."
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {lancamento ? 'Salvar alterações' : 'Cadastrar transferência'}
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
        <div className={juntarClasses(styles.full, styles.route)}>
          <CampoSelecao
            required
            rotulo="Conta de origem"
            placeholder="De onde sai o dinheiro"
            opcoes={accountOptions}
            value={form.idOrigem}
            onChange={handleOriginChange}
            erro={erros.idOrigem}
          />
          <span className={styles.routeArrow} aria-hidden="true">
            <ArrowDown size={16} strokeWidth={2} />
          </span>
          <CampoSelecao
            required
            rotulo="Conta de destino"
            placeholder="Para onde vai o dinheiro"
            opcoes={destinationOptions}
            value={form.idContaDestino}
            onChange={(toAccountId) => set('idContaDestino', toAccountId)}
            erro={erros.idContaDestino}
          />
        </div>

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

        <CampoTexto
          required
          rotulo="Descrição"
          placeholder="Aporte na reserva, sobra da carteira..."
          value={form.descricao}
          onChange={(event) => set('descricao', event.target.value)}
          onBlur={() => tocar('descricao')}
          limiteCaracteres={limitesTexto.descricao}
          erro={erros.descricao}
        />

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(status) => set('situacao', status as SituacaoLancamento)}
          dica={form.situacao === 'PAGO' ? 'A transferência já foi feita.' : 'Ainda não saiu da conta de origem.'}
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar desta transferência."
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
