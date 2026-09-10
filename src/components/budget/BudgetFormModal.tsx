import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Budget, BudgetPayload, Categoria, Option } from '@/types';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import { amountError } from '@/utils/validation';
import styles from './BudgetForm.module.css';

interface BudgetFormModalProps {
  open: boolean;
  budget: Budget | null;
  categories: Categoria[];
  usedCategoryIds: string[];
  saving: boolean;
  onSubmit: (payload: BudgetPayload) => void;
  onClose: () => void;
}

interface FormState {
  categoryId: string;
  limit: string;
}

function initialState(budget: Budget | null): FormState {
  return {
    categoryId: budget?.category.id ?? '',
    limit: budget ? toAmountInput(budget.limit) : '',
  };
}

function validate(form: FormState): FieldErrors<FormState> {
  return {
    categoryId: form.categoryId ? undefined : 'Escolha a categoria que receberá o limite!',
    limit: amountError(form.limit, {
      subject: 'O limite mensal',
      missing: 'Informe o limite mensal!',
      sign: 'positive',
    }),
  };
}

export function BudgetFormModal({
  open,
  budget,
  categories,
  usedCategoryIds,
  saving,
  onSubmit,
  onClose,
}: BudgetFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(budget));
  const { errors, formRef, touch, submit, reset } = useFormValidation(form, validate);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(budget));
    reset();
  }, [open, budget, reset]);

  const categoryOptions = useMemo<Option[]>(
    () =>
      categories
        .filter((item) => item.tipo === 'DESPESA')
        .filter((item) => !usedCategoryIds.includes(item.id) || item.id === budget?.category.id)
        .map((item) => ({ value: item.id, label: item.nome })),
    [categories, usedCategoryIds, budget],
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!submit()) return;
    onSubmit({ categoryId: form.categoryId, limit: parseAmountInput(form.limit) ?? 0 });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? 'Editar limite' : 'Novo limite'}
      description="O limite vale todo mês, até você mudá-lo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {budget ? 'Salvar alterações' : 'Definir limite'}
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
        <Select
          required
          label="Categoria"
          placeholder="Selecione a categoria"
          options={categoryOptions}
          value={form.categoryId}
          onChange={(categoryId) => set('categoryId', categoryId)}
          error={errors.categoryId}
          hint={
            categoryOptions.length === 0
              ? 'Todas as categorias de despesa já têm limite definido.'
              : undefined
          }
        />

        <Input
          required
          label="Limite mensal"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.limit}
          onChange={(event) => set('limit', event.target.value)}
          onBlur={() => touch('limit')}
          error={errors.limit}
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
