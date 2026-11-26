import { useEffect, useMemo, useState } from 'react';
import { useVersaoOrigens } from '@/hooks/conta/useVersaoOrigens';
import { categoriaService, contaService } from '@/services';
import type { CategoriaDTO, OrigemDTO, TipoCategoria } from '@/types';

interface Catalogo {
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
}

let pedidoCategorias: Promise<CategoriaDTO[]> | null = null;
let pedidoOrigens: { versao: number; pedido: Promise<OrigemDTO[]> } | null = null;

function carregarCategorias(): Promise<CategoriaDTO[]> {
  const pedido = (pedidoCategorias ??= categoriaService.listar());
  pedido.catch(() => {
    if (pedidoCategorias === pedido) pedidoCategorias = null;
  });
  return pedido;
}

function carregarOrigens(versao: number): Promise<OrigemDTO[]> {
  if (!pedidoOrigens || pedidoOrigens.versao !== versao) {
    const pedido = contaService.listarOrigens();
    pedidoOrigens = { versao, pedido };
    pedido.catch(() => {
      if (pedidoOrigens?.pedido === pedido) pedidoOrigens = null;
    });
  }
  return pedidoOrigens.pedido;
}

export function useCatalogo(ativo = true): Catalogo & { carregado: boolean } {
  const versao = useVersaoOrigens();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    Promise.all([carregarCategorias(), carregarOrigens(versao)])
      .then(([categorias, origens]) => {
        if (!vivo) return;
        setCatalogo({ categorias, origens });
        setFalhou(false);
      })
      .catch(() => {
        if (vivo) setFalhou(true);
      });
    return () => {
      vivo = false;
    };
  }, [ativo, versao]);

  return useMemo(
    () => ({
      categorias: catalogo?.categorias ?? [],
      origens: catalogo?.origens ?? [],
      carregado: catalogo !== null || falhou,
    }),
    [catalogo, falhou],
  );
}

export function useCategoriasDoTipo(tipo: TipoCategoria): CategoriaDTO[] {
  const { categorias } = useCatalogo();
  return useMemo(() => categorias.filter((categoria) => categoria.tipo === tipo), [categorias, tipo]);
}
