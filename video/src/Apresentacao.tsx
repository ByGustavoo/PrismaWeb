import type { ComponentType } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Abertura } from './cenas/Abertura';
import { Confianca } from './cenas/Confianca';
import { Dashboard } from './cenas/Dashboard';
import { Encerramento } from './cenas/Encerramento';
import { Gancho } from './cenas/Gancho';
import { Investimentos } from './cenas/Investimentos';
import { Metas } from './cenas/Metas';
import { Orcamento } from './cenas/Orcamento';
import { Parcelas } from './cenas/Parcelas';
import { Previsao } from './cenas/Previsao';
import { Fundo } from './componentes/Fundo';
import { cenas, ordemCenas } from './linhaDoTempo';
import type { NomeCena } from './linhaDoTempo';

export const ARQUIVO_TRILHA = 'audio/trilha.wav';

const componentesCena: Record<NomeCena, ComponentType> = {
  abertura: Abertura,
  gancho: Gancho,
  dashboard: Dashboard,
  parcelas: Parcelas,
  orcamento: Orcamento,
  previsao: Previsao,
  investimentos: Investimentos,
  metas: Metas,
  confianca: Confianca,
  encerramento: Encerramento,
};

export function Apresentacao() {
  return (
    <AbsoluteFill>
      <Fundo />
      {ordemCenas.map((nome) => {
        const Cena = componentesCena[nome];
        return (
          <Sequence key={nome} from={cenas[nome].inicio} durationInFrames={cenas[nome].duracao} name={nome}>
            <Cena />
          </Sequence>
        );
      })}
      <Audio src={staticFile(ARQUIVO_TRILHA)} />
    </AbsoluteFill>
  );
}
