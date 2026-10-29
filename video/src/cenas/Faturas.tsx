import { Check, X } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { Botao, Selo, ValorMonetario } from '../componentes/Interface';
import { Notificacao } from '../componentes/Notificacao';
import { ANTECEDENCIA_SAIDA_NOTIFICACAO, cenas, faturas } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 940;
const RESPIRO = 34;
const ALTURA_ITEM = 76;
const ALTURA_RODAPE = 92;
const TOTAL = 1150;

const itens = [
  { data: '01 de Set', descricao: 'Curso de idiomas', parcela: '2/4', categoria: 'Educação', cor: paleta[7], valor: 300 },
  { data: '10 de Ago', descricao: 'Passagens aéreas', parcela: '4/6', categoria: 'Lazer', cor: paleta[9], valor: 310 },
  { data: '18 de Mai', descricao: 'Notebook', parcela: '6/10', categoria: 'Compras', cor: paleta[11], valor: 540 },
];

function Data({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 16, color: cores.textoSecundario }}>{rotulo}</span>
      <span style={{ fontSize: 19, fontWeight: 620, color: cores.texto }}>{valor}</span>
    </span>
  );
}

export function Faturas() {
  const passo = usePasso();
  const entrada = mola(passo, faturas.cartao, 90, 18);
  const pago = interpolate(passo, [faturas.contagem, faturas.contagem + faturas.duracaoContagem], [0, TOTAL], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const linhaPago = progresso(passo, faturas.contagem - 2, 10);
  const selo = mola(passo, faturas.selo, 200, 15);
  const trocaRodape = progresso(passo, faturas.clique + 4, 10);
  const pressao = pulso(passo, faturas.clique, 6);
  const alturaCabecalho = 96;
  const alturaResumo = 214;
  const topoItens = alturaCabecalho + alturaResumo;
  const topoRodape = topoItens + itens.length * ALTURA_ITEM + 26;
  const altura = topoRodape + ALTURA_RODAPE;
  const larguraBotaoPagar = 292;

  return (
    <CenaDividida
      duracao={cenas.faturas.duracao}
      ladoTexto="esquerda"
      sobretitulo="FATURAS"
      titulo="Pagou a fatura?"
      tituloDestaque="Um clique basta."
      subtitulo="Cada parcela vira despesa na conta de pagamento do cartão, e o saldo baixa na data em que você pagou."
      inicioTitulo={faturas.titulo}
      inicioCartao={faturas.cartao}
      larguraTexto={600}
      sobreposicao={<Notificacao titulo="Fatura paga e debitada da conta!" descricao="Novembro de 2026 — Aurora Platinum" inicio={faturas.notificacao} saida={cenas.faturas.duracao - ANTECEDENCIA_SAIDA_NOTIFICACAO} />}
    >
      <div
        style={{
          position: 'relative',
          width: LARGURA_CARTAO,
          height: altura,
          borderRadius: 26,
          background: cores.superficieElevada,
          border: `1.5px solid ${cores.bordaForte}`,
          boxShadow: '0 40px 90px -30px rgba(0, 0, 0, 0.9)',
          fontFamily: fontes.texto,
          opacity: entrada > 0 ? 1 : 0,
        }}
      >
        <div style={{ height: alturaCabecalho, boxSizing: 'border-box', padding: `24px ${RESPIRO}px 0`, display: 'flex', justifyContent: 'space-between', borderBottom: `1.5px solid ${cores.borda}` }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 27, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Fatura de Novembro de 2026</span>
            <span style={{ fontSize: 18, color: cores.textoSecundario }}>Aurora Platinum</span>
          </span>
          <span style={{ display: 'flex', alignSelf: 'flex-start', marginTop: 4, color: cores.textoSecundario }}>
            <X size={24} strokeWidth={2.2} />
          </span>
        </div>

        <div style={{ height: alturaResumo, boxSizing: 'border-box', padding: `24px ${RESPIRO}px 0`, display: 'flex', flexDirection: 'column', gap: 10, opacity: progresso(passo, faturas.cabecalho, 14) }}>
          <span style={{ fontSize: 17, color: cores.textoSecundario }}>Total da fatura</span>
          <ValorMonetario valor={TOTAL} tamanho={40} />
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, height: 24, fontSize: 18, color: cores.textoSecundario, opacity: linhaPago, transform: `translateY(${misturar(8, 0, linhaPago)}px)` }}>
            Já pago <ValorMonetario valor={pago} tamanho={18} cor={cores.positivo} estilo={{ minWidth: 90 }} />—<span style={{ marginLeft: 4 }}>Falta pagar</span>
            <ValorMonetario valor={TOTAL - pago} tamanho={18} />
          </span>
          <div style={{ display: 'flex', gap: 44, marginTop: 8, paddingBottom: 22, borderBottom: `1.5px solid ${cores.borda}` }}>
            <Data rotulo="Fechamento" valor="03 de novembro de 2026" />
            <Data rotulo="Vencimento" valor="10 de novembro de 2026" />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 16, color: cores.textoSecundario }}>Situação</span>
              <span style={{ display: 'grid' }}>
                <Selo cor={cores.destaque} fundo={cores.destaqueSuave} tamanho={16} estilo={{ gridArea: '1 / 1', justifySelf: 'start', opacity: 1 - Math.min(selo, 1), transform: `scale(${misturar(1, 0.7, Math.min(selo, 1))})` }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                  Aberta
                </Selo>
                <Selo cor={cores.positivo} fundo={cores.positivoSuave} tamanho={16} estilo={{ gridArea: '1 / 1', justifySelf: 'start', opacity: Math.min(selo, 1), transform: `scale(${misturar(0.6, 1, selo)})` }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                  Paga até agora
                </Selo>
              </span>
            </span>
          </div>
        </div>

        {itens.map((item, indice) => {
          const chegada = progresso(passo, faturas.itens[indice] ?? 0, 14);
          const marcado = mola(passo, faturas.pagos[indice] ?? 0, 210, 16);
          const brilho = passo >= (faturas.pagos[indice] ?? 0) ? 1 - progresso(passo, (faturas.pagos[indice] ?? 0) + 4, 30) : 0;
          return (
            <div
              key={item.descricao}
              style={{
                position: 'absolute',
                left: RESPIRO - 12,
                right: RESPIRO - 12,
                top: topoItens + indice * ALTURA_ITEM + 10,
                height: ALTURA_ITEM - 6,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 12px',
                borderRadius: 14,
                background: `rgba(47, 217, 154, ${0.08 * brilho})`,
                opacity: chegada,
                transform: `translateY(${misturar(12, 0, chegada)}px)`,
              }}
            >
              <span style={{ width: 96, fontSize: 18, color: cores.textoSecundario }}>{item.data}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 620, color: cores.texto }}>
                  {item.descricao}
                  <Selo cor={cores.destaque} fundo={cores.destaqueSuave} tamanho={14} estilo={{ padding: '2px 8px', fontFamily: fontes.numero }}>
                    {item.parcela}
                  </Selo>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, color: cores.textoSecundario }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.cor }} />
                  {item.categoria}
                </span>
              </span>
              <ValorMonetario valor={item.valor} tamanho={20} />
              <span style={{ width: 190, display: 'grid', justifyItems: 'end' }}>
                <span style={{ gridArea: '1 / 1', fontSize: 18, fontWeight: 600, color: cores.destaque, opacity: 1 - Math.min(marcado, 1) }}>Já paguei</span>
                <span
                  style={{
                    gridArea: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 18,
                    opacity: Math.min(marcado, 1),
                    transform: `translateY(${misturar(10, 0, marcado)}px)`,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: cores.positivo }}>
                    <Check size={18} strokeWidth={2.6} />
                    Paga
                  </span>
                  <span style={{ color: cores.textoSecundario }}>Desfazer</span>
                </span>
              </span>
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: topoRodape,
            height: ALTURA_RODAPE,
            boxSizing: 'border-box',
            padding: `0 ${RESPIRO}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 14,
            borderTop: `1.5px solid ${cores.borda}`,
            opacity: progresso(passo, faturas.rodape, 12),
          }}
        >
          <Botao estilo={{ border: '1.5px solid transparent', color: cores.textoSecundario, opacity: trocaRodape, transform: `translateX(${misturar(16, 0, trocaRodape)}px)` }}>Desfazer pagamento</Botao>
          <Botao>Fechar</Botao>
          <span style={{ width: misturar(larguraBotaoPagar, 0, trocaRodape), marginLeft: misturar(0, -14, trocaRodape), overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
            <Botao principal escala={1 - 0.06 * pressao} estilo={{ width: larguraBotaoPagar, boxSizing: 'border-box', flexShrink: 0, opacity: 1 - trocaRodape }}>
              <Check size={20} strokeWidth={2.6} />
              Já paguei esta fatura
            </Botao>
          </span>
        </div>

        <Cursor
          de={{ x: LARGURA_CARTAO - 380, y: topoItens + 60 }}
          paradas={[{ x: LARGURA_CARTAO - RESPIRO - 40, y: topoRodape + ALTURA_RODAPE / 2 + 6, clique: faturas.clique }]}
          saida={faturas.clique + 8}
        />
      </div>
    </CenaDividida>
  );
}
