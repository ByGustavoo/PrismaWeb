import { useEffect, useRef, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Textarea } from '@/components/ui';
import { goalStatusOptions } from '@/constants/goals';
import type { Goal, GoalPayload, GoalStatus, GoalUpdatePayload } from '@/types';
import { todayISO } from '@/utils/date';
import { parseAmountInput } from '@/utils/format';
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

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(goal: Goal | null): FormState {
  return {
    name: goal?.name ?? '',
    url: goal?.url ?? '',
    imageUrl: goal?.imageUrl ?? '',
    price: '',
    date: todayISO(),
    status: goal?.status ?? 'tracking',
    notes: goal?.notes ?? '',
  };
}

/** Endereco que o navegador consegue abrir; um "www.loja.com" solto nao abre. */
function isLink(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

function validate(form: FormState, editing: boolean): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Informe um nome com pelo menos 2 caracteres!';
  }
  if (form.url.trim() && !isLink(form.url)) {
    errors.url = 'O link precisa começar com http:// ou https://!';
  }
  if (form.imageUrl.trim() && !isLink(form.imageUrl)) {
    errors.imageUrl = 'O endereço da imagem precisa começar com http:// ou https://!';
  }

  // Preco e data so existem no cadastro: ver o comentario de GoalFormResult.
  if (editing) return errors;

  const price = parseAmountInput(form.price);
  if (price === undefined) {
    errors.price = 'Informe o preço que você viu!';
  } else if (price <= 0) {
    errors.price = 'O preço precisa ser maior que zero!';
  }

  if (!form.date) {
    errors.date = 'Informe a data do registro!';
  } else if (form.date > todayISO()) {
    errors.date = 'A data do registro não pode estar no futuro!';
  }

  return errors;
}

export function GoalFormModal({ open, goal, saving, onSubmit, onClose }: GoalFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(goal));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const editing = goal !== null;

  useEffect(() => {
    if (!open) return;
    setForm(initialState(goal));
    setErrors({});
  }, [open, goal]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = () => {
    const found = validate(form, editing);
    setErrors(found);

    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

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
          error={errors.imageUrl}
          hint="Opcional. Sem ela, a meta usa um marcador."
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: o modelo exato, a cor, o preço que você considera justo."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
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
