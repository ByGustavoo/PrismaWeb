import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { Rolante } from '../componentes/Rolante';
import { Selo, ValorMonetario } from '../componentes/Interface';
import { Notificacao } from '../componentes/Notificacao';
import { ANTECEDENCIA_SAIDA_NOTIFICACAO, cenas, parcelas, PARCELAS_COMPRA, PARCELAS_JA_PAGAS, VALOR_PARCELA } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const LARGURA_CARTAO = 900;
const RESPIRO = 34;
const ALTURA_LINHA = 78;
const ALTURA_SEGMENTO = 10;
const TOTAL = VALOR_PARCELA * PARCELAS_COMPRA;
const INDICE_ATUAL = PARCELAS_JA_PAGAS;
const PRIMEIRA_LINHA = PARCELAS_JA_PAGAS - 2;
const LARGURA_CONTROLE = 200;
const ALTURA_RESUMO = 174;

const meses = ['Jun/2026', 'Jul/2026', 'Ago/2026', 'Set/2026', 'Out/2026', 'Nov/2026', 'Dez/2026', 'Jan/2027', 'Fev/2027', 'Mar/2027'];
const vencimentos = ['10 de Jun', '10 de Jul', '10 de Ago', '10 de Set', '10 de Out', '10 de Nov', '10 de Dez', '10 de Jan de 2027', '10 de Fev de 2027', '10 de Mar de 2027'];

const linhas = Array.from({ length: 5 }, (_, posicao) => PRIMEIRA_LINHA + posicao);

function Resumo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 17, color: cores.textoSecundario }}>{rotulo}</span>
      {children}
    </span>
  );
}

