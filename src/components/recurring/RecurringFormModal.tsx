import { useEffect, useMemo, useState } from 'react';
import { Amount } from '@/components/common';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { monthlyOccurrences, recurrenceFrequencies, recurrenceLabel, recurringStatusLabel, recurringStatuses } from '@/constants/recurring';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Categoria, Option, PaymentSource, RecurrenceFrequency, RecurringExpense, RecurringPayload, RecurringStatus } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import styles from './RecurringForm.module.css';

interface RecurringFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  expense: RecurringExpense | null;
  categories: Categoria[];
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

const limits = { description: textLimits.description, notes: textLimits.notes };

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
    frequency: expense?.frequency ?? 'MENSAL',
    nextDueDate: expense?.nextDueDate ?? todayISO(),
    accountId: expense?.accountId ?? '',
    status: expense?.status ?? 'ATIVO',
    notes: expense?.notes ?? '',
  };
}

function validate(form: FormState): FieldErrors<FormState> {
  const errors: FieldErrors<FormState> = {
    description: textError(form.description, {
      subject: 'A descrição da despesa',
      missing: 'Informe a descrição da despesa!',
      max: textLimits.description,
    }),
    amount: amountError(form.amount, {
      subject: 'O valor da despesa',
      missing: 'Informe o valor da despesa!',
      sign: 'positive',
    }),
    notes: textError(form.notes, { subject: 'A observação', max: textLimits.notes }),
  };

  if (!form.nextDueDate) {
    errors.nextDueDate = 'Informe a data do próximo vencimento!';
  }
  if (!form.accountId) {
    errors.accountId = 'Escolha a conta ou o cartão que paga esta despesa!';
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
  const { errors, formRef, touch, submit, reset } = useFormValidation(form, validate, { limits });

  useEffect(() => {
    if (!open) return;
    setForm(initialState(expense));
    reset();
  }, [open, expense, reset]);

  const categoryOptions = useMemo<Option[]>(
    () => categories.filter((item) => item.tipo === 'DESPESA').map((item) => ({ value: item.id, label: item.nome })),
    [categories],
  );

  const sourceOptions = useMemo<Option[]>(
    () =>
      sources.map((source) => ({
        value: source.id,
        label: source.group === 'CARTAO' ? `${source.name} (cartão)` : source.name,
      })),
    [sources],
  );

  const amount = parseAmountInput(form.amount);
  const monthlyEquivalent = amount ? amount * monthlyOccurrences[form.frequency] : undefined;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!submit()) return;

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
          onBlur={() => touch('description')}
          characterLimit={textLimits.description}
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
          onBlur={() => touch('amount')}
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
          onBlur={() => touch('notes')}
          characterLimit={textLimits.notes}
          error={errors.notes}
        />

        {/*
          O custo mensal equivalente e a conta que o usuario nao faz de cabeca:
          um seguro anual de R$ 2.340 pesa R$ 195 por mes no orcamento.
        */}
        {monthlyEquivalent !== undefined && form.frequency !== 'MENSAL' ? (
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
