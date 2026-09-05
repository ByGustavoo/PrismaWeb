import { useEffect, useRef, useState } from 'react';
import { Button, Input, Modal, Select, Switch } from '@/components/ui';
import { accountStatusLabel, accountStatuses, accountTypeLabel, accountTypes } from '@/constants/accounts';
import type { Account, AccountPayload, AccountStatus, AccountType, Option } from '@/types';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './AccountForm.module.css';

interface AccountFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  account: Account | null;
  saving: boolean;
  onSubmit: (payload: AccountPayload) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  institution: string;
  type: AccountType;
  balance: string;
  status: AccountStatus;
  includeInTotal: boolean;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const typeOptions: Option[] = accountTypes.map((type) => ({ value: type, label: accountTypeLabel[type] }));

const statusOptions: Option[] = accountStatuses.map((status) => ({
  value: status,
  label: accountStatusLabel[status],
}));

function initialState(account: Account | null): FormState {
  return {
    name: account?.name ?? '',
    institution: account?.institution ?? '',
    type: account?.type ?? 'CORRENTE',
    balance: account ? toAmountInput(account.balance) : '',
    status: account?.status ?? 'ATIVO',
    includeInTotal: account?.includeInTotal ?? true,
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres!';
  }
  if (form.institution.trim().length < 2) {
    errors.institution = 'Informe o banco ou a instituição da conta!';
  }
  if (parseAmountInput(form.balance) === undefined) {
    errors.balance = 'Informe o saldo atual da conta!';
  }

  return errors;
}

export function AccountFormModal({ open, account, saving, onSubmit, onClose }: AccountFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(account));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Cada abertura comeca do zero (ou do registro em edicao), sem resto da anterior.
  useEffect(() => {
    if (!open) return;
    setForm(initialState(account));
    setErrors({});
  }, [open, account]);

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
      name: form.name,
      institution: form.institution,
      type: form.type,
      balance: parseAmountInput(form.balance) ?? 0,
      status: form.status,
      includeInTotal: form.includeInTotal,
    });
  };

  const inactive = form.status === 'INATIVO';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? 'Editar conta' : 'Nova conta'}
      description={
        account
          ? 'Altere os dados desta conta. O novo nome aparece também nos lançamentos já registrados.'
          : 'Cadastre uma conta para acompanhar o saldo e usá-la nos lançamentos.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {account ? 'Salvar alterações' : 'Cadastrar conta'}
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
          label="Nome da conta"
          placeholder="Conta corrente, Reserva de emergência..."
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
          autoFocus
        />

        <Input
          required
          label="Instituição"
          placeholder="Banco, corretora ou carteira"
          value={form.institution}
          onChange={(event) => set('institution', event.target.value)}
          error={errors.institution}
        />

        <Select
          required
          label="Tipo"
          options={typeOptions}
          value={form.type}
          onChange={(type) => set('type', type as AccountType)}
        />

        <Input
          required
          label="Saldo atual"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.balance}
          onChange={(event) => set('balance', event.target.value)}
          error={errors.balance}
          hint="Aceita valor negativo, para conta no cheque especial."
        />

        <Select
          label="Situação"
          options={statusOptions}
          value={form.status}
          onChange={(status) => set('status', status as AccountStatus)}
          hint={
            inactive
              ? 'Sai do saldo total e dos novos lançamentos; o histórico continua.'
              : 'Aparece no saldo e nos formulários de lançamento.'
          }
        />

        <Switch
          className={styles.full}
          label="Somar ao saldo total"
          checked={form.includeInTotal && !inactive}
          // Conta inativa nunca soma, entao a chave nao teria efeito nenhum
          // ligada: desabilitar diz isso antes de o usuario tentar.
          disabled={inactive}
          onChange={(checked) => set('includeInTotal', checked)}
          hint={
            inactive
              ? 'Contas inativas ficam sempre fora do saldo total.'
              : 'Desligue para contas que não são dinheiro disponível, como a de uma corretora.'
          }
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
