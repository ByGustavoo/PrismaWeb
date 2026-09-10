import { useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { transactionStatusLabel, transactionStatuses } from '@/constants/transactions';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Option, PaymentSource, Lancamento, LancamentoPayload, SituacaoLancamento } from '@/types';
import { cn } from '@/utils/cn';
import { todayISO } from '@/utils/date';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import styles from './TransactionForm.module.css';

interface TransferFormModalProps {
  open: boolean;
  transaction: Lancamento | null;
  sources: PaymentSource[];
  saving: boolean;
  onSubmit: (payload: LancamentoPayload) => void;
  onClose: () => void;
}

interface FormState {
  accountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description: string;
  status: SituacaoLancamento;
  notes: string;
}

const limits = { description: textLimits.description, notes: textLimits.notes };

function initialState(transaction: Lancamento | null): FormState {
  return {
    accountId: transaction?.idOrigem ?? '',
    toAccountId: transaction?.idContaDestino ?? '',
    amount: transaction ? toAmountInput(transaction.valor) : '',
    date: transaction?.data ?? todayISO(),
    description: transaction?.descricao ?? '',
    status: transaction?.situacao ?? 'PAGO',
    notes: transaction?.observacoes ?? '',
  };
}

function validate(form: FormState): FieldErrors<FormState> {
  const errors: FieldErrors<FormState> = {
    amount: amountError(form.amount, {
      subject: 'O valor da transferência',
      missing: 'Informe o valor da transferência!',
      sign: 'positive',
    }),
    description: textError(form.description, {
      subject: 'A descrição da transferência',
      missing: 'Informe a descrição da transferência!',
      max: textLimits.description,
    }),
    notes: textError(form.notes, { subject: 'A observação', max: textLimits.notes }),
  };

  if (!form.accountId) {
    errors.accountId = 'Escolha a conta de origem!';
  }
  if (!form.toAccountId) {
    errors.toAccountId = 'Escolha a conta de destino!';
  } else if (form.toAccountId === form.accountId) {
    errors.toAccountId = 'A conta de destino precisa ser diferente da origem!';
  }
  if (!form.date) {
    errors.date = 'Informe a data da transferência!';
  }

  return errors;
}

const statusOptions: Option[] = transactionStatuses.map((status) => ({
  value: status,
  label: transactionStatusLabel[status],
}));

export function TransferFormModal({
  open,
  transaction,
  sources,
  saving,
  onSubmit,
  onClose,
}: TransferFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(transaction));
  const { errors, formRef, touch, submit, reset } = useFormValidation(form, validate, { limits });

  useEffect(() => {
    if (!open) return;
    setForm(initialState(transaction));
    reset();
  }, [open, transaction, reset]);

  const accountOptions = useMemo<Option[]>(
    () =>
      sources
        .filter((item) => item.group === 'CONTA')
        .map((item) => ({ value: item.id, label: item.name })),
    [sources],
  );

  const destinationOptions = useMemo<Option[]>(
    () => accountOptions.filter((option) => option.value !== form.accountId),
    [accountOptions, form.accountId],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleOriginChange = (accountId: string) => {
    set('accountId', accountId);
    if (form.toAccountId === accountId) set('toAccountId', '');
  };

  const handleSubmit = () => {
    if (!submit()) return;

    onSubmit({
      descricao: form.description,
      valor: parseAmountInput(form.amount) ?? 0,
      tipo: 'TRANSFERENCIA',
      situacao: form.status,
      forma: 'CONTA',
      data: form.date,
      idOrigem: form.accountId,
      idContaDestino: form.toAccountId,
      observacoes: form.notes,
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
        ref={formRef}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className={cn(styles.full, styles.route)}>
          <Select
            required
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
            required
            label="Conta de destino"
            placeholder="Para onde vai o dinheiro"
            options={destinationOptions}
            value={form.toAccountId}
            onChange={(toAccountId) => set('toAccountId', toAccountId)}
            error={errors.toAccountId}
          />
        </div>

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

        <Input
          required
          label="Descrição"
          placeholder="Aporte na reserva, sobra da carteira..."
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          onBlur={() => touch('description')}
          characterLimit={textLimits.description}
          error={errors.description}
        />

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as SituacaoLancamento)}
          hint={form.status === 'PAGO' ? 'A transferência já foi feita.' : 'Ainda não saiu da conta de origem.'}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar desta transferência."
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
