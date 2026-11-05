import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { formatarMoeda, formatarPercentual, IndicadorVariacao, ItemResumo, ValorMonetario } from '../componentes/Interface';
import { cenas, investimentos } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const TOTAL_APORTADO = 42900;
const LUCRO = 5420.5;
const CARTEIRA = TOTAL_APORTADO + LUCRO;
const RESERVA = 11880.5;
const RENDIMENTO_RESERVA = 612.4;
const MESES = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'];

const serie = MESES.map((rotulo, indice) => {
  const aportado = TOTAL_APORTADO - (MESES.length - 1 - indice) * 800;
  const rendimento = LUCRO * (indice / (MESES.length - 1)) ** 1.3;
  return { rotulo, aportado, valor: aportado + rendimento };
});

const classes = [
  { rotulo: 'Tesouro', valor: 16240, cor: paleta[5] },
  { rotulo: 'CDB', valor: 12600, cor: paleta[2] },
  { rotulo: 'RDB e caixinhas', valor: 9880.5, cor: paleta[7] },
  { rotulo: 'ETFs', valor: 7600, cor: paleta[11] },
  { rotulo: 'Poupança', valor: 2000, cor: paleta[12] },
];

const CLASSES_EM_FOCO = [0, 2, 4];

const LARGURA_GRAFICO = 470;
const ALTURA_GRAFICO = 372;
const MINIMO = 32000;
const MAXIMO = 50000;

const xMes = (indice: number) => (indice / (MESES.length - 1)) * LARGURA_GRAFICO;
const yValor = (valor: number) => ALTURA_GRAFICO - ((valor - MINIMO) / (MAXIMO - MINIMO)) * ALTURA_GRAFICO;
const CAMINHO_VALOR = serie.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${xMes(indice)} ${yValor(ponto.valor).toFixed(1)}`).join(' ');
const CAMINHO_APORTADO = serie.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${xMes(indice)} ${yValor(ponto.aportado).toFixed(1)}`).join(' ');

const RAIO = 80;
const ESPESSURA = 24;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const LADO_ROSCA = (RAIO + ESPESSURA) * 2;
const ALTURA_LINHA_LEGENDA = 35;
const VAO_LEGENDA = 4;

