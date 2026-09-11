import type { CSSProperties } from 'react';

export interface MarcaPrismaProps {
  tamanho?: number;
  className?: string;
}

const FACE_FRENTE = 'M8.5 7.6 L14.1 19.6 L2.9 19.6 Z';
const FACE_TOPO = 'M8.5 7.6 L15.5 4.4 L9.9 16.4 L2.9 19.6 Z';
const FACE_LATERAL = 'M8.5 7.6 L14.1 19.6 L21.1 16.4 L15.5 4.4 Z';

export function MarcaPrisma({ tamanho = 26, className }: MarcaPrismaProps) {
  const face: CSSProperties = { strokeWidth: 1.1, strokeLinejoin: 'round' };

  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Prisma"
    >
      <path d={FACE_LATERAL} style={face} fill="var(--brand-facet-shade)" stroke="var(--brand-facet-shade)" />
      <path d={FACE_TOPO} style={face} fill="var(--brand-facet)" stroke="var(--brand-facet)" />
      <path d={FACE_FRENTE} style={face} fill="var(--brand-ray)" stroke="var(--brand-ray)" />
    </svg>
  );
}
