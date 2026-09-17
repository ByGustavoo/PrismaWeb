import { useEffect, useMemo, useState } from 'react';
import { Botao, Modal, CampoSelecao, CampoValor } from '@/components/ui';
import { useValidacaoFormulario } from '@/hooks/useValidacaoFormulario';
import type { ErrosCampos } from '@/hooks/useValidacaoFormulario';
import type { CategoriaDTO, Opcao, OrcamentoDTO, SalvarOrcamentoDTO } from '@/types';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import { erroValor } from '@/utils/validacao';
import styles from './FormularioOrcamento.module.css';

interface ModalFormularioOrcamentoProps {
  aberto: boolean;
  orcamento: OrcamentoDTO | null;
  categorias: CategoriaDTO[];
  idsCategoriasUsadas: string[];
  salvando: boolean;
  aoEnviar: (payload: SalvarOrcamentoDTO) => void;
  aoFechar: () => void;
}

interface EstadoFormulario {
  idCategoria: string;
  limite: string;
}

function estadoInicial(budget: OrcamentoDTO | null): EstadoFormulario {
  return {
    idCategoria: budget?.categoria.id ?? '',
    limite: budget ? paraEntradaValor(budget.limiteMensal) : '',
  };
}

function validar(form: EstadoFormulario): ErrosCampos<EstadoFormulario> {
  return {
    idCategoria: form.idCategoria ? undefined : 'Escolha a categoria que receberá o limite!',
    limite: erroValor(form.limite, {
      sujeito: 'O limite mensal',
      ausente: 'Informe o limite mensal!',
      sinal: 'positive',
    }),
  };
}

export function ModalFormularioOrcamento({
  aberto,
  orcamento,
  categorias,
  idsCategoriasUsadas,
  salvando,
  aoEnviar,
  aoFechar,
}: ModalFormularioOrcamentoProps) {
  const [form, setForm] = useState<EstadoFormulario>(() => estadoInicial(orcamento));
  const { erros, refFormulario, tocar, enviar, reiniciar } = useValidacaoFormulario(form, validar);

  useEffect(() => {
    if (!aberto) return;
    setForm(estadoInicial(orcamento));
    reiniciar();
  }, [aberto, orcamento, reiniciar]);

  const categoryOptions = useMemo<Opcao[]>(
    () =>
      categorias
        .filter((item) => item.tipo === 'DESPESA')
        .filter((item) => !idsCategoriasUsadas.includes(item.id) || item.id === orcamento?.categoria.id)
        .map((item) => ({ valor: item.id, rotulo: item.nome })),
    [categorias, idsCategoriasUsadas, orcamento],
  );

  const set = <K extends keyof EstadoFormulario>(field: K, value: EstadoFormulario[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!enviar()) return;
    aoEnviar({ idCategoria: form.idCategoria, limiteMensal: interpretarEntradaValor(form.limite) ?? 0 });
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={orcamento ? 'Editar limite' : 'Novo limite'}
      descricao="O limite vale todo mês, até você mudá-lo."
      rodape={
        <>
          <Botao variante="secondary" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Botao>
          <Botao onClick={handleSubmit} carregando={salvando}>
            {orcamento ? 'Salvar alterações' : 'Definir limite'}
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
        <CampoSelecao
          required
          rotulo="Categoria"
          placeholder="Selecione a categoria"
          opcoes={categoryOptions}
          value={form.idCategoria}
          onChange={(categoryId) => set('idCategoria', categoryId)}
          erro={erros.idCategoria}
          dica={
            categoryOptions.length === 0
              ? 'Todas as categorias de despesa já têm limite definido.'
              : undefined
          }
        />

        <CampoValor
          required
          rotulo="Limite mensal"
          valor={form.limite}
          aoMudar={(value) => set('limite', value)}
          onBlur={() => tocar('limite')}
          erro={erros.limite}
        />

        <p className={styles.legend}>* Campos obrigatórios.</p>

        <button type="submit" className="visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
