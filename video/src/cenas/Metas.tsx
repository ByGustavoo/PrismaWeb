import { ArrowDownRight, ExternalLink, Lightbulb, Monitor } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import { curvaEntradaSaida, misturar, mola, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { formatarMoeda, formatarPercentual, ItemResumo, Selo, ValorMonetario } from '../componentes/Interface';
import { cenas, metas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const registros = [
  { data: '18/08', preco: 2199 },
  { data: '02/09', preco: 2089.8 },
  { data: '17/09', preco: 2149 },
  { data: '30/09', preco: 1899 },
];

const precos = registros.map((registro) => registro.preco);
const MENOR = Math.min(...precos);
const MAIOR = Math.max(...precos);
const MEDIA = precos.reduce((soma, preco) => soma + preco, 0) / precos.length;
const INICIAL = precos[0] ?? 0;
const ATUAL = precos[precos.length - 1] ?? 0;

const LARGURA = 912;
const ALTURA = 210;
const MINIMO = 1800;
const MAXIMO = 2300;

const x = (indice: number) => 40 + (indice / (registros.length - 1)) * (LARGURA - 80);
const y = (preco: number) => ALTURA - ((preco - MINIMO) / (MAXIMO - MINIMO)) * ALTURA;
const precoNaAltura = (altura: number) => MINIMO + (1 - altura / ALTURA) * (MAXIMO - MINIMO);
const linear = (t: number) => t;

const pontos = registros.map((registro, indice) => ({ x: x(indice), y: y(registro.preco) }));
const PASSO = x(1) - x(0);
const inclinacoes = pontos.slice(1).map((ponto, indice) => (ponto.y - (pontos[indice]?.y ?? ponto.y)) / PASSO);
const tangentes = pontos.map((_, indice) => {
  const antes = inclinacoes[indice - 1];
  const depois = inclinacoes[indice];
  if (antes === undefined) return depois ?? 0;
  if (depois === undefined) return antes;
  if (antes * depois <= 0) return 0;
  return Math.sign(antes) * Math.min(Math.abs(antes + depois) / 2, 3 * Math.min(Math.abs(antes), Math.abs(depois)));
});

const caminhoLinha = pontos
  .map((ponto, indice) => {
    const anterior = pontos[indice - 1];
    if (!anterior) return `M ${ponto.x} ${ponto.y}`;
    const terco = PASSO / 3;
    return `C ${anterior.x + terco} ${anterior.y + (tangentes[indice - 1] ?? 0) * terco} ${ponto.x - terco} ${ponto.y - (tangentes[indice] ?? 0) * terco} ${ponto.x} ${ponto.y}`;
  })
  .join(' ');
const caminhoArea = `${caminhoLinha} L ${x(registros.length - 1)} ${ALTURA} L ${x(0)} ${ALTURA} Z`;

function alturaNoAvanco(avanco: number): number {
  const indice = Math.min(Math.floor(avanco), pontos.length - 2);
  const de = pontos[indice];
  const para = pontos[indice + 1];
  if (!de || !para) return 0;
  const s = avanco - indice;
  const cubo = s ** 3;
  const quadrado = s ** 2;
  return (
    (2 * cubo - 3 * quadrado + 1) * de.y +
    (cubo - 2 * quadrado + s) * PASSO * (tangentes[indice] ?? 0) +
    (-2 * cubo + 3 * quadrado) * para.y +
    (cubo - quadrado) * PASSO * (tangentes[indice + 1] ?? 0)
  );
}

const mediasParciais = precos.map((_, indice) => precos.slice(0, indice + 1).reduce((soma, preco) => soma + preco, 0) / (indice + 1));

export function Metas() {
  const quadro = useCurrentFrame();
  const visiveis = metas.pontos.filter((inicio) => quadro >= inicio).length;
  const indiceAtual = Math.max(visiveis - 1, 0);
  const selo = mola(quadro, metas.selo, 190, 14);
  const leitura = mola(quadro, metas.leitura, 140, 16);
  const queda = INICIAL - ATUAL;

  const avanco = metas.pontos.slice(1).reduce((soma, chegada) => soma + progresso(quadro, chegada - metas.duracaoTrecho, metas.duracaoTrecho, curvaEntradaSaida), 0);
  const cabecaX = x(avanco);
  const cabecaY = alturaNoAvanco(avanco);
  const viajando = avanco % 1 > 0.001 && avanco % 1 < 0.999;
  const precoAtual = viajando ? precoNaAltura(cabecaY) : (registros[Math.round(avanco)]?.preco ?? INICIAL);
  const inicioGrafico = progresso(quadro, metas.pontos[0] ?? 0, 8);
  const fimGrafico = progresso(quadro, (metas.pontos[metas.pontos.length - 1] ?? 0) + 4, 16);

  const media = progresso(quadro, metas.pontos[1] ?? 0, metas.duracaoMedia);
  const alturaMedia = mediasParciais.slice(2).reduce(
    (altura, parcial, indice) => altura + (y(parcial) - y(mediasParciais[indice + 1] ?? parcial)) * mola(quadro, metas.pontos[indice + 2] ?? 0, 150, 18),
    y(mediasParciais[1] ?? MEDIA),
  );

  return (
    <CenaDividida
      duracao={cenas.metas.duracao}
      ladoTexto="direita"
      sobretitulo="METAS E DESEJOS"
      titulo="Compre no"
      tituloDestaque="menor preço."
      subtitulo="Registre o preço a cada consulta. O Prisma guarda o histórico e mostra o menor, a média e para onde ele está indo."
      inicioTitulo={metas.titulo}
      inicioCartao={metas.cartao}
      larguraTexto={560}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 36, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 14, background: cores.superficieSuave, color: cores.textoSecundario }}>
            <Monitor size={34} strokeWidth={1.8} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 27, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Monitor 27" 4K</span>
            <span style={{ fontSize: 18, color: cores.textoSecundario }}>{visiveis <= 1 ? '1 registro' : `${visiveis} registros`}</span>
          </div>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Selo cor={cores.destaque} fundo={cores.destaqueSuave}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
              Em acompanhamento
            </Selo>
            <ExternalLink size={22} color={cores.textoSecundario} />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 19, color: cores.textoSecundario }}>Preço atual</span>
            <ValorMonetario valor={precoAtual} tamanho={52} />
          </div>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              borderRadius: 12,
              background: cores.positivoSuave,
              color: cores.positivo,
              fontSize: 21,
              fontWeight: 600,
              opacity: selo,
              transform: `scale(${misturar(0.7, 1, selo)})`,
              transformOrigin: 'right center',
            }}
          >
            <ArrowDownRight size={22} strokeWidth={2.4} />
            Baixou
            <span style={{ fontFamily: fontes.numero }}>{formatarMoeda(queda)}</span>
            <span style={{ fontFamily: fontes.numero, opacity: 0.85 }}>{formatarPercentual((queda / INICIAL) * 100)}</span>
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <svg width={LARGURA} height={ALTURA} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="area-metas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cores.destaque} stopOpacity={0.3} />
                <stop offset="100%" stopColor={cores.destaque} stopOpacity={0} />
              </linearGradient>
              <clipPath id="recorte-metas">
                <rect x={0} y={-20} width={cabecaX} height={ALTURA + 20} />
              </clipPath>
            </defs>
            {[0, 0.5, 1].map((fracao) => (
              <line key={fracao} x1={0} x2={LARGURA} y1={ALTURA * fracao} y2={ALTURA * fracao} stroke={cores.graficoGrade} strokeWidth={1.5} />
            ))}
            <line x1={0} x2={LARGURA * media} y1={alturaMedia} y2={alturaMedia} stroke={cores.textoTerciario} strokeWidth={2} strokeDasharray="7 7" />
            <line
              x1={cabecaX}
              x2={cabecaX}
              y1={cabecaY}
              y2={ALTURA}
              stroke={cores.destaque}
              strokeWidth={2}
              strokeDasharray="5 6"
              opacity={0.55 * inicioGrafico * (1 - fimGrafico)}
            />
            <g clipPath="url(#recorte-metas)">
              <path d={caminhoArea} fill="url(#area-metas)" />
              <path d={caminhoLinha} fill="none" stroke={cores.destaque} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            {viajando ? (
              <g>
                <circle cx={cabecaX} cy={cabecaY} r={17} fill="rgba(124, 154, 255, 0.22)" />
                <circle cx={cabecaX} cy={cabecaY} r={7} fill={cores.destaqueForte} />
              </g>
            ) : null}
            {registros.map((registro, indice) => {
              const chegada = metas.pontos[indice] ?? 0;
              const entrada = mola(quadro, chegada, 200, 13);
              const menor = registro.preco === MENOR && indice === registros.length - 1;
              const cor = menor ? cores.positivo : cores.destaque;
              const escala = indice === 0 ? entrada : 0.75 + 0.25 * entrada;
              if (quadro < chegada) return null;
              return (
                <g key={registro.data} opacity={indice === 0 ? Math.min(entrada * 2, 1) : 1}>
                  {(menor ? [0, 9] : [0]).map((atraso) => {
                    const onda = progresso(quadro, chegada + atraso, 18, linear);
                    return onda > 0 && onda < 1 ? (
                      <circle key={atraso} cx={x(indice)} cy={y(registro.preco)} r={misturar(8, menor ? 38 : 26, onda)} fill="none" stroke={cor} strokeWidth={2.5} opacity={(1 - onda) * 0.75} />
                    ) : null;
                  })}
                  {menor ? <circle cx={x(indice)} cy={y(registro.preco)} r={22 * entrada} fill="rgba(47, 217, 154, 0.18)" /> : null}
                  <circle cx={x(indice)} cy={y(registro.preco)} r={8 * escala} fill={cor} stroke={cores.superficie} strokeWidth={3} />
                </g>
              );
            })}
          </svg>
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: alturaMedia - 30,
              fontSize: 16,
              color: cores.textoSecundario,
              opacity: media,
            }}
          >
            Média
          </span>
          <div style={{ position: 'relative', height: 26, marginTop: 10 }}>
            {registros.map((registro, indice) => (
              <span
                key={registro.data}
                style={{
                  position: 'absolute',
                  left: x(indice),
                  transform: 'translateX(-50%)',
                  fontSize: 16,
                  color: indice === indiceAtual && visiveis > 0 ? cores.texto : cores.textoSecundario,
                  opacity: quadro >= (metas.pontos[indice] ?? 0) ? 1 : 0.3,
                }}
              >
                {registro.data}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', borderRadius: 16, border: `1.5px solid ${cores.borda}`, background: cores.superficieElevada }}>
          {[
            { rotulo: 'Menor preço', valor: MENOR, cor: cores.positivo },
            { rotulo: 'Preço médio', valor: MEDIA, cor: cores.texto },
            { rotulo: 'Maior preço', valor: MAIOR, cor: cores.texto },
          ].map(({ rotulo, valor, cor }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} opacidade={progresso(quadro, metas.selo + indice * 4, 14)} primeiro={indice === 0}>
              <ValorMonetario valor={valor} tamanho={24} cor={cor} />
            </ItemResumo>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '18px 20px',
            borderRadius: 16,
            background: cores.positivoSuave,
            border: `1.5px solid rgba(47, 217, 154, 0.35)`,
            fontSize: 20,
            lineHeight: 1.4,
            color: cores.texto,
            opacity: leitura,
            transform: `translateY(${misturar(16, 0, leitura)}px)`,
          }}
        >
          <Lightbulb size={24} color={cores.positivo} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
          É o menor preço já registrado. Se a compra estava no plano, este é o melhor momento até agora.
        </div>
      </Cartao>
    </CenaDividida>
  );
}
