import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import { misturar, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { BarraProgresso, ItemResumo, Selo, ValorMonetario } from '../componentes/Interface';
import { cenas, orcamento } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const PROPORCAO_ALERTA = 0.8;

const linhas = [
  { categoria: 'Alimentação', cor: paleta[4], gasto: 1180.4, limite: 1400 },
  { categoria: 'Transporte', cor: paleta[5], gasto: 312.8, limite: 600 },
  { categoria: 'Lazer', cor: paleta[9], gasto: 468, limite: 400 },
  { categoria: 'Assinaturas', cor: paleta[10], gasto: 94.9, limite: 150 },
];

const situacoes = {
  SEGURO: { rotulo: 'Dentro do limite', cor: cores.positivo, fundo: cores.positivoSuave, barra: cores.destaque },
  ALERTA: { rotulo: 'Perto do limite', cor: cores.aviso, fundo: cores.avisoSuave, barra: cores.aviso },
  ESTOURADO: { rotulo: 'Limite estourado', cor: cores.negativo, fundo: cores.negativoSuave, barra: cores.negativo },
};

function situacaoDe(proporcao: number) {
  if (proporcao >= 1) return situacoes.ESTOURADO;
  if (proporcao >= PROPORCAO_ALERTA) return situacoes.ALERTA;
  return situacoes.SEGURO;
}

const resumo = [
  { rotulo: 'Planejado', valor: 2550 },
  { rotulo: 'Gasto', valor: 2056.1 },
  { rotulo: 'Disponível', valor: 493.9 },
  { rotulo: 'Fora do orçamento', valor: 3856.3 },
];

export function Orcamento() {
  const quadro = useCurrentFrame();
  const entradaResumo = progresso(quadro, orcamento.resumo, 16);

  return (
    <CenaDividida
      duracao={cenas.orcamento.duracao}
      ladoTexto="esquerda"
      sobretitulo="ORÇAMENTO"
      titulo="Um teto para"
      tituloDestaque="cada categoria."
      subtitulo="A barra muda de cor ao passar de 80% do limite, antes de estourar. E o que ficou fora do orçamento também aparece."
      inicioTitulo={orcamento.titulo}
      inicioCartao={orcamento.cartao}
      larguraTexto={600}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 26, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Consumo de Outubro</span>
            <span style={{ fontSize: 19, color: cores.textoSecundario }}>Quanto você planejou gastar em cada categoria e quanto já foi</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${cores.bordaForte}`, fontSize: 19, fontWeight: 600, color: cores.texto }}>
            <ChevronLeft size={20} color={cores.textoSecundario} />
            Outubro de 2026
            <ChevronRight size={20} color={cores.textoSecundario} />
          </span>
        </div>
        <div style={{ display: 'flex', borderRadius: 16, border: `1.5px solid ${cores.borda}`, background: cores.superficieElevada }}>
          {resumo.map(({ rotulo, valor }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} opacidade={entradaResumo} primeiro={indice === 0}>
              <ValorMonetario valor={valor} tamanho={26} cor={indice === 2 ? cores.positivo : cores.texto} />
            </ItemResumo>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {linhas.map(({ categoria, cor, gasto, limite }, indice) => {
            const inicio = orcamento.linhas[indice] ?? 0;
            const entrada = progresso(quadro, inicio, 12);
            const t = progresso(quadro, inicio + 4, orcamento.duracaoBarra);
            const atual = gasto * t;
            const proporcao = atual / limite;
            const situacao = situacaoDe(proporcao);
            const restante = limite - atual;
            return (
              <div
                key={categoria}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '18px 0',
                  borderTop: indice === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                  opacity: entrada,
                  transform: `translateY(${misturar(14, 0, entrada)}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: cor }} />
                  <span style={{ fontSize: 22, fontWeight: 600, color: cores.texto }}>{categoria}</span>
                  <Selo cor={situacao.cor} fundo={situacao.fundo} tamanho={16} estilo={{ marginLeft: 'auto' }}>
                    {situacao.rotulo}
                  </Selo>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <ValorMonetario valor={atual} tamanho={24} estilo={{ minWidth: 150 }} />
                    <span style={{ color: cores.textoTerciario }}>/</span>
                    <ValorMonetario valor={limite} tamanho={18} cor={cores.textoSecundario} />
                  </span>
                  <span style={{ fontFamily: fontes.numero, fontSize: 20, fontWeight: 600, color: cores.textoSecundario }}>{Math.round(proporcao * 100)}%</span>
                </div>
                <BarraProgresso valor={proporcao} cor={situacao.barra} altura={10} />
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 17, color: cores.textoSecundario }}>
                  {restante < 0 ? 'Passou do limite em' : 'Ainda cabem'}
                  <ValorMonetario valor={Math.abs(restante)} tamanho={17} cor={restante < 0 ? cores.negativo : cores.texto} peso={600} />
                </span>
              </div>
            );
          })}
        </div>
      </Cartao>
    </CenaDividida>
  );
}
