import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso, usePasso } from '../animacao';
import { cores, fontes } from '../tema';
import { Sobretitulo } from './Sobretitulo';
import { TextoRevelado } from './TextoRevelado';

interface CenaDivididaProps {
  duracao: number;
  ladoTexto: 'esquerda' | 'direita';
  sobretitulo: string;
  titulo: string;
  tituloDestaque: string;
  subtitulo: string;
  inicioTitulo: number;
  inicioCartao: number;
  larguraTexto?: number;
  children: ReactNode;
  complemento?: ReactNode;
  sobreposicao?: ReactNode;
}

export function CenaDividida({
  duracao,
  ladoTexto,
  sobretitulo,
  titulo,
  tituloDestaque,
  subtitulo,
  inicioTitulo,
  inicioCartao,
  larguraTexto = 640,
  children,
  complemento,
  sobreposicao,
}: CenaDivididaProps) {
  const passo = usePasso();
  const entradaCartao = mola(passo, inicioCartao, 90, 18);
  const sinal = ladoTexto === 'esquerda' ? -1 : 1;
  const rotacao = misturar(14, 4, entradaCartao) - progresso(passo, 0, duracao, (t) => t) * 3;

  const texto = (
    <div style={{ width: larguraTexto, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Sobretitulo texto={sobretitulo} inicio={inicioTitulo} />
      <div style={{ fontFamily: fontes.texto, fontSize: 80, fontWeight: 620, letterSpacing: '-0.035em', lineHeight: 1.06, color: cores.texto, whiteSpace: 'nowrap' }}>
        <TextoRevelado inicio={inicioTitulo + 4} trechos={[{ texto: titulo }]} />
        <TextoRevelado inicio={inicioTitulo + 4 + titulo.split(' ').length * 2.5} trechos={[{ texto: tituloDestaque, cor: cores.destaque }]} />
      </div>
      <TextoRevelado
        inicio={inicioTitulo + 16}
        intervalo={1}
        trechos={[{ texto: subtitulo }]}
        estilo={{ fontFamily: fontes.texto, fontSize: 31, lineHeight: 1.42, color: cores.textoSecundario, textWrap: 'balance' }}
      />
    </div>
  );

  const cartao = (
    <div style={{ flex: 1, minWidth: 0, perspective: 2000 }}>
      <div
        style={{
          opacity: entradaCartao,
          transform: `translateY(${misturar(80, 0, entradaCartao)}px) rotateY(${sinal * rotacao}deg) rotateX(${rotacao * 0.35}deg)`,
          transformOrigin: ladoTexto === 'esquerda' ? 'left center' : 'right center',
        }}
      >
        {children}
      </div>
      {complemento}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(passo, duracao),
        padding: '0 140px',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 96,
      }}
    >
      {ladoTexto === 'esquerda' ? texto : cartao}
      {ladoTexto === 'esquerda' ? cartao : texto}
      {sobreposicao}
    </AbsoluteFill>
  );
}
