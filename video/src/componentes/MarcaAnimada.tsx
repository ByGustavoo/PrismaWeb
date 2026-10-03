import { misturar } from '../animacao';
import { cores } from '../tema';

const FACE_FRENTE = 'M8.5 7.6 L14.1 19.6 L2.9 19.6 Z';
const FACE_TOPO = 'M8.5 7.6 L15.5 4.4 L9.9 16.4 L2.9 19.6 Z';
const FACE_LATERAL = 'M8.5 7.6 L14.1 19.6 L21.1 16.4 L15.5 4.4 Z';

interface MarcaAnimadaProps {
  tamanho: number;
  faces: [number, number, number];
}

export function MarcaAnimada({ tamanho, faces }: MarcaAnimadaProps) {
  const [lateral, topo, frente] = faces;
  const face = (caminho: string, cor: string, t: number, dx: number, dy: number) => (
    <path
      d={caminho}
      fill={cor}
      stroke={cor}
      strokeWidth={1.1}
      strokeLinejoin="round"
      opacity={Math.min(t * 1.6, 1)}
      transform={`translate(${misturar(dx, 0, t)} ${misturar(dy, 0, t)})`}
    />
  );
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" style={{ display: 'block', overflow: 'visible' }}>
      <rect x="0.4" y="0.4" width="31.2" height="31.2" rx="9" fill={cores.marcaSuperficie} stroke={cores.borda} strokeWidth={0.8} />
      <g transform="translate(4 4)">
        {face(FACE_LATERAL, cores.marcaSombra, lateral, 5, -2)}
        {face(FACE_TOPO, cores.marcaFaceta, topo, 2, -5)}
        {face(FACE_FRENTE, cores.marcaRaio, frente, -4, 4)}
      </g>
    </svg>
  );
}
