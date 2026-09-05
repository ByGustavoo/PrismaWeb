import { useEffect, useMemo, useRef, useState } from 'react';
import { Amount } from '@/components/common';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { investmentClassLabel, investmentClasses } from '@/constants/investments';
import type { Investment, InvestmentClass, InvestmentPayload, Option } from '@/types';
import { todayISO } from '@/utils/date';
import { formatSignedPercent, parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './InvestmentForm.module.css';

interface InvestmentFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  investment: Investment | null;
  saving: boolean;
  onSubmit: (payload: InvestmentPayload) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  assetClass: InvestmentClass;
  institution: string;
  invested: string;
  currentValue: string;
  startDate: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const classOptions: Option[] = investmentClasses.map((assetClass) => ({
  value: assetClass,
  label: investmentClassLabel[assetClass],
}));

function initialState(investment: Investment | null): FormState {
  return {
    name: investment?.name ?? '',
    assetClass: investment?.assetClass ?? 'RENDA_FIXA',
    institution: investment?.institution ?? '',
    invested: investment ? toAmountInput(investment.invested) : '',
    currentValue: investment ? toAmountInput(investment.currentValue) : '',
    startDate: investment?.startDate ?? todayISO(),
    notes: investment?.notes ?? '',
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const invested = parseAmountInput(form.invested);
  const currentValue = parseAmountInput(form.currentValue);

  if (form.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres!';
  }
  if (form.institution.trim().length < 2) {
    errors.institution = 'Informe onde o dinheiro está aplicado!';
  }
  if (invested === undefined) {
    errors.invested = 'Informe quanto já foi aportado!';
  } else if (invested <= 0) {
    errors.invested = 'O valor aportado precisa ser maior que zero!';
  }
  if (currentValue === undefined) {
    errors.currentValue = 'Informe quanto a posição vale hoje!';
  } else if (currentValue < 0) {
    errors.currentValue = 'O valor atual não pode ser negativo!';
  }
  if (!form.startDate) {
    errors.startDate = 'Informe a data do primeiro aporte!';
  } else if (form.startDate > todayISO()) {
    errors.startDate = 'O primeiro aporte não pode estar no futuro!';
  }

  return errors;
}

export function InvestmentFormModal({ open, investment, saving, onSubmit, onClose }: InvestmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(investment));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(investment));
    setErrors({});
  }, [open, investment]);

  const preview = useMemo(() => {
    const invested = parseAmountInput(form.invested);
    const currentValue = parseAmountInput(form.currentValue);
    if (invested === undefined || currentValue === undefined || invested <= 0) return null;

    return { profit: currentValue - invested, profitability: ((currentValue - invested) / invested) * 100 };
  }, [form.invested, form.currentValue]);

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
      assetClass: form.assetClass,
      institution: form.institution,
      invested: parseAmountInput(form.invested) ?? 0,
      currentValue: parseAmountInput(form.currentValue) ?? 0,
      startDate: form.startDate,
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={investment ? 'Editar investimento' : 'Novo investimento'}
      description="O valor atual é o que a posição vale hoje; o aportado é a soma do que você colocou nela."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {investment ? 'Salvar alterações' : 'Cadastrar investimento'}
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
          label="Nome"
          placeholder="CDB Liquidez Diária, Tesouro IPCA+ 2029..."
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
          autoFocus
        />

        <Select
          required
          label="Tipo de ativo"
          options={classOptions}
          value={form.assetClass}
          onChange={(value) => set('assetClass', value as InvestmentClass)}
        />

        <Input
          required
          label="Instituição"
          placeholder="Banco, corretora ou seguradora"
          value={form.institution}
          onChange={(event) => set('institution', event.target.value)}
          error={errors.institution}
        />

        <Input
          required
          label="Total aportado"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.invested}
          onChange={(event) => set('invested', event.target.value)}
          error={errors.invested}
          hint="Soma de tudo que já entrou nesta posição."
        />

        <Input
          required
          label="Valor atual"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.currentValue}
          onChange={(event) => set('currentValue', event.target.value)}
          error={errors.currentValue}
          hint="Quanto a posição vale hoje, com rendimento."
        />

        <DatePicker
          required
          label="Primeiro aporte"
          max={todayISO()}
          value={form.startDate}
          onChange={(startDate) => set('startDate', startDate)}
          error={errors.startDate}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: estratégia, prazo de resgate ou o que ajudar a lembrar."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />

        {/* A previa responde antes do envio o que a tela existe para mostrar. */}
        {preview ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <Amount value={preview.profit} size="md" sign="auto" />
              <span className="tabular">{formatSignedPercent(preview.profitability)}</span>
            </strong>
            <span>
              {preview.profit >= 0 ? 'De rendimento acumulado' : 'De prejuízo acumulado'} sobre o valor aportado.
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
