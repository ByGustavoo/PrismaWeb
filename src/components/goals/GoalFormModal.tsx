import { useEffect, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { goalStatusOptions } from '@/constants/goals';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Goal, GoalPayload, GoalStatus, GoalUpdatePayload } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import styles from './GoalForm.module.css';

/**
 * O cadastro e a edicao enviam corpos diferentes, e nao por detalhe de
 * implementacao: preco novo e sempre um registro novo, entao a edicao nao tem
 * como carregar preco sem apagar um ponto do historico.
 */
export type GoalFormResult =
  | { mode: 'create'; data: GoalPayload }
  | { mode: 'update'; data: GoalUpdatePayload };

interface GoalFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  goal: Goal | null;
  saving: boolean;
  onSubmit: (result: GoalFormResult) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  url: string;
  imageUrl: string;
  price: string;
  date: string;
  status: GoalStatus;
  notes: string;
}

const limits = {
  name: textLimits.goalName,
  url: textLimits.link,
  imageUrl: textLimits.link,
  notes: textLimits.notes,
};

function initialState(goal: Goal | null): FormState {
  return {
    name: goal?.name ?? '',
    url: goal?.url ?? '',
    imageUrl: goal?.imageUrl ?? '',
    price: '',
    date: todayISO(),
    status: goal?.status ?? 'ACOMPANHANDO',
    notes: goal?.notes ?? '',
  };
}

/** Link opcional: vazio passa; preenchido, precisa ser algo que o navegador abra. */
function linkError(value: string, subject: string): string | undefined {
  const trimmed = value.trim();
  const tooLong = textError(value, { subject, max: textLimits.link });

  if (!trimmed || tooLong) return tooLong;
  // Um "www.loja.com" solto nao abre; um link com espaco no meio foi colado pela metade.
  if (/\s/.test(trimmed)) return `${subject} não pode ter espaços!`;
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return `${subject} precisa começar com http:// ou https://!`;
  return undefined;
}

function validate(form: FormState, editing: boolean): FieldErrors<FormState> {
  const errors: FieldErrors<FormState> = {
    name: textError(form.name, {
      subject: 'O nome do produto',
      missing: 'Informe o nome do produto!',
      max: textLimits.goalName,
    }),
    url: linkError(form.url, 'O link do produto'),
    imageUrl: linkError(form.imageUrl, 'O endereço da imagem'),
    notes: textError(form.notes, { subject: 'A observação', max: textLimits.notes }),
  };

  // Preco e data so existem no cadastro: ver o comentario de GoalFormResult.
  if (editing) return errors;

  errors.price = amountError(form.price, {
    subject: 'O preço inicial',
    missing: 'Informe o preço que você viu!',
    sign: 'positive',
  });

  if (!form.date) {
    errors.date = 'Informe a data do registro!';
  } else if (form.date > todayISO()) {
    errors.date = 'A data do registro não pode estar no futuro!';
  }

  return errors;
}

export function GoalFormModal({ open, goal, saving, onSubmit, onClose }: GoalFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(goal));
  const editing = goal !== null;
  const { errors, formRef, touch, submit, reset } = useFormValidation(
    form,
    (values) => validate(values, editing),
    { limits },
  );

  useEffect(() => {
    if (!open) return;
    setForm(initialState(goal));
    reset();
  }, [open, goal, reset]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!submit()) return;

    const shared = {
      name: form.name,
      url: form.url.trim(),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
      notes: form.notes,
    };

    onSubmit(
      editing
        ? { mode: 'update', data: shared }
        : { mode: 'create', data: { ...shared, price: parseAmountInput(form.price) ?? 0, date: form.date } },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar meta' : 'Nova meta'}
      description={
        editing
          ? 'Aqui ficam o produto, o link e a situação. O preço tem caminho próprio.'
          : 'O preço informado agora vira o primeiro registro do histórico da meta.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {editing ? 'Salvar alterações' : 'Cadastrar meta'}
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
          label="Produto"
          placeholder="Tênis Nike Pegasus 41, cadeira ergonômica..."
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          onBlur={() => touch('name')}
          characterLimit={textLimits.goalName}
          error={errors.name}
          autoFocus
        />

        <Input
          className={styles.full}
          label="Link do produto"
          type="url"
          inputMode="url"
          placeholder="https://loja.com.br/produto"
          value={form.url}
          onChange={(event) => set('url', event.target.value)}
          onBlur={() => touch('url')}
          characterLimit={textLimits.link}
          error={errors.url}
          hint="Opcional. É por ele que a meta abre a página quando você for consultar o preço."
        />

        {editing ? null : (
          <>
            <Input
              required
              label="Preço inicial"
              prefix="R$"
              inputMode="decimal"
              placeholder="0,00"
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
              onBlur={() => touch('price')}
              error={errors.price}
              hint="Quanto o produto custa hoje."
            />

            <DatePicker
              required
              label="Data do registro"
              max={todayISO()}
              value={form.date}
              onChange={(date) => set('date', date)}
              error={errors.date}
              hint="Deixe em hoje se acabou de consultar."
            />
          </>
        )}

        <Select
          required
          label="Situação"
          options={goalStatusOptions}
          value={form.status}
          onChange={(status) => set('status', status as GoalStatus)}
        />

        <Input
          label="Imagem do produto"
          type="url"
          inputMode="url"
          placeholder="https://loja.com.br/foto.jpg"
          value={form.imageUrl}
          onChange={(event) => set('imageUrl', event.target.value)}
          onBlur={() => touch('imageUrl')}
          characterLimit={textLimits.link}
          error={errors.imageUrl}
          hint="Opcional. Sem ela, a meta usa um marcador."
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: o modelo exato, a cor, o preço que você considera justo."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
          onBlur={() => touch('notes')}
          characterLimit={textLimits.notes}
          error={errors.notes}
        />

        {editing ? (
          <p className={styles.note}>
            Para anotar um preço novo, use <strong>Registrar preço</strong> no histórico da meta. É assim que a
            série continua completa — dela saem o menor preço, a média e o gráfico.
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        {/* Envio pelo Enter dentro do formulario; o botao visivel fica no rodape do modal. */}
        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
