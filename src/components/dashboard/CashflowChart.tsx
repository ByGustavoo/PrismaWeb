import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { CashflowPoint } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './CashflowChart.module.css';

interface CashflowChartProps {
  data: CashflowPoint[];
  /** A janela termina no mes de referencia, que nem sempre e o mes corrente. */
  description: string;
  /**
   * Relatorios chamam as mesmas duas series de "receitas e despesas", que e o
   * vocabulario daquela tela. O grafico e o mesmo — duplica-lo para trocar o
   * titulo seria criar um segundo desenho para o mesmo problema.
   */
  title?: string;
  /**
   * Largura maxima da barra. O dashboard sempre desenha seis meses e fica bem
   * com barras finas; os relatorios variam de quatro a doze baldes, e com
   * poucos as barras finas viram tracinhos perdidos numa faixa vazia.
   */
  maxBarSize?: number;
}

export function CashflowChart({
  data,
  description,
  title = 'Entradas e saídas',
  maxBarSize = 26,
}: CashflowChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          {/*
            `barCategoryGap` estreita a faixa de cada categoria e, com isso,
            aproxima entrada e saida do mesmo periodo. Sem ele, a distancia
            dentro do par chegava perto da distancia entre pares e as barras se
            liam como uma fileira solta, nao como comparacoes de um mes.
          */}
          <BarChart
            data={data}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              width={78}
            />
            <Tooltip
              cursor={{ fill: palette.surfaceMuted }}
              content={<ChartTooltip />}
            />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Bar dataKey="income" name="Entradas" fill={palette.series[1]} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} />
            <Bar dataKey="expense" name="Saídas" fill={palette.series[2]} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
