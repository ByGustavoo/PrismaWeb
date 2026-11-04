import { CreditCard, Landmark, Layers, Repeat, UtensilsCrossed } from 'lucide-react';
import { AbsoluteFill, interpolate } from 'remotion';
import { curvaEntradaSaida, estiloTransicaoCena, misturar, mola, progresso, usePasso } from '../animacao';
import { ValorMonetario } from '../componentes/Interface';
import { Sobretitulo } from '../componentes/Sobretitulo';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { useRetrato } from '../formato';
import { cenas, gancho, SALDO_ATUAL } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const portas = [
  { icone: Landmark, origem: 'Conta corrente', descricao: 'Aluguel', valor: -1850 },
  { icone: CreditCard, origem: 'Cartão de crédito', descricao: 'Fatura de outubro', valor: -2346.9 },
  { icone: Layers, origem: 'Parcela 7 de 10', descricao: 'Notebook', valor: -540 },
  { icone: Repeat, origem: 'Recorrente', descricao: 'Academia', valor: -119.9 },
  { icone: UtensilsCrossed, origem: 'Vale-refeição', descricao: 'Almoço', valor: -42 },
];

const LARGURA_PORTA = 296;
const VAO = 22;
const LARGURA_PORTA_RETRATO = 760;
const ALTURA_PORTA_RETRATO = 112;
const VAO_RETRATO = 18;

const estiloTitulo = {
  fontFamily: fontes.texto,
  fontSize: 88,
  fontWeight: 620,
  letterSpacing: '-0.035em',
  lineHeight: 1.05,
  color: cores.texto,
  textAlign: 'center' as const,
};

export function Gancho() {
  const passo = usePasso();
  const retrato = useRetrato();
  const larguraPorta = retrato ? LARGURA_PORTA_RETRATO : LARGURA_PORTA;
  const passoPorta = retrato ? ALTURA_PORTA_RETRATO + VAO_RETRATO : LARGURA_PORTA + VAO;
  const convergencia = progresso(passo, gancho.convergencia, 14, curvaEntradaSaida);
  const saldo = mola(passo, gancho.saldo, 150, 15);
  const valorSaldo = interpolate(passo, [gancho.saldo, gancho.saldo + 18], [0, SALDO_ATUAL], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(passo, cenas.gancho.duracao),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: retrato ? 44 : 36,
        padding: retrato ? '0 48px 80px' : undefined,
      }}
    >
      <Sobretitulo texto="O PROBLEMA" inicio={gancho.titulo} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TextoRevelado inicio={gancho.titulo + 4} intervalo={2} trechos={[{ texto: 'O dinheiro sai por' }]} estilo={estiloTitulo} />
        <TextoRevelado inicio={gancho.titulo + 12} intervalo={2.5} trechos={[{ texto: 'muitas portas.', cor: cores.negativo }]} estilo={estiloTitulo} />
      </div>
      <div
        style={{
          position: 'relative',
          width: retrato ? LARGURA_PORTA_RETRATO : portas.length * LARGURA_PORTA + (portas.length - 1) * VAO,
          height: retrato ? portas.length * passoPorta - VAO_RETRATO : 170,
          marginTop: retrato ? 12 : 20,
        }}
      >
        {portas.map(({ icone: Icone, origem, descricao, valor }, indice) => {
          const entrada = mola(passo, gancho.portas[indice] ?? 0, 160, 15);
          const deslocamento = (indice - (portas.length - 1) / 2) * passoPorta;
          const recolhido = deslocamento * (1 - convergencia);
          const entradaY = misturar(50, 0, entrada) + convergencia * 10;
          return (
            <div
              key={origem}
              style={{
                position: 'absolute',
                left: '50%',
                top: retrato ? '50%' : 0,
                width: larguraPorta,
                height: retrato ? ALTURA_PORTA_RETRATO : undefined,
                boxSizing: 'border-box',
                marginLeft: -larguraPorta / 2,
                marginTop: retrato ? -ALTURA_PORTA_RETRATO / 2 : 0,
                display: retrato ? 'grid' : 'flex',
                gridTemplateColumns: retrato ? '1fr auto' : undefined,
                gridTemplateRows: retrato ? 'auto auto' : undefined,
                alignItems: retrato ? 'center' : undefined,
                columnGap: retrato ? 20 : undefined,
                flexDirection: 'column',
                gap: retrato ? undefined : 14,
                rowGap: retrato ? 4 : undefined,
                padding: retrato ? '0 30px' : '24px 26px',
                borderRadius: 22,
                background: cores.superficie,
                border: `1.5px solid ${cores.borda}`,
                boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.8)',
                fontFamily: fontes.texto,
                opacity: entrada * (1 - convergencia),
                transform: retrato
                  ? `translateY(${recolhido + entradaY}px) scale(${misturar(0.9, 1, entrada) * misturar(1, 0.55, convergencia)})`
                  : `translateX(${recolhido}px) translateY(${entradaY}px) scale(${misturar(0.9, 1, entrada) * misturar(1, 0.55, convergencia)})`,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: retrato ? 24 : 21, fontWeight: 600, color: cores.texto }}>
                <span style={{ display: 'flex', padding: 8, borderRadius: 10, background: cores.superficieSuave, color: cores.textoSecundario }}>
                  <Icone size={22} strokeWidth={2.1} />
                </span>
                {origem}
              </span>
              <span style={{ fontSize: retrato ? 22 : 19, color: cores.textoSecundario, gridColumn: retrato ? '1' : undefined, gridRow: retrato ? '2' : undefined, paddingLeft: retrato ? 52 : 0 }}>{descricao}</span>
              <ValorMonetario valor={valor} tamanho={retrato ? 36 : 30} cor={cores.negativo} estilo={retrato ? { gridColumn: '2', gridRow: '1 / span 2' } : undefined} />
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: retrato ? '50%' : -6,
            width: 520,
            marginLeft: -260,
            marginTop: retrato ? -96 : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '26px 30px',
            borderRadius: 26,
            background: cores.superficie,
            border: `1.5px solid ${cores.destaque}`,
            boxShadow: `0 0 0 6px rgba(124, 154, 255, ${(0.15 + 0.07 * Math.sin((passo - gancho.saldo) / 9)) * saldo}), 0 40px 80px -30px rgba(0, 0, 0, 0.85)`,
            fontFamily: fontes.texto,
            opacity: saldo,
            transform: `scale(${misturar(0.6, 1, saldo)})`,
          }}
        >
          <span style={{ fontSize: 22, color: cores.textoSecundario }}>Saldo atual</span>
          <ValorMonetario valor={valorSaldo} tamanho={72} peso={600} estilo={{ minWidth: 420, justifyContent: 'center' }} />
        </div>
      </div>
      <TextoRevelado
        inicio={gancho.conclusao}
        intervalo={2}
        trechos={[{ texto: 'O Prisma junta tudo e mostra' }, { texto: 'para onde vai cada real.', cor: cores.texto }]}
        estilo={{
          fontFamily: fontes.texto,
          fontSize: retrato ? 44 : 40,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: cores.textoSecundario,
          whiteSpace: retrato ? 'normal' : 'nowrap',
          ...(retrato ? { maxWidth: 760, textAlign: 'center' as const, lineHeight: 1.3, textWrap: 'balance' as const } : {}),
        }}
      />
    </AbsoluteFill>
  );
}
