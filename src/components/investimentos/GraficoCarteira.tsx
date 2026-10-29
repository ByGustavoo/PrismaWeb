import { GraficoEvolucao } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import type { PontoEvolucaoDTO } from '@/types';

interface GraficoCarteiraProps {
  dados: PontoEvolucaoDTO[];
}

export function GraficoCarteira({ dados }: GraficoCarteiraProps) {
  return (
    <Painel className="card-hover-accent">
      <CabecalhoPainel
        titulo="Evolução da carteira"
        descricao="Valor da carteira e total aportado nos últimos doze meses"
      />
      <CorpoPainel>
        <GraficoEvolucao dados={dados} rotuloValor="Carteira" />
      </CorpoPainel>
    </Painel>
  );
}
