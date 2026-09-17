import { GraficoEvolucao } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import type { PontoEvolucaoDTO } from '@/types';

interface GraficoCarteiraProps {
  dados: PontoEvolucaoDTO[];
}

export function GraficoCarteira({ dados }: GraficoCarteiraProps) {
  return (
    <Painel>
      <CabecalhoPainel
        titulo="Evolução do patrimônio"
        descricao="Patrimônio acumulado e total aportado nos últimos doze meses"
      />
      <CorpoPainel>
        <GraficoEvolucao dados={dados} />
      </CorpoPainel>
    </Painel>
  );
}
