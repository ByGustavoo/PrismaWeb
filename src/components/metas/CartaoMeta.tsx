import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ExternalLink, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo } from '@/components/ui';
import { rotuloSituacaoMeta, tomSituacaoMeta } from '@/constants/metas';
import type { AcompanhamentoMetaDTO } from '@/types';
import { formatarDataNumerica } from '@/utils/formatacao';
import { VariacaoPreco } from './VariacaoPreco';
import { MiniCurvaPreco } from './MiniCurvaPreco';
import styles from './CartaoMeta.module.css';

interface CartaoMetaProps {
  acompanhamento: AcompanhamentoMetaDTO;
  indice: number;
  aoAbrir: (tracking: AcompanhamentoMetaDTO) => void;
  aoRegistrarPreco: (tracking: AcompanhamentoMetaDTO) => void;
  aoExcluir: (tracking: AcompanhamentoMetaDTO) => void;
}

function dominioDe(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function CartaoMeta({ acompanhamento, indice, aoAbrir, aoRegistrarPreco, aoExcluir }: CartaoMetaProps) {
  const { meta: goal, analise: analysis } = acompanhamento;
  const [imageBroken, setImageBroken] = useState(false);
  const host = goal.url ? dominioDe(goal.url) : null;
  const archived = goal.situacao !== 'ACOMPANHANDO';

  return (
    <li className={`${styles.card} ${archived ? styles.archived : ''} list-item-in`} style={{ '--i': indice } as CSSProperties}>
      <button type="button" className={styles.open} onClick={() => aoAbrir(acompanhamento)}>
        <span className="visually-hidden">Ver histórico de preços de {goal.nome}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.thumb}>
            {goal.urlImagem && !imageBroken ? (
              <img
                src={goal.urlImagem}
                alt=""
                loading="lazy"
                width={48}
                height={48}
                onError={() => setImageBroken(true)}
              />
            ) : (
              <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{goal.nome}</span>
            <span className={styles.meta}>
              {host ?? 'Sem link'}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {analysis.quantidadeRegistros} {analysis.quantidadeRegistros === 1 ? 'registro' : 'registros'}
            </span>
          </span>
        </div>

        <div className={styles.figures}>
          <span className={styles.price}>
            <span className={styles.figureLabel}>Preço atual</span>
            <ValorMonetario valor={analysis.precoAtual} tamanho="lg" />
          </span>
          {analysis.quantidadeRegistros > 1 ? (
            <VariacaoPreco
              className={styles.delta}
              variacao={analysis.variacao}
              percentual={analysis.variacaoPercentual}
              tendencia={analysis.tendencia}
            />
          ) : (
            <span className={styles.firstOnly}>Primeiro registro</span>
          )}
        </div>

        {analysis.quantidadeRegistros > 1 ? (
          <MiniCurvaPreco
            className={styles.spark}
            precos={goal.historico.map((entry) => entry.preco)}
            tendencia={analysis.tendencia}
          />
        ) : (
          <p className={styles.sparkHint}>Registre o preço de novo para ver a evolução.</p>
        )}

        <p className={styles.since}>
          Registrado a <ValorMonetario className={styles.inline} valor={analysis.precoInicial} tamanho="sm" tom="muted" /> ·
          atualizado em <span className="tabular">{formatarDataNumerica(analysis.ultimaAtualizacao)}</span>
        </p>

        <div className={styles.bottom}>
          <Selo tom={tomSituacaoMeta[goal.situacao]} ponto={goal.situacao === 'ACOMPANHANDO'}>
            {rotuloSituacaoMeta[goal.situacao]}
          </Selo>

          <span className={styles.actions}>
            {goal.url ? (
              <a
                className={styles.action}
                href={goal.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Abrir a página de ${goal.nome} em uma nova aba`}
              >
                <ExternalLink size={16} strokeWidth={2} />
              </a>
            ) : null}

            <button
              type="button"
              className={styles.action}
              aria-label={`Registrar um preço novo para ${goal.nome}`}
              onClick={() => aoRegistrarPreco(acompanhamento)}
            >
              <Plus size={16} strokeWidth={2} />
            </button>

            <button
              type="button"
              className={`${styles.action} ${styles.delete}`}
              aria-label={`Excluir ${goal.nome}`}
              onClick={() => aoExcluir(acompanhamento)}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}
