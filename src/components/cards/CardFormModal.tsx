import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { cardStatusLabel, cardStatuses, cardTypeLabel, cardTypes } from '@/constants/cards';
import type { Account, Card, CardPayload, CardStatus, CardType, Option } from '@/types';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './CardForm.module.css';

interface CardFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  card: Card | null;
  /** Contas oferecidas ao vincular um cartao de debito. */
  accounts: Account[];
  saving: boolean;
  onSubmit: (payload: CardPayload) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  brand: string;
  lastDigits: string;
  limit: string;
  closingDay: string;
  dueDay: string;
  accountId: string;
  balance: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const typeOptions: Option[] = cardTypes.map((type) => ({ value: type, label: cardTypeLabel[type] }));

const statusOptions: Option[] = cardStatuses.map((status) => ({
  value: status,
  label: cardStatusLabel[status],
}));

function initialState(card: Card | null): FormState {
  return {
    name: card?.name ?? '',
    institution: card?.institution ?? '',
    type: card?.type ?? 'CREDITO',
    status: card?.status ?? 'ATIVO',
    brand: card?.brand ?? '',
    lastDigits: card?.lastDigits ?? '',
    limit: typeof card?.limit === 'number' ? toAmountInput(card.limit) : '',
    closingDay: card?.closingDay ? String(card.closingDay) : '',
    dueDay: card?.dueDay ? String(card.dueDay) : '',
    accountId: card?.accountId ?? '',
    balance: typeof card?.balance === 'number' ? toAmountInput(card.balance) : '',
  };
}

/** Dia do mes valido, ou undefined quando o campo nao serve. */
function parseDay(raw: string): number | undefined {
  const parsed = Number(raw.trim());
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 31 ? parsed : undefined;
}

/*
 * Dois campos de dia lado a lado repetindo a mesma frase nao dizem qual deles
 * ficou em branco; a faixa valida so ajuda quando ha um numero para corrigir.
 */
function dayMessage(raw: string, field: string): string {
  return raw.trim() ? 'Informe um dia entre 1 e 31!' : `Informe o ${field}!`;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres!';
  }
  if (form.institution.trim().length < 2) {
    errors.institution = 'Informe o banco ou a operadora do cartão!';
  }
  if (form.lastDigits.trim() && !/^\d{4}$/.test(form.lastDigits.trim())) {
    errors.lastDigits = 'Informe exatamente 4 números!';
  }

  if (form.type === 'CREDITO') {
    const limit = parseAmountInput(form.limit);
    if (limit === undefined) {
      errors.limit = 'Informe o limite do cartão!';
    } else if (limit <= 0) {
      errors.limit = 'O limite precisa ser maior que zero!';
    }
    if (parseDay(form.closingDay) === undefined) {
      errors.closingDay = dayMessage(form.closingDay, 'dia de fechamento');
    }
    if (parseDay(form.dueDay) === undefined) {
      errors.dueDay = dayMessage(form.dueDay, 'dia de vencimento');
    }
  }

  if (form.type === 'DEBITO' && !form.accountId) {
    errors.accountId = 'Escolha a conta que o cartão acessa!';
  }

  if (form.type === 'VALE_ALIMENTACAO' || form.type === 'VALE_REFEICAO') {
    const balance = parseAmountInput(form.balance);
    if (balance === undefined) {
      errors.balance = 'Informe o saldo do cartão!';
    } else if (balance < 0) {
      errors.balance = 'O saldo não pode ser negativo!';
    }
  }

  return errors;
}

