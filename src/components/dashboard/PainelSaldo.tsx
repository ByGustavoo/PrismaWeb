import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import { ValorMonetario, IndicadorVariacao } from '@/components/comum';
import type { SaldoDTO, VariacaoDTO } from '@/types';
import styles from './PainelSaldo.module.css';

interface RotuloMesNaBordaProps {
  cor: string;
  total: number;
  x?: number;
  y?: number;
  index?: number;
  payload?: { value: string };
}

function RotuloMesNaBorda({ cor, total, x = 0, y = 0, index = 0, payload }: RotuloMesNaBordaProps) {
  const ancora = index === 0 ? 'start' : index === total - 1 ? 'end' : 'middle';

  return (
    <text x={x} y={y} dy={6} fill={cor} fontSize={12} textAnchor={ancora} dominantBaseline="hanging">
      {payload?.value}
    </text>
  );
}

interface PainelSaldoProps {
  rotulo: string;
  saldo: number;
  variacao: VariacaoDTO;
  patrimonio: number;
  variacaoPatrimonio: VariacaoDTO;
  entradas: number;
  saidas: number;
  substantivoPeriodo: string;
  historico: SaldoDTO[];
}

export function PainelSaldo({
  rotulo,
  saldo,
  variacao,
  patrimonio,
  variacaoPatrimonio,
  entradas,
  saidas,
  substantivoPeriodo,
  historico,
}: PainelSaldoProps) {
  const palette = usePaletaGrafico();
  const lineColor = palette.series[0];

  const values = historico.map((point) => point.saldo);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || Math.abs(max) || 1) * 0.08;
  const domainMin = min - padding;
  const domainMax = max + padding;

  return (
    <section className={`${styles.panel} card-hover-accent`} aria-label={rotulo}>
      <div className={styles.summary}>
        <p className={styles.label}>{rotulo}</p>
        <ValorMonetario valor={saldo} tamanho="display" animar contarAoAparecer />
        <IndicadorVariacao variacao={variacao} legenda={`em relação ao ${substantivoPeriodo} anterior`} />

        <div className={styles.wealth}>
          <div className={styles.wealthText}>
            <span className={styles.wealthLabel}>Patrimônio</span>
            <span className={styles.wealthHint}>Saldo somado aos investimentos</span>
          </div>
          <div className={styles.wealthFigure}>
            <ValorMonetario valor={patrimonio} tamanho="md" animar contarAoAparecer />
            <IndicadorVariacao variacao={variacaoPatrimonio} />
          </div>
        </div>

        <dl className={styles.flows}>
          <div className={styles.flow}>
            <dt>Entradas do {substantivoPeriodo}</dt>
            <dd>
              <ValorMonetario valor={entradas} tom="positive" tamanho="md" sinal="plus" animar contarAoAparecer />
            </dd>
          </div>
          <div className={styles.flow}>
            <dt>Saídas do {substantivoPeriodo}</dt>
            <dd>
              <ValorMonetario valor={saidas} tom="negative" tamanho="md" sinal="minus" animar contarAoAparecer />
            </dd>
          </div>
          <div className={styles.flow}>
            <dt>Resultado</dt>
            <dd>
              <ValorMonetario
                valor={entradas - saidas}
                tom={entradas - saidas >= 0 ? 'positive' : 'negative'}
                tamanho="md"
                sinal="auto"
                animar
                contarAoAparecer
              />
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historico} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="rotulo"
              axisLine={false}
              tickLine={false}
              tick={<RotuloMesNaBorda cor={palette.textoEixo} total={historico.length} />}
              interval={0}
              dy={6}
            />
            <YAxis hide domain={[domainMin, domainMax]} />
            <Tooltip
              cursor={{ stroke: palette.borda, strokeDasharray: '4 4' }}
              content={<DicaGrafico />}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              baseValue={domainMin}
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#balanceFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.superficie }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
