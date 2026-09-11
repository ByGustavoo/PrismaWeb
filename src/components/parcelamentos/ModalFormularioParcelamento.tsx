import { useEffect, useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import { quantidadesParcelas, ehCartaoCredito } from '@/constants/cartoes';
import type { CartaoCredito } from '@/constants/cartoes';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { CartaoDTO, CategoriaDTO, CompraParceladaDTO, Opcao, SalvarCompraParceladaDTO } from '@/types';
import { deslocarChaveMes, hojeISO } from '@/utils/data';
import { capitalizar, formatarRotuloMes, formatarMesCurto, interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioParcelamento.module.css';

interface ModalFormularioParcelamentoProps {
  aberto: boolean;
  compra: CompraParceladaDTO | null;
  cartoes: CartaoDTO[];
  categorias: CategoriaDTO[];
  salvando: boolean;
  aoEnviar: (payload: SalvarCompraParceladaDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  descricao: string;
  valorTotal: string;
  parcelas: string;
  idCartao: string;
  dataCompra: string;
  primeiroMes: string;
  idCategoria: string;
  observacoes: string;
}

const limites = { descricao: limitesTexto.descricao, observacoes: limitesTexto.observacoes };

const opcoesParcelas: Opcao[] = quantidadesParcelas.map((count) => ({ valor: String(count), rotulo: `${count}x`,
}));

function estadoInicial(purchase: CompraParceladaDTO | null): EstadoFormulario {
  return {
    descricao: purchase?.descricao ?? '',
    valorTotal: purchase ? paraEntradaValor(purchase.valorTotal) : '',
    parcelas: String(purchase?.parcelas ?? 10),
    idCartao: purchase?.idCartao ?? '',
    dataCompra: purchase?.dataCompra ?? hojeISO(),
    primeiroMes: purchase?.primeiroMes ?? '',
    idCategoria: purchase?.categoria?.id ?? '',
    observacoes: purchase?.observacoes ?? '',
  };
}

function primeiroMesPadrao(card: CartaoCredito | undefined, purchaseDate: string): string {
  const month = purchaseDate.slice(0, 7);
  if (!card) return month;
  const day = Number(purchaseDate.slice(8, 10));
  return day <= card.diaFechamento ? month : deslocarChaveMes(month, 1);
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    descricao: erroTexto(form.descricao, {
      sujeito: 'A descrição da compra',
      ausente: 'Informe a descrição da compra!',
      maximo: limitesTexto.descricao,
    }),
    valorTotal: erroValor(form.valorTotal, {
      sujeito: 'O valor total da compra',
      ausente: 'Informe o valor total da compra!',
      sinal: 'positive',
    }),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (!form.idCartao) {
    errors.idCartao = 'Escolha o cartão de crédito da compra!';
  }
  if (!form.dataCompra) {
    errors.dataCompra = 'Informe a data da compra!';
  }

  return errors;
}

export function ModalFormularioParcelamento({
  aberto,
  compra,
  cartoes,
  categorias,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioParcelamentoProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(compra));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar, { limites });

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(compra));
    reiniciar();
  }, [aberto, compra, reiniciar]);

  const creditCards = useMemo(() => cartoes.filter(ehCartaoCredito), [cartoes]);

  const cardOptions = useMemo<Opcao[]>(
    () =>
      creditCards
        .filter((card) => card.situacao === 'ATIVO' || card.id === compra?.idCartao)
        .map((card) => ({ valor: card.id, rotulo: card.nome })),
    [creditCards, compra],
  );

  const expenseCategoryOptions = useMemo<Opcao[]>(
    () =>
      categorias
        .filter((item) => item.tipo === 'DESPESA')
        .map((item) => ({ valor: item.id, rotulo: item.nome })),
    [categorias],
  );

  const selectedCard = creditCards.find((card) => card.id === form.idCartao);
  const suggestedMonth = primeiroMesPadrao(selectedCard, form.dataCompra);
  const firstMonth = form.primeiroMes || suggestedMonth;

  const monthOptions = useMemo<Opcao[]>(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const month = deslocarChaveMes(suggestedMonth, index - 1);
        return { valor: month, rotulo: capitalizar(formatarRotuloMes(month)) + (month === suggestedMonth ? ' (sugerido)' : ''),
        };
      }),
    [suggestedMonth],
  );

  const count = Number(form.parcelas) || 0;
  const total = interpretarEntradaValor(form.valorTotal);
  const lastMonth = count > 1 ? deslocarChaveMes(firstMonth, count - 1) : firstMonth;

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    aoEnviar({
      descricao: form.descricao,
      valorTotal: interpretarEntradaValor(form.valorTotal) ?? 0,
      parcelas: count,
      dataCompra: form.dataCompra,
      primeiroMes: firstMonth,
      idCartao: form.idCartao,
      idCategoria: form.idCategoria || undefined,
      observacoes: form.observacoes,
    });
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={compra ? 'Editar compra parcelada' : 'Nova compra parcelada'}
      descricao="As parcelas entram automaticamente nas faturas dos próximos meses."
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {compra ? 'Salvar alterações' : 'Cadastrar compra'}
          </Botao>
        </>
      }
    >
      <form
        ref={refFormulario}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <CampoTexto
          className={styles.full}
          required
          rotulo="Descrição"
          placeholder="Notebook, geladeira, passagens..."
          value={form.descricao}
          onChange={(event) => set('descricao', event.target.value)}
          onBlur={() => tocar('descricao')}
          limiteCaracteres={limitesTexto.descricao}
          erro={erros.descricao}
          autoFocus
        />

        <CampoTexto
          required
          rotulo="Valor total"
          prefixo="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={form.valorTotal}
          onChange={(event) => set('valorTotal', event.target.value)}
          onBlur={() => tocar('valorTotal')}
          erro={erros.valorTotal}
          dica="O valor cheio da compra, não o da parcela."
        />

        <CampoSelecao
          required
          rotulo="Parcelas"
          opcoes={opcoesParcelas}
          value={form.parcelas}
          onChange={(value) => set('parcelas', value)}
        />

        <CampoSelecao
          required
          rotulo="Cartão"
          placeholder="Selecione o cartão"
          opcoes={cardOptions}
          value={form.idCartao}
          onChange={(cardId) => {
            set('idCartao', cardId);
            set('primeiroMes', '');
          }}
          erro={erros.idCartao}
        />

        <SeletorData
          required
          rotulo="Data da compra"
          value={form.dataCompra}
          onChange={(purchaseDate) => {
            set('dataCompra', purchaseDate);
            set('primeiroMes', '');
          }}
          erro={erros.dataCompra}
        />

        <CampoSelecao
          rotulo="Primeira parcela em"
          opcoes={monthOptions}
          value={firstMonth}
          onChange={(month) => set('primeiroMes', month)}
        />

        <CampoSelecao
          rotulo="Categoria"
          placeholder="Opcional: ajuda a classificar o gasto"
          opcoes={expenseCategoryOptions}
          value={form.idCategoria}
          onChange={(categoryId) => set('idCategoria', categoryId)}
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder="Opcional: detalhes que ajudam a lembrar desta compra."
          value={form.observacoes}
          onChange={(event) => set('observacoes', event.target.value)}
          onBlur={() => tocar('observacoes')}
          limiteCaracteres={limitesTexto.observacoes}
          erro={erros.observacoes}
        />

        {total && total > 0 && count > 1 ? (
          <p className={styles.preview}>
            <strong className={styles.previewValue}>
              <span className="tabular">{count}x</span> de{' '}
              <ValorMonetario valor={Math.floor((total * 100) / count) / 100} tamanho="md" />
            </strong>
            <span>
              De {formatarMesCurto(firstMonth)} a {formatarMesCurto(lastMonth)}
              {selectedCard ? `, na fatura do ${selectedCard.nome}` : ''}.
            </span>
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
