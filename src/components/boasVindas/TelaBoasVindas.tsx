import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, ChartSpline, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MarcaPrisma } from '@/components/comum';
import { Botao } from '@/components/ui';
import { FRASE_BOAS_VINDAS, NOME_APLICACAO } from '@/constants/aplicacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { LinhaDoSaldo } from './LinhaDoSaldo';
import { transicionarParaAplicacao } from './transicaoBoasVindas';
import styles from './TelaBoasVindas.module.css';

const DURACAO_DESPEDIDA_MS = 760;

const LETRAS_DO_NOME = [...NOME_APLICACAO];
const PALAVRAS_DO_TITULO = FRASE_BOAS_VINDAS.split(' ');

const ATRASO_ENTRADA_MS = {
  descricao: 1000,
  primeiroRecurso: 1100,
  passoRecurso: 90,
  acoes: 1420,
};

interface Recurso {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
}

const recursos: Recurso[] = [
  {
    icone: Wallet,
    titulo: 'Contas e cartões',
    descricao: 'O saldo de cada conta e a fatura de cada cartão, com as parcelas já distribuídas.',
  },
  {
    icone: ChartSpline,
    titulo: 'Orçamento e previsão',
    descricao: 'Limites por categoria e a projeção dos próximos meses a partir do que se repete.',
  },
  {
    icone: PiggyBank,
    titulo: 'Investimentos e metas',
    descricao: 'Quanto você aportou, quanto rendeu e quanto custa o que você quer comprar.',
  },
];

const TOTAL_BLOCOS = recursos.length + 2;

function bloco(atrasoEntradaMs: number, ordemSaida: number): CSSProperties {
  return { '--atraso': `${atrasoEntradaMs}ms`, '--ordem-saida': ordemSaida } as CSSProperties;
}

function comIndice(indice: number): CSSProperties {
  return { '--i': indice } as CSSProperties;
}

export function TelaBoasVindas({ aoComecar }: { aoComecar: () => void }) {
  const [saindo, setSaindo] = useState(false);
  const [movimentoPermitido] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const simboloRef = useRef<HTMLSpanElement>(null);
  const nomeRef = useRef<HTMLSpanElement>(null);
  const letrasRef = useRef<(HTMLSpanElement | null)[]>([]);

  const medirDistanciaAteOLogo = useCallback(() => {
    const simbolo = simboloRef.current?.getBoundingClientRect();
    const nome = nomeRef.current?.getBoundingClientRect();
    if (!simbolo || !nome) return;
    const centroDoLogo = simbolo.left + simbolo.width / 2;
    letrasRef.current.forEach((letra) => {
      if (!letra) return;
      const centroDaLetra = nome.left + letra.offsetLeft + letra.offsetWidth / 2;
      letra.style.setProperty('--dx', `${(centroDoLogo - centroDaLetra).toFixed(1)}px`);
    });
  }, []);

  useLayoutEffect(() => {
    medirDistanciaAteOLogo();
    void document.fonts.ready.then(medirDistanciaAteOLogo);
    window.addEventListener('resize', medirDistanciaAteOLogo);
    return () => window.removeEventListener('resize', medirDistanciaAteOLogo);
  }, [medirDistanciaAteOLogo]);

  const comecar = () => {
    if (saindo) return;
    if (!movimentoPermitido) {
      aoComecar();
      return;
    }
    medirDistanciaAteOLogo();
    setSaindo(true);
    window.setTimeout(() => transicionarParaAplicacao(aoComecar), DURACAO_DESPEDIDA_MS);
  };

  return (
    <main
      className={juntarClasses(styles.tela, saindo && styles.saindo)}
      aria-labelledby="titulo-boas-vindas"
      aria-busy={saindo || undefined}
    >
      <LinhaDoSaldo saindo={saindo} />

      <div className={styles.conteudo}>
        <div className={styles.marca}>
          <span ref={simboloRef} className={juntarClasses(styles.simbolo, 'marca-em-transicao')} aria-hidden="true">
            <MarcaPrisma tamanho={40} className={styles.prisma} />
          </span>
          <span ref={nomeRef} className={styles.nome}>
            <span className="visually-hidden">{NOME_APLICACAO}</span>
            {LETRAS_DO_NOME.map((letra, indice) => (
              <span
                key={`${letra}-${indice}`}
                ref={(elemento) => {
                  letrasRef.current[indice] = elemento;
                }}
                className={styles.letra}
                style={comIndice(indice)}
                aria-hidden="true"
              >
                {letra}
              </span>
            ))}
          </span>
        </div>

        <h1 id="titulo-boas-vindas" className={styles.titulo}>
          {PALAVRAS_DO_TITULO.map((palavra, indice) => (
            <Fragment key={`${palavra}-${indice}`}>
              <span className={styles.palavra}>
                <span className={styles.palavraInterna} style={comIndice(indice)}>
                  {palavra}
                </span>
              </span>
              {indice < PALAVRAS_DO_TITULO.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </h1>

        <p
          className={juntarClasses(styles.descricao, styles.entra, styles.etapa)}
          style={bloco(ATRASO_ENTRADA_MS.descricao, TOTAL_BLOCOS)}
        >
          Contas, cartões, lançamentos e investimentos no mesmo lugar, para você saber quanto tem hoje e quanto
          ainda vai ter no fim do mês.
        </p>

        <ul className={styles.recursos}>
          {recursos.map(({ icone: Icone, titulo, descricao }, indice) => (
            <li
              key={titulo}
              className={juntarClasses(styles.recurso, styles.entra, styles.etapa)}
              style={bloco(
                ATRASO_ENTRADA_MS.primeiroRecurso + indice * ATRASO_ENTRADA_MS.passoRecurso,
                TOTAL_BLOCOS - 1 - indice,
              )}
            >
              <span className={styles.iconeRecurso} aria-hidden="true">
                <Icone size={18} strokeWidth={2} />
              </span>
              <span className={styles.textosRecurso}>
                <span className={styles.tituloRecurso}>{titulo}</span>
                <span className={styles.descricaoRecurso}>{descricao}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className={juntarClasses(styles.acoes, styles.entra, styles.etapa)} style={bloco(ATRASO_ENTRADA_MS.acoes, 0)}>
          <Botao icone={ArrowRight} posicaoIcone="right" onClick={comecar} className={styles.comecar}>
            Começar
          </Botao>
        </div>
      </div>
    </main>
  );
}
