import { useEffect, useState } from 'react';
import { Botao, SeletorData, CampoTexto, Modal, CampoSelecao, AreaTexto } from '@/components/ui';
import { opcoesSituacaoMeta } from '@/constants/metas';
import { limitesTexto } from '@/constants/validacao';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { AtualizarMetaDTO, MetaDTO, SalvarMetaDTO, SituacaoMeta } from '@/types';
import { hojeISO } from '@/utils/data';
import { interpretarEntradaValor } from '@/utils/formatacao';
import { erroValor, erroTexto } from '@/utils/validacao';
import styles from './FormularioMeta.module.css';

export type ResultadoFormularioMeta =
  | { modo: 'create'; dados: SalvarMetaDTO }
  | { modo: 'update'; dados: AtualizarMetaDTO };

interface ModalFormularioMetaProps {
  aberto: boolean;
  meta: MetaDTO | null;
  salvando: boolean;
  aoEnviar: (result: ResultadoFormularioMeta) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  nome: string;
  url: string;
  urlImagem: string;
  preco: string;
  data: string;
  situacao: SituacaoMeta;
  observacoes: string;
}

const limites = {
  nome: limitesTexto.nomeMeta,
  url: limitesTexto.link,
  urlImagem: limitesTexto.link,
  observacoes: limitesTexto.observacoes,
};

function estadoInicial(goal: MetaDTO | null): EstadoFormulario {
  return {
    nome: goal?.nome ?? '',
    url: goal?.url ?? '',
    urlImagem: goal?.urlImagem ?? '',
    preco: '',
    data: hojeISO(),
    situacao: goal?.situacao ?? 'ACOMPANHANDO',
    observacoes: goal?.observacoes ?? '',
  };
}

function erroLink(value: string, subject: string): string | undefined {
  const trimmed = value.trim();
  const tooLong = erroTexto(value, { sujeito: subject, maximo: limitesTexto.link });

  if (!trimmed || tooLong) return tooLong;
  if (/\s/.test(trimmed)) return `${subject} não pode ter espaços!`;
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return `${subject} precisa começar com http:// ou https://!`;
  return undefined;
}

function validar(form: EstadoFormulario, editing: boolean): ErrosCampos<EstadoFormulario> {
  const errors: ErrosCampos<EstadoFormulario> = {
    nome: erroTexto(form.nome, {
      sujeito: 'O nome do produto',
      ausente: 'Informe o nome do produto!',
      maximo: limitesTexto.nomeMeta,
    }),
    url: erroLink(form.url, 'O link do produto'),
    urlImagem: erroLink(form.urlImagem, 'O endereço da imagem'),
    observacoes: erroTexto(form.observacoes, { sujeito: 'A observação', maximo: limitesTexto.observacoes }),
  };

  if (editing) return errors;

  errors.preco = erroValor(form.preco, {
    sujeito: 'O preço inicial',
    ausente: 'Informe o preço que você viu!',
    sinal: 'positive',
  });

  if (!form.data) {
    errors.data = 'Informe a data do registro!';
  } else if (form.data > hojeISO()) {
    errors.data = 'A data do registro não pode estar no futuro!';
  }

  return errors;
}

export function ModalFormularioMeta({ aberto, meta, salvando, aoEnviar, aoFechar }: ModalFormularioMetaProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(meta));
  const editing = meta !== null;
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(
    form,
    (values) => validar(values, editing),
    { limites },
  );

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(meta));
    reiniciar();
  }, [aberto, meta, reiniciar]);

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;

    const shared = {
      nome: form.nome,
      url: form.url.trim(),
      urlImagem: form.urlImagem.trim(),
      situacao: form.situacao,
      observacoes: form.observacoes,
    };

    aoEnviar(
      editing
        ? { modo: 'update', dados: shared }
        : { modo: 'create', dados: { ...shared, preco: interpretarEntradaValor(form.preco) ?? 0, data: form.data } },
    );
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editing ? 'Editar meta' : 'Nova meta'}
      descricao={
        editing
          ? 'Aqui ficam o produto, o link e a situação. O preço tem caminho próprio.'
          : 'O preço informado agora vira o primeiro registro do histórico da meta.'
      }
      tamanho="lg"
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {editing ? 'Salvar alterações' : 'Cadastrar meta'}
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
          rotulo="Produto"
          placeholder="Tênis Nike Pegasus 41, cadeira ergonômica..."
          value={form.nome}
          onChange={(event) => set('nome', event.target.value)}
          onBlur={() => tocar('nome')}
          limiteCaracteres={limitesTexto.nomeMeta}
          erro={erros.nome}
          autoFocus
        />

        <CampoTexto
          className={styles.full}
          rotulo="Link do produto"
          type="url"
          inputMode="url"
          placeholder="https://loja.com.br/produto"
          value={form.url}
          onChange={(event) => set('url', event.target.value)}
          onBlur={() => tocar('url')}
          limiteCaracteres={limitesTexto.link}
          erro={erros.url}
          dica="Opcional. É por ele que a meta abre a página quando você for consultar o preço."
        />

        {editing ? null : (
          <>
            <CampoTexto
              required
              rotulo="Preço inicial"
              prefixo="R$"
              inputMode="decimal"
              placeholder="0,00"
              value={form.preco}
              onChange={(event) => set('preco', event.target.value)}
              onBlur={() => tocar('preco')}
              erro={erros.preco}
              dica="Quanto o produto custa hoje."
            />

            <SeletorData
              required
              rotulo="Data do registro"
              max={hojeISO()}
              value={form.data}
              onChange={(date) => set('data', date)}
              erro={erros.data}
              dica="Deixe em hoje se acabou de consultar."
            />
          </>
        )}

        <CampoSelecao
          required
          rotulo="Situação"
          opcoes={opcoesSituacaoMeta}
          value={form.situacao}
          onChange={(status) => set('situacao', status as SituacaoMeta)}
        />

        <CampoTexto
          rotulo="Imagem do produto"
          type="url"
          inputMode="url"
          placeholder="https://loja.com.br/foto.jpg"
          value={form.urlImagem}
          onChange={(event) => set('urlImagem', event.target.value)}
          onBlur={() => tocar('urlImagem')}
          limiteCaracteres={limitesTexto.link}
          erro={erros.urlImagem}
          dica="Opcional. Sem ela, a meta usa um marcador."
        />

        <AreaTexto
          className={styles.full}
          rotulo="Observação"
          placeholder="Opcional: o modelo exato, a cor, o preço que você considera justo."
          value={form.observacoes}
          onChange={(event) => set('observacoes', event.target.value)}
          onBlur={() => tocar('observacoes')}
          limiteCaracteres={limitesTexto.observacoes}
          erro={erros.observacoes}
        />

        {editing ? (
          <p className={styles.note}>
            Para anotar um preço novo, use <strong>Registrar preço</strong> no histórico da meta. É assim que a
            série continua completa — dela saem o menor preço, a média e o gráfico.
          </p>
        ) : null}

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
