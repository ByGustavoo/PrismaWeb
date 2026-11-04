import { Keyboard, MonitorSmartphone, Palette, Search, Server } from 'lucide-react';
import { AbsoluteFill } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso, usePasso } from '../animacao';
import { Sobretitulo } from '../componentes/Sobretitulo';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { useRetrato } from '../formato';
import { cenas, confianca } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const selos = [
  { icone: Search, rotulo: 'Busca em lançamentos, contas e categorias' },
  { icone: Palette, rotulo: 'Uma cor fixa por categoria' },
  { icone: MonitorSmartphone, rotulo: 'Do desktop ao celular' },
  { icone: Keyboard, rotulo: 'Teclado e leitor de tela' },
  { icone: Server, rotulo: 'Imagem Docker para o seu servidor' },
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
  const passo = usePasso();
  const retrato = useRetrato();
  const titulo = retrato ? { ...estiloTitulo, fontSize: 88 } : estiloTitulo;

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(passo, cenas.confianca.duracao),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 40,
        padding: retrato ? '0 48px 80px' : undefined,
      }}
    >
      <Sobretitulo texto="EM QUE CONFIAR" inicio={confianca.titulo} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TextoRevelado inicio={confianca.titulo + 2} intervalo={2} trechos={[{ texto: 'Números que fecham' }]} estilo={titulo} />
        <TextoRevelado inicio={confianca.titulo + 8} intervalo={2.5} trechos={[{ texto: 'no centavo.', cor: cores.destaque }]} estilo={titulo} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: retrato ? 'column' : 'row',
          flexWrap: retrato ? 'nowrap' : 'wrap',
          alignItems: retrato ? 'center' : undefined,
          justifyContent: 'center',
          gap: retrato ? 18 : 22,
          maxWidth: retrato ? 984 : 1560,
          marginTop: 20,
        }}
      >
        {selos.map(({ icone: Icone, rotulo }, indice) => {
          const entrada = mola(passo, confianca.selos[indice] ?? 0, 170, 15);
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
                fontSize: retrato ? 29 : 27,
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
          maxWidth: retrato ? 860 : 1240,
          fontFamily: fontes.texto,
          fontSize: retrato ? 34 : 29,
          lineHeight: 1.45,
          textAlign: 'center',
          color: cores.textoSecundario,
          opacity: progresso(passo, confianca.rodape, 18),
          textWrap: 'balance',
        }}
      >
        Saldo, faturas, parcelas e previsão seguem a mesma regra em todas as telas.
      </div>
    </AbsoluteFill>
  );
}
