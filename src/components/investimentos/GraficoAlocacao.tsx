import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { corClasseAtivo, rotuloClasseAtivo } from '@/constants/investimentos';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { AlocacaoDTO, ClasseAtivo } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPercentual } from '@/utils/formatacao';
import { corDaClasse } from './aparencia';
import styles from './GraficoAlocacao.module.css';

interface GraficoAlocacaoProps {
  dados: AlocacaoDTO[];
  total: number;
}

export function GraficoAlocacao({ dados, total }: GraficoAlocacaoProps) {
  const [fixada, setFixada] = useState<ClasseAtivo | null>(null);
  const [previa, setPrevia] = useState<ClasseAtivo | null>(null);
  const active = previa ?? fixada;
  const activeEntry = dados.find((entry) => entry.classeAtivo === active) ?? null;
  const palette = usePaletaGrafico();

  const alternarFixada = (classe: ClasseAtivo) => setFixada((atual) => (atual === classe ? null : classe));

  return (
    <Painel className="card-hover-accent">
      <CabecalhoPainel titulo="Distribuição por tipo" descricao="Participação de cada classe no patrimônio atual" />
      <CorpoPainel className={styles.body}>
        <div className={styles.chart} onMouseLeave={() => setPrevia(null)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                dataKey="valorAtual"
                nameKey="classeAtivo"
                innerRadius="70%"
                outerRadius="100%"
                paddingAngle={dados.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
                rootTabIndex={-1}
              >
                {dados.map((entry) => (
                  <Cell
                    key={entry.classeAtivo}
                    fill={palette.paleta[corClasseAtivo[entry.classeAtivo] - 1]}
                    fillOpacity={active && active !== entry.classeAtivo ? 0.4 : 1}
                    onMouseEnter={() => setPrevia(entry.classeAtivo)}
                    onClick={() => alternarFixada(entry.classeAtivo)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className={styles.center} aria-hidden="true">
            <div key={activeEntry?.classeAtivo ?? 'total'} className={styles.centerContent}>
              {activeEntry ? (
                <>
                  <span className={styles.centerLabel}>{rotuloClasseAtivo[activeEntry.classeAtivo]}</span>
                  <ValorMonetario valor={activeEntry.valorAtual} tamanho="md" />
                  <span className={`${styles.centerShare} tabular`}>
                    {formatarPercentual(activeEntry.participacao * 100, 1)} do total
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.centerLabel}>Patrimônio</span>
                  <ValorMonetario valor={total} tamanho="md" />
                </>
              )}
            </div>
          </div>
        </div>

        <ul className={styles.legend}>
          {dados.map((entry) => (
            <li key={entry.classeAtivo}>
              <button
                type="button"
                aria-pressed={fixada === entry.classeAtivo}
                className={juntarClasses(styles.item, active === entry.classeAtivo && styles.itemActive)}
                onMouseEnter={() => setPrevia(entry.classeAtivo)}
                onMouseLeave={() => setPrevia(null)}
                onFocus={() => setPrevia(entry.classeAtivo)}
                onBlur={() => setPrevia(null)}
                onClick={() => alternarFixada(entry.classeAtivo)}
              >
                <span
                  className={styles.marker}
                  style={{ backgroundColor: corDaClasse(entry.classeAtivo) }}
                  aria-hidden="true"
                />
                <span className={styles.name}>{rotuloClasseAtivo[entry.classeAtivo]}</span>
                <span className={`${styles.share} tabular`}>{formatarPercentual(entry.participacao * 100, 0)}</span>
                <ValorMonetario className={styles.value} valor={entry.valorAtual} tamanho="sm" tom="muted" />
              </button>
            </li>
          ))}
        </ul>
      </CorpoPainel>
    </Painel>
  );
}