export function CardFormModal({ open, card, accounts, saving, onSubmit, onClose }: CardFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(card));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(card));
    setErrors({});
  }, [open, card]);

  // Cartao de debito acessa uma conta de verdade; uma conta encerrada nao serve.
  const accountOptions = useMemo<Option[]>(
    () =>
      accounts
        .filter((account) => account.status === 'ATIVO' || account.id === card?.accountId)
        .map((account) => ({ value: account.id, label: `${account.name} · ${account.institution}` })),
    [accounts, card],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);

    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    // So vao os campos do tipo escolhido: o cadastro guarda o cartao, nao o
    // rascunho de um tipo que o usuario chegou a selecionar e trocou depois.
    onSubmit({
      name: form.name,
      institution: form.institution,
      type: form.type,
      status: form.status,
      brand: form.brand.trim() || undefined,
      lastDigits: form.lastDigits.trim() || undefined,
      ...(form.type === 'CREDITO'
        ? {
            limit: parseAmountInput(form.limit),
            closingDay: parseDay(form.closingDay),
            dueDay: parseDay(form.dueDay),
          }
        : {}),
      ...(form.type === 'DEBITO' ? { accountId: form.accountId } : {}),
      ...(form.type === 'VALE_ALIMENTACAO' || form.type === 'VALE_REFEICAO'
        ? { balance: parseAmountInput(form.balance) }
        : {}),
    });
  };

  const isCredit = form.type === 'CREDITO';
  const isDebit = form.type === 'DEBITO';
  const isVoucher = form.type === 'VALE_ALIMENTACAO' || form.type === 'VALE_REFEICAO';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? 'Editar cartão' : 'Novo cartão'}
      description="Os campos mudam conforme o tipo: só o crédito tem limite e datas de fatura."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {card ? 'Salvar alterações' : 'Cadastrar cartão'}
          </Button>
        </>
      }
    >
      <form
        ref={formRef}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          className={styles.full}
          required
          label="Nome do cartão"
          placeholder="Como você chama este cartão"
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
          autoFocus
        />

        <Select
          required
          label="Tipo"
          options={typeOptions}
          value={form.type}
          onChange={(type) => set('type', type as CardType)}
        />

        <Input
          required
          label="Instituição"
          placeholder="Banco ou operadora"
          value={form.institution}
          onChange={(event) => set('institution', event.target.value)}
          error={errors.institution}
        />

        {isCredit ? (
          <>
            <Input
              required
              label="Limite"
              prefix="R$"
              inputMode="decimal"
              placeholder="0,00"
              value={form.limit}
              onChange={(event) => set('limit', event.target.value)}
              error={errors.limit}
            />

            <div className={styles.days}>
              <Input
                required
                label="Dia de fechamento"
                inputMode="numeric"
                maxLength={2}
                placeholder="28"
                value={form.closingDay}
                onChange={(event) => set('closingDay', event.target.value)}
                error={errors.closingDay}
              />
              <Input
                required
                label="Dia de vencimento"
                inputMode="numeric"
                maxLength={2}
                placeholder="8"
                value={form.dueDay}
                onChange={(event) => set('dueDay', event.target.value)}
                error={errors.dueDay}
              />
            </div>
          </>
        ) : null}

        {isDebit ? (
          <Select
            required
            label="Conta vinculada"
            placeholder="Selecione a conta"
            options={accountOptions}
            value={form.accountId}
            onChange={(accountId) => set('accountId', accountId)}
            error={errors.accountId}
            hint="As compras saem direto do saldo dessa conta."
          />
        ) : null}

        {isVoucher ? (
          <Input
            required
            label="Saldo disponível"
            prefix="R$"
            inputMode="decimal"
            placeholder="0,00"
            value={form.balance}
            onChange={(event) => set('balance', event.target.value)}
            error={errors.balance}
          />
        ) : null}

        <Input
          label="Bandeira"
          placeholder="Visa, Mastercard, Elo..."
          value={form.brand}
          onChange={(event) => set('brand', event.target.value)}
        />

        <Input
          label="Últimos 4 dígitos"
          inputMode="numeric"
          maxLength={4}
          placeholder="0000"
          value={form.lastDigits}
          onChange={(event) => set('lastDigits', event.target.value)}
          error={errors.lastDigits}
          hint="Ajuda a distinguir dois cartões do mesmo banco."
        />

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as CardStatus)}
          hint={
            form.status === 'INATIVO'
              ? 'Sai dos novos lançamentos; o histórico e as faturas continuam.'
              : 'Disponível para novos lançamentos.'
          }
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
