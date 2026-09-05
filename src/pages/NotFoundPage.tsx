import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { BrandMark } from '@/components/common';
import { Button } from '@/components/ui';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';
import styles from './NotFoundPage.module.css';

/*
 * Quem erra o endereco quase sempre queria uma das telas de entrada. Como esta
 * pagina fica fora do shell do app, sem sidebar, estes quatro destinos sao a
 * navegacao que sobra — e por isso nao sao enfeite.
 */
const shortcuts = [
  { label: 'Lançamentos', to: paths.transactions },
  { label: 'Contas', to: paths.accounts },
  { label: 'Cartões', to: paths.cards },
  { label: 'Relatórios', to: paths.reports },
];

/*
 * A serie do historico ate o ponto em que ela para. Sao coordenadas do viewBox,
 * escritas a mao: uma curva que sobe com as oscilacoes que qualquer saldo tem.
 */
const HISTORY: ReadonlyArray<readonly [number, number]> = [
  [10, 124],
  [62, 113],
  [114, 120],
  [166, 96],
  [218, 104],
  [270, 76],
  [322, 84],
  [374, 50],
];

/** Onde o traco cheio termina e o tracejado do que nao existe comeca. */
const BREAK_X = 374;
const BREAK_Y = 50;
/*
 * O tracejado para antes da borda: o halo que pulsa no ponto final chega a quase
 * tres vezes o raio, e o cartao tem `overflow: hidden` — encostado na moldura,
 * ele apareceria cortado ao meio.
 */
const TRAIL_END_X = 552;
const BASELINE = 148;

/**
 * Duracao do ciclo completo da serie: ela avanca, espera no ponto em que a
 * historia acaba, recua e recomeca. O laco e continuo de proposito — a linha
 * fica tentando chegar adiante do ponto em que os dados terminam.
 */
const SWEEP_MS = 4200;

/**
 * Fracao do ciclo gasta na ida. Precisa acompanhar o quadro de 42% do keyframe
 * `sweep-series` no `.module.css`: e dela que saem os atrasos de tudo que entra
 * quando a linha chega ao fim pela primeira vez.
 */
const SWEEP_FORWARD = 0.42;
const DRAW_MS = Math.round(SWEEP_MS * SWEEP_FORWARD);

const line = HISTORY.map(([x, y]) => `${x},${y}`).join(' ');
const area = `M${HISTORY.map(([x, y]) => `${x},${y}`).join(' L')} L${BREAK_X},${BASELINE} L10,${BASELINE} Z`;

/** Distancia acumulada da poligonal ate o ponto de indice `index`. */
function lengthUpTo(index: number) {
  let walked = 0;
  for (let step = 1; step <= index; step += 1) {
    const point = HISTORY[step];
    const previous = HISTORY[step - 1];
    if (point && previous) walked += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }
  return walked;
}

/*
 * Comprimento do tracado, calculado da propria geometria em vez de medido no
 * DOM: a serie e uma poligonal, entao a soma das hipotenusas e exata e ja esta
 * pronta no primeiro quadro — medir depois da montagem faria a linha aparecer
 * inteira antes de se esconder para comecar a animacao.
 *
 * O valor vale em unidades do viewBox, e nao em pixels de tela. Por isso os
 * tracos animados nao usam `non-scaling-stroke`: com ele o padrao de tracejado
 * passa a ser medido na tela, e a mesma animacao cortaria a linha pela metade
 * numa largura de celular.
 */
const DRAW_LENGTH = lengthUpTo(HISTORY.length - 1);

/**
 * O grafico que conta o 404 no vocabulario do proprio produto: traco cheio para
 * o que existe, marca vertical no ponto em que a serie acaba e tracejado ate um
 * ponto vazio para o trecho que nenhum dado preenche. Nas telas do Prisma o
 * tracejado ja significa "isto nao aconteceu" — na previsao e no total aportado
 * da carteira —, entao aqui ele diz que o endereco pedido nao tem historia.
 *
 * A animacao e a mensagem, e por isso tem ordem: a grade entra, a serie se
 * desenha da esquerda para a direita com cada ponto assentando na passagem dela
 * e, quando chega ao fim, o vazio se anuncia — o tracejado corre para a direita
 * sem chegar a lugar nenhum e o ponto final pulsa oco, como um dado que se
 * espera e nao vem.
 *
 * Dai em diante o traco nao para: ele recua ate o comeco e avanca de novo, em
 * laco. Os pontos, a area e a marca do fim ficam onde estao — o que existe
 * continua existindo; o que vai e volta e a leitura da serie, que a cada volta
 * esbarra no mesmo lugar.
 *
 * E SVG escrito a mao, e nao Recharts: sem eixo, rotulo ou tooltip, montar um
 * grafico inteiro custaria mais do que informa. A cor sai das classes do modulo,
 * que leem os tokens e acompanham o tema.
 */
