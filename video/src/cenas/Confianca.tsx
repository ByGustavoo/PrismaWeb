import { Bell, MonitorSmartphone, Palette, Search, SunMoon } from 'lucide-react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso } from '../animacao';
import { Sobretitulo } from '../componentes/Sobretitulo';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { cenas, confianca } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const selos = [
  { icone: Bell, rotulo: 'Avisos antes do vencimento' },
  { icone: Search, rotulo: 'Busca em lançamentos, contas e categorias' },
  { icone: Palette, rotulo: 'Uma cor fixa por categoria' },
  { icone: SunMoon, rotulo: 'Tema claro, escuro e sistema' },
  { icone: MonitorSmartphone, rotulo: 'Do desktop ao celular' },
];

const estiloTitulo = {
  fontFamily: fontes.texto,
  fontSize: 100,
  fontWeight: 620,
  letterSpacing: '-0.04em',
  lineHeight: 1.04,
  color: cores.texto,
  textAlign: 'center' as const,
};

export function Confianca() {
  const quadro = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(quadro, cenas.confianca.duracao),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      <Sobretitulo texto="EM QUE CONFIAR" inicio={confianca.titulo} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TextoRevelado inicio={confianca.titulo + 2} intervalo={2} trechos={[{ texto: 'Números que fecham' }]} estilo={estiloTitulo} />
        <TextoRevelado inicio={confianca.titulo + 8} intervalo={2.5} trechos={[{ texto: 'no centavo.', cor: cores.destaque }]} estilo={estiloTitulo} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, maxWidth: 1560, marginTop: 20 }}>
        {selos.map(({ icone: Icone, rotulo }, indice) => {
          const entrada = mola(quadro, confianca.selos[indice] ?? 0, 170, 15);
          return (
            <span
              key={rotulo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 28px',
                borderRadius: 999,
                background: cores.superficie,
                border: `1.5px solid ${cores.borda}`,
                fontFamily: fontes.texto,
                fontSize: 27,
                fontWeight: 500,
                color: cores.texto,
                opacity: entrada,
                transform: `translateY(${misturar(40, 0, entrada)}px) scale(${misturar(0.85, 1, entrada)})`,
                boxShadow: '0 24px 48px -24px rgba(0, 0, 0, 0.8)',
              }}
            >
              <span style={{ display: 'flex', padding: 10, borderRadius: 12, background: cores.destaqueSuave, color: cores.destaque }}>
                <Icone size={26} strokeWidth={2.2} />
              </span>
              {rotulo}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 12,
          maxWidth: 1240,
          fontFamily: fontes.texto,
          fontSize: 29,
          lineHeight: 1.45,
          textAlign: 'center',
          color: cores.textoSecundario,
          opacity: progresso(quadro, confianca.rodape, 18),
          textWrap: 'balance',
        }}
      >
        Saldo, faturas, parcelas e previsão são calculados pelo PrismaAPI. A tela apresenta, não recalcula.
      </div>
    </AbsoluteFill>
  );
}
