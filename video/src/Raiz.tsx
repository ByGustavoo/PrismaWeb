import { Composition } from 'remotion';
import { Apresentacao } from './Apresentacao';
import { carregarFontes } from './fontes';
import { ALTURA, DURACAO_TOTAL, LARGURA, QUADROS_POR_PASSO, QUADROS_POR_SEGUNDO } from './linhaDoTempo';

carregarFontes();

export function Raiz() {
  return (
    <Composition
      id="ApresentacaoPrisma"
      component={Apresentacao}
      durationInFrames={DURACAO_TOTAL * QUADROS_POR_PASSO}
      fps={QUADROS_POR_SEGUNDO}
      width={LARGURA}
      height={ALTURA}
    />
  );
}
