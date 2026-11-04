import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, usePasso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { IndicadorVariacao, ValorMonetario } from '../componentes/Interface';
import { cenas, dashboard, DESPESAS_MES, HISTORICO_SALDO, PATRIMONIO, SALDO_ATUAL } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const LARGURA_GRAFICO = 370;
const ALTURA_GRAFICO = 190;
const RECEITAS_MES = 7850;

const fluxo = [
  { rotulo: 'Entradas do mês', valor: RECEITAS_MES, cor: cores.positivo, sinal: true },
  { rotulo: 'Saídas do mês', valor: -DESPESAS_MES, cor: cores.negativo, sinal: false },
  { rotulo: 'Resultado', valor: RECEITAS_MES - DESPESAS_MES, cor: cores.positivo, sinal: true },
];

const indicadores = [
  { rotulo: 'Receitas do mês', icone: TrendingUp, valor: RECEITAS_MES, variacao: 4.1, sentido: 'ALTA' as const, legenda: 'Recebeu mais', apoio: '' },
  { rotulo: 'Despesas do mês', icone: TrendingDown, valor: DESPESAS_MES, variacao: -6.3, sentido: 'BAIXA' as const, legenda: 'Gastou menos', apoio: '' },
  { rotulo: 'Investimentos', icone: PiggyBank, valor: PATRIMONIO - SALDO_ATUAL, variacao: 12.6, sentido: 'ALTA' as const, legenda: null, apoio: 'Rentabilidade acumulada' },
  { rotulo: 'Fatura do mês', icone: CreditCard, valor: 490, variacao: null, sentido: 'ALTA' as const, legenda: null, apoio: 'Horizonte Gold — Vence em 05 de Novembro de 2026' },
];

function pontosGrafico() {
  const valores = HISTORICO_SALDO.map((item) => item.saldo);
  const minimo = Math.min(...valores) * 0.92;
  const maximo = Math.max(...valores) * 1.03;
  return HISTORICO_SALDO.map((item, indice) => ({
    x: (indice / (HISTORICO_SALDO.length - 1)) * LARGURA_GRAFICO,
    y: ALTURA_GRAFICO - ((item.saldo - minimo) / (maximo - minimo)) * ALTURA_GRAFICO,
    rotulo: item.rotulo,
  }));
}

const PONTOS = pontosGrafico();

function curva(): string {
  return PONTOS.map((ponto, indice) => {
    if (indice === 0) return `M${ponto.x} ${ponto.y}`;
    const anterior = PONTOS[indice - 1] ?? ponto;
    const meio = (anterior.x + ponto.x) / 2;
    return `C${meio} ${anterior.y} ${meio} ${ponto.y} ${ponto.x} ${ponto.y}`;
  }).join(' ');
}

const CURVA = curva();

