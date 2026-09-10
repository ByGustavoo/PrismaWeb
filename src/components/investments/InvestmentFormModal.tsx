import { useEffect, useMemo, useState } from 'react';
import { Amount } from '@/components/common';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { investmentClassLabel, investmentClasses } from '@/constants/investments';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Investment, InvestmentClass, InvestmentPayload, Option } from '@/types';
import { todayISO } from '@/utils/date';
import { formatSignedPercent, parseAmountInput, toAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import styles from './InvestmentForm.module.css';

interface InvestmentFormModalProps {
  open: boolean;
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

const limits = {
  name: textLimits.investmentName,
  institution: textLimits.institution,
  notes: textLimits.notes,
};

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

function validate(form: FormState): FieldErrors<FormState> {
  const errors: FieldErrors<FormState> = {
    name: textError(form.name, {
      subject: 'O nome do investimento',
      missing: 'Informe o nome do investimento!',
      max: textLimits.investmentName,
    }),
    institution: textError(form.institution, {
      subject: 'O nome da instituição',
      missing: 'Informe onde o dinheiro está aplicado!',
      max: textLimits.institution,
    }),
    invested: amountError(form.invested, {
      subject: 'O total aportado',
      missing: 'Informe quanto já foi aportado!',
      sign: 'positive',
    }),
    currentValue: amountError(form.currentValue, {
      subject: 'O valor atual',
      missing: 'Informe quanto a posição vale hoje!',
      sign: 'non-negative',
    }),
    notes: textError(form.notes, { subject: 'A observação', max: textLimits.notes }),
  };

  if (!form.startDate) {
    errors.startDate = 'Informe a data do primeiro aporte!';
  } else if (form.startDate > todayISO()) {
    errors.startDate = 'O primeiro aporte não pode estar no futuro!';
  }

  return errors;
}

export function InvestmentFormModal({ open, investment, saving, onSubmit, onClose }: InvestmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(investment));
  const { errors, formRef, touch, submit, reset } = useFormValidation(form, validate, { limits });

  useEffect(() => {
    if (!open) return;
    setForm(initialState(investment));
    reset();
  }, [open, investment, reset]);

  const preview = useMemo(() => {
    const invested = parseAmountInput(form.invested);
    const currentValue = parseAmountInput(form.currentValue);
    if (invested === undefined || currentValue === undefined || invested <= 0) return null;

    return { profit: currentValue - invested, profitability: ((currentValue - invested) / invested) * 100 };
  }, [form.invested, form.currentValue]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!submit()) return;

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
          onBlur={() => touch('name')}
          characterLimit={textLimits.investmentName}
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
          onBlur={() => touch('institution')}
          characterLimit={textLimits.institution}
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
          onBlur={() => touch('invested')}
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
          onBlur={() => touch('currentValue')}
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
          onBlur={() => touch('notes')}
          characterLimit={textLimits.notes}
          error={errors.notes}
        />

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

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
