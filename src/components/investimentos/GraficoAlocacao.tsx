import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { rotuloClasseAtivo } from '@/constants/investimentos';
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
  const [active, setActive] = useState<ClasseAtivo | null>(null);
  const activeEntry = dados.find((entry) => entry.classeAtivo === active) ?? null;

  return (
    <Painel className={styles.card}>
      <CabecalhoPainel titulo="Distribuição por tipo" descricao="Participação de cada classe no patrimônio atual" />
      <CorpoPainel className={styles.body}>
        <div className={styles.chart} onMouseLeave={() => setActive(null)}>
          <ResponsiveContainer width="100%" height={232}>
            <PieChart>
              <Pie
                data={dados}
                dataKey="valorAtual"
                nameKey="classeAtivo"
                innerRadius="64%"
                outerRadius="100%"
                paddingAngle={dados.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
                rootTabIndex={-1}
              >
                {dados.map((entry) => (
                  <Cell
                    key={entry.classeAtivo}
                    fill={corDaClasse(entry.classeAtivo)}
                    fillOpacity={active && active !== entry.classeAtivo ? 0.4 : 1}
                    onMouseEnter={() => setActive(entry.classeAtivo)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className={styles.center} aria-hidden="true">
            {activeEntry ? (
              <>
                <span className={styles.centerLabel}>{rotuloClasseAtivo[activeEntry.classeAtivo]}</span>
                <ValorMonetario valor={activeEntry.valorAtual} tamanho="md" />
                <span className={`${styles.centerShare} tabular`}>
                  {formatarPercentual(activeEntry.participacao * 100, 1)} do patrimônio
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

        <ul className={styles.legend}>
          {dados.map((entry) => (
            <li
              key={entry.classeAtivo}
              className={juntarClasses(styles.item, active === entry.classeAtivo && styles.itemActive)}
              onMouseEnter={() => setActive(entry.classeAtivo)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                className={styles.marker}
                style={{ backgroundColor: corDaClasse(entry.classeAtivo) }}
                aria-hidden="true"
              />
              <span className={styles.name}>{rotuloClasseAtivo[entry.classeAtivo]}</span>
              <span className={`${styles.share} tabular`}>{formatarPercentual(entry.participacao * 100, 0)}</span>
              <ValorMonetario className={styles.value} valor={entry.valorAtual} tamanho="sm" tom="muted" />
            </li>
          ))}
        </ul>
      </CorpoPainel>
    </Painel>
  );
}