export function Dashboard() {
  const passo = usePasso();
  const contagem = (valor: number) =>
    interpolate(passo, [dashboard.contagem, dashboard.contagem + dashboard.duracaoContagem], [0, valor], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    });
  const grafico = progresso(passo, dashboard.grafico, dashboard.duracaoGrafico);
  const ultimo = PONTOS[PONTOS.length - 1] ?? { x: 0, y: 0 };
  const patrimonio = progresso(passo, dashboard.patrimonio, 14);
  const legendas = progresso(passo, dashboard.legendas, 12);

  return (
    <CenaDividida
      duracao={cenas.dashboard.duracao}
      ladoTexto="esquerda"
      sobretitulo="DASHBOARD"
      titulo="Seu dinheiro"
      tituloDestaque="em uma tela só."
      subtitulo="Saldo, patrimônio, entradas e saídas e a fatura do mês, sempre comparados ao período anterior."
      inicioTitulo={dashboard.titulo}
      inicioCartao={dashboard.cartao}
      larguraTexto={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Cartao estilo={{ display: 'flex', gap: 36, padding: '30px 36px', fontFamily: fontes.texto }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 21, color: cores.textoSecundario }}>Saldo atual</span>
            <ValorMonetario valor={contagem(SALDO_ATUAL)} tamanho={64} estilo={{ minWidth: 380 }} />
            <IndicadorVariacao percentual={10} tamanho={18} legenda="em relação ao mês anterior" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                margin: '4px 0',
                padding: '14px 18px',
                borderRadius: 14,
                background: cores.superficieSuave,
                opacity: patrimonio,
                transform: `translateY(${misturar(10, 0, patrimonio)}px)`,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: cores.texto }}>Patrimônio</span>
                <span style={{ fontSize: 16, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>Saldo somado aos investimentos</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <ValorMonetario valor={contagem(PATRIMONIO)} tamanho={26} estilo={{ minWidth: 186, justifyContent: 'flex-end' }} />
                <IndicadorVariacao percentual={3.2} tamanho={16} />
              </span>
            </div>
            {fluxo.map(({ rotulo, valor, cor, sinal }, indice) => {
              const t = progresso(passo, dashboard.linhas[indice] ?? 0, 14);
              return (
                <div key={rotulo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: t, transform: `translateY(${misturar(10, 0, t)}px)` }}>
                  <span style={{ fontSize: 20, color: cores.textoSecundario }}>{rotulo}</span>
                  <ValorMonetario valor={contagem(valor)} tamanho={24} cor={cor} sinal={sinal} />
                </div>
              );
            })}
          </div>
          <div style={{ width: LARGURA_GRAFICO, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12 }}>
            <svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaDashboard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={cores.destaque} stopOpacity={0.3} />
                  <stop offset="1" stopColor={cores.destaque} stopOpacity={0} />
                </linearGradient>
                <clipPath id="revelarDashboard">
                  <rect x={-10} y={-20} width={(LARGURA_GRAFICO + 20) * grafico} height={ALTURA_GRAFICO + 40} />
                </clipPath>
              </defs>
              {[0, 0.5, 1].map((fracao) => (
                <line key={fracao} x1={0} x2={LARGURA_GRAFICO} y1={ALTURA_GRAFICO * fracao} y2={ALTURA_GRAFICO * fracao} stroke={cores.graficoGrade} strokeWidth={1.5} />
              ))}
              <g clipPath="url(#revelarDashboard)">
                <path d={`${CURVA} L${LARGURA_GRAFICO} ${ALTURA_GRAFICO} L0 ${ALTURA_GRAFICO} Z`} fill="url(#areaDashboard)" />
                <path d={CURVA} fill="none" stroke={cores.destaque} strokeWidth={3.5} strokeLinecap="round" />
              </g>
              <circle cx={ultimo.x} cy={ultimo.y} r={7 * (grafico >= 1 ? 1 : 0)} fill={cores.destaque} stroke={cores.superficie} strokeWidth={3} />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: cores.textoSecundario }}>
              {PONTOS.map((ponto) => (
                <span key={ponto.rotulo}>{ponto.rotulo}</span>
              ))}
            </div>
          </div>
        </Cartao>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {indicadores.map(({ rotulo, icone: Icone, valor, variacao, sentido, legenda, apoio }, indice) => {
            const entrada = mola(passo, dashboard.indicadores[indice] ?? 0, 160, 16);
            return (
              <div
                key={rotulo}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '20px 26px',
                  borderRadius: 20,
                  background: cores.superficie,
                  border: `1.5px solid ${cores.borda}`,
                  fontFamily: fontes.texto,
                  opacity: entrada,
                  transform: `translateY(${misturar(30, 0, entrada)}px)`,
                }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: cores.textoSecundario }}>
                  {rotulo}
                  <span style={{ display: 'flex', padding: 7, borderRadius: 9, background: cores.superficieSuave }}>
                    <Icone size={20} strokeWidth={2} />
                  </span>
                </span>
                <ValorMonetario valor={valor} tamanho={36} />
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                  {variacao !== null ? <IndicadorVariacao percentual={variacao} tamanho={18} sentidoFavoravel={sentido} /> : null}
                  {legenda ? <span style={{ opacity: legendas, transform: `translateX(${misturar(-8, 0, legendas)}px)` }}>{legenda}</span> : null}
                  {apoio ? <span style={{ marginLeft: variacao !== null ? 'auto' : 0 }}>{apoio}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CenaDividida>
  );
}
