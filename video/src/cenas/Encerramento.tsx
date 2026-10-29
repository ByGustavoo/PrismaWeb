import { AbsoluteFill } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso, usePasso } from '../animacao';
import { MarcaAnimada } from '../componentes/MarcaAnimada';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { cenas, encerramento } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

export function Encerramento() {
  const passo = usePasso();
  const marca = mola(passo, encerramento.marca, 110, 14);
  const nome = progresso(passo, encerramento.nome, 20);
  const respiro = progresso(passo, 0, cenas.encerramento.duracao, (t) => t);

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(passo, cenas.encerramento.duracao, false),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 44,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${1 + respiro * 0.03})` }}>
        <div style={{ transform: `scale(${marca})`, filter: `drop-shadow(0 24px 48px rgba(63, 99, 201, ${0.6 * marca}))` }}>
          <MarcaAnimada tamanho={132} faces={[1, 1, 1]} />
        </div>
        <span
          style={{
            fontFamily: fontes.texto,
            fontSize: 132,
            fontWeight: 620,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            color: cores.texto,
            opacity: nome,
            transform: `translateX(${misturar(-30, 0, nome)}px)`,
            clipPath: `inset(-20% ${misturar(100, -5, nome)}% -20% 0)`,
          }}
        >
          Prisma
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.3em', fontFamily: fontes.texto, fontSize: 60, fontWeight: 500, letterSpacing: '-0.02em', color: cores.texto }}>
        <TextoRevelado inicio={encerramento.slogan} intervalo={2} trechos={[{ texto: 'Cada real' }]} />
        <TextoRevelado inicio={encerramento.fechoSlogan} intervalo={3} duracao={20} trechos={[{ texto: 'no lugar certo.', cor: cores.destaque }]} />
      </div>
    </AbsoluteFill>
  );
}
