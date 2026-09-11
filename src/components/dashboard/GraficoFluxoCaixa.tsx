import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import type { FluxoDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import styles from './GraficoFluxoCaixa.module.css';

interface GraficoFluxoCaixaProps {
  dados: FluxoDTO[];
  descricao: string;
  titulo?: string;
  larguraMaximaBarra?: number;
}

export function GraficoFluxoCaixa({
  dados,
  descricao,
  titulo = 'Entradas e saídas',
  larguraMaximaBarra = 26,
}: GraficoFluxoCaixaProps) {
  const palette = usePaletaGrafico();

  return (
    <Painel>
      <CabecalhoPainel titulo={titulo} descricao={descricao} />
      <CorpoPainel className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={dados}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
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
              width={78}
            />
            <Tooltip
              cursor={{ fill: palette.superficieSuave }}
              content={<DicaGrafico />}
            />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Bar dataKey="receitas" name="Entradas" fill={palette.series[1]} radius={[4, 4, 0, 0]} maxBarSize={larguraMaximaBarra} />
            <Bar dataKey="despesas" name="Saídas" fill={palette.series[2]} radius={[4, 4, 0, 0]} maxBarSize={larguraMaximaBarra} />
          </BarChart>
        </ResponsiveContainer>
      </CorpoPainel>
    </Painel>
  );
}