export function Investimentos() {
  const passo = usePasso();
  const grafico = progresso(passo, investimentos.grafico, investimentos.duracaoGrafico);
  const rosca = progresso(passo, investimentos.rosca, investimentos.duracaoRosca);
  const reserva = pulso(passo, investimentos.reserva, 16);

  const ativoDe = (indiceClasse: number) => {
    const posicao = CLASSES_EM_FOCO.indexOf(indiceClasse);
    if (posicao === -1) return 0;
    const fim = investimentos.focos[posicao + 1] ?? investimentos.fimFoco;
    return Math.min(mola(passo, investimentos.focos[posicao] ?? 0, 220, 18), 1) * (1 - progresso(passo, fim + 1, 8));
  };
  const ativos = classes.map((_, indice) => ativoDe(indice));
  const posicaoMiolo = investimentos.focos.reduce((atual, inicio, posicao) => (passo >= inicio ? posicao : atual), -1);
  const classeNoMiolo = passo >= investimentos.fimFoco || posicaoMiolo === -1 ? null : (CLASSES_EM_FOCO[posicaoMiolo] ?? null);
  const inicioMiolo = classeNoMiolo === null ? (passo >= investimentos.fimFoco ? investimentos.fimFoco : -100) : (investimentos.focos[posicaoMiolo] ?? 0);
  const entradaMiolo = progresso(passo, inicioMiolo, 7);

  const resumo = [
    { rotulo: 'Valor atual', conteudo: <ValorMonetario valor={CARTEIRA} tamanho={23} />, apoio: 'Soma do valor de mercado das posições' },
    { rotulo: 'Lucro', conteudo: <ValorMonetario valor={LUCRO} tamanho={23} cor={cores.positivo} sinal />, apoio: 'Diferença entre o valor atual e o aportado' },
    { rotulo: 'Rentabilidade', conteudo: <IndicadorVariacao percentual={(LUCRO / TOTAL_APORTADO) * 100} tamanho={23} />, apoio: 'Sobre o total aportado, desde o primeiro aporte' },
    {
      rotulo: 'Reserva de emergência',
      conteudo: (
        <span style={{ display: 'inline-flex', transformOrigin: 'left center', transform: `scale(${1 + 0.1 * reserva})` }}>
          <ValorMonetario valor={RESERVA} tamanho={23} />
        </span>
      ),
      apoio: (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6 }}>
          2 investimentos — Rendeu
          <ValorMonetario valor={RENDIMENTO_RESERVA} tamanho={16} cor={cores.positivo} sinal />
        </span>
      ),
    },
  ];

  let acumulado = 0;

  return (
    <CenaDividida
      duracao={cenas.investimentos.duracao}
      ladoTexto="esquerda"
      sobretitulo="INVESTIMENTOS"
      titulo="Quanto aportou"
      tituloDestaque="e quanto rendeu."
      subtitulo="Aporte e rendimento não se misturam. E a reserva de emergência é uma marca: o resumo soma o que faz parte dela."
      inicioTitulo={investimentos.titulo}
      inicioCartao={investimentos.cartao}
      larguraTexto={600}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 32, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, border: `1.5px solid ${cores.borda}`, background: cores.superficieElevada }}>
          {[0, 2].map((inicioLinha) => (
            <div key={inicioLinha} style={{ display: 'flex', borderTop: inicioLinha === 0 ? 'none' : `1.5px solid ${cores.borda}` }}>
              {resumo.slice(inicioLinha, inicioLinha + 2).map(({ rotulo, conteudo, apoio }, posicao) => (
                <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(passo, investimentos.resumo[inicioLinha + posicao] ?? 0, 14)} primeiro={posicao === 0}>
                  {conteudo}
                </ItemResumo>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
          <div style={{ width: LARGURA_GRAFICO, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Evolução da carteira</span>
              <span style={{ fontSize: 17, color: cores.textoSecundario }}>Valor da carteira e total aportado nos últimos doze meses</span>
            </div>
            <svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO} style={{ overflow: 'visible', marginTop: 8 }}>
              <defs>
                <linearGradient id="areaCarteira" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={cores.destaque} stopOpacity={0.3} />
                  <stop offset="1" stopColor={cores.destaque} stopOpacity={0} />
                </linearGradient>
                <clipPath id="revelarCarteira">
                  <rect x={-10} y={-20} width={(LARGURA_GRAFICO + 20) * grafico} height={ALTURA_GRAFICO + 40} />
                </clipPath>
              </defs>
              {[0, 1 / 3, 2 / 3, 1].map((fracao) => (
                <line key={fracao} x1={0} x2={LARGURA_GRAFICO} y1={ALTURA_GRAFICO * fracao} y2={ALTURA_GRAFICO * fracao} stroke={cores.graficoGrade} strokeWidth={1.5} />
              ))}
              <g clipPath="url(#revelarCarteira)">
                <path d={`${CAMINHO_VALOR} L${LARGURA_GRAFICO} ${ALTURA_GRAFICO} L0 ${ALTURA_GRAFICO} Z`} fill="url(#areaCarteira)" />
                <path d={CAMINHO_APORTADO} fill="none" stroke={cores.aviso} strokeWidth={2.5} strokeDasharray="6 6" />
                <path d={CAMINHO_VALOR} fill="none" stroke={cores.destaque} strokeWidth={3.5} strokeLinejoin="round" />
              </g>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: cores.textoSecundario }}>
              {MESES.filter((_, indice) => indice % 2 === 0).map((mes) => (
                <span key={mes}>{mes}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 'auto', fontSize: 17, color: cores.textoSecundario }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 3, borderRadius: 2, background: cores.destaque }} />
                Carteira
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 0, borderTop: `3px dashed ${cores.aviso}` }} />
                Total aportado
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 28, borderLeft: `1.5px solid ${cores.borda}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Distribuição por tipo</span>
              <span style={{ fontSize: 17, lineHeight: 1.35, color: cores.textoSecundario }}>Participação de cada classe no valor atual da carteira</span>
            </div>
            <div style={{ position: 'relative', alignSelf: 'center', width: LADO_ROSCA, height: LADO_ROSCA, marginTop: 4 }}>
              <svg width={LADO_ROSCA} height={LADO_ROSCA} viewBox={`${-LADO_ROSCA / 2} ${-LADO_ROSCA / 2} ${LADO_ROSCA} ${LADO_ROSCA}`} style={{ transform: 'rotate(-90deg)' }}>
                {classes.map(({ rotulo, valor, cor }, indice) => {
                  const fatia = (valor / CARTEIRA) * CIRCUNFERENCIA;
                  const inicio = acumulado;
                  acumulado += fatia;
                  const visivel = Math.min(Math.max(rosca * CIRCUNFERENCIA - inicio, 0), fatia);
                  const outros = Math.min(ativos.reduce((soma, valorAtivo, posicao) => (posicao === indice ? soma : soma + valorAtivo), 0), 1);
                  return (
                    <circle
                      key={rotulo}
                      r={RAIO}
                      fill="none"
                      stroke={cor}
                      strokeOpacity={1 - 0.6 * outros}
                      strokeWidth={ESPESSURA + 6 * (ativos[indice] ?? 0)}
                      strokeDasharray={`${Math.max(visivel - 4, 0)} ${CIRCUNFERENCIA}`}
                      strokeDashoffset={-inicio}
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: rosca }}>
                <span style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: classeNoMiolo === null ? entradaMiolo : 0, transform: `translateY(${misturar(4, 0, entradaMiolo)}px)` }}>
                  <span style={{ fontSize: 16, color: cores.textoSecundario }}>Carteira</span>
                  <ValorMonetario valor={CARTEIRA} tamanho={21} />
                </span>
                {classes.map(({ rotulo, valor }, indice) => {
                  if (classeNoMiolo !== indice) return null;
                  const ativo = entradaMiolo;
                  return (
                    <span key={rotulo} style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: ativo, transform: `translateY(${misturar(4, 0, ativo)}px)` }}>
                      <span style={{ fontSize: 15, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{rotulo}</span>
                      <ValorMonetario valor={valor} tamanho={20} />
                      <span style={{ fontSize: 14, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{formatarPercentual((valor / CARTEIRA) * 100)} do total</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: VAO_LEGENDA, marginTop: 6 }}>
              {classes.map(({ rotulo, valor, cor }, indice) => {
                const t = progresso(passo, investimentos.legenda[indice] ?? 0, 12);
                const ativo = ativos[indice] ?? 0;
                return (
                  <span
                    key={rotulo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      height: ALTURA_LINHA_LEGENDA,
                      margin: '0 -10px',
                      padding: '0 10px',
                      borderRadius: 10,
                      background: `rgba(255, 255, 255, ${0.07 * ativo})`,
                      fontSize: 18,
                      color: cores.texto,
                      opacity: t,
                      transform: `translateX(${misturar(-12, 0, t)}px)`,
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: cor }} />
                    {rotulo}
                    <span style={{ marginLeft: 'auto', fontFamily: fontes.numero, fontSize: 16, color: cores.textoSecundario }}>{Math.round((valor / CARTEIRA) * 100)}%</span>
                    <span style={{ minWidth: 112, textAlign: 'right', fontFamily: fontes.numero, fontSize: 17, fontWeight: 600, color: cores.textoSecundario }}>{formatarMoeda(valor)}</span>
                  </span>
                );
              })}
              <Cursor
                de={{ x: 260, y: (ALTURA_LINHA_LEGENDA + VAO_LEGENDA) * 5 + 40 }}
                paradas={CLASSES_EM_FOCO.map((indiceClasse, posicao) => ({
                  x: 150,
                  y: indiceClasse * (ALTURA_LINHA_LEGENDA + VAO_LEGENDA) + ALTURA_LINHA_LEGENDA / 2 + 2,
                  clique: investimentos.focos[posicao] ?? 0,
                }))}
                saida={investimentos.fimFoco}
                semClique
              />
            </div>
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
