import type { ReactNode } from 'react';
import { ArrowRight, CreditCard, Landmark } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Botao, ItemResumo, Selo, ValorMonetario } from '../componentes/Interface';
import { cartoes, cenas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const resumo = [
  { rotulo: 'Limite disponível', valor: 14230, apoio: 'Somando todos os cartões de crédito' },
  { rotulo: 'Limite comprometido', valor: 4770, apoio: 'Faturas em aberto e parcelas a vencer' },
  { rotulo: 'Faturas atuais', valor: 490, apoio: 'O que falta pagar dos ciclos em aberto' },
];

const blocos = [
  { nome: 'Aurora Platinum', detalhe: 'Banco Aurora — Mastercard •••• 4821', limite: 12000, comprometido: 3380, fatura: 0, fechamento: 3, vencimento: 10, vence: 'Vence em 10 de novembro de 2026' },
  { nome: 'Horizonte Gold', detalhe: 'Banco Horizonte — Visa •••• 1934', limite: 5000, comprometido: 1390, fatura: 490, fechamento: 25, vencimento: 5, vence: 'Vence em 05 de novembro de 2026' },
];

function Fato({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 16, color: cores.textoSecundario }}>{rotulo}</span>
      <span style={{ fontSize: 19, fontWeight: 620, color: cores.texto }}>{children}</span>
    </span>
  );
}

export function Cartoes() {
  const passo = usePasso();
  const barra = progresso(passo, cartoes.barra, cartoes.duracaoBarra);
  const destaqueConta = progresso(passo, cartoes.contaPagamento, 10) * (1 - 0.55 * progresso(passo, cartoes.contaPagamento + 26, 24));
  const saltoConta = pulso(passo, cartoes.contaPagamento, 10);
  const contagem = (valor: number) =>
    interpolate(passo, [cartoes.barra, cartoes.barra + cartoes.duracaoBarra], [0, valor], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    });

  return (
    <CenaDividida
      duracao={cenas.cartoes.duracao}
      ladoTexto="direita"
      sobretitulo="CARTÕES"
      titulo="O limite real"
      tituloDestaque="de cada cartão."
      subtitulo="O comprometido já conta as parcelas que ainda vão vencer, e cada cartão diz de qual conta sai o pagamento."
      inicioTitulo={cartoes.titulo}
      inicioCartao={cartoes.cartao}
      larguraTexto={560}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie, boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)' }}>
          {resumo.map(({ rotulo, valor, apoio }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(passo, cartoes.resumo[indice] ?? 0, 14)} primeiro={indice === 0}>
              <ValorMonetario valor={valor} tamanho={indice === 0 ? 32 : 25} />
            </ItemResumo>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {blocos.map((bloco, indice) => {
            const entrada = mola(passo, cartoes.blocos[indice] ?? 0, 130, 17);
            const proporcao = bloco.comprometido / bloco.limite;
            return (
              <div
                key={bloco.nome}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: '26px 26px 24px',
                  borderRadius: 22,
                  background: cores.superficie,
                  border: `1.5px solid ${cores.borda}`,
                  boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
                  opacity: Math.min(entrada, 1),
                  transform: `translateY(${misturar(40, 0, entrada)}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', padding: 8, borderRadius: 10, background: cores.superficieSuave, color: cores.textoSecundario }}>
                    <CreditCard size={21} strokeWidth={2.1} />
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 650, color: cores.texto }}>{bloco.nome}</span>
                  <Selo cor={cores.textoSecundario} fundo={cores.neutroSuave} tamanho={15}>
                    Crédito
                  </Selo>
                </div>
                <span style={{ fontSize: 17, color: cores.textoSecundario, marginTop: -6 }}>{bloco.detalhe}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 17, color: cores.textoSecundario }}>
                    Limite disponível
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      de <ValorMonetario valor={bloco.limite} tamanho={17} cor={cores.textoSecundario} />
                    </span>
                  </span>
                  <ValorMonetario valor={bloco.limite - contagem(bloco.comprometido)} tamanho={34} estilo={{ minWidth: 220 }} />
                  <div style={{ height: 9, borderRadius: 5, background: cores.neutroSuave, overflow: 'hidden' }}>
                    <div style={{ width: `${proporcao * barra * 100}%`, height: '100%', borderRadius: 5, background: cores.destaque }} />
                  </div>
                  <span style={{ fontSize: 16, color: cores.textoSecundario }}>{Math.round(proporcao * barra * 100)}% do limite comprometido</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12, paddingTop: 14, borderTop: `1.5px solid ${cores.borda}` }}>
                  <Fato rotulo="Fatura atual">
                    <ValorMonetario valor={bloco.fatura} tamanho={19} peso={620} />
                  </Fato>
                  <Fato rotulo="Fechamento">Dia {bloco.fechamento}</Fato>
                  <Fato rotulo="Vencimento">Dia {bloco.vencimento}</Fato>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '0 -12px',
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: `rgba(124, 154, 255, ${0.12 * destaqueConta})`,
                    boxShadow: `inset 0 0 0 1.5px rgba(124, 154, 255, ${0.6 * destaqueConta})`,
                    transform: `scale(${1 + 0.03 * saltoConta})`,
                  }}
                >
                  <span style={{ display: 'flex', padding: 7, borderRadius: 9, background: destaqueConta > 0.3 ? cores.destaqueSuave : cores.superficieSuave, color: destaqueConta > 0.3 ? cores.destaque : cores.textoSecundario }}>
                    <Landmark size={18} strokeWidth={2.1} />
                  </span>
                  <Fato rotulo="Conta de pagamento">Conta principal</Fato>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 17, color: cores.textoSecundario }}>{bloco.vence}</span>
                  <Botao estilo={{ fontSize: 17, padding: '8px 14px', borderRadius: 10 }}>
                    Ver faturas <ArrowRight size={17} strokeWidth={2.2} />
                  </Botao>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenaDividida>
  );
}