export function Parcelas() {
  const passo = usePasso();
  const entrada = mola(passo, parcelas.cartao, 90, 18);
  const resumo = progresso(passo, parcelas.resumo, 14);
  const pago = interpolate(passo, [parcelas.pagamento, parcelas.pagamento + parcelas.duracaoPagamento], [0, VALOR_PARCELA], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const marcado = mola(passo, parcelas.pagamento, 210, 16);
  const enchimento = progresso(passo, parcelas.pagamento, parcelas.duracaoPagamento * 0.6);
  const chegada = parcelas.pagamento + parcelas.duracaoPagamento * 0.6;
  const salto = pulso(passo, chegada, 10);
  const halo = passo >= chegada ? progresso(passo, chegada, 18) : 0;
  const brilhoLinha = passo >= parcelas.pagamento ? 1 - progresso(passo, parcelas.pagamento + 10, 36) : 0;
  const larguraSegmento = (LARGURA_CARTAO - RESPIRO * 2 - 6 * (PARCELAS_COMPRA - 1)) / PARCELAS_COMPRA;
  const topoLista = 96 + ALTURA_RESUMO;

  return (
    <CenaDividida
      duracao={cenas.parcelas.duracao}
      ladoTexto="direita"
      sobretitulo="COMPRAS PARCELADAS"
      titulo="Pagou adiantado?"
      tituloDestaque="Marque a parcela."
      subtitulo="O cronograma inteiro num lugar só: o que já foi, o que falta e quando vence a última parcela."
      inicioTitulo={parcelas.titulo}
      inicioCartao={parcelas.cartao}
      larguraTexto={640}
      sobreposicao={<Notificacao titulo="Parcela paga e lançada em despesas!" descricao={`${INDICE_ATUAL + 1}/${PARCELAS_COMPRA} — Notebook`} inicio={parcelas.notificacao} saida={cenas.parcelas.duracao - ANTECEDENCIA_SAIDA_NOTIFICACAO} />}
    >
      <div
        style={{
          position: 'relative',
          width: LARGURA_CARTAO,
          height: topoLista + linhas.length * ALTURA_LINHA + 30,
          borderRadius: 26,
          background: cores.superficieElevada,
          border: `1.5px solid ${cores.bordaForte}`,
          boxShadow: '0 40px 90px -30px rgba(0, 0, 0, 0.9)',
          fontFamily: fontes.texto,
          opacity: entrada > 0 ? 1 : 0,
        }}
      >
        <div style={{ height: 96, boxSizing: 'border-box', padding: `24px ${RESPIRO}px 0`, display: 'flex', justifyContent: 'space-between', borderBottom: `1.5px solid ${cores.borda}` }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 27, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Notebook</span>
            <span style={{ fontSize: 18, color: cores.textoSecundario }}>Aurora Platinum — 10x</span>
          </span>
          <span style={{ display: 'flex', alignSelf: 'flex-start', marginTop: 4, color: cores.textoSecundario }}>
            <X size={24} strokeWidth={2.2} />
          </span>
        </div>

        <div style={{ height: ALTURA_RESUMO, boxSizing: 'border-box', padding: `26px ${RESPIRO}px 0`, borderBottom: `1.5px solid ${cores.borda}`, opacity: resumo, transform: `translateY(${misturar(10, 0, resumo)}px)` }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <Resumo rotulo="Já pago">
              <ValorMonetario valor={VALOR_PARCELA * PARCELAS_JA_PAGAS + pago} tamanho={28} cor={cores.positivo} estilo={{ minWidth: 180 }} />
            </Resumo>
            <Resumo rotulo="Falta pagar">
              <ValorMonetario valor={VALOR_PARCELA * (PARCELAS_COMPRA - PARCELAS_JA_PAGAS) - pago} tamanho={28} estilo={{ minWidth: 180 }} />
            </Resumo>
            <Resumo rotulo="Total">
              <ValorMonetario valor={TOTAL} tamanho={28} />
            </Resumo>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
            {Array.from({ length: PARCELAS_COMPRA }, (_, indice) => {
              const trilho = progresso(passo, parcelas.segmentos + indice * parcelas.intervaloSegmentos, 8);
              const cheio = indice < PARCELAS_JA_PAGAS ? progresso(passo, parcelas.segmentos + 4 + indice * 2, 10) : indice === INDICE_ATUAL ? enchimento : 0;
              const atual = indice === INDICE_ATUAL;
              return (
                <div
                  key={indice}
                  style={{
                    position: 'relative',
                    width: larguraSegmento,
                    height: ALTURA_SEGMENTO,
                    borderRadius: ALTURA_SEGMENTO / 2,
                    background: cores.neutroSuave,
                    opacity: trilho,
                    transform: `scaleY(${1 + (atual ? 0.7 * salto : 0)})`,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, width: `${cheio * 100}%`, borderRadius: ALTURA_SEGMENTO / 2, background: cores.destaque }} />
                  {atual && halo > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: ALTURA_SEGMENTO / 2,
                        boxShadow: `0 0 0 ${misturar(0, 12, halo)}px rgba(124, 154, 255, ${0.45 * (1 - halo)})`,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14, fontSize: 18, color: cores.textoSecundario }}>
            <Rolante itens={[String(PARCELAS_JA_PAGAS), String(PARCELAS_JA_PAGAS + 1)]} trocas={[parcelas.pagamento + 4]} alinhamento="end" estilo={{ fontFamily: fontes.numero, fontWeight: 650, color: cores.texto }} />
            de {PARCELAS_COMPRA} parcelas pagas
          </span>
        </div>

        {linhas.map((indice, posicao) => {
          const chegadaLinha = progresso(passo, parcelas.linhas[posicao] ?? 0, 14);
          const atual = indice === INDICE_ATUAL;
          const pagaPelaData = indice < PARCELAS_JA_PAGAS - 1;
          const pagaAntes = indice === PARCELAS_JA_PAGAS - 1;
          return (
            <div
              key={indice}
              style={{
                position: 'absolute',
                left: RESPIRO - 14,
                right: RESPIRO - 14,
                top: topoLista + 12 + posicao * ALTURA_LINHA,
                height: ALTURA_LINHA - 8,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '0 14px',
                borderRadius: 14,
                background: atual ? `rgba(124, 154, 255, ${0.06 + 0.1 * brilhoLinha})` : 'transparent',
                boxShadow: atual ? `inset 3px 0 0 ${cores.destaque}` : undefined,
                opacity: chegadaLinha,
                transform: `translateY(${misturar(12, 0, chegadaLinha)}px)`,
              }}
            >
              <span style={{ width: 62, fontFamily: fontes.numero, fontSize: 19, fontWeight: 600, color: cores.textoSecundario }}>
                {indice + 1}/{PARCELAS_COMPRA}
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 620, color: cores.texto }}>
                  {meses[indice]}
                  {atual ? (
                    <Selo cor={cores.destaque} fundo={cores.destaqueSuave} tamanho={14} estilo={{ padding: '2px 9px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                      Atual
                    </Selo>
                  ) : null}
                </span>
                <span style={{ fontSize: 16, color: cores.textoSecundario }}>vence {vencimentos[indice]}</span>
              </span>
              <ValorMonetario valor={VALOR_PARCELA} tamanho={20} />
              <span style={{ width: LARGURA_CONTROLE, display: 'grid', justifyItems: 'end' }}>
                {atual ? (
                  <>
                    <span style={{ gridArea: '1 / 1', fontSize: 18, fontWeight: 600, color: cores.destaque, opacity: 1 - Math.min(marcado, 1) }}>Já paguei</span>
                    <span style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, opacity: Math.min(marcado, 1), transform: `translateY(${misturar(10, 0, marcado)}px)` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: cores.positivo }}>
                        <Check size={18} strokeWidth={2.6} />
                        Paga
                      </span>
                      <span style={{ color: cores.textoSecundario }}>Desfazer</span>
                    </span>
                  </>
                ) : pagaPelaData || pagaAntes ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 18 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: cores.positivo }}>
                      <Check size={18} strokeWidth={2.6} />
                      Paga
                    </span>
                    {pagaAntes ? <span style={{ color: cores.textoSecundario }}>Desfazer</span> : null}
                  </span>
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 600, color: cores.destaque }}>Já paguei</span>
                )}
              </span>
            </div>
          );
        })}

        <Cursor
          de={{ x: LARGURA_CARTAO - 360, y: topoLista + 4 * ALTURA_LINHA }}
          paradas={[{ x: LARGURA_CARTAO - RESPIRO - 44, y: topoLista + 12 + (INDICE_ATUAL - PRIMEIRA_LINHA) * ALTURA_LINHA + 40, clique: parcelas.clique }]}
          saida={parcelas.clique + 8}
        />
      </div>
    </CenaDividida>
  );
}
