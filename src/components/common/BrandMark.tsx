import type { CSSProperties } from 'react';

export interface BrandMarkProps {
  size?: number;
  className?: string;
}

/*
 * Prisma triangular em projecao isometrica. Face frontal (o triangulo) mais a
 * extrusao para tras e para a direita, que revela duas faces retangulares:
 *
 *   frente  A(8.5, 7.6)  B(14.1, 19.6)  C(2.9, 19.6)
 *   fundo   A'(15.5, 4.4) B'(21.1, 16.4) C'(9.9, 16.4)   (deslocamento +7, -3.2)
 *
 * As duas faces visiveis sao as que a extrusao empurra para cima e para a
 * direita; a de baixo fica escondida atras do solido.
 */
const FACE_FRONT = 'M8.5 7.6 L14.1 19.6 L2.9 19.6 Z';
const FACE_TOP = 'M8.5 7.6 L15.5 4.4 L9.9 16.4 L2.9 19.6 Z';
const FACE_SIDE = 'M8.5 7.6 L14.1 19.6 L21.1 16.4 L15.5 4.4 Z';

/**
 * Logotipo do Prisma: o solido em tres dimensoes, com as tres faces visiveis em
 * valores diferentes da mesma familia — claro na frente, medio no topo, escuro
 * na lateral. A profundidade vem so do contraste entre as faces, sem gradiente
 * nem sombra, entao o desenho continua chapado e nitido em qualquer tamanho.
 *
 * O contorno usa `stroke` da propria cor de cada face com junta arredondada:
 * e o que suaviza as pontas sem introduzir um traco de outra cor.
 *
 * As cores saem dos tokens `--brand-*`, iguais nos dois temas: um logotipo que
 * troca de cor junto com o tema deixa de ser reconhecivel.
 */
export function BrandMark({ size = 26, className }: BrandMarkProps) {
  const face: CSSProperties = { strokeWidth: 1.1, strokeLinejoin: 'round' };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Prisma"
    >
      <path d={FACE_SIDE} style={face} fill="var(--brand-facet-shade)" stroke="var(--brand-facet-shade)" />
      <path d={FACE_TOP} style={face} fill="var(--brand-facet)" stroke="var(--brand-facet)" />
      <path d={FACE_FRONT} style={face} fill="var(--brand-ray)" stroke="var(--brand-ray)" />
    </svg>
  );
}
