import { useEffect, useMemo, useRef, useState } from 'react';
import { Amount } from '@/components/common';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { installmentCounts, isCreditCard } from '@/constants/cards';
import type { CreditCard } from '@/constants/cards';
import type { Card, Category, InstallmentPayload, InstallmentPurchase, Option } from '@/types';
import { shiftMonthKey, todayISO } from '@/utils/date';
import { capitalize, formatMonthLabel, formatShortMonth, parseAmountInput, toAmountInput } from '@/utils/format';
import styles from './InstallmentForm.module.css';

interface InstallmentFormModalProps {
  open: boolean;
  /** Presente apenas na edicao. */
  purchase: InstallmentPurchase | null;
  cards: Card[];
  categories: Category[];
  saving: boolean;
  onSubmit: (payload: InstallmentPayload) => void;
  onClose: () => void;
}

interface FormState {
  description: string;
  totalAmount: string;
  count: string;
  cardId: string;
  purchaseDate: string;
  firstMonth: string;
  categoryId: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const countOptions: Option[] = installmentCounts.map((count) => ({
  value: String(count),
  label: `${count}x`,
}));

function initialState(purchase: InstallmentPurchase | null): FormState {
  return {
    description: purchase?.description ?? '',
    totalAmount: purchase ? toAmountInput(purchase.totalAmount) : '',
    count: String(purchase?.count ?? 10),
    cardId: purchase?.cardId ?? '',
    purchaseDate: purchase?.purchaseDate ?? todayISO(),
    firstMonth: purchase?.firstMonth ?? '',
    categoryId: purchase?.category?.id ?? '',
    notes: purchase?.notes ?? '',
  };
}

/**
 * Mes em que a primeira parcela cai: compra feita depois do fechamento entra so
 * na fatura seguinte. E o mesmo criterio que a fatura usa para montar o ciclo,
 * entao o padrao sugerido aqui coincide com o que a tela de faturas vai mostrar.
 */
function defaultFirstMonth(card: CreditCard | undefined, purchaseDate: string): string {
  const month = purchaseDate.slice(0, 7);
  if (!card) return month;
  const day = Number(purchaseDate.slice(8, 10));
  return day <= card.closingDay ? month : shiftMonthKey(month, 1);
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const total = parseAmountInput(form.totalAmount);

  if (form.description.trim().length < 2) {
    errors.description = 'Informe uma descrição com pelo menos 2 caracteres.';
  }
  if (total === undefined) {
    errors.totalAmount = 'Informe o valor total da compra.';
  } else if (total <= 0) {
    errors.totalAmount = 'O valor precisa ser maior que zero.';
  }
  if (!form.cardId) {
    errors.cardId = 'Escolha o cartão de crédito da compra.';
  }
  if (!form.purchaseDate) {
    errors.purchaseDate = 'Informe a data da compra.';
  }

  return errors;
}

export function InstallmentFormModal({
  open,
  purchase,
  cards,
  categories,
  saving,
  onSubmit,
  onClose,
}: InstallmentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(purchase));
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialState(purchase));
    setErrors({});
  }, [open, purchase]);

  const creditCards = useMemo(() => cards.filter(isCreditCard), [cards]);

  const cardOptions = useMemo<Option[]>(
    () =>
      creditCards
        .filter((card) => card.status === 'active' || card.id === purchase?.cardId)
        .map((card) => ({ value: card.id, label: card.name })),
    [creditCards, purchase],
  );

  const expenseCategoryOptions = useMemo<Option[]>(
    () =>
      categories
        .filter((item) => item.kind === 'expense')
        .map((item) => ({ value: item.id, label: item.name })),
    [categories],
  );

  const selectedCard = creditCards.find((card) => card.id === form.cardId);
  const suggestedMonth = defaultFirstMonth(selectedCard, form.purchaseDate);
  const firstMonth = form.firstMonth || suggestedMonth;

  /*
   * Meses oferecidos: o sugerido, o anterior e os tres seguintes. Vale poder
   * ajustar — compra parcelada com carencia comeca depois —, mas uma lista de
   * doze meses tiraria a forca do padrao, que acerta na maioria dos casos.
   */
  const monthOptions = useMemo<Option[]>(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const month = shiftMonthKey(suggestedMonth, index - 1);
        return {
          value: month,
          label: capitalize(formatMonthLabel(month)) + (month === suggestedMonth ? ' (sugerido)' : ''),
        };
      }),
    [suggestedMonth],
  );

  const count = Number(form.count) || 0;
  const total = parseAmountInput(form.totalAmount);
  const lastMonth = count > 1 ? shiftMonthKey(firstMonth, count - 1) : firstMonth;

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
      description: form.description,
      totalAmount: parseAmountInput(form.totalAmount) ?? 0,
      count,
      purchaseDate: form.purchaseDate,
      firstMonth,
      cardId: form.cardId,
      categoryId: form.categoryId || undefined,
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchase ? 'Editar compra parcelada' : 'Nova compra parcelada'}
      description="As parcelas entram automaticamente nas faturas dos próximos meses."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {purchase ? 'Salvar alterações' : 'Cadastrar compra'}
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
          placeholder="Notebook, geladeira, passagens..."
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          error={errors.description}
          autoFocus
        />

        <Input
          required
          label="Valor total"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.totalAmount}
          onChange={(event) => set('totalAmount', event.target.value)}
          error={errors.totalAmount}
          hint="O valor cheio da compra, não o da parcela."
        />

        <Select
          required
          label="Parcelas"
          options={countOptions}
          value={form.count}
          onChange={(value) => set('count', value)}
        />

        <Select
          required
          label="Cartão"
          placeholder="Selecione o cartão"
          options={cardOptions}
          value={form.cardId}
          onChange={(cardId) => {
            set('cardId', cardId);
            // O mes sugerido depende do fechamento do cartao: trocar de cartao
            // com um mes escolhido a mao guardaria a escolha do cartao anterior.
            set('firstMonth', '');
          }}
          error={errors.cardId}
        />

        <Input
          required
          label="Data da compra"
          type="date"
          value={form.purchaseDate}
          onChange={(event) => {
            set('purchaseDate', event.target.value);
            set('firstMonth', '');
          }}
          error={errors.purchaseDate}
        />

        <Select
          label="Primeira parcela em"
          options={monthOptions}
          value={firstMonth}
          onChange={(month) => set('firstMonth', month)}
        />

        <Select
          label="Categoria"
          placeholder="Opcional: ajuda a classificar o gasto"
          options={expenseCategoryOptions}
          value={form.categoryId}
          onChange={(categoryId) => set('categoryId', categoryId)}
        />

        <Textarea
          className={styles.full}
          label="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar desta compra."
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />

        {/*
          A previa responde antes do envio a pergunta que a tela toda existe para
          responder: quanto e cada parcela e ate quando ela aparece nas faturas.
        */}
        {total && total > 0 && count > 1 ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <span className="tabular">{count}x</span> de{' '}
              <Amount value={Math.floor((total * 100) / count) / 100} size="md" />
            </strong>
            <span>
              De {formatShortMonth(firstMonth)} a {formatShortMonth(lastMonth)}
              {selectedCard ? `, na fatura do ${selectedCard.name}` : ''}.
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
