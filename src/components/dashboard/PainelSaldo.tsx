import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import { ValorMonetario, IndicadorVariacao } from '@/components/comum';
import type { SaldoDTO, VariacaoDTO } from '@/types';
import styles from './PainelSaldo.module.css';

interface PainelSaldoProps {
  rotulo: string;
  saldo: number;
  variacao: VariacaoDTO;
  entradas: number;
  saidas: number;
  substantivoPeriodo: string;
  historico: SaldoDTO[];
}

export function PainelSaldo({
  rotulo,
  saldo,
  variacao,
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
    <section className={styles.panel} aria-label={rotulo}>
      <div className={styles.summary}>
        <p className={styles.label}>{rotulo}</p>
        <ValorMonetario valor={saldo} tamanho="display" animar contarAoAparecer />
        <IndicadorVariacao variacao={variacao} legenda={`em relação ao ${substantivoPeriodo} anterior`} />

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
          <AreaChart data={historico} margin={{ top: 16, right: 20, bottom: 0, left: 20 }}>
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
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
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
