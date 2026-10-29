import { Pause, Play, Trash2 } from 'lucide-react';
import { interpolate } from 'remotion';
import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { ItemResumo, Selo, ValorMonetario } from '../componentes/Interface';
import { Notificacao } from '../componentes/Notificacao';
import { Rolante } from '../componentes/Rolante';
import { ANTECEDENCIA_SAIDA_NOTIFICACAO, cenas, recorrentes } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 984;
const COLUNAS = 2;
const VAO = 16;
const ALTURA_ITEM = 184;
const ALTURA_RESUMO = 142;
const LARGURA_ITEM = (LARGURA_CARTAO - VAO * (COLUNAS - 1)) / COLUNAS;

const itens = [
  { descricao: 'Aluguel', categoria: 'Moradia', cor: paleta[1], origem: 'Conta principal', valor: 2200, frequencia: 'Mensal', vencimento: '10/11/2026 — Vence em 16 dias', breve: false },
  { descricao: 'Plano de saúde', categoria: 'Saúde', cor: paleta[6], origem: 'Conta principal', valor: 420, frequencia: 'Mensal', vencimento: '12/11/2026 — Vence em 18 dias', breve: false },
  { descricao: 'Seguro do carro', categoria: 'Transporte', cor: paleta[5], origem: 'Conta principal', valor: 210, frequencia: 'Mensal', vencimento: '29/10/2026 — Vence em 4 dias', breve: true },
  { descricao: 'Anuidade do conselho', categoria: 'Educação', cor: paleta[7], origem: 'Conta principal', valor: 690, frequencia: 'Anual', vencimento: '15/12/2026 — Vence em 51 dias', breve: false },
  { descricao: 'Academia', categoria: 'Saúde', cor: paleta[6], origem: 'Conta principal', valor: 129.9, frequencia: 'Mensal', vencimento: '01/11/2026 — Vence em 7 dias', breve: true },
  { descricao: 'Revista digital', categoria: 'Assinaturas', cor: paleta[10], origem: 'Horizonte Gold', valor: 19.9, frequencia: 'Mensal', vencimento: '15/11/2026 — Vence em 21 dias', breve: false },
];

const INDICE_PAUSADA = itens.length - 1;
const CUSTO_MENSAL = 3595.9;
const VALOR_PAUSADO = 19.9;

