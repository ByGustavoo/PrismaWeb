import { Landmark, ShieldCheck, Wallet, WalletCards } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { BarraProgresso, IndicadorVariacao, ItemResumo, ValorMonetario } from '../componentes/Interface';
import { cenas, contas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const SALDO_TOTAL = 58088.6;

const resumo = [
  { rotulo: 'Saldo total', valor: SALDO_TOTAL, apoio: 'Soma das contas ativas que entram no total', cor: cores.texto },
  { rotulo: 'Em reservas', valor: 32831, apoio: 'Rendeu R$ 1.485,00 em 12 meses', cor: cores.texto },
  { rotulo: 'Fora do saldo total', valor: 10585, apoio: 'Contas marcadas para não somar', cor: cores.texto },
];

const diaADia = [
  { nome: 'Carteira', detalhe: 'Dinheiro vivo — Outros', icone: Wallet, saldo: 260 },
  { nome: 'Conta principal', detalhe: 'Banco Aurora — Conta corrente', icone: Landmark, saldo: 33032.6 },
  { nome: 'Conta salário', detalhe: 'Banco Horizonte — Conta salário', icone: WalletCards, saldo: 2550 },
];

const EVOLUCAO = [10862, 11545, 12221, 12915, 13602, 14282, 14955, 15646, 16330, 17007, 17607, 17607];
const APORTADO = [10772, 11372, 11972, 12572, 13172, 13772, 14372, 14972, 15572, 16172, 16772, 16772];

const equacao = [
  { rotulo: 'Saldo em 01/11/2025', valor: 10172, operador: null, cor: cores.texto },
  { rotulo: 'Aportes', valor: 6600, operador: '+', cor: cores.texto },
  { rotulo: 'Resgates', valor: 0, operador: '−', cor: cores.textoSecundario },
  { rotulo: 'Rendimentos', valor: 835, operador: '+', cor: cores.positivo },
  { rotulo: 'Saldo hoje', valor: 17607, operador: '=', cor: cores.texto },
];

const LARGURA_CURVA = 404;
const ALTURA_CURVA = 120;
const MINIMO_CURVA = 10200;
const MAXIMO_CURVA = 17900;

const xMes = (indice: number) => (indice / (EVOLUCAO.length - 1)) * LARGURA_CURVA;
const yValor = (valor: number) => ALTURA_CURVA - ((valor - MINIMO_CURVA) / (MAXIMO_CURVA - MINIMO_CURVA)) * ALTURA_CURVA;
const caminho = (valores: number[]) => valores.map((valor, indice) => `${indice === 0 ? 'M' : 'L'}${xMes(indice).toFixed(1)} ${yValor(valor).toFixed(1)}`).join(' ');
const CAMINHO_VALOR = caminho(EVOLUCAO);
const CAMINHO_APORTADO = caminho(APORTADO);

function TituloSecao({ titulo, apoio, opacidade }: { titulo: string; apoio: string; opacidade: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, opacity: opacidade }}>
      <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>{titulo}</span>
      <span style={{ fontSize: 18, color: cores.textoSecundario }}>{apoio}</span>
    </div>
  );
}

