import { useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { transactionStatusLabel, transactionStatuses } from '@/constants/transactions';
import type { Option, PaymentSource, Transaction, TransactionPayload, TransactionStatus } from '@/types';
import { cn } from '@/utils/cn';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './TransactionForm.module.css';

interface TransferFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  transaction: Transaction | null;
  sources: PaymentSource[];
  saving: boolean;
  onSubmit: (payload: TransactionPayload) => void;
  onClose: () => void;
}

interface FormState {
  accountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description: string;
  status: TransactionStatus;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(transaction: Transaction | null): FormState {
  return {
    accountId: transaction?.accountId ?? '',
    toAccountId: transaction?.toAccountId ?? '',
    amount: transaction ? toAmountInput(transaction.amount) : '',
    date: transaction?.date ?? todayISO(),
    description: transaction?.description ?? '',
    status: transaction?.status ?? 'paid',
    notes: transaction?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const amount = parseAmountInput(form.amount);

  if (!form.accountId) {
    errors.accountId = 'Escolha a conta de origem.';
  }
  if (!form.toAccountId) {
    errors.toAccountId = 'Escolha a conta de destino.';
  } else if (form.toAccountId === form.accountId) {
    errors.toAccountId = 'O destino precisa ser diferente da origem.';
  }
  if (amount === undefined) {
    errors.amount = 'Informe um valor.';
  } else if (amount <= 0) {
    errors.amount = 'O valor precisa ser maior que zero.';
  }
  if (!form.date) {
    errors.date = 'Informe a data.';
  }
  if (form.description.trim().length < 2) {
    errors.description = 'Informe uma descrição com pelo menos 2 caracteres.';
  }

  return errors;
}

const statusOptions: Option[] = transactionStatuses.map((status) => ({
  value: status,
  label: transactionStatusLabel[status],
}));

/**
 * Movimentacao entre contas do proprio usuario. Nao vira receita nem despesa:
 * o dinheiro so troca de lugar, entao o registro nao tem categoria e fica fora
 * do resultado do periodo.
 */
export function TransferFormModal({
  open,
  transaction,
  sources,
  saving,
  onSubmit,
  onClose,
}: TransferFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(transaction));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialState(transaction));
    setErrors({});
  }, [open, transaction]);

  // Cartao nao e conta propria: nao aparece nem na origem nem no destino.
  const accountOptions = useMemo<Option[]>(
    () =>
      sources
        .filter((item) => item.group === 'account')
        .map((item) => ({ value: item.id, label: item.name })),
    [sources],
  );

  const destinationOptions = useMemo<Option[]>(
    () => accountOptions.filter((option) => option.value !== form.accountId),
    [accountOptions, form.accountId],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleOriginChange = (accountId: string) => {
    set('accountId', accountId);
    // A origem escolhida nao pode continuar valendo como destino.
    if (form.toAccountId === accountId) set('toAccountId', '');
  };

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    onSubmit({
      description: form.description,
      amount: parseAmountInput(form.amount) ?? 0,
      kind: 'transfer',
      status: form.status,
      method: 'account',
      date: form.date,
      accountId: form.accountId,
      toAccountId: form.toAccountId,
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Editar transferência' : 'Nova transferência'}
      description="Movimente dinheiro entre as suas contas. O valor não entra no resultado do período."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {transaction ? 'Salvar alterações' : 'Cadastrar transferência'}
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
        {/* Origem e destino empilhados com a seta entre eles: o sentido fica explicito. */}
        <div className={cn(styles.full, styles.route)}>
          <Select
            label="Conta de origem"
            placeholder="De onde sai o dinheiro"
            options={accountOptions}
            value={form.accountId}
            onChange={handleOriginChange}
            error={errors.accountId}
          />
          <span className={styles.routeArrow} aria-hidden="true">
            <ArrowDown size={16} strokeWidth={2} />
          </span>
          <Select
            label="Conta de destino"
            placeholder="Para onde vai o dinheiro"
            options={destinationOptions}
            value={form.toAccountId}
            onChange={(toAccountId) => set('toAccountId', toAccountId)}
            error={errors.toAccountId}
          />
        </div>

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

        <Input
          label="Descrição"
          placeholder="Aporte na reserva, sobra da carteira..."
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          error={errors.description}
        />

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as TransactionStatus)}
          hint={form.status === 'paid' ? 'A transferência já foi feita.' : 'Ainda não saiu da conta de origem.'}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar desta transferência."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
