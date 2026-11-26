import type { CSSProperties, ReactNode } from 'react';
import { MarcaPrisma } from '@/components/comum/MarcaPrisma';
import { NOME_APLICACAO, SLOGAN_APLICACAO } from '@/constants/aplicacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { SerieInterrompida } from './SerieInterrompida';
import styles from './MolduraDeErro.module.css';

interface MolduraDeErroProps {
  marca: ReactNode;
  codigo?: ReactNode;
  sobretitulo?: string;
  titulo: string;
  descricao: ReactNode;
  acoes: ReactNode;
  rodape?: ReactNode;
  alerta?: boolean;
}

export const classeDaMarcaDeErro = styles.brand;

export function ConteudoDaMarcaDeErro() {
  return (
    <>
      <MarcaPrisma tamanho={28} />
      <span className={styles.brandName}>
        {NOME_APLICACAO}
        <small>{SLOGAN_APLICACAO}</small>
      </span>
    </>
  );
}

export function CodigoDeErro({ antes, destaque, depois }: { antes: string; destaque: string; depois: string }) {
  return (
    <p className={styles.code} aria-hidden="true">
      {antes}
      <span className={styles.zero}>{destaque}</span>
      {depois}
    </p>
  );
}

export function MolduraDeErro({ marca, codigo, sobretitulo, titulo, descricao, acoes, rodape, alerta = false }: MolduraDeErroProps) {
  const entrada = (indice: number) => ({ '--i': indice }) as CSSProperties;
  const deslocamento = sobretitulo ? 1 : 0;

  return (
    <div className={styles.screen}>
      {marca}

      <main className={styles.card} data-tom={alerta ? 'erro' : 'acento'} role={alerta ? 'alert' : undefined}>
        <div className={styles.hero}>
          {codigo}
          <SerieInterrompida tom={alerta ? 'erro' : 'acento'} />
        </div>

        <div className={styles.content}>
          {sobretitulo ? (
            <p className={juntarClasses(styles.sobretitulo, 'list-item-in')} style={entrada(0)}>
              {sobretitulo}
            </p>
          ) : null}

          <h1 className={juntarClasses(styles.title, 'list-item-in')} style={entrada(deslocamento)}>
            {titulo}
          </h1>

          <p className={juntarClasses(styles.description, 'list-item-in')} style={entrada(deslocamento + 1)}>
            {descricao}
          </p>

          <div className={juntarClasses(styles.actions, 'list-item-in')} style={entrada(deslocamento + 2)}>
            {acoes}
          </div>

          {rodape ? (
            <div className={juntarClasses(styles.rodape, 'list-item-in')} style={entrada(deslocamento + 3)}>
              {rodape}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
