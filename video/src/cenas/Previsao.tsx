import { useCurrentFrame } from 'remotion';
import { misturar, mola, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { formatarMoeda, ItemResumo, ValorMonetario } from '../componentes/Interface';
import { cenas, previsao } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const SALDO_FIM_DO_MES = 13105.2;
const APORTE = 800;

const meses = [
  { rotulo: 'Nov', receitas: 7850, despesas: 6420.3 },
  { rotulo: 'Dez', receitas: 7850, despesas: 7910.55 },
  { rotulo: 'Jan', receitas: 7850, despesas: 6980.4 },
  { rotulo: 'Fev', receitas: 7850, despesas: 6240.1 },
  { rotulo: 'Mar', receitas: 7850, despesas: 6105.75 },
  { rotulo: 'Abr', receitas: 7850, despesas: 5890.2 },
];

const saldos = meses.reduce<number[]>((lista, mes) => {
  const anterior = lista[lista.length - 1] ?? SALDO_FIM_DO_MES;
  return [...lista, Math.round((anterior + mes.receitas - mes.despesas - APORTE) * 100) / 100];
}, []);

const indiceApertado = saldos.indexOf(Math.min(...saldos));
const resultadoMedio = ((saldos[saldos.length - 1] ?? SALDO_FIM_DO_MES) - SALDO_FIM_DO_MES) / meses.length;

const LARGURA = 912;
const ALTURA = 290;
const ESCALA_BARRAS = 9000;
const SALDO_MINIMO = 12000;
const SALDO_MAXIMO = 16200;
const COLUNA = LARGURA / meses.length;

function ySaldo(valor: number): number {
  return ALTURA - ((valor - SALDO_MINIMO) / (SALDO_MAXIMO - SALDO_MINIMO)) * ALTURA;
}

const PONTOS_SALDO = saldos.map((saldo, indice) => ({ x: COLUNA * (indice + 0.5), y: ySaldo(saldo) }));
const LINHA_SALDO = PONTOS_SALDO.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${ponto.x} ${ponto.y}`).join(' ');

export function Previsao() {
  const quadro = useCurrentFrame();
  const linha = progresso(quadro, previsao.linha, previsao.duracaoLinha);
  const apertado = mola(quadro, previsao.mesApertado, 140, 16);
  const ultimoSaldo = saldos[saldos.length - 1] ?? 0;

  const resumo = [
    { rotulo: 'Saldo de hoje', valor: 12480.35, apoio: 'Contas que entram no saldo total', cor: cores.texto },
    { rotulo: 'Fim de Outubro', valor: SALDO_FIM_DO_MES, apoio: 'Hoje, mais o que ainda cai neste mês', cor: cores.texto },
    { rotulo: 'Saldo em Abril de 2027', valor: ultimoSaldo, apoio: `Resultado médio de ${formatarMoeda(resultadoMedio)} por mês`, cor: cores.positivo },
    { rotulo: 'Mês mais apertado', valor: saldos[indiceApertado] ?? 0, apoio: 'Dezembro de 2026', cor: cores.aviso },
  ];

  return (
    <CenaDividida
      duracao={cenas.previsao.duracao}
      ladoTexto="direita"
      sobretitulo="PREVISÃO"
      titulo="O mês que vem,"
      tituloDestaque="antes de chegar."
      subtitulo="Recorrentes, parcelas e gasto variável projetam o saldo dos próximos seis meses, com o método à vista."
      inicioTitulo={previsao.titulo}
      inicioCartao={previsao.cartao}
      larguraTexto={560}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 26, padding: 36, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', borderRadius: 16, border: `1.5px solid ${cores.borda}`, background: cores.superficieElevada }}>
          {resumo.map(({ rotulo, valor, apoio, cor }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(quadro, previsao.resumo[indice] ?? 0, 14)} primeiro={indice === 0}>
              <ValorMonetario valor={valor} tamanho={25} cor={cor} />
            </ItemResumo>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 650, color: cores.texto }}>Entradas, saídas e saldo previsto</span>
          <span style={{ fontSize: 18, color: cores.textoSecundario }}>Projeção a partir do saldo previsto para o fim deste mês</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg width={LARGURA} height={ALTURA} style={{ overflow: 'visible', display: 'block' }}>
            <rect
              x={COLUNA * indiceApertado + 6}
              y={-14}
              width={COLUNA - 12}
              height={ALTURA + 14}
              rx={12}
              fill={`rgba(232, 180, 74, ${0.1 * apertado})`}
              stroke={`rgba(232, 180, 74, ${0.6 * apertado})`}
              strokeWidth={1.5}
            />
            {[0, 1 / 3, 2 / 3, 1].map((fracao) => (
              <line key={fracao} x1={0} x2={LARGURA} y1={ALTURA * fracao} y2={ALTURA * fracao} stroke={cores.graficoGrade} strokeWidth={1.5} />
            ))}
            {meses.map((mes, indice) => {
              const t = progresso(quadro, previsao.barras + indice * previsao.intervaloBarras, 18);
              const alturaReceita = (mes.receitas / ESCALA_BARRAS) * ALTURA * t;
              const alturaDespesa = (mes.despesas / ESCALA_BARRAS) * ALTURA * t;
              const alturaAporte = (APORTE / ESCALA_BARRAS) * ALTURA * t;
              const centro = COLUNA * (indice + 0.5);
              return (
                <g key={mes.rotulo}>
                  <rect x={centro - 38} y={ALTURA - alturaReceita} width={34} height={alturaReceita} rx={4} fill={cores.receita} />
                  <rect x={centro + 4} y={ALTURA - alturaDespesa} width={34} height={alturaDespesa} rx={4} fill={cores.despesa} />
                  <rect x={centro + 4} y={ALTURA - alturaDespesa - alturaAporte - 2} width={34} height={alturaAporte} rx={4} fill={cores.aporte} />
                </g>
              );
            })}
            <path
              d={LINHA_SALDO}
              fill="none"
              stroke={cores.destaque}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - linha}
            />
            {PONTOS_SALDO.map((ponto, indice) => {
              const visivel = linha >= indice / (PONTOS_SALDO.length - 1) - 0.001;
              return <circle key={indice} cx={ponto.x} cy={ponto.y} r={visivel ? 7 : 0} fill={cores.destaque} stroke={cores.superficie} strokeWidth={3} />;
            })}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: COLUNA * (indiceApertado + 0.5) + 18,
              top: ySaldo(saldos[indiceApertado] ?? 0) + 18,
              transform: `translateY(${misturar(12, 0, apertado)}px) scale(${misturar(0.7, 1, apertado)})`,
              transformOrigin: 'left top',
              opacity: apertado,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 14px',
              borderRadius: 12,
              background: cores.superficieElevada,
              border: `1.5px solid ${cores.aviso}`,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: cores.aviso }}>Mês mais apertado</span>
            <ValorMonetario valor={saldos[indiceApertado] ?? 0} tamanho={19} />
          </div>
          <div style={{ display: 'flex', marginTop: 12 }}>
            {meses.map((mes) => (
              <span key={mes.rotulo} style={{ width: COLUNA, textAlign: 'center', fontSize: 18, color: cores.textoSecundario }}>
                {mes.rotulo}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14, fontSize: 18, color: cores.textoSecundario }}>
            {[
              { rotulo: 'Receitas previstas', cor: cores.receita },
              { rotulo: 'Despesas previstas', cor: cores.despesa },
              { rotulo: 'Aportes', cor: cores.aporte },
              { rotulo: 'Saldo previsto', cor: cores.destaque },
            ].map(({ rotulo, cor }) => (
              <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: cor }} />
                {rotulo}
              </span>
            ))}
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
