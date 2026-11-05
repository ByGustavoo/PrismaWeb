import { Composition } from 'remotion';
import { Apresentacao, ApresentacaoCelular } from './Apresentacao';
import { carregarFontes } from './fontes';
import { ALTURA, ALTURA_RETRATO, DURACAO_TOTAL, LARGURA, LARGURA_RETRATO, QUADROS_POR_PASSO, QUADROS_POR_SEGUNDO } from './linhaDoTempo';

carregarFontes();

export function Raiz() {
  return (
    <>
      <Composition
        id="ApresentacaoPrisma"
        component={Apresentacao}
        durationInFrames={DURACAO_TOTAL * QUADROS_POR_PASSO}
        fps={QUADROS_POR_SEGUNDO}
        width={LARGURA}
        height={ALTURA}
      />
      <Composition
        id="ApresentacaoPrismaCelular"
        component={ApresentacaoCelular}
        durationInFrames={DURACAO_TOTAL * QUADROS_POR_PASSO}
        fps={QUADROS_POR_SEGUNDO}
        width={LARGURA_RETRATO}
        height={ALTURA_RETRATO}
      />
    </>
  );
}
