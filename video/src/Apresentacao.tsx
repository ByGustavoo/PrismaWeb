import type { ComponentType } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Abertura } from './cenas/Abertura';
import { Avisos } from './cenas/Avisos';
import { Cartoes } from './cenas/Cartoes';
import { Confianca } from './cenas/Confianca';
import { Contas } from './cenas/Contas';
import { Dashboard } from './cenas/Dashboard';
import { Encerramento } from './cenas/Encerramento';
import { Faturas } from './cenas/Faturas';
import { Gancho } from './cenas/Gancho';
import { Investimentos } from './cenas/Investimentos';
import { Lancamentos } from './cenas/Lancamentos';
import { Metas } from './cenas/Metas';
import { Orcamento } from './cenas/Orcamento';
import { Parcelas } from './cenas/Parcelas';
import { Previsao } from './cenas/Previsao';
import { Recorrentes } from './cenas/Recorrentes';
import { Relatorios } from './cenas/Relatorios';
import { Fundo } from './componentes/Fundo';
import { cenas, ordemCenas, QUADROS_POR_PASSO } from './linhaDoTempo';
import type { NomeCena } from './linhaDoTempo';

export const ARQUIVO_TRILHA = 'audio/trilha.wav';

const componentesCena: Record<NomeCena, ComponentType> = {
  abertura: Abertura,
  gancho: Gancho,
  dashboard: Dashboard,
  lancamentos: Lancamentos,
  contas: Contas,
  cartoes: Cartoes,
  faturas: Faturas,
  parcelas: Parcelas,
  orcamento: Orcamento,
  previsao: Previsao,
  recorrentes: Recorrentes,
  metas: Metas,
  investimentos: Investimentos,
  relatorios: Relatorios,
  avisos: Avisos,
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
          <Sequence
            key={nome}
            from={cenas[nome].inicio * QUADROS_POR_PASSO}
            durationInFrames={cenas[nome].duracao * QUADROS_POR_PASSO}
            name={nome}
          >
            <Cena />
          </Sequence>
        );
      })}
      <Audio src={staticFile(ARQUIVO_TRILHA)} />
    </AbsoluteFill>
  );
}
