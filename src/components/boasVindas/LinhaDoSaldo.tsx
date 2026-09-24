import { useId, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './LinhaDoSaldo.module.css';

interface Ponto {
  x: number;
  y: number;
}

const LARGURA = 1440;
const ALTURA = 900;
const INDICE_HOJE = 10;
const SELO_HOJE = { largura: 58, altura: 26, distancia: 18 };

const SALDO_Y = [800, 790, 798, 786, 794, 780, 788, 774, 740, 650, 520, 405, 300];

const PONTOS: Ponto[] = SALDO_Y.map((y, indice) => ({
  x: (indice * LARGURA) / (SALDO_Y.length - 1),
  y,
}));

function formatar(ponto: Ponto): string {
  return `${ponto.x.toFixed(1)} ${ponto.y.toFixed(1)}`;
}

function segmentosSuaves(pontos: Ponto[], de: number, ate: number): string {
  const segmentos = [];
  for (let indice = de; indice < ate; indice += 1) {
    const anterior = pontos[indice - 1] ?? pontos[indice];
    const inicio = pontos[indice];
    const fim = pontos[indice + 1];
    const seguinte = pontos[indice + 2] ?? fim;
    if (!anterior || !inicio || !fim || !seguinte) continue;
    const controle1 = { x: inicio.x + (fim.x - anterior.x) / 6, y: inicio.y + (fim.y - anterior.y) / 6 };
    const controle2 = { x: fim.x - (seguinte.x - inicio.x) / 6, y: fim.y - (seguinte.y - inicio.y) / 6 };
    segmentos.push(`C ${formatar(controle1)}, ${formatar(controle2)}, ${formatar(fim)}`);
  }
  return segmentos.join(' ');
}

function trecho(pontos: Ponto[], de: number, ate: number): string {
  const inicio = pontos[de];
  return inicio ? `M ${formatar(inicio)} ${segmentosSuaves(pontos, de, ate)}` : '';
}

const ULTIMO = PONTOS.length - 1;
const HOJE = PONTOS[INDICE_HOJE] ?? { x: 0, y: ALTURA };
const CAMINHO_REALIZADO = trecho(PONTOS, 0, INDICE_HOJE);
const CAMINHO_PREVISTO = trecho(PONTOS, INDICE_HOJE, ULTIMO);
const FIM = PONTOS[ULTIMO] ?? HOJE;
const AREA_REALIZADA = `${CAMINHO_REALIZADO} L ${HOJE.x} ${ALTURA} L 0 ${ALTURA} Z`;
const AREA_PREVISTA = `${CAMINHO_PREVISTO} L ${FIM.x} ${ALTURA} L ${HOJE.x} ${ALTURA} Z`;

const ORIGEM_NO_HOJE = { transformOrigin: `${HOJE.x}px ${HOJE.y}px` } as CSSProperties;

export function LinhaDoSaldo({ saindo }: { saindo: boolean }) {
  const idBase = useId().replace(/:/g, '');
  const graficoRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const grafico = graficoRef.current;
    if (!grafico) return;
    const medirEscala = () => {
      const escala = grafico.getScreenCTM()?.a;
      if (escala) grafico.style.setProperty('--escala-inversa', (1 / escala).toFixed(4));
    };
    medirEscala();
    const observador = new ResizeObserver(medirEscala);
    observador.observe(grafico);
    return () => observador.disconnect();
  }, []);

  return (
    <div className={juntarClasses(styles.fundo, saindo && styles.saindo)} aria-hidden="true">
      <div className={styles.grade} />
      <svg
        ref={graficoRef}
        className={styles.grafico}
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        preserveAspectRatio="xMaxYMax slice"
      >
        <defs>
          <linearGradient
            id={`${idBase}-area`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            x2={0}
            y1={HOJE.y}
            y2={ALTURA}
          >
            <stop offset="0" className={styles.areaTopo} />
            <stop offset="1" className={styles.areaBase} />
          </linearGradient>
          <linearGradient
            id={`${idBase}-esmaecer`}
            gradientUnits="userSpaceOnUse"
            x1={HOJE.x}
            x2={FIM.x}
            y1={0}
            y2={0}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.2} />
          </linearGradient>
          <mask id={`${idBase}-previsao`} maskUnits="userSpaceOnUse" x={0} y={0} width={LARGURA} height={ALTURA}>
            <rect width={LARGURA} height={ALTURA} fill={`url(#${idBase}-esmaecer)`} />
          </mask>
          <linearGradient
            id={`${idBase}-tracejado`}
            gradientUnits="userSpaceOnUse"
            x1={HOJE.x}
            x2={FIM.x}
            y1={0}
            y2={0}
          >
            <stop offset="0" className={styles.previstoInicio} />
            <stop offset="1" className={styles.previstoFim} />
          </linearGradient>
        </defs>

        <path d={AREA_REALIZADA} fill={`url(#${idBase}-area)`} className={styles.area} />
        <path
          d={AREA_PREVISTA}
          fill={`url(#${idBase}-area)`}
          mask={`url(#${idBase}-previsao)`}
          className={styles.areaPrevista}
        />
        <path d={CAMINHO_PREVISTO} stroke={`url(#${idBase}-tracejado)`} className={styles.previsto} />
        <path d={CAMINHO_REALIZADO} pathLength={1} className={styles.realizado} />
        <path d={CAMINHO_REALIZADO} pathLength={1} className={styles.brilho} />

        <line x1={HOJE.x} x2={HOJE.x} y1={HOJE.y} y2={ALTURA} className={styles.marcaHoje} />
        <g className={styles.tamanhoFixo} style={ORIGEM_NO_HOJE}>
          <circle cx={HOJE.x} cy={HOJE.y} r={16} className={styles.halo} />
          <circle cx={HOJE.x} cy={HOJE.y} r={5} className={styles.hoje} />
        </g>

        <g className={juntarClasses(styles.tamanhoFixo, styles.selo)} style={ORIGEM_NO_HOJE}>
          <rect
            x={HOJE.x - SELO_HOJE.largura / 2}
            y={HOJE.y - SELO_HOJE.distancia - SELO_HOJE.altura}
            width={SELO_HOJE.largura}
            height={SELO_HOJE.altura}
            rx={SELO_HOJE.altura / 2}
            className={styles.fundoSelo}
          />
          <text
            x={HOJE.x}
            y={HOJE.y - SELO_HOJE.distancia - SELO_HOJE.altura / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.textoSelo}
          >
            Hoje
          </text>
        </g>
      </svg>
    </div>
  );
}
