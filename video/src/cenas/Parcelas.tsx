import { useCurrentFrame } from 'remotion';
import { curvaEntradaSaida, misturar, mola, progresso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { formatarMoeda, Selo, ValorMonetario } from '../componentes/Interface';
import { Rolante } from '../componentes/Rolante';
import { cenas, PARCELA, parcelas, PARCELAS_PAGAS, PARCELAS_TOTAIS } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 984;
const RESPIRO = 36;
const BORDA = 1.5;
const ALTURA_COMPRA = 300;
const ALTURA_SEGMENTO = 10;
const TOPO_BARRA = RESPIRO + BORDA + 28 + 34 + 8 + 26 + 24 + 36 + 20;
const TOPO_FATURAS = RESPIRO + ALTURA_COMPRA + 26 + 44;
const ALTURA_FATURA = 92;
const ALTURA_LINHA_FATURA = ALTURA_FATURA - 12;
const LARGURA_BARRA = LARGURA_CARTAO - RESPIRO * 2 - 28 * 2;
const CENTRO_ETIQUETA = RESPIRO + 22 + 200 + 18 + 65;
const AMOSTRAS_CURVA = 80;
const linear = (t: number) => t;

const faturas = [
  { mes: 'Outubro de 2026', fecha: 'Fecha 13 de Out', vence: 'Vence 05 de Nov', total: 2346.9, aberta: true },
  { mes: 'Novembro de 2026', fecha: 'Fecha 13 de Nov', vence: 'Vence 05 de Dez', total: 1812.4, aberta: false },
  { mes: 'Dezembro de 2026', fecha: 'Fecha 13 de Dez', vence: 'Vence 05 de Jan de 2027', total: 1204.15, aberta: false },
];

const estagios = Array.from({ length: PARCELAS_PAGAS + 1 }, (_, pagas) => ({
  atual: String(pagas + 1),
  restantes: String(PARCELAS_TOTAIS - pagas),
  pagas: `${pagas} ${pagas === 1 ? 'paga' : 'pagas'} · última em Jul/2027`,
}));

interface Ponto {
  x: number;
  y: number;
}

interface Amostra extends Ponto {
  comprimento: number;
}

function centroSegmento(indice: number): number {
  return RESPIRO + BORDA + 28 + (indice + 0.5) * (LARGURA_BARRA / PARCELAS_TOTAIS);
}

function pontosDoVoo(indice: number): [Ponto, Ponto, Ponto, Ponto] {
  const de = { x: centroSegmento(indice + PARCELAS_PAGAS), y: TOPO_BARRA + ALTURA_SEGMENTO / 2 };
  const para = { x: CENTRO_ETIQUETA, y: TOPO_FATURAS + indice * ALTURA_FATURA + ALTURA_LINHA_FATURA / 2 };
  return [de, { x: de.x + 130, y: de.y - 64 }, { x: para.x + 170, y: para.y - 130 }, para];
}

function amostrar([a, b, c, d]: [Ponto, Ponto, Ponto, Ponto]): Amostra[] {
  const amostras: Amostra[] = [];
  let comprimento = 0;
  let anterior = a;
  for (let passo = 0; passo <= AMOSTRAS_CURVA; passo += 1) {
    const t = passo / AMOSTRAS_CURVA;
    const u = 1 - t;
    const ponto = {
      x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
      y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y,
    };
    comprimento += Math.hypot(ponto.x - anterior.x, ponto.y - anterior.y);
    amostras.push({ ...ponto, comprimento });
    anterior = ponto;
  }
  return amostras;
}

function pontoNoArco(amostras: Amostra[], fracao: number): Ponto {
  const alvo = fracao * (amostras[amostras.length - 1]?.comprimento ?? 0);
  const indice = Math.max(
    amostras.findIndex((amostra) => amostra.comprimento >= alvo),
    1,
  );
  const antes = amostras[indice - 1];
  const depois = amostras[indice];
  if (!antes || !depois) return { x: 0, y: 0 };
  const trecho = depois.comprimento - antes.comprimento;
  const t = trecho > 0 ? (alvo - antes.comprimento) / trecho : 0;
  return { x: misturar(antes.x, depois.x, t), y: misturar(antes.y, depois.y, t) };
}

const voos = parcelas.voos.map((inicio, indice) => {
  const pontos = pontosDoVoo(indice);
  const [a, b, c, d] = pontos;
  return {
    inicio,
    pouso: inicio + parcelas.duracaoVoo,
    amostras: amostrar(pontos),
    caminho: `M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`,
  };
});

function pulso(quadro: number, inicio: number, duracao: number): number {
  return Math.sin(Math.PI * progresso(quadro, inicio, duracao, linear));
}

export function Parcelas() {
  const quadro = useCurrentFrame();
  const entradaCartao = mola(quadro, parcelas.cartao, 90, 18);
  const pulsoSelo = parcelas.pagamentos.reduce((soma, pagamento) => soma + pulso(quadro, pagamento, parcelas.duracaoPagamento), 0);

  return (
    <CenaDividida
      duracao={cenas.parcelas.duracao}
      ladoTexto="direita"
      sobretitulo="FATURAS E PARCELAS"
      titulo="Cada parcela"
      tituloDestaque="na fatura certa."
      subtitulo="A compra parcelada se distribui pelas faturas, e a soma das parcelas fecha no centavo com o total."
      inicioTitulo={parcelas.titulo}
      inicioCartao={parcelas.cartao}
      larguraTexto={560}
    >
      <div
        style={{
          position: 'relative',
          height: TOPO_FATURAS + ALTURA_FATURA * 3 + RESPIRO,
          borderRadius: 28,
          background: cores.superficie,
          border: `${BORDA}px solid ${cores.borda}`,
          boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
          fontFamily: fontes.texto,
          opacity: entradaCartao > 0 ? 1 : 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: RESPIRO,
            right: RESPIRO,
            top: RESPIRO,
            height: ALTURA_COMPRA,
            padding: '28px 28px 0',
            borderRadius: 20,
            background: cores.superficieElevada,
            border: `${BORDA}px solid ${cores.borda}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: 34 + 8 + 26 }}>
            <span style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto, lineHeight: '34px' }}>Notebook</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, color: cores.textoSecundario, lineHeight: '26px' }}>
              Cartão Azul ·
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: paleta[11] }} />
              Compras · 12 de agosto de 2026
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, height: 36 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 28, fontWeight: 650, color: cores.texto }}>
              12x de <ValorMonetario valor={PARCELA} tamanho={30} />
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 19, color: cores.textoSecundario }}>
              Total <ValorMonetario valor={3598} tamanho={21} cor={cores.textoSecundario} />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {Array.from({ length: PARCELAS_TOTAIS }, (_, indice) => {
              const trilho = progresso(quadro, parcelas.segmentos + indice * parcelas.intervaloSegmentos, 8);
              const ativacao = indice === 0 ? parcelas.segmentos : parcelas.pagamentos[indice - 1];
              const quitacao = parcelas.pagamentos[indice];
              const voo = parcelas.voos[indice - PARCELAS_PAGAS];
              const enchimento = ativacao === undefined ? 0 : progresso(quadro, ativacao, parcelas.duracaoPagamento);
              const pago = quitacao === undefined ? 0 : progresso(quadro, quitacao, parcelas.duracaoPagamento);
              const reserva = voo === undefined || ativacao !== undefined ? 0 : progresso(quadro, voo, 8);
              const salto = (quitacao === undefined ? 0 : pulso(quadro, quitacao, parcelas.duracaoPagamento)) + (voo === undefined ? 0 : pulso(quadro, voo - 3, 10));
              const respiracao = 0.75 + 0.25 * Math.sin((quadro - (ativacao ?? 0)) / 5);
              return (
                <div
                  key={indice}
                  style={{
                    position: 'relative',
                    flex: 1,
                    height: ALTURA_SEGMENTO,
                    borderRadius: ALTURA_SEGMENTO / 2,
                    background: cores.neutroSuave,
                    opacity: trilho,
                    transform: `scaleX(${misturar(0.4, 1, trilho)}) scaleY(${1 + 0.55 * salto})`,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, width: `${reserva * 100}%`, borderRadius: ALTURA_SEGMENTO / 2, background: 'rgba(124, 154, 255, 0.45)' }} />
                  <div style={{ position: 'absolute', inset: 0, width: `${enchimento * 100}%`, borderRadius: ALTURA_SEGMENTO / 2, background: cores.destaque }} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${enchimento * 100}%`,
                      borderRadius: ALTURA_SEGMENTO / 2,
                      background: cores.destaqueForte,
                      opacity: enchimento > 0 ? 1 - pago : 0,
                      boxShadow: `0 0 ${12 + 6 * respiracao}px rgba(151, 174, 255, ${0.8 * respiracao})`,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
            <span style={{ fontSize: 21, color: cores.textoSecundario }}>
              Parcela{' '}
              <Rolante
                itens={estagios.map((estagio) => estagio.atual)}
                trocas={parcelas.pagamentos}
                alinhamento="end"
                estilo={{ fontFamily: fontes.numero, color: cores.texto, fontWeight: 650 }}
              />{' '}
              de 12
            </span>
            <Selo cor={cores.destaque} fundo={cores.destaqueSuave} estilo={{ transform: `scale(${1 + 0.09 * pulsoSelo})` }}>
              <Rolante itens={estagios.map((estagio) => estagio.restantes)} trocas={parcelas.pagamentos} alinhamento="end" estilo={{ fontFamily: fontes.numero }} />
              restantes
            </Selo>
          </div>
          <Rolante
            itens={estagios.map((estagio) => estagio.pagas)}
            trocas={parcelas.pagamentos}
            estilo={{ display: 'grid', marginTop: 8, fontSize: 18, color: cores.textoSecundario }}
          />
        </div>

        <div style={{ position: 'absolute', left: RESPIRO, right: RESPIRO, top: RESPIRO + ALTURA_COMPRA + 26, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Fatura atual e próximas</span>
          <span style={{ fontSize: 18, color: cores.textoSecundario }}>Fechamento antes do vencimento</span>
        </div>

        {faturas.map((fatura, indice) => {
          const entrada = progresso(quadro, parcelas.faturas[indice] ?? 0, 14);
          const pouso = voos[indice]?.pouso ?? 0;
          const brilho = quadro >= pouso ? 1 - progresso(quadro, pouso, 26) : 0;
          const etiqueta = mola(quadro, pouso - 1, 210, 14);
          const somado = progresso(quadro, pouso, 14);
          const impacto = pulso(quadro, pouso, 9);
          return (
            <div
              key={fatura.mes}
              style={{
                position: 'absolute',
                left: RESPIRO,
                right: RESPIRO,
                top: TOPO_FATURAS + indice * ALTURA_FATURA,
                height: ALTURA_LINHA_FATURA,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 22px',
                borderRadius: 16,
                background: `rgba(124, 154, 255, ${0.12 * brilho})`,
                border: `${BORDA}px solid ${brilho > 0 ? `rgba(124, 154, 255, ${0.3 + 0.6 * brilho})` : cores.borda}`,
                boxShadow: `0 0 ${28 * brilho}px rgba(124, 154, 255, ${0.28 * brilho})`,
                opacity: entrada,
                transform: `translateY(${misturar(16, 0, entrada) + 4 * impacto}px)`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200, flexShrink: 0 }}>
                <span style={{ fontSize: 21, fontWeight: 650, color: cores.texto }}>{fatura.mes}</span>
                <span style={{ fontSize: 17, color: cores.textoSecundario }}>Cartão Azul</span>
              </div>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 10,
                  background: cores.superficieSuave,
                  fontSize: 17,
                  color: cores.texto,
                  whiteSpace: 'nowrap',
                  opacity: Math.min(etiqueta, 1),
                  transform: `scale(${misturar(0.6, 1, etiqueta)})`,
                }}
              >
                Notebook {indice + PARCELAS_PAGAS + 1}/12
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                <span>{fatura.fecha}</span>
                <span>{fatura.vence}</span>
              </span>
              <ValorMonetario
                valor={fatura.total - PARCELA * (1 - somado)}
                tamanho={22}
                cor={brilho > 0.35 ? cores.destaqueForte : cores.texto}
                estilo={{ minWidth: 128, justifyContent: 'flex-end' }}
              />
              <Selo cor={fatura.aberta ? cores.destaque : cores.textoSecundario} fundo={fatura.aberta ? cores.destaqueSuave : cores.neutroSuave} tamanho={16} estilo={{ minWidth: 92, justifyContent: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                {fatura.aberta ? 'Aberta' : 'Prevista'}
              </Selo>
            </div>
          );
        })}

        <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {voos.map(({ inicio, caminho }, indice) => {
            const cabeca = progresso(quadro, inicio, parcelas.duracaoVoo, curvaEntradaSaida);
            const cauda = progresso(quadro, inicio + parcelas.atrasoRastro, parcelas.duracaoVoo - parcelas.atrasoRastro, curvaEntradaSaida);
            const trecho = cabeca - cauda;
            if (trecho <= 0.002) return null;
            return (
              <path
                key={indice}
                d={caminho}
                pathLength={1}
                fill="none"
                stroke={cores.destaque}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={`${trecho} 2`}
                strokeDashoffset={-cauda}
                opacity={0.55}
              />
            );
          })}
        </svg>

        {voos.map(({ inicio, pouso, amostras }, indice) => {
          if (quadro < inicio || quadro >= pouso) return null;
          const { x, y } = pontoNoArco(amostras, progresso(quadro, inicio, parcelas.duracaoVoo, curvaEntradaSaida));
          const nascimento = progresso(quadro, inicio, 5);
          const chegada = progresso(quadro, pouso - 3, 3, linear);
          return (
            <span
              key={indice}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${misturar(0.4, 1, nascimento) * misturar(1, 0.82, chegada)})`,
                opacity: nascimento * (1 - 0.5 * chegada),
                padding: '6px 14px',
                borderRadius: 999,
                background: cores.destaque,
                color: cores.destaqueContraste,
                fontFamily: fontes.numero,
                fontSize: 19,
                fontWeight: 650,
                whiteSpace: 'nowrap',
                boxShadow: '0 0 0 5px rgba(124, 154, 255, 0.18), 0 10px 30px -6px rgba(124, 154, 255, 0.7)',
              }}
            >
              {formatarMoeda(PARCELA)}
            </span>
          );
        })}
      </div>
    </CenaDividida>
  );
}
