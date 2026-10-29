import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { misturar, progresso, usePasso } from '../animacao';

interface Trecho {
  texto: string;
  cor?: string;
}

interface TextoReveladoProps {
  trechos: Trecho[];
  inicio: number;
  intervalo?: number;
  duracao?: number;
  estilo?: CSSProperties;
}

export function TextoRevelado({ trechos, inicio, intervalo = 2.5, duracao = 16, estilo }: TextoReveladoProps) {
  const passo = usePasso();
  const palavras: Trecho[] = trechos.flatMap((trecho) =>
    trecho.texto
      .split(' ')
      .filter(Boolean)
      .map((texto) => ({ texto, cor: trecho.cor })),
  );

  return (
    <div style={estilo}>
      {palavras.map((palavra, indice) => {
        const t = progresso(passo, inicio + indice * intervalo, duracao);
        return (
          <Fragment key={indice}>
            <span
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'top',
                paddingBottom: '0.14em',
                marginBottom: '-0.14em',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${misturar(110, 0, t)}%)`,
                  color: palavra.cor,
                }}
              >
                {palavra.texto}
              </span>
            </span>
            {indice < palavras.length - 1 ? ' ' : null}
          </Fragment>
        );
      })}
    </div>
  );
}
