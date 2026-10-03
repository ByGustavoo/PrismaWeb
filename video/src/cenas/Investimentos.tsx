import { useCurrentFrame } from 'remotion';
import { misturar, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { formatarMoeda, IndicadorVariacao, ItemResumo, ValorMonetario } from '../componentes/Interface';
import { cenas, investimentos } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const TOTAL_APORTADO = 42900;
const LUCRO = 5420.5;
const PATRIMONIO = TOTAL_APORTADO + LUCRO;
const MESES = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'];

const serie = MESES.map((rotulo, indice) => {
  const aportado = TOTAL_APORTADO - (MESES.length - 1 - indice) * 800;
  const rendimento = LUCRO * (indice / (MESES.length - 1)) ** 1.3;
  return { rotulo, aportado, valor: aportado + rendimento };
});

const classes = [
  { rotulo: 'Tesouro', valor: 18240, cor: paleta[5] },
  { rotulo: 'CDB', valor: 12600, cor: paleta[2] },
  { rotulo: 'RDB e caixinhas', valor: 9880.5, cor: paleta[7] },
  { rotulo: 'ETFs', valor: 7600, cor: paleta[11] },
];

const LARGURA_GRAFICO = 452;
const ALTURA_GRAFICO = 230;
const MINIMO = 32000;
const MAXIMO = 50000;

const xMes = (indice: number) => (indice / (MESES.length - 1)) * LARGURA_GRAFICO;
const yValor = (valor: number) => ALTURA_GRAFICO - ((valor - MINIMO) / (MAXIMO - MINIMO)) * ALTURA_GRAFICO;
const CAMINHO_VALOR = serie.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${xMes(indice)} ${yValor(ponto.valor).toFixed(1)}`).join(' ');
const CAMINHO_APORTADO = serie.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${xMes(indice)} ${yValor(ponto.aportado).toFixed(1)}`).join(' ');

