import { useCurrentFrame } from 'remotion';
import { curvaEntradaSaida, misturar, mola, progresso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { formatarMoeda, Selo, ValorMonetario } from '../componentes/Interface';
import { cenas, PARCELA, parcelas } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 984;
const RESPIRO = 36;
const ALTURA_COMPRA = 300;
const TOPO_BARRA = RESPIRO + 28 + 34 + 8 + 26 + 24 + 36 + 20;
const TOPO_FATURAS = RESPIRO + ALTURA_COMPRA + 26 + 44;
const ALTURA_FATURA = 92;
const QUANTIDADE = 12;
const LARGURA_BARRA = LARGURA_CARTAO - RESPIRO * 2 - 28 * 2;

const faturas = [
  { mes: 'Outubro de 2026', fecha: 'Fecha 13 de Out', vence: 'Vence 05 de Nov', total: 2346.9, aberta: true },
  { mes: 'Novembro de 2026', fecha: 'Fecha 13 de Nov', vence: 'Vence 05 de Dez', total: 1812.4, aberta: false },
  { mes: 'Dezembro de 2026', fecha: 'Fecha 13 de Dez', vence: 'Vence 05 de Jan de 2027', total: 1204.15, aberta: false },
];

function centroSegmento(indice: number): number {
  return RESPIRO + 28 + (indice + 0.5) * (LARGURA_BARRA / QUANTIDADE);
}

export function Parcelas() {
  const quadro = useCurrentFrame();
  const entradaCartao = mola(quadro, parcelas.cartao, 90, 18);

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
          border: `1.5px solid ${cores.borda}`,
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
            border: `1.5px solid ${cores.borda}`,
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
            {Array.from({ length: QUANTIDADE }, (_, indice) => {
              const t = progresso(quadro, parcelas.segmentos + indice * parcelas.intervaloSegmentos, 8);
              const paga = indice < 2;
              const atual = indice === 2;
              const voando = parcelas.voos.findIndex((_, voo) => voo + 2 === indice);
              const saiu = voando >= 0 && quadro >= (parcelas.voos[voando] ?? 0);
              const cor = paga ? cores.destaque : atual ? cores.destaqueForte : cores.neutroSuave;
              return (
                <div key={indice} style={{ flex: 1, height: 10, borderRadius: 5, background: cores.neutroSuave, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${t * 100}%`,
                      height: '100%',
                      borderRadius: 5,
                      background: saiu && !paga ? 'rgba(124, 154, 255, 0.45)' : cor,
                      boxShadow: atual ? '0 0 12px rgba(151, 174, 255, 0.8)' : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
            <span style={{ fontSize: 21, color: cores.textoSecundario }}>
              Parcela <strong style={{ fontFamily: fontes.numero, color: cores.texto, fontWeight: 650 }}>3</strong> de 12
            </span>
            <Selo cor={cores.destaque} fundo={cores.destaqueSuave}>
              10 restantes
            </Selo>
          </div>
          <span style={{ display: 'block', marginTop: 10, fontSize: 18, color: cores.textoSecundario }}>2 pagas · última em Jul/2027</span>
        </div>

        <div style={{ position: 'absolute', left: RESPIRO, right: RESPIRO, top: RESPIRO + ALTURA_COMPRA + 26, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 23, fontWeight: 650, color: cores.texto }}>Fatura atual e próximas</span>
          <span style={{ fontSize: 18, color: cores.textoSecundario }}>Fechamento antes do vencimento</span>
        </div>

        {faturas.map((fatura, indice) => {
          const entrada = progresso(quadro, parcelas.faturas[indice] ?? 0, 14);
          const pouso = (parcelas.voos[indice] ?? 0) + parcelas.duracaoVoo;
          const brilho = quadro >= pouso ? 1 - progresso(quadro, pouso, 24) : 0;
          const etiqueta = mola(quadro, pouso, 200, 14);
          return (
            <div
              key={fatura.mes}
              style={{
                position: 'absolute',
                left: RESPIRO,
                right: RESPIRO,
                top: TOPO_FATURAS + indice * ALTURA_FATURA,
                height: ALTURA_FATURA - 12,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 22px',
                borderRadius: 16,
                background: `rgba(124, 154, 255, ${0.1 * brilho})`,
                border: `1.5px solid ${brilho > 0 ? `rgba(124, 154, 255, ${0.3 + 0.5 * brilho})` : cores.borda}`,
                opacity: entrada,
                transform: `translateY(${misturar(16, 0, entrada)}px)`,
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
                  opacity: etiqueta,
                  transform: `scale(${misturar(0.6, 1, etiqueta)})`,
                }}
              >
                Notebook {indice + 3}/12
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                <span>{fatura.fecha}</span>
                <span>{fatura.vence}</span>
              </span>
              <ValorMonetario valor={fatura.total} tamanho={22} estilo={{ minWidth: 128, justifyContent: 'flex-end' }} />
              <Selo cor={fatura.aberta ? cores.destaque : cores.textoSecundario} fundo={fatura.aberta ? cores.destaqueSuave : cores.neutroSuave} tamanho={16} estilo={{ minWidth: 92, justifyContent: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                {fatura.aberta ? 'Aberta' : 'Prevista'}
              </Selo>
            </div>
          );
        })}

        {parcelas.voos.map((inicio, indice) => {
          const t = progresso(quadro, inicio, parcelas.duracaoVoo, curvaEntradaSaida);
          if (quadro < inicio || t >= 1) return null;
          const deX = centroSegmento(indice + 2);
          const deY = TOPO_BARRA + 5;
          const paraX = RESPIRO + 22 + 200 + 18 + 65;
          const paraY = TOPO_FATURAS + indice * ALTURA_FATURA + (ALTURA_FATURA - 12) / 2;
          const x = misturar(deX, paraX, t);
          const y = misturar(deY, paraY, t) - Math.sin(Math.PI * t) * 60;
          return (
            <span
              key={indice}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${misturar(0.7, 1, Math.sin(Math.PI * t))})`,
                padding: '6px 14px',
                borderRadius: 999,
                background: cores.destaque,
                color: cores.destaqueContraste,
                fontFamily: fontes.numero,
                fontSize: 19,
                fontWeight: 650,
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 30px -6px rgba(124, 154, 255, 0.7)',
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
