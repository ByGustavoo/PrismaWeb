import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { IndicadorVariacao, ItemResumo, ValorMonetario } from '../componentes/Interface';
import { cenas, relatorios } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 984;
const RESPIRO = 30;
const ALTURA_GRAFICO = 220;
const LARGURA_GRAFICO = ((LARGURA_CARTAO - 18) * 1.55) / 2.55 - RESPIRO * 2 - 76 - 3;
const ALTURA_CATEGORIA = 62;

const periodos = ['Semana', 'Mês', '3 meses', '6 meses', 'Ano', 'Personalizado'];
const LARGURAS_PERIODO = [104, 70, 104, 108, 66, 156];
const LARGURA_PERIODOS = LARGURAS_PERIODO.reduce((a, b) => a + b, 0) + 12;
const inicioPeriodo = (indice: number) => LARGURAS_PERIODO.slice(0, indice).reduce((a, b) => a + b, 0);

const coresCategoria = { Moradia: paleta[1], Alimentação: paleta[4], Transporte: paleta[5], Saúde: paleta[6] };
type NomeCategoria = keyof typeof coresCategoria;
const nomesCategoria = Object.keys(coresCategoria) as NomeCategoria[];

interface Estado {
  periodo: number;
  inicio: string;
  receitas: number;
  despesas: number;
  resultado: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  escala: number;
  fluxo: { rotulo: string; receitas: number; despesas: number }[];
  categorias: Partial<Record<NomeCategoria, { valor: number; participacao: number }>>;
}

const estados: Estado[] = [
  {
    periodo: 1,
    inicio: '01/10/2026',
    receitas: 1930,
    despesas: 480,
    resultado: 1450,
    variacaoReceitas: 1431.7,
    variacaoDespesas: -93.6,
    escala: 2000,
    fluxo: [
      { rotulo: '01/10', receitas: 1930, despesas: 480 },
      { rotulo: '08/10', receitas: 0, despesas: 0 },
      { rotulo: '15/10', receitas: 0, despesas: 0 },
      { rotulo: '22/10', receitas: 0, despesas: 0 },
    ],
    categorias: { Moradia: { valor: 480, participacao: 1 } },
  },
  {
    periodo: 2,
    inicio: '01/08/2026',
    receitas: 17047,
    despesas: 14596.7,
    resultado: 2450.3,
    variacaoReceitas: 7.9,
    variacaoDespesas: -20.8,
    escala: 10000,
    fluxo: [
      { rotulo: 'Ago', receitas: 8791, despesas: 5920.7 },
      { rotulo: 'Set', receitas: 6326, despesas: 8196 },
      { rotulo: 'Out', receitas: 1930, despesas: 480 },
    ],
    categorias: {
      Moradia: { valor: 4880, participacao: 0.3343 },
      Alimentação: { valor: 4118, participacao: 0.2821 },
      Transporte: { valor: 2140, participacao: 0.1466 },
      Saúde: { valor: 1242.8, participacao: 0.0851 },
    },
  },
  {
    periodo: 3,
    inicio: '01/05/2026',
    receitas: 39041,
    despesas: 33520.7,
    resultado: 5520.3,
    variacaoReceitas: -11.5,
    variacaoDespesas: -10.5,
    escala: 10000,
    fluxo: [
      { rotulo: 'Mai', receitas: 8929, despesas: 6025.7 },
      { rotulo: 'Jun', receitas: 6715, despesas: 6247.6 },
      { rotulo: 'Jul', receitas: 6350, despesas: 6650.7 },
      { rotulo: 'Ago', receitas: 8791, despesas: 5920.7 },
      { rotulo: 'Set', receitas: 6326, despesas: 8196 },
      { rotulo: 'Out', receitas: 1930, despesas: 480 },
    ],
    categorias: {
      Moradia: { valor: 11480, participacao: 0.3425 },
      Alimentação: { valor: 10080, participacao: 0.3007 },
      Transporte: { valor: 3560, participacao: 0.1062 },
      Saúde: { valor: 3209.5, participacao: 0.0957 },
    },
  },
  {
    periodo: 4,
    inicio: '01/01/2026',
    receitas: 67538,
    despesas: 58981.4,
    resultado: 8556.6,
    variacaoReceitas: 207.7,
    variacaoDespesas: 217.1,
    escala: 10000,
    fluxo: [
      { rotulo: 'Jan', receitas: 6682, despesas: 6434.6 },
      { rotulo: 'Fev', receitas: 9118, despesas: 6106.7 },
      { rotulo: 'Mar', receitas: 6353, despesas: 7124.7 },
      { rotulo: 'Abr', receitas: 6344, despesas: 5794.7 },
      { rotulo: 'Mai', receitas: 8929, despesas: 6025.7 },
      { rotulo: 'Jun', receitas: 6715, despesas: 6247.6 },
      { rotulo: 'Jul', receitas: 6350, despesas: 6650.7 },
      { rotulo: 'Ago', receitas: 8791, despesas: 5920.7 },
      { rotulo: 'Set', receitas: 6326, despesas: 8196 },
      { rotulo: 'Out', receitas: 1930, despesas: 480 },
    ],
    categorias: {
      Moradia: { valor: 20280, participacao: 0.3438 },
      Alimentação: { valor: 18566, participacao: 0.3148 },
      Saúde: { valor: 5827.1, participacao: 0.0988 },
      Transporte: { valor: 5460, participacao: 0.0926 },
    },
  },
];