const RAIO = 104;
const ESPESSURA = 30;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export function Investimentos() {
  const quadro = useCurrentFrame();
  const grafico = progresso(quadro, investimentos.grafico, investimentos.duracaoGrafico);
  const rosca = progresso(quadro, investimentos.rosca, investimentos.duracaoRosca);
  let acumulado = 0;

  const resumo = [
    { rotulo: 'Total investido', conteudo: <ValorMonetario valor={TOTAL_APORTADO} tamanho={25} />, apoio: '4 posições em 4 tipos de ativo' },
    { rotulo: 'Patrimônio atual', conteudo: <ValorMonetario valor={PATRIMONIO} tamanho={25} />, apoio: 'Valor de mercado das posições' },
    { rotulo: 'Lucro', conteudo: <ValorMonetario valor={LUCRO} tamanho={25} cor={cores.positivo} sinal />, apoio: 'Valor atual menos o aportado' },
    { rotulo: 'Rentabilidade', conteudo: <IndicadorVariacao percentual={(LUCRO / TOTAL_APORTADO) * 100} tamanho={25} />, apoio: 'Sobre o total aportado' },
  ];

  return (
    <CenaDividida
      duracao={cenas.investimentos.duracao}
      ladoTexto="esquerda"
      sobretitulo="INVESTIMENTOS"
      titulo="Quanto aportou"
      tituloDestaque="e quanto rendeu."
      subtitulo="Aporte e rendimento não se misturam: a distância entre a curva e o tracejado é o que o dinheiro rendeu."
      inicioTitulo={investimentos.titulo}
      inicioCartao={investimentos.cartao}
      larguraTexto={600}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 28, padding: 36, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', borderRadius: 16, border: `1.5px solid ${cores.borda}`, background: cores.superficieElevada }}>
          {resumo.map(({ rotulo, conteudo, apoio }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(quadro, investimentos.resumo[indice] ?? 0, 14)} primeiro={indice === 0}>
              {conteudo}
            </ItemResumo>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Evolução do patrimônio</span>
              <span style={{ fontSize: 17, color: cores.textoSecundario }}>Patrimônio e total aportado nos últimos doze meses</span>
            </div>
            <svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO} style={{ overflow: 'visible', marginTop: 10 }}>
              <defs>
                <linearGradient id="areaPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={cores.destaque} stopOpacity={0.3} />
                  <stop offset="1" stopColor={cores.destaque} stopOpacity={0} />
                </linearGradient>
                <clipPath id="revelarPatrimonio">
                  <rect x={-10} y={-20} width={(LARGURA_GRAFICO + 20) * grafico} height={ALTURA_GRAFICO + 40} />
                </clipPath>
              </defs>
              {[0, 0.5, 1].map((fracao) => (
                <line key={fracao} x1={0} x2={LARGURA_GRAFICO} y1={ALTURA_GRAFICO * fracao} y2={ALTURA_GRAFICO * fracao} stroke={cores.graficoGrade} strokeWidth={1.5} />
              ))}
              <g clipPath="url(#revelarPatrimonio)">
                <path d={`${CAMINHO_VALOR} L${LARGURA_GRAFICO} ${ALTURA_GRAFICO} L0 ${ALTURA_GRAFICO} Z`} fill="url(#areaPatrimonio)" />
                <path d={CAMINHO_APORTADO} fill="none" stroke={cores.aviso} strokeWidth={2.5} strokeDasharray="6 6" />
                <path d={CAMINHO_VALOR} fill="none" stroke={cores.destaque} strokeWidth={3.5} strokeLinejoin="round" />
              </g>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: LARGURA_GRAFICO, fontSize: 15, color: cores.textoSecundario }}>
              {MESES.filter((_, indice) => indice % 2 === 0).map((mes) => (
                <span key={mes}>{mes}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 22, fontSize: 17, color: cores.textoSecundario }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 3, borderRadius: 2, background: cores.destaque }} />
                Patrimônio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 0, borderTop: `3px dashed ${cores.aviso}` }} />
                Total aportado
              </span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 28, borderLeft: `1.5px solid ${cores.borda}` }}>
            <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Distribuição por tipo</span>
            <div style={{ position: 'relative', alignSelf: 'center', width: (RAIO + ESPESSURA) * 2, height: (RAIO + ESPESSURA) * 2 }}>
              <svg width={(RAIO + ESPESSURA) * 2} height={(RAIO + ESPESSURA) * 2} viewBox={`${-RAIO - ESPESSURA} ${-RAIO - ESPESSURA} ${(RAIO + ESPESSURA) * 2} ${(RAIO + ESPESSURA) * 2}`} style={{ transform: 'rotate(-90deg)' }}>
                {classes.map(({ rotulo, valor, cor }) => {
                  const fatia = (valor / PATRIMONIO) * CIRCUNFERENCIA;
                  const inicio = acumulado;
                  acumulado += fatia;
                  const visivel = Math.min(Math.max(rosca * CIRCUNFERENCIA - inicio, 0), fatia);
                  return (
                    <circle
                      key={rotulo}
                      r={RAIO}
                      fill="none"
                      stroke={cor}
                      strokeWidth={ESPESSURA}
                      strokeDasharray={`${Math.max(visivel - 4, 0)} ${CIRCUNFERENCIA}`}
                      strokeDashoffset={-inicio}
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: rosca }}>
                <span style={{ fontSize: 16, color: cores.textoSecundario }}>Patrimônio</span>
                <ValorMonetario valor={PATRIMONIO} tamanho={21} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classes.map(({ rotulo, valor, cor }, indice) => {
                const t = progresso(quadro, investimentos.legenda[indice] ?? 0, 12);
                return (
                  <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, color: cores.texto, opacity: t, transform: `translateX(${misturar(-12, 0, t)}px)` }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: cor }} />
                    {rotulo}
                    <span style={{ marginLeft: 'auto', fontFamily: fontes.numero, fontSize: 16, color: cores.textoSecundario }}>{Math.round((valor / PATRIMONIO) * 100)}%</span>
                    <span style={{ minWidth: 104, textAlign: 'right', fontFamily: fontes.numero, fontSize: 17, fontWeight: 600 }}>{formatarMoeda(valor)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
