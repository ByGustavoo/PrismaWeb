import { useEffect, useMemo, useRef, useState } from 'react';
import { Amount } from '@/components/common';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { monthlyOccurrences, recurrenceFrequencies, recurrenceLabel, recurringStatusLabel, recurringStatuses } from '@/constants/recurring';
import type { Category, Option, PaymentSource, RecurrenceFrequency, RecurringExpense, RecurringPayload, RecurringStatus } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './RecurringForm.module.css';

interface RecurringFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  expense: RecurringExpense | null;
  categories: Category[];
  sources: PaymentSource[];
  saving: boolean;
  onSubmit: (payload: RecurringPayload) => void;
  onClose: () => void;
}

interface FormState {
  description: string;
  amount: string;
  categoryId: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  accountId: string;
  status: RecurringStatus;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const frequencyOptions: Option[] = recurrenceFrequencies.map((frequency) => ({
  value: frequency,
  label: recurrenceLabel[frequency],
}));

const statusOptions: Option[] = recurringStatuses.map((status) => ({
  value: status,
  label: recurringStatusLabel[status],
}));

function initialState(expense: RecurringExpense | null): FormState {
  return {
    description: expense?.description ?? '',
    amount: expense ? toAmountInput(expense.amount) : '',
    categoryId: expense?.category?.id ?? '',
    frequency: expense?.frequency ?? 'monthly',
    nextDueDate: expense?.nextDueDate ?? todayISO(),
    accountId: expense?.accountId ?? '',
    status: expense?.status ?? 'active',
    notes: expense?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const amount = parseAmountInput(form.amount);

  if (form.description.trim().length < 2) {
    errors.description = 'Informe uma descrição com pelo menos 2 caracteres.';
  }
  if (amount === undefined) {
    errors.amount = 'Informe o valor da despesa.';
  } else if (amount <= 0) {
    errors.amount = 'O valor precisa ser maior que zero.';
  }
  if (!form.nextDueDate) {
    errors.nextDueDate = 'Informe a data do próximo vencimento.';
  }
  if (!form.accountId) {
    errors.accountId = 'Escolha a conta ou o cartão que paga esta despesa.';
  }

  return errors;
}

export function RecurringFormModal({
  open,
  expense,
  categories,
  sources,
  saving,
  onSubmit,
  onClose,
}: RecurringFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(expense));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(expense));
    setErrors({});
  }, [open, expense]);

  const categoryOptions = useMemo<Option[]>(
    () => categories.filter((item) => item.kind === 'expense').map((item) => ({ value: item.id, label: item.name })),
    [categories],
  );

  const sourceOptions = useMemo<Option[]>(
    () =>
      sources.map((source) => ({
        value: source.id,
        label: source.group === 'card' ? `${source.name} (cartão)` : source.name,
      })),
    [sources],
  );

  const amount = parseAmountInput(form.amount);
  const monthlyEquivalent = amount ? amount * monthlyOccurrences[form.frequency] : undefined;

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

    onSubmit({
      description: form.description,
      amount: amount ?? 0,
      categoryId: form.categoryId || undefined,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      accountId: form.accountId,
      status: form.status,
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}
      description="Despesas fixas alimentam a previsão dos próximos meses e o aviso de vencimento."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {expense ? 'Salvar alterações' : 'Cadastrar despesa'}
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
          label="Descrição"
          placeholder="Aluguel, internet, assinatura..."
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          error={errors.description}
          autoFocus
        />

        <Input
          required
          label="Valor"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={(event) => set('amount', event.target.value)}
          error={errors.amount}
        />

        <Select
          required
          label="Periodicidade"
          options={frequencyOptions}
          value={form.frequency}
          onChange={(value) => set('frequency', value as RecurrenceFrequency)}
        />

        <DatePicker
          required
          label="Próximo vencimento"
          value={form.nextDueDate}
          onChange={(nextDueDate) => set('nextDueDate', nextDueDate)}
          error={errors.nextDueDate}
          hint="A partir dele, as próximas datas são calculadas."
        />

        <Select
          required
          label="Conta ou cartão"
          placeholder="De onde sai o dinheiro"
          options={sourceOptions}
          value={form.accountId}
          onChange={(accountId) => set('accountId', accountId)}
          error={errors.accountId}
        />

        <Select
          label="Categoria"
          placeholder="Opcional: ajuda a classificar o gasto"
          options={categoryOptions}
          value={form.categoryId}
          onChange={(categoryId) => set('categoryId', categoryId)}
        />

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(value) => set('status', value as RecurringStatus)}
          hint="Pausada sai do custo mensal e da previsão."
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: reajuste, número do contrato ou o que ajudar a lembrar."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />

        {/*
          O custo mensal equivalente e a conta que o usuario nao faz de cabeca:
          um seguro anual de R$ 2.340 pesa R$ 195 por mes no orcamento.
        */}
        {monthlyEquivalent !== undefined && form.frequency !== 'monthly' ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <Amount value={monthlyEquivalent} size="md" />
              <span>por mês</span>
            </strong>
            <span>É quanto esta despesa {recurrenceLabel[form.frequency].toLowerCase()} pesa no custo mensal.</span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