function rotuloEixo(valor: number): string {
  if (valor === 0) return 'R$ 0';
  if (valor < 1000) return `R$ ${valor}`;
  return `R$ ${(valor / 1000).toLocaleString('pt-BR')} mil`;
}

function ordemCategoria(estado: Estado, nome: NomeCategoria): number {
  const presentes = nomesCategoria.filter((outro) => estado.categorias[outro]).sort((a, b) => (estado.categorias[b]?.valor ?? 0) - (estado.categorias[a]?.valor ?? 0));
  const posicao = presentes.indexOf(nome);
  return posicao === -1 ? presentes.length : posicao;
}

function maiorParticipacao(estado: Estado): number {
  return Math.max(...nomesCategoria.map((nome) => estado.categorias[nome]?.participacao ?? 0));
}

function misturarEstados(campo: (estado: Estado) => number, pesos: number[]): number {
  return estados.reduce((valor, estado, indice) => {
    if (indice === 0) return campo(estado);
    const anterior = estados[indice - 1] ?? estado;
    return valor + (campo(estado) - campo(anterior)) * (pesos[indice - 1] ?? 0);
  }, 0);
}

export function Relatorios() {
  const passo = usePasso();
  const trocas = relatorios.cliques.map((clique) => progresso(passo, clique + relatorios.troca, relatorios.duracaoTroca));
  const molas = relatorios.cliques.map((clique) => mola(passo, clique, 200, 20));
  const presenca = estados.map((_, indice) => (indice === 0 ? 1 : (trocas[indice - 1] ?? 0)) * (1 - (trocas[indice] ?? 0)));
  const chegada = progresso(passo, relatorios.dados, 22);
  const contagem = 1 - (1 - chegada) ** 3;
  const misturar1 = (campo: (estado: Estado) => number) => misturarEstados(campo, trocas);

  const pilulaX = misturarEstados((estado) => inicioPeriodo(estado.periodo), molas);
  const pilulaLargura = misturar1((estado) => LARGURAS_PERIODO[estado.periodo] ?? 0);
  const pressao = relatorios.cliques.reduce((soma, clique) => soma + pulso(passo, clique, 6), 0);
  const presencaEscalaMes = presenca[0] ?? 0;

  const resumo = [
    { rotulo: 'Receitas', campo: (estado: Estado) => estado.receitas, variacao: (estado: Estado) => estado.variacaoReceitas, cor: cores.positivo, sinal: false },
    { rotulo: 'Despesas', campo: (estado: Estado) => estado.despesas, variacao: (estado: Estado) => estado.variacaoDespesas, cor: cores.negativo, sinal: false },
    { rotulo: 'Resultado', campo: (estado: Estado) => estado.resultado, variacao: null, cor: cores.positivo, sinal: true },
  ];

  return (
    <CenaDividida
      duracao={cenas.relatorios.duracao}
      ladoTexto="direita"
      sobretitulo="RELATÓRIOS"
      titulo="Do mês ao ano,"
      tituloDestaque="num clique."
      subtitulo="Troque o recorte e receitas, despesas e categorias se recalculam, sempre comparados ao período anterior."
      inicioTitulo={relatorios.titulo}
      inicioCartao={relatorios.cartao}
      larguraTexto={560}
    >
      <div style={{ position: 'relative', width: LARGURA_CARTAO, display: 'flex', flexDirection: 'column', gap: 18, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: progresso(passo, relatorios.periodos, 14) }}>
          <span style={{ display: 'grid', fontSize: 19, color: cores.textoSecundario }}>
            {estados.map((estado, indice) => (
              <span key={estado.inicio} style={{ gridArea: '1 / 1', opacity: presenca[indice], transform: `translateY(${misturar(8, 0, presenca[indice] ?? 0)}px)` }}>
                Análise de {estado.inicio} a 25/10/2026
              </span>
            ))}
          </span>
          <span style={{ position: 'relative', display: 'flex', width: LARGURA_PERIODOS, padding: 6, boxSizing: 'border-box', borderRadius: 14, background: cores.superficie, border: `1.5px solid ${cores.borda}` }}>
            <span style={{ position: 'absolute', top: 6, bottom: 6, left: 6 + pilulaX, width: pilulaLargura, borderRadius: 9, background: cores.destaque, transform: `scale(${1 - 0.05 * pressao})` }} />
            {periodos.map((periodo, indice) => {
              const ativo = estados.reduce((soma, estado, posicao) => soma + (estado.periodo === indice ? (presenca[posicao] ?? 0) : 0), 0);
              return (
                <span key={periodo} style={{ position: 'relative', width: LARGURAS_PERIODO[indice], padding: '8px 0', textAlign: 'center', fontSize: 18, fontWeight: 600, color: ativo > 0.5 ? cores.destaqueContraste : cores.textoSecundario }}>
                  {periodo}
                </span>
              );
            })}
          </span>
        </div>

        <div style={{ display: 'flex', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie, boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)' }}>
          {resumo.map(({ rotulo, campo, variacao, cor, sinal }, indice) => (
            <ItemResumo
              key={rotulo}
              rotulo={rotulo}
              primeiro={indice === 0}
              opacidade={progresso(passo, relatorios.periodos + 4 + indice * 4, 14)}
              apoio={
                variacao ? (
                  <span style={{ display: 'grid' }}>
                    {estados.map((estado, posicao) => (
                      <span key={estado.inicio} style={{ gridArea: '1 / 1', opacity: presenca[posicao], transform: `translateY(${misturar(6, 0, presenca[posicao] ?? 0)}px)` }}>
                        <IndicadorVariacao percentual={variacao(estado)} tamanho={16} />
                      </span>
                    ))}
                  </span>
                ) : (
                  'Receitas menos despesas'
                )
              }
            >
              <ValorMonetario valor={misturar1(campo) * contagem} tamanho={27} cor={cor} sinal={sinal} estilo={{ minWidth: 190 }} />
            </ItemResumo>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18 }}>
          <div style={{ padding: `24px ${RESPIRO}px 20px`, borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie }}>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 650, color: cores.texto }}>Receitas e despesas</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 16, color: cores.textoSecundario }}>Entradas e saídas agrupadas dentro do período</span>
            <div style={{ position: 'relative', height: ALTURA_GRAFICO, marginTop: 22, marginLeft: 76 }}>
              {[1, 0.75, 0.5, 0.25, 0].map((fracao) => (
                <div key={fracao} style={{ position: 'absolute', left: 0, right: 0, top: ALTURA_GRAFICO * (1 - fracao), borderTop: `1.5px solid ${cores.graficoGrade}` }}>
                  <span style={{ position: 'absolute', right: '100%', marginRight: 10, top: -11, display: 'grid', justifyItems: 'end', fontSize: 14, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                    <span style={{ gridArea: '1 / 1', opacity: presencaEscalaMes }}>{rotuloEixo(2000 * fracao)}</span>
                    <span style={{ gridArea: '1 / 1', opacity: 1 - presencaEscalaMes }}>{rotuloEixo(10000 * fracao)}</span>
                  </span>
                </div>
              ))}
              {estados.map((estado, posicao) => {
                const fim = relatorios.cliques[posicao];
                const recolhe = fim === undefined ? 0 : progresso(passo, fim + relatorios.troca, 8);
                const partida = posicao === 0 ? relatorios.dados : (relatorios.cliques[posicao - 1] ?? 0) + relatorios.troca + 6;
                if (recolhe >= 1 || passo < partida) return null;
                const coluna = LARGURA_GRAFICO / estado.fluxo.length;
                const larguraBarra = Math.min(30, coluna * 0.34);
                return estado.fluxo.map((mes, indice) => {
                  const inicioBarra = partida + indice * relatorios.intervaloBarras;
                  const crescimento = progresso(passo, inicioBarra, relatorios.duracaoBarra) * (1 - recolhe);
                  const rotulo = progresso(passo, inicioBarra, 8) * (1 - recolhe);
                  return (
                    <div key={`${estado.inicio}-${mes.rotulo}`} style={{ position: 'absolute', left: (indice + 0.5) * coluna - larguraBarra - 2, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ width: larguraBarra, height: (ALTURA_GRAFICO * mes.receitas * crescimento) / estado.escala, borderRadius: '6px 6px 0 0', background: cores.receita }} />
                      <div style={{ width: larguraBarra, height: (ALTURA_GRAFICO * mes.despesas * crescimento) / estado.escala, borderRadius: '6px 6px 0 0', background: cores.despesa }} />
                      <span style={{ position: 'absolute', top: '100%', left: -20, right: -20, marginTop: 10, textAlign: 'center', fontSize: 15, color: cores.textoSecundario, opacity: rotulo }}>{mes.rotulo}</span>
                    </div>
                  );
                });
              })}
            </div>
            <div style={{ height: 34 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px 26px', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 650, color: cores.texto }}>Gastos por categoria</span>
              <span style={{ fontSize: 16, color: cores.textoSecundario }}>Participação no total de despesas</span>
            </span>
            <div style={{ position: 'relative', flex: 1, marginTop: 20 }}>
              {nomesCategoria.map((nome) => {
                const valor = misturar1((estado) => estado.categorias[nome]?.valor ?? 0);
                const participacao = misturar1((estado) => estado.categorias[nome]?.participacao ?? 0);
                const relativa = misturar1((estado) => (estado.categorias[nome]?.participacao ?? 0) / maiorParticipacao(estado));
                const visivel = misturar1((estado) => (estado.categorias[nome] ? 1 : 0));
                const ordem = misturar1((estado) => ordemCategoria(estado, nome));
                return (
                  <div
                    key={nome}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: ordem * ALTURA_CATEGORIA,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 9,
                      opacity: visivel * chegada,
                      transform: `translateX(${misturar(14, 0, visivel)}px)`,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 18, color: cores.texto }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: coresCategoria[nome] }} />
                      {nome}
                      <span style={{ fontSize: 15, color: cores.textoSecundario }}>{Math.round(participacao * 100)}%</span>
                      <ValorMonetario valor={valor * contagem} tamanho={17} estilo={{ marginLeft: 'auto' }} />
                    </span>
                    <div style={{ height: 8, borderRadius: 4, background: cores.neutroSuave }}>
                      <div style={{ width: `${relativa * chegada * 100}%`, height: '100%', borderRadius: 4, background: coresCategoria[nome] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Cursor
          de={{ x: LARGURA_CARTAO - 160, y: 280 }}
          paradas={relatorios.cliques.map((clique, indice) => {
            const periodo = estados[indice + 1]?.periodo ?? 0;
            return { x: LARGURA_CARTAO - LARGURA_PERIODOS + 6 + inicioPeriodo(periodo) + (LARGURAS_PERIODO[periodo] ?? 0) / 2 + 8, y: 34, clique };
          })}
          saida={(relatorios.cliques[relatorios.cliques.length - 1] ?? 0) + 14}
        />
      </div>
    </CenaDividida>
  );
}
