import { AbsoluteFill } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso, usePasso } from '../animacao';
import { MarcaAnimada } from '../componentes/MarcaAnimada';
import { abertura, cenas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const NOME = 'Prisma';

export function Abertura() {
  const passo = usePasso();
  const entradaMarca = mola(passo, abertura.marca, 120, 13);
  const faces = abertura.faces.map((inicio) => mola(passo, inicio, 150, 14)) as [number, number, number];
  const pulso = progresso(passo, abertura.brilho, 30);
  const legenda = progresso(passo, abertura.legenda, 18);
  const deslocamentoMarca = progresso(passo, abertura.nome - 4, 22);

  return (
    <AbsoluteFill style={{ ...estiloTransicaoCena(passo, cenas.abertura.duracao), alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: misturar(0, 40, deslocamentoMarca) }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 52,
              border: `3px solid ${cores.destaque}`,
              opacity: pulso > 0 ? (1 - pulso) * 0.8 : 0,
              transform: `scale(${1 + pulso * 0.7})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -60,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(124, 154, 255, ${0.32 * entradaMarca}), transparent 65%)`,
              filter: 'blur(10px)',
            }}
          />
          <div
            style={{
              transform: `scale(${entradaMarca}) rotate(${misturar(-14, 0, entradaMarca)}deg)`,
              filter: `drop-shadow(0 24px 48px rgba(63, 99, 201, ${0.6 * entradaMarca}))`,
            }}
          >
            <MarcaAnimada tamanho={176} faces={faces} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: misturar(0, 520, deslocamentoMarca),
            overflow: 'hidden',
            fontFamily: fontes.texto,
            fontSize: 168,
            fontWeight: 620,
            letterSpacing: '-0.035em',
            color: cores.texto,
            lineHeight: 1,
            paddingBottom: 18,
            marginBottom: -18,
          }}
        >
          {NOME.split('').map((letra, indice) => {
            const t = progresso(passo, abertura.nome + indice * abertura.intervaloLetras, 20);
            return (
              <span key={indice} style={{ display: 'inline-block', transform: `translateY(${misturar(110, 0, t)}%)`, opacity: t }}>
                {letra}
              </span>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 150,
          fontFamily: fontes.texto,
          fontSize: 26,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: cores.textoSecundario,
          opacity: legenda,
          transform: `translateY(${misturar(16, 0, legenda)}px)`,
        }}
      >
        Finanças pessoais
      </div>
    </AbsoluteFill>
  );
}
