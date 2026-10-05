import type { CSSProperties } from 'react';
import { useCurrentFrame } from 'remotion';
import { mola } from '../animacao';

interface RolanteProps {
  itens: readonly string[];
  trocas: readonly number[];
  alinhamento?: 'start' | 'end';
  estilo?: CSSProperties;
}

export function Rolante({ itens, trocas, alinhamento = 'start', estilo }: RolanteProps) {
  const quadro = useCurrentFrame();

  return (
    <span style={{ display: 'inline-grid', overflow: 'hidden', lineHeight: 1.3, whiteSpace: 'nowrap', ...estilo }}>
      {itens.map((item, indice) => {
        const chegada = trocas[indice - 1];
        const partida = trocas[indice];
        const entrada = chegada === undefined ? 1 : mola(quadro, chegada, 210, 19);
        const saida = partida === undefined ? 0 : mola(quadro, partida, 210, 19);
        return (
          <span
            key={item}
            style={{
              gridArea: '1 / 1',
              justifySelf: alinhamento,
              transform: `translateY(${(1 - entrada) * 100 - saida * 100}%)`,
            }}
          >
            {item}
          </span>
        );
      })}
    </span>
  );
}
