import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { MetaPrecoDTO, Tendencia } from '@/types';
import { formatarMoedaCompacta, formatarDataNumerica } from '@/utils/formatacao';
import styles from './GraficoHistoricoPreco.module.css';

interface GraficoHistoricoPrecoProps {
  historico: MetaPrecoDTO[];
  precoMedio: number;
  tendencia: Tendencia;
}

function rotuloDia(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

const PROPORCAO_FOLGA_EIXO = 0.2;

const PASSOS_EIXO = 4;

const PASSOS_REDONDOS = [1, 2, 2.5, 5, 10];

function eixoRedondo(min: number, max: number): { domain: [number, number]; ticks: number[] } {
  const raw = (max - min) / PASSOS_EIXO;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const multiplier = PASSOS_REDONDOS.find((value) => magnitude * value >= raw) ?? 10;
  const step = magnitude * multiplier;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }

  return { domain: [start, end], ticks };
}

export function GraficoHistoricoPreco({ historico, precoMedio, tendencia }: GraficoHistoricoPrecoProps) {
  const palette = usePaletaGrafico();
  const color = tendencia === 'ALTA' ? palette.series[2] : tendencia === 'BAIXA' ? palette.series[1] : palette.series[0];

  const data = historico.map((entry) => ({
    label: rotuloDia(entry.data),
    date: entry.data,
    price: entry.preco,
  }));

  const prices = historico.map((entry) => entry.preco);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const padding = Math.max((highest - lowest) * PROPORCAO_FOLGA_EIXO, highest * 0.02);
  const axis = eixoRedondo(lowest - padding, highest + padding);

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="prisma-goal-price" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={palette.grade} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.textoEixo, fontSize: 12 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.textoEixo, fontSize: 12 }}
            tickFormatter={formatarMoedaCompacta}
            domain={axis.domain}
            ticks={axis.ticks}
            width={78}
          />
          <Tooltip
            cursor={{ stroke: palette.borda }}
            content={<DicaGrafico />}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as { date?: string } | undefined;
              return point?.date ? formatarDataNumerica(point.date) : '';
            }}
          />
          <ReferenceLine
            y={precoMedio}
            stroke={palette.borda}
            strokeDasharray="4 4"
            label={{ value: 'Média', position: 'insideTopRight', fill: palette.textoEixo, fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            name="Preço"
            stroke={color}
            strokeWidth={2}
            fill="url(#prisma-goal-price)"
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
