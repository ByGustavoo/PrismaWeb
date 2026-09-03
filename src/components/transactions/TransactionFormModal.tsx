import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import {
  paymentMethodLabel,
  paymentMethods,
  transactionStatusLabel,
  transactionStatuses,
} from '@/constants/transactions';
import type { Category, Option, PaymentMethod, PaymentSource, Transaction, TransactionPayload, TransactionStatus } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './TransactionForm.module.css';

interface TransactionFormModalProps {
  open: boolean;
  /** Transferencia tem formulario proprio; aqui so entra receita ou despesa. */
  kind: 'income' | 'expense';
  /** Presente apenas na edicao. */
  transaction: Transaction | null;
  categories: Category[];
  sources: PaymentSource[];
  saving: boolean;
  onSubmit: (payload: TransactionPayload) => void;
  onClose: () => void;
}

interface FormState {
  description: string;
  amount: string;
  date: string;
  categoryId: string;
  accountId: string;
  method: PaymentMethod;
  status: TransactionStatus;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(transaction: Transaction | null): FormState {
  return {
    description: transaction?.description ?? '',
    amount: transaction ? toAmountInput(transaction.amount) : '',
    date: transaction?.date ?? todayISO(),
    categoryId: transaction?.category?.id ?? '',
    accountId: transaction?.accountId ?? '',
    method: transaction?.method ?? 'account',
    status: transaction?.status ?? 'paid',
    notes: transaction?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const amount = parseAmountInput(form.amount);

  if (form.description.trim().length < 2) {
    errors.description = 'Informe uma descrição com pelo menos 2 caracteres.';
  }
  if (amount === undefined) {
    errors.amount = 'Informe um valor.';
  } else if (amount <= 0) {
    errors.amount = 'O valor precisa ser maior que zero.';
  }
  if (!form.date) {
    errors.date = 'Informe a data.';
  }
  if (!form.categoryId) {
    errors.categoryId = 'Escolha uma categoria.';
  }
  if (!form.accountId) {
    errors.accountId = 'Escolha uma conta.';
  }

  return errors;
}

const statusOptions: Option[] = transactionStatuses.map((status) => ({
  value: status,
  label: transactionStatusLabel[status],
}));

const methodOptions: Option[] = paymentMethods.map((method) => ({
  value: method,
  label: paymentMethodLabel[method],
}));

export function TransactionFormModal({
  open,
  kind,
  transaction,
  categories,
  sources,
  saving,
  onSubmit,
  onClose,
}: TransactionFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(transaction));
  const [errors, setErrors] = useState<FormErrors>({});

  // Cada abertura comeca do zero (ou do registro em edicao), sem resto da anterior.
  useEffect(() => {
    if (!open) return;
    setForm(initialState(transaction));
    setErrors({});
  }, [open, transaction]);

  const isExpense = kind === 'expense';

  const categoryOptions = useMemo<Option[]>(
    () => categories.filter((item) => item.kind === kind).map((item) => ({ value: item.id, label: item.name })),
    [categories, kind],
  );

  // Despesa pode sair de um cartao; receita sempre cai numa conta propria.
  const sourceOptions = useMemo<Option[]>(
    () =>
      sources
        .filter((item) => (isExpense ? true : item.group === 'account'))
        .map((item) => ({
          value: item.id,
          label: item.group === 'card' ? `${item.name} · cartão` : item.name,
        })),
    [sources, isExpense],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    // O erro some assim que o campo e corrigido, nao so no proximo envio.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    onSubmit({
      description: form.description,
      amount: parseAmountInput(form.amount) ?? 0,
      kind,
      status: form.status,
      method: form.method,
      date: form.date,
      categoryId: form.categoryId,
      accountId: form.accountId,
      notes: form.notes,
    });
  };

  const noun = isExpense ? 'despesa' : 'receita';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? `Editar ${noun}` : `Nova ${noun}`}
      description={
        isExpense
          ? 'Registre uma saída de dinheiro da sua conta ou do cartão.'
          : 'Registre uma entrada de dinheiro em uma das suas contas.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {transaction ? 'Salvar alterações' : `Cadastrar ${noun}`}
          </Button>
        </>
      }
    >
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          className={styles.full}
          label="Descrição"
          placeholder={isExpense ? 'Conta de luz, mercado, aluguel...' : 'Salário, freelance, reembolso...'}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          error={errors.description}
          autoFocus
        />

        <Input
          label="Valor"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={(event) => set('amount', event.target.value)}
          error={errors.amount}
        />

        <Input
          label="Data"
          type="date"
          value={form.date}
          onChange={(event) => set('date', event.target.value)}
          error={errors.date}
        />

        <Select
          label="Categoria"
          placeholder="Selecione a categoria"
          options={categoryOptions}
          value={form.categoryId}
          onChange={(categoryId) => set('categoryId', categoryId)}
          error={errors.categoryId}
        />

        <Select
          label={isExpense ? 'Conta ou cartão' : 'Conta'}
          placeholder={isExpense ? 'Selecione a conta ou o cartão' : 'Selecione a conta'}
          options={sourceOptions}
          value={form.accountId}
          onChange={(accountId) => set('accountId', accountId)}
          error={errors.accountId}
        />

        {isExpense ? (
          <Select
            label="Forma de pagamento"
            options={methodOptions}
            value={form.method}
            onChange={(method) => set('method', method as PaymentMethod)}
          />
        ) : null}

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as TransactionStatus)}
          hint={form.status === 'paid' ? 'Já entrou ou saiu da conta.' : 'Ainda não afetou o saldo.'}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar deste lançamento."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