export function Contas() {
  const passo = usePasso();
  const contagem = (valor: number) =>
    interpolate(passo, [contas.contagem, contas.contagem + contas.duracaoContagem], [0, valor], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    });
  const reserva = mola(passo, contas.reserva, 120, 17);
  const curva = progresso(passo, contas.curva, contas.duracaoCurva);

  return (
    <CenaDividida
      duracao={cenas.contas.duracao}
      ladoTexto="esquerda"
      sobretitulo="CONTAS"
      titulo="O que é do dia"
      tituloDestaque="e o que é reserva."
      subtitulo="Contas de movimento de um lado, reservas do outro. Na reserva, a conta fecha: quanto entrou e quanto rendeu."
      inicioTitulo={contas.titulo}
      inicioCartao={contas.cartao}
      larguraTexto={620}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie, boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)' }}>
          {resumo.map(({ rotulo, valor, apoio, cor }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(passo, contas.resumo[indice] ?? 0, 14)} primeiro={indice === 0}>
              <ValorMonetario valor={contagem(valor)} tamanho={indice === 0 ? 34 : 26} cor={cor} estilo={{ minWidth: indice === 0 ? 230 : 170 }} />
            </ItemResumo>
          ))}
        </div>

        <TituloSecao titulo="Contas do dia a dia" apoio="Onde o salário cai e de onde as contas saem." opacidade={progresso(passo, contas.contas[0] ?? 0, 12)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {diaADia.map(({ nome, detalhe, icone: Icone, saldo }, indice) => {
            const entrada = mola(passo, contas.contas[indice] ?? 0, 160, 16);
            const parcela = saldo / SALDO_TOTAL;
            return (
              <div
                key={nome}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '22px 22px 20px',
                  borderRadius: 20,
                  background: cores.superficie,
                  border: `1.5px solid ${cores.borda}`,
                  opacity: Math.min(entrada, 1),
                  transform: `translateY(${misturar(30, 0, entrada)}px)`,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', padding: 8, borderRadius: 10, background: cores.superficieSuave, color: cores.textoSecundario }}>
                    <Icone size={20} strokeWidth={2.1} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 620, color: cores.texto }}>{nome}</span>
                    <span style={{ fontSize: 16, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{detalhe}</span>
                  </span>
                </span>
                <ValorMonetario valor={contagem(saldo)} tamanho={29} estilo={{ marginTop: 6 }} />
                <BarraProgresso valor={parcela * progresso(passo, (contas.contas[indice] ?? 0) + 6, 24)} cor={cores.destaque} altura={7} />
                <span style={{ fontSize: 16, color: cores.textoSecundario }}>{Math.round(parcela * 100)}% do saldo total</span>
              </div>
            );
          })}
        </div>

        <TituloSecao titulo="Reservas e patrimônio" apoio="Quanto entrou e quanto rendeu." opacidade={progresso(passo, contas.reserva - 4, 12)} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '24px 26px',
            borderRadius: 22,
            background: cores.superficie,
            border: `1.5px solid ${cores.borda}`,
            opacity: Math.min(reserva, 1),
            transform: `translateY(${misturar(36, 0, reserva)}px)`,
          }}
        >
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', padding: 8, borderRadius: 10, background: cores.destaqueSuave, color: cores.destaque }}>
                  <ShieldCheck size={20} strokeWidth={2.1} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 20, fontWeight: 620, color: cores.texto }}>Reserva de emergência</span>
                  <span style={{ fontSize: 16, color: cores.textoSecundario }}>Banco Aurora — Reserva de emergência</span>
                </span>
              </span>
              <span style={{ fontSize: 17, color: cores.textoSecundario }}>Saldo</span>
              <ValorMonetario valor={17607} tamanho={36} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, color: cores.textoSecundario }}>
                Rendeu em 12 meses
                <ValorMonetario valor={835} tamanho={19} cor={cores.positivo} sinal />
                <IndicadorVariacao percentual={5} tamanho={17} />
              </span>
            </div>
            <svg width={LARGURA_CURVA} height={ALTURA_CURVA} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaReserva" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={cores.destaque} stopOpacity={0.28} />
                  <stop offset="1" stopColor={cores.destaque} stopOpacity={0} />
                </linearGradient>
                <clipPath id="revelarReserva">
                  <rect x={-10} y={-20} width={(LARGURA_CURVA + 20) * curva} height={ALTURA_CURVA + 40} />
                </clipPath>
              </defs>
              <g clipPath="url(#revelarReserva)">
                <path d={`${CAMINHO_VALOR} L${LARGURA_CURVA} ${ALTURA_CURVA} L0 ${ALTURA_CURVA} Z`} fill="url(#areaReserva)" />
                <path d={CAMINHO_APORTADO} fill="none" stroke={cores.textoSecundario} strokeWidth={2} strokeDasharray="6 6" />
                <path d={CAMINHO_VALOR} fill="none" stroke={cores.destaque} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: cores.superficieElevada, border: `1.5px solid ${cores.borda}` }}>
            {equacao.map(({ rotulo, valor, operador, cor }, indice) => {
              const entrada = mola(passo, contas.equacao[indice] ?? 0, 180, 15);
              return (
                <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: operador === '=' ? '0 0 auto' : 1, opacity: Math.min(entrada, 1), transform: `translateY(${misturar(14, 0, entrada)}px)` }}>
                  {operador ? <span style={{ fontFamily: fontes.numero, fontSize: 24, fontWeight: 500, color: cores.textoSecundario }}>{operador}</span> : null}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 16, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{rotulo}</span>
                    <ValorMonetario valor={valor} tamanho={20} cor={cor} />
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </CenaDividida>
  );
}
