import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import {
  paymentMethodLabel,
  paymentMethods,
  transactionStatusLabel,
  transactionStatuses,
} from '@/constants/transactions';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Categoria, Option, FormaPagamento, PaymentSource, Lancamento, LancamentoPayload, SituacaoLancamento } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import styles from './TransactionForm.module.css';

interface TransactionFormModalProps {
  open: boolean;
  kind: 'RECEITA' | 'DESPESA';
  transaction: Lancamento | null;
  categories: Categoria[];
  sources: PaymentSource[];
  saving: boolean;
  onSubmit: (payload: LancamentoPayload) => void;
  onClose: () => void;
}

interface FormState {
  description: string;
  amount: string;
  date: string;
  categoryId: string;
  accountId: string;
  method: FormaPagamento;
  status: SituacaoLancamento;
  notes: string;
}

const limits = { description: textLimits.description, notes: textLimits.notes };

function initialState(transaction: Lancamento | null): FormState {
  return {
    description: transaction?.descricao ?? '',
    amount: transaction ? toAmountInput(transaction.valor) : '',
    date: transaction?.data ?? todayISO(),
    categoryId: transaction?.categoria?.id ?? '',
    accountId: transaction?.idOrigem ?? '',
    method: transaction?.forma ?? 'CONTA',
    status: transaction?.situacao ?? 'PAGO',
    notes: transaction?.observacoes ?? '',
  };
}

function validate(form: FormState, isExpense: boolean): FieldErrors<FormState> {
  const noun = isExpense ? 'despesa' : 'receita';
  const errors: FieldErrors<FormState> = {
    description: textError(form.description, {
      subject: `A descrição da ${noun}`,
      missing: `Informe a descrição da ${noun}!`,
      max: textLimits.description,
    }),
    amount: amountError(form.amount, {
      subject: `O valor da ${noun}`,
      missing: `Informe o valor da ${noun}!`,
      sign: 'positive',
    }),
    notes: textError(form.notes, { subject: 'A observação', max: textLimits.notes }),
  };

  if (!form.date) {
    errors.date = `Informe a data da ${noun}!`;
  }
  if (!form.categoryId) {
    errors.categoryId = `Escolha a categoria da ${noun}!`;
  }
  if (!form.accountId) {
    errors.accountId = isExpense ? 'Escolha a conta ou o cartão da despesa!' : 'Escolha a conta da receita!';
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
  const isExpense = kind === 'DESPESA';
  const { errors, formRef, touch, submit, reset } = useFormValidation(
    form,
    (values) => validate(values, isExpense),
    { limits },
  );

  useEffect(() => {
    if (!open) return;
    setForm(initialState(transaction));
    reset();
  }, [open, transaction, reset]);

  const categoryOptions = useMemo<Option[]>(
    () => categories.filter((item) => item.tipo === kind).map((item) => ({ value: item.id, label: item.nome })),
    [categories, kind],
  );

  const sourceOptions = useMemo<Option[]>(
    () =>
      sources
        .filter((item) => (isExpense ? true : item.group === 'CONTA'))
        .map((item) => ({
          value: item.id,
          label: item.group === 'CARTAO' ? `${item.name} · cartão` : item.name,
        })),
    [sources, isExpense],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!submit()) return;

    onSubmit({
      descricao: form.description,
      valor: parseAmountInput(form.amount) ?? 0,
      tipo: kind,
      situacao: form.status,
      forma: form.method,
      data: form.date,
      idCategoria: form.categoryId,
      idOrigem: form.accountId,
      observacoes: form.notes,
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
          placeholder={isExpense ? 'Conta de luz, mercado, aluguel...' : 'Salário, freelance, reembolso...'}
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

        <DatePicker
          required
          label="Data"
          value={form.date}
          onChange={(date) => set('date', date)}
          error={errors.date}
        />

        <Select
          required
          label="Categoria"
          placeholder="Selecione a categoria"
          options={categoryOptions}
          value={form.categoryId}
          onChange={(categoryId) => set('categoryId', categoryId)}
          error={errors.categoryId}
        />

        <Select
          required
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
            onChange={(method) => set('method', method as FormaPagamento)}
          />
        ) : null}

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as SituacaoLancamento)}
          hint={form.status === 'PAGO' ? 'Já entrou ou saiu da conta.' : 'Ainda não afetou o saldo.'}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar deste lançamento."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
          onBlur={() => touch('notes')}
          characterLimit={textLimits.notes}
          error={errors.notes}
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