function BrokenSeries() {
  const chartStyle = {
    '--draw-length': DRAW_LENGTH.toFixed(2),
    '--draw-duration': `${DRAW_MS}ms`,
    '--sweep-duration': `${SWEEP_MS}ms`,
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
        {/*
          O traco nasce transparente na borda esquerda: sem isso a serie comecaria
          num corte seco contra a moldura do cartao, como um grafico partido ao
          meio em vez de uma historia que vem de tras.
        */}
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

      {/* O halo e a mesma serie desfocada: da corpo ao traco sem engrossa-lo. */}
      <polyline className={styles.glow} points={line} filter="url(#prisma-404-glow)" />
      {/*
        O degrade do traco vai no atributo, e nao no CSS: `stroke: url(#id)` num
        `.module.css` fica a merce do processamento de `url()` do bundler, e o
        atributo referencia o `defs` acima sem intermediario.
      */}
      <polyline className={styles.line} points={line} stroke="url(#prisma-404-stroke)" />

      {HISTORY.slice(1, -1).map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          className={styles.dot}
          style={{ '--delay': `${Math.round((lengthUpTo(index + 1) / DRAW_LENGTH) * DRAW_MS)}ms` } as CSSProperties}
          cx={x}
          cy={y}
          r="3.5"
        />
      ))}

      <line className={styles.marker} x1={BREAK_X} y1="18" x2={BREAK_X} y2={BASELINE} />
      <path className={styles.trail} d={`M${BREAK_X},${BREAK_Y} L${TRAIL_END_X},${BREAK_Y}`} />

      <circle className={styles.point} cx={BREAK_X} cy={BREAK_Y} r="5" />
      <circle className={styles.pulse} cx={TRAIL_END_X} cy={BREAK_Y} r="5" />
      <circle className={styles.end} cx={TRAIL_END_X} cy={BREAK_Y} r="5" />
    </svg>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * `default` e a chave da primeira entrada do historico: quem colou a URL
   * errada direto na barra do navegador nao tem pagina anterior dentro do app,
   * e um botao "Voltar" ali ou nao faria nada ou jogaria a pessoa para fora.
   */
  const canGoBack = location.key !== 'default';

  // A aba tambem precisa dizer o que aconteceu: esta pagina costuma chegar por
  // link externo, e o titulo e a primeira coisa que se le no historico.
  useEffect(() => {
    const previous = document.title;
    document.title = `Página não encontrada · ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className={styles.screen}>
      <Link className={styles.brand} to={paths.dashboard}>
        <BrandMark size={28} />
        <span className={styles.brandName}>
          {APP_NAME}
          <small>{APP_TAGLINE}</small>
        </span>
      </Link>

      <main className={styles.card}>
        <div className={styles.hero}>
          <p className={styles.code} aria-hidden="true">
            4<span className={styles.zero}>0</span>4
          </p>
          <BrokenSeries />
        </div>

        <div className={styles.content}>
          <h1 className={cn(styles.title, 'list-item-in')} style={{ '--i': 0 } as CSSProperties}>
            Página não encontrada
          </h1>

          <p className={cn(styles.description, 'list-item-in')} style={{ '--i': 1 } as CSSProperties}>
            O endereço <code className={styles.path}>{location.pathname}</code> não corresponde a nenhuma tela do
            Prisma. Ele pode ter sido digitado com um erro ou pertencer a uma tela que mudou de lugar.
          </p>

          <div className={cn(styles.actions, 'list-item-in')} style={{ '--i': 2 } as CSSProperties}>
            <Button icon={LayoutDashboard} onClick={() => navigate(paths.dashboard)}>
              Ir para o dashboard
            </Button>
            {canGoBack ? (
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
                Voltar
              </Button>
            ) : null}
          </div>

          <nav
            className={cn(styles.shortcuts, 'list-item-in')}
            style={{ '--i': 3 } as CSSProperties}
            aria-label="Atalhos"
          >
            <span className={styles.shortcutsLabel}>Talvez você procure</span>
            <ul className={styles.links}>
              {shortcuts.map((shortcut) => (
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
