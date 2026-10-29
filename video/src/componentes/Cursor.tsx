import { curvaEntradaSaida, misturar, progresso, pulso, usePasso } from '../animacao';
import { cores } from '../tema';

interface Ponto {
  x: number;
  y: number;
}

interface Parada extends Ponto {
  clique: number;
}

interface CursorProps {
  de: Ponto;
  paradas: Parada[];
  saida?: number;
}

const DURACAO_PRESSAO = 6;
const DURACAO_PERCURSO = 12;

export function Cursor({ de, paradas, saida }: CursorProps) {
  const passo = usePasso();
  const primeira = paradas[0];
  if (!primeira) return null;
  const aparicao = progresso(passo, primeira.clique - DURACAO_PERCURSO - 6, 8);
  const sumico = saida === undefined ? 0 : progresso(passo, saida, 10);

  let x = de.x;
  let y = de.y;
  let anterior: Ponto = de;
  for (const parada of paradas) {
    const t = progresso(passo, parada.clique - DURACAO_PERCURSO, DURACAO_PERCURSO - 2, curvaEntradaSaida);
    if (t <= 0) break;
    x = misturar(anterior.x, parada.x, t);
    y = misturar(anterior.y, parada.y, t);
    anterior = parada;
  }

  const pressao = paradas.reduce((soma, parada) => soma + pulso(passo, parada.clique, DURACAO_PRESSAO), 0);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none', opacity: aparicao * (1 - sumico), zIndex: 20 }}>
      {paradas.map((parada) => {
        const onda = progresso(passo, parada.clique, 16);
        return (
          <span
            key={parada.clique}
            style={{
              position: 'absolute',
              left: parada.x,
              top: parada.y,
              width: 64,
              height: 64,
              marginLeft: -32,
              marginTop: -32,
              borderRadius: '50%',
              border: `2.5px solid ${cores.destaque}`,
              opacity: passo >= parada.clique ? 0.8 * (1 - onda) : 0,
              transform: `scale(${misturar(0.3, 1.2, onda)})`,
            }}
          />
        );
      })}
      <svg
        width={34}
        height={40}
        viewBox="0 0 17 20"
        style={{
          position: 'absolute',
          left: x - 3,
          top: y - 2,
          transform: `scale(${1 - 0.14 * pressao})`,
          transformOrigin: '3px 2px',
          filter: 'drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6))',
        }}
      >
        <path d="M1.5 1.2 L1.5 15.6 L5.1 12.3 L7.6 18.2 L10.2 17.1 L7.7 11.3 L12.6 11.3 Z" fill="#ffffff" stroke="#0e0e10" strokeWidth={1.1} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
