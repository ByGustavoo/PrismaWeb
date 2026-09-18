import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { SaldoDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import styles from './GraficoRelatorio.module.css';

interface GraficoEvolucaoSaldoProps {
  dados: SaldoDTO[];
}

export function GraficoEvolucaoSaldo({ dados }: GraficoEvolucaoSaldoProps) {
  const palette = usePaletaGrafico();

  return (
    <Painel className="card-hover-accent">
      <CabecalhoPainel titulo="Evolução do saldo" descricao="Saldo somado das contas ao fim de cada intervalo" />
      <CorpoPainel className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="prisma-balance-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.26} />
                <stop offset="100%" stopColor={palette.series[0]} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke={palette.grade} />
            <XAxis
              dataKey="rotulo"
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
              domain={['auto', 'auto']}
              width={78}
            />
            <Tooltip cursor={{ stroke: palette.borda }} content={<DicaGrafico />} />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-balance-trend)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CorpoPainel>
    </Painel>
  );
}
