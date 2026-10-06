import { useCallback, useState } from 'react';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { cartoesService } from '@/services';
import type { FaturaCartaoDTO } from '@/types';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';

export function usePagamentoFatura<T>(dados: T, aoConcluir: () => void) {
  const toast = useNotificacoes();
  const [envio, setEnvio] = useState<{ origem: T } | null>(null);

  const emEspera = envio !== null && envio.origem === dados;

  const alternar = useCallback(
    async (fatura: FaturaCartaoDTO, desfazer: boolean): Promise<boolean> => {
      const item = `${capitalizar(formatarRotuloMes(fatura.mes))} · ${fatura.nomeCartao}`;

      setEnvio({ origem: dados });

      try {
        if (desfazer) {
          await cartoesService.desfazerPagamentoFatura(fatura.id);
          toast.sucesso('Pagamento da fatura desfeito!', item);
        } else {
          await cartoesService.registrarPagamentoFatura(fatura.id);
          toast.sucesso('Fatura marcada como paga!', item);
        }

        aoConcluir();
        return true;
      } catch (erro) {
        toast.erro(
          desfazer
            ? 'Não foi possível desfazer o pagamento da fatura.'
            : 'Não foi possível registrar o pagamento da fatura.',
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
