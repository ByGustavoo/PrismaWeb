import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import type { Budget, BudgetPayload, Categoria, Option } from '@/types';
import { parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './BudgetForm.module.css';

interface BudgetFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  budget: Budget | null;
  categories: Categoria[];
  /** Categorias que ja tem limite: elas saem da lista, exceto a que se edita. */
  usedCategoryIds: string[];
  saving: boolean;
  onSubmit: (payload: BudgetPayload) => void;
  onClose: () => void;
}

interface FormState {
  categoryId: string;
  limit: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(budget: Budget | null): FormState {
  return {
    categoryId: budget?.category.id ?? '',
    limit: budget ? toAmountInput(budget.limit) : '',
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
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(budget));
    setErrors({});
  }, [open, budget]);

  /*
   * Uma categoria tem no maximo um limite, entao as ja orcadas nem aparecem: e
   * melhor nao oferecer a opcao do que deixar o usuario escolher e receber um
   * erro de conflito depois de preencher o valor.
   */
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
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = () => {
    const limit = parseAmountInput(form.limit);
    const found: FormErrors = {};

    if (!form.categoryId) found.categoryId = 'Escolha a categoria que receberá o limite!';
    if (limit === undefined) found.limit = 'Informe o limite mensal!';
    else if (limit <= 0) found.limit = 'O limite precisa ser maior que zero!';

    setErrors(found);

    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    onSubmit({ categoryId: form.categoryId, limit: limit ?? 0 });
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
          error={errors.limit}
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
