import { useEffect, useMemo, useState } from 'react';
import { Botao, CampoTexto, Modal, CampoSelecao, CampoValor } from '@/components/ui';
import { rotuloSituacaoCartao, situacoesCartao, rotuloTipoCartao, tiposCartao } from '@/constants/cartoes';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { CartaoDTO, ContaDTO, Opcao, SalvarCartaoDTO, Situacao, TipoCartao } from '@/types';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { apenasDigitos } from '@/utils/mascaraValor';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioCartao.module.css';

interface ModalFormularioCartaoProps {
  aberto: boolean;
  cartao: CartaoDTO | null;
  contas: ContaDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarCartaoDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  nome: string;
  instituicao: string;
  tipo: TipoCartao;
  situacao: Situacao;
  bandeira: string;
  ultimosDigitos: string;
  limite: string;
  diaFechamento: string;
  diaVencimento: string;
  idConta: string;
  saldo: string;
}

const limites = {
  nome: limitesTexto.nomeCartao,
  instituicao: limitesTexto.instituicao,
  bandeira: limitesTexto.bandeiraCartao,
};

const opcoesTipo: Opcao[] = tiposCartao.map((type) => ({ valor: type, rotulo: rotuloTipoCartao[type] }));

const opcoesSituacao: Opcao[] = situacoesCartao.map((status) => ({ valor: status, rotulo: rotuloSituacaoCartao[status],
}));

function estadoInicial(card: CartaoDTO | null): EstadoFormulario {
  return {
    nome: card?.nome ?? '',
    instituicao: card?.instituicao ?? '',
    tipo: card?.tipo ?? 'CREDITO',
    situacao: card?.situacao ?? 'ATIVO',
    bandeira: card?.bandeira ?? '',
    ultimosDigitos: card?.ultimosDigitos ?? '',
    limite: typeof card?.limiteCredito === 'number' ? paraEntradaValor(card.limiteCredito) : '',
    diaFechamento: card?.diaFechamento ? String(card.diaFechamento) : '',
    diaVencimento: card?.diaVencimento ? String(card.diaVencimento) : '',
    idConta: card?.idConta ?? '',
    saldo: typeof card?.saldo === 'number' ? paraEntradaValor(card.saldo) : '',
  };
}

function converterDia(raw: string): number | undefined {
  const parsed = Number(raw.trim());
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 31 ? parsed : undefined;
}

function erroDia(raw: string, field: string): string | undefined {
  if (!raw.trim()) return `Informe o ${field}!`;
  return converterDia(raw) === undefined ? `O ${field} precisa estar entre 1 e 31!` : undefined;
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    nome: erroTexto(form.nome, {
      sujeito: 'O nome do cartão',
      ausente: 'Informe o nome do cartão!',
      maximo: limitesTexto.nomeCartao,
    }),
    instituicao: erroTexto(form.instituicao, {
      sujeito: 'O nome da instituição',
      ausente: 'Informe o banco ou a operadora do cartão!',
      maximo: limitesTexto.instituicao,
    }),
    bandeira: erroTexto(form.bandeira, { sujeito: 'A bandeira', maximo: limitesTexto.bandeiraCartao }),
  };

  if (form.ultimosDigitos.trim() && !/^\d{4}$/.test(form.ultimosDigitos.trim())) {
    errors.ultimosDigitos = 'Os últimos dígitos precisam ser 4 números!';
  }

  if (form.tipo === 'CREDITO') {
    errors.limite = erroValor(form.limite, {
      sujeito: 'O limite do cartão',
      ausente: 'Informe o limite do cartão!',
      sinal: 'positive',
    });
    errors.diaFechamento = erroDia(form.diaFechamento, 'dia de fechamento');
    errors.diaVencimento = erroDia(form.diaVencimento, 'dia de vencimento');
  }

  if (form.tipo === 'DEBITO' && !form.idConta) {
    errors.idConta = 'Escolha a conta que o cartão acessa!';
  }

  if (form.tipo === 'VALE_ALIMENTACAO' || form.tipo === 'VALE_REFEICAO') {
    errors.saldo = erroValor(form.saldo, {
      sujeito: 'O saldo do cartão',
      ausente: 'Informe o saldo do cartão!',
      sinal: 'non-negative',
    });
  }

  return errors;
}