export function Recorrentes() {
  const passo = usePasso();
  const pausa = progresso(passo, recorrentes.pausa, recorrentes.duracaoPausa);
  const marcaPausa = mola(passo, recorrentes.pausa, 190, 15);
  const pressao = pulso(passo, recorrentes.clique, 6);
  const custo = (fator: number) => interpolate(pausa, [0, 1], [(CUSTO_MENSAL + VALOR_PAUSADO) * fator, CUSTO_MENSAL * fator]);
  const coluna = INDICE_PAUSADA % COLUNAS;
  const linha = Math.floor(INDICE_PAUSADA / COLUNAS);
  const botaoPausa = { x: coluna * (LARGURA_ITEM + VAO) + LARGURA_ITEM - 22 - 34 - 4 - 17, y: ALTURA_RESUMO + 20 + linha * (ALTURA_ITEM + VAO) + 22 + 17 };

  return (
    <CenaDividida
      duracao={cenas.recorrentes.duracao}
      ladoTexto="esquerda"
      sobretitulo="DESPESAS RECORRENTES"
      titulo="O que se repete,"
      tituloDestaque="somado por mês."
      subtitulo="A anual entra dividida por doze. Pausar tira a despesa do custo e da previsão, sem apagar o cadastro."
      inicioTitulo={recorrentes.titulo}
      inicioCartao={recorrentes.cartao}
      larguraTexto={600}
      sobreposicao={<Notificacao titulo="Despesa recorrente pausada!" descricao="Revista digital" inicio={recorrentes.pausa + 4} saida={cenas.recorrentes.duracao - ANTECEDENCIA_SAIDA_NOTIFICACAO} />}
    >
      <div style={{ position: 'relative', width: LARGURA_CARTAO, fontFamily: fontes.texto }}>
        <div style={{ height: ALTURA_RESUMO, boxSizing: 'border-box', display: 'flex', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie, boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)' }}>
          <ItemResumo rotulo="Custo mensal" apoio="Equivalente por mês, com anuais diluídas" opacidade={progresso(passo, recorrentes.resumo[0], 14)} primeiro>
            <ValorMonetario valor={custo(1)} tamanho={32} estilo={{ minWidth: 200 }} />
          </ItemResumo>
          <ItemResumo rotulo="Custo anual" apoio="Doze vezes o custo mensal equivalente" opacidade={progresso(passo, recorrentes.resumo[1], 14)}>
            <ValorMonetario valor={custo(12)} tamanho={25} estilo={{ minWidth: 170 }} />
          </ItemResumo>
          <ItemResumo rotulo="Ativas" apoio="10 despesas cadastradas" opacidade={progresso(passo, recorrentes.resumo[2], 14)}>
            <Rolante itens={['10', '9']} trocas={[recorrentes.pausa]} estilo={{ fontFamily: fontes.numero, fontSize: 25, fontWeight: 600, color: cores.texto, lineHeight: 1.3 }} />
          </ItemResumo>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUNAS}, ${LARGURA_ITEM}px)`, gap: VAO, marginTop: 20 }}>
          {itens.map((item, indice) => {
            const entrada = mola(passo, recorrentes.cartoes[indice] ?? 0, 160, 16);
            const pausada = indice === INDICE_PAUSADA;
            const apagado = pausada ? pausa : 0;
            const Icone = pausada && passo >= recorrentes.pausa ? Play : Pause;
            return (
              <div
                key={item.descricao}
                style={{
                  height: ALTURA_ITEM,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '22px 22px 20px',
                  borderRadius: 20,
                  background: cores.superficie,
                  border: `1.5px solid ${cores.borda}`,
                  opacity: Math.min(entrada, 1),
                  transform: `translateY(${misturar(30, 0, entrada)}px)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 650, color: cores.texto, whiteSpace: 'nowrap' }}>{item.descricao}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 16, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.cor }} />
                      {item.categoria} — {item.origem}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 4, color: cores.textoSecundario }}>
                    <span
                      style={{
                        display: 'flex',
                        padding: 8,
                        borderRadius: 9,
                        background: pausada && pressao > 0 ? cores.superficieSuave : 'transparent',
                        transform: `scale(${pausada ? 1 - 0.1 * pressao : 1})`,
                      }}
                    >
                      <Icone size={18} strokeWidth={2.1} />
                    </span>
                    <span style={{ display: 'flex', padding: 8 }}>
                      <Trash2 size={18} strokeWidth={2.1} />
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ValorMonetario valor={item.valor} tamanho={28} cor={apagado > 0.5 ? cores.textoTerciario : cores.texto} />
                  <Selo cor={cores.textoSecundario} fundo={cores.neutroSuave} tamanho={15}>
                    {item.frequencia}
                  </Selo>
                </div>
                <div style={{ display: 'grid', height: 26, alignItems: 'center' }}>
                  <span style={{ gridArea: '1 / 1', fontSize: 16, color: item.breve ? cores.aviso : cores.textoSecundario, whiteSpace: 'nowrap', opacity: 1 - apagado }}>{item.vencimento}</span>
                  {pausada ? (
                    <span style={{ gridArea: '1 / 1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: Math.min(marcaPausa, 1) }}>
                      <span style={{ fontSize: 16, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>Sem vencimento enquanto pausada</span>
                      <Selo cor={cores.textoSecundario} fundo={cores.neutroSuave} tamanho={15} estilo={{ transform: `scale(${misturar(0.6, 1, marcaPausa)})` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        Pausada
                      </Selo>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <Cursor
          de={{ x: botaoPausa.x - 260, y: botaoPausa.y - 170 }}
          paradas={[{ x: botaoPausa.x + 2, y: botaoPausa.y + 4, clique: recorrentes.clique }]}
          saida={recorrentes.clique + 10}
        />
      </div>
    </CenaDividida>
  );
}
