import { useCallback, useState } from 'react';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { cartoesService } from '@/services';
import type { ID } from '@/types';

export interface ParcelaAlvo {
  idCompra: ID;
  descricao: string;
  numero: number;
  totalParcelas: number;
  pagamentoAntecipado: boolean;
}

export interface ParcelaEmEspera {
  idCompra: ID;
  numero: number;
}

interface Envio<T> extends ParcelaEmEspera {
  origem: T;
}

export function usePagamentoParcela<T>(dados: T, aoConcluir: () => void) {
  const toast = useNotificacoes();
  const [envio, setEnvio] = useState<Envio<T> | null>(null);

  const emEspera: ParcelaEmEspera | null = envio !== null && envio.origem === dados ? envio : null;

  const alternar = useCallback(
    async (alvo: ParcelaAlvo): Promise<boolean> => {
      const aVista = alvo.totalParcelas === 1;
      const item = aVista ? alvo.descricao : `${alvo.numero}/${alvo.totalParcelas} · ${alvo.descricao}`;

      setEnvio({ idCompra: alvo.idCompra, numero: alvo.numero, origem: dados });

      try {
        if (alvo.pagamentoAntecipado) {
          await cartoesService.desfazerPagamentoParcela(alvo.idCompra, alvo.numero);
          toast.sucesso(aVista ? 'Pagamento da compra desfeito!' : 'Pagamento da parcela desfeito!', item);
        } else {
          await cartoesService.registrarPagamentoParcela(alvo.idCompra, alvo.numero);
          toast.sucesso(aVista ? 'Compra paga e lançada em despesas!' : 'Parcela paga e lançada em despesas!', item);
        }

        aoConcluir();
        return true;
      } catch (erro) {
        toast.erro(
          alvo.pagamentoAntecipado ? 'Não foi possível desfazer o pagamento.' : 'Não foi possível registrar o pagamento.',
          erro,
        );
        setEnvio(null);
        return false;
      }
    },
    [aoConcluir, dados, toast],
  );

  return { emEspera, alternar };
}