export function ModalFormularioCartao({ aberto, cartao, contas, salvando, aoEnviar, aoFechar }: ModalFormularioCartaoProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(cartao));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(cartao));
    reiniciar();
  }, [aberto, cartao, reiniciar]);

  const accountOptions = useMemo<Opcao[]>(
    () =>
      contas
        .filter((account) => account.situacao === 'ATIVO' || account.id === cartao?.idConta)
        .map((account) => ({ valor: account.id, rotulo: `${account.nome} · ${account.instituicao}` })),
    [contas, cartao],
  );

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      nome: form.nome,
      instituicao: form.instituicao,
      tipo: form.tipo,
      situacao: form.situacao,
      bandeira: form.bandeira.trim() || undefined,
      ultimosDigitos: form.ultimosDigitos.trim() || undefined,
      ...(form.tipo === 'CREDITO'
        ? {
            limiteCredito: interpretarEntradaValor(form.limite),
            diaFechamento: converterDia(form.diaFechamento),
            diaVencimento: converterDia(form.diaVencimento),
          }
        : {}),
      ...(form.tipo === 'DEBITO' ? { idConta: form.idConta } : {}),
      ...(form.tipo === 'VALE_ALIMENTACAO' || form.tipo === 'VALE_REFEICAO'
        ? { saldo: interpretarEntradaValor(form.saldo) }
        : {}),
    });
  };

  const isCredit = form.tipo === 'CREDITO';
  const isDebit = form.tipo === 'DEBITO';
  const isVoucher = form.tipo === 'VALE_ALIMENTACAO' || form.tipo === 'VALE_REFEICAO';

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={cartao ? 'Editar cartão' : 'Novo cartão'}
      descricao="Os campos mudam conforme o tipo: só o crédito tem limite e datas de fatura."
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {cartao ? 'Salvar alterações' : 'Cadastrar cartão'}
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
          rotulo="Nome do cartão"
          placeholder="Como você chama este cartão"
          value={form.nome}
          onChange={(event) => set('nome', event.target.value)}
          onBlur={() => tocar('nome')}
          limiteCaracteres={limitesTexto.nomeCartao}
          erro={erros.nome}
          autoFocus
        />

        <CampoSelecao
          required
          rotulo="Tipo"
          opcoes={opcoesTipo}
          value={form.tipo}
          onChange={(type) => set('tipo', type as TipoCartao)}
        />

        <CampoTexto
          required
          rotulo="Instituição"
          placeholder="Banco ou operadora"
          value={form.instituicao}
          onChange={(event) => set('instituicao', event.target.value)}
          onBlur={() => tocar('instituicao')}
          limiteCaracteres={limitesTexto.instituicao}
          erro={erros.instituicao}
        />

        {isCredit ? (
          <>
            <CampoValor
              required
              rotulo="Limite"
              valor={form.limite}
              aoMudar={(value) => set('limite', value)}
              onBlur={() => tocar('limite')}
              erro={erros.limite}
            />

            <div className={styles.days}>
              <CampoTexto
                required
                rotulo="Dia de fechamento"
                inputMode="numeric"
                maxLength={2}
                placeholder="28"
                value={form.diaFechamento}
                onChange={(event) => set('diaFechamento', apenasDigitos(event.target.value))}
                onBlur={() => tocar('diaFechamento')}
                erro={erros.diaFechamento}
              />
              <CampoTexto
                required
                rotulo="Dia de vencimento"
                inputMode="numeric"
                maxLength={2}
                placeholder="8"
                value={form.diaVencimento}
                onChange={(event) => set('diaVencimento', apenasDigitos(event.target.value))}
                onBlur={() => tocar('diaVencimento')}
                erro={erros.diaVencimento}
              />
            </div>
          </>
        ) : null}

        {isDebit ? (
          <CampoSelecao
            required
            rotulo="Conta vinculada"
            placeholder="Selecione a conta"
            opcoes={accountOptions}
            value={form.idConta}
            onChange={(accountId) => set('idConta', accountId)}
            erro={erros.idConta}
            dica="As compras saem direto do saldo dessa conta."
          />
        ) : null}

        {isVoucher ? (
          <CampoValor
            required
            rotulo="Saldo disponível"
            valor={form.saldo}
            aoMudar={(value) => set('saldo', value)}
            onBlur={() => tocar('saldo')}
            erro={erros.saldo}
          />
        ) : null}

        <CampoTexto
          rotulo="Bandeira"
          placeholder="Visa, Mastercard, Elo..."
          value={form.bandeira}
          onChange={(event) => set('bandeira', event.target.value)}
          onBlur={() => tocar('bandeira')}
          limiteCaracteres={limitesTexto.bandeiraCartao}
          erro={erros.bandeira}
        />

        <CampoTexto
          rotulo="Últimos 4 dígitos"
          inputMode="numeric"
          maxLength={4}
          placeholder="0000"
          value={form.ultimosDigitos}
          onChange={(event) => set('ultimosDigitos', apenasDigitos(event.target.value))}
          onBlur={() => tocar('ultimosDigitos')}
          erro={erros.ultimosDigitos}
          dica="Ajuda a distinguir dois cartões do mesmo banco."
        />

        <CampoSelecao
          rotulo="Situação"
          opcoes={opcoesSituacao}
          value={form.situacao}
          onChange={(status) => set('situacao', status as Situacao)}
          dica={
            form.situacao === 'INATIVO'
              ? 'Sai dos novos lançamentos; o histórico e as faturas continuam.'
              : 'Disponível para novos lançamentos.'
          }
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
