import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { MarcaPrisma } from '@/components/comum';
import { Botao } from '@/components/ui';
import { NOME_APLICACAO, SLOGAN_APLICACAO } from '@/constants/aplicacao';
import { caminhos } from '@/routes/caminhos';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './PaginaNaoEncontrada.module.css';

const atalhos = [
  { label: 'Lançamentos', to: caminhos.lancamentos },
  { label: 'Contas', to: caminhos.contas },
  { label: 'Cartões', to: caminhos.cartoes },
  { label: 'Relatórios', to: caminhos.relatorios },
];

const HISTORICO: ReadonlyArray<readonly [number, number]> = [
  [10, 124],
  [62, 113],
  [114, 120],
  [166, 96],
  [218, 104],
  [270, 76],
  [322, 84],
  [374, 50],
];

const QUEBRA_X = 374;
const QUEBRA_Y = 50;
const FIM_RASTRO_X = 552;
const LINHA_BASE = 148;

const VARREDURA_MS = 4200;

const VARREDURA_IDA = 0.42;
const DESENHO_MS = Math.round(VARREDURA_MS * VARREDURA_IDA);

const linha = HISTORICO.map(([x, y]) => `${x},${y}`).join(' ');
const area = `M${HISTORICO.map(([x, y]) => `${x},${y}`).join(' L')} L${QUEBRA_X},${LINHA_BASE} L10,${LINHA_BASE} Z`;

function comprimentoAte(index: number) {
  let walked = 0;
  for (let step = 1; step <= index; step += 1) {
    const point = HISTORICO[step];
    const previous = HISTORICO[step - 1];
    if (point && previous) walked += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }
  return walked;
}

const COMPRIMENTO_DESENHO = comprimentoAte(HISTORICO.length - 1);

function SerieInterrompida() {
  const chartStyle = {
    '--draw-length': COMPRIMENTO_DESENHO.toFixed(2),
    '--draw-duration': `${DESENHO_MS}ms`,
    '--sweep-duration': `${VARREDURA_MS}ms`,
  } as CSSProperties;

  return (
    <svg
      className={styles.chart}
      style={chartStyle}
      viewBox="0 0 600 150"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="prisma-404-area" x1="0" y1="0" x2="0" y2="1">
          <stop className={styles.areaTop} offset="0%" />
          <stop className={styles.areaBottom} offset="100%" />
        </linearGradient>
        <linearGradient id="prisma-404-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop className={styles.strokeFade} offset="0%" />
          <stop className={styles.strokeFull} offset="14%" />
          <stop className={styles.strokeFull} offset="100%" />
        </linearGradient>
        <filter id="prisma-404-glow" x="-20%" y="-80%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {[40, 84, 128].map((y) => (
        <line key={y} className={styles.grid} x1="0" y1={y} x2="600" y2={y} />
      ))}

      <path className={styles.area} d={area} fill="url(#prisma-404-area)" />

      <polyline className={styles.glow} points={linha} filter="url(#prisma-404-glow)" />
      <polyline className={styles.line} points={linha} stroke="url(#prisma-404-stroke)" />

      {HISTORICO.slice(1, -1).map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          className={styles.dot}
          style={{ '--delay': `${Math.round((comprimentoAte(index + 1) / COMPRIMENTO_DESENHO) * DESENHO_MS)}ms` } as CSSProperties}
          cx={x}
          cy={y}
          r="3.5"
        />
      ))}

      <line className={styles.marker} x1={QUEBRA_X} y1="18" x2={QUEBRA_X} y2={LINHA_BASE} />
      <path className={styles.trail} d={`M${QUEBRA_X},${QUEBRA_Y} L${FIM_RASTRO_X},${QUEBRA_Y}`} />

      <circle className={styles.point} cx={QUEBRA_X} cy={QUEBRA_Y} r="5" />
      <circle className={styles.pulse} cx={FIM_RASTRO_X} cy={QUEBRA_Y} r="5" />
      <circle className={styles.end} cx={FIM_RASTRO_X} cy={QUEBRA_Y} r="5" />
    </svg>
  );
}

export function PaginaNaoEncontrada() {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = location.key !== 'default';

  useEffect(() => {
    const previous = document.title;
    document.title = `Página não encontrada · ${NOME_APLICACAO}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className={styles.screen}>
      <Link className={styles.brand} to={caminhos.dashboard}>
        <MarcaPrisma tamanho={28} />
        <span className={styles.brandName}>
          {NOME_APLICACAO}
          <small>{SLOGAN_APLICACAO}</small>
        </span>
      </Link>

      <main className={styles.card}>
        <div className={styles.hero}>
          <p className={styles.code} aria-hidden="true">
            4<span className={styles.zero}>0</span>4
          </p>
          <SerieInterrompida />
        </div>

        <div className={styles.content}>
          <h1 className={juntarClasses(styles.title, 'list-item-in')} style={{ '--i': 0 } as CSSProperties}>
            Página não encontrada
          </h1>

          <p className={juntarClasses(styles.description, 'list-item-in')} style={{ '--i': 1 } as CSSProperties}>
            O endereço <code className={styles.path}>{location.pathname}</code> não corresponde a nenhuma tela do
            Prisma. Ele pode ter sido digitado com um erro ou pertencer a uma tela que mudou de lugar.
          </p>

          <div className={juntarClasses(styles.actions, 'list-item-in')} style={{ '--i': 2 } as CSSProperties}>
            <Botao icone={LayoutDashboard} onClick={() => navigate(caminhos.dashboard)}>
              Ir para o dashboard
            </Botao>
            {canGoBack ? (
              <Botao variante="secondary" icone={ArrowLeft} onClick={() => navigate(-1)}>
                Voltar
              </Botao>
            ) : null}
          </div>

          <nav
            className={juntarClasses(styles.shortcuts, 'list-item-in')}
            style={{ '--i': 3 } as CSSProperties}
            aria-label="Atalhos"
          >
            <span className={styles.shortcutsLabel}>Talvez você procure</span>
            <ul className={styles.links}>
              {atalhos.map((shortcut) => (
                <li key={shortcut.to}>
                  <Link className={styles.link} to={shortcut.to}>
                    {shortcut.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
