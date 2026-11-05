import { interpolate, random } from 'remotion';
import { misturar, mola, progresso, usePasso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { ValorMonetario } from '../componentes/Interface';
import { cenas, DESPESAS_MES, DIGITOS_VALOR, gastosDia, HOJE, PRIMEIRO_DIA_CALENDARIO, ULTIMO_DIA_CALENDARIO } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const CELULA = 25;
const VAO = 4;
const LARGURA_MES = 7 * CELULA + 6 * VAO;
const VAO_MES = 26;
const ALTURA_NOME_MES = 22;
const ALTURA_SEMANA = 20;
const VAO_MES_INTERNO = 8;
const TOPO_GRADE = ALTURA_NOME_MES + VAO_MES_INTERNO + ALTURA_SEMANA + VAO_MES_INTERNO;
const ALTURA_MES = TOPO_GRADE + 6 * (CELULA + VAO) - VAO;
const COLUNAS_MESES = 3;
const LARGURA_CALENDARIO = COLUNAS_MESES * LARGURA_MES + (COLUNAS_MESES - 1) * VAO_MES;

const DIAS_DA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOMES_DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CORES_NIVEL = [cores.calor0, cores.calor1, cores.calor2, cores.calor3, cores.calor4];

const FIXOS_POR_DIA: Record<number, number> = { 1: 12990, 10: 220000, 12: 42000, 15: 1990, 29: 21000 };
const TOTAL_POR_MES: Record<string, number> = {
  '2026-05': 602570,
  '2026-06': 624760,
  '2026-07': 665070,
  '2026-08': 592070,
  '2026-09': 819600,
  '2026-10': Math.round(DESPESAS_MES * 100),
};
const GASTO_HOJE = Number(DIGITOS_VALOR);

interface Dia {
  data: string;
  dia: number;
  diaSemana: number;
  centavos: number;
}

interface Mes {
  chave: string;
  deslocamento: number;
  dias: Dia[];
}

function paraISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1));
}

function montarMeses(): Mes[] {
  const meses = new Map<string, Dia[]>();
  for (let data = deISO(PRIMEIRO_DIA_CALENDARIO); paraISO(data) <= ULTIMO_DIA_CALENDARIO; data.setUTCDate(data.getUTCDate() + 1)) {
    const iso = paraISO(data);
    const lista = meses.get(iso.slice(0, 7)) ?? [];
    lista.push({ data: iso, dia: data.getUTCDate(), diaSemana: data.getUTCDay(), centavos: 0 });
    meses.set(iso.slice(0, 7), lista);
  }

  return [...meses.entries()].map(([chave, dias]) => {
    const vividos = dias.filter((dia) => dia.data <= HOJE);
    for (const dia of vividos) dia.centavos = dia.data === HOJE ? GASTO_HOJE : (FIXOS_POR_DIA[dia.dia] ?? 0);

    const variaveis = vividos.filter((dia) => dia.centavos === 0 && random(`folga-${dia.data}`) > (dia.diaSemana === 0 || dia.diaSemana === 6 ? 0.12 : 0.34));
    const pesos = variaveis.map((dia) => {
      const fimDeSemana = dia.diaSemana === 5 || dia.diaSemana === 6 ? 1.9 : 1;
      return (0.15 + random(`gasto-${dia.data}`) ** 2.4) * fimDeSemana;
    });
    const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
    const fixos = vividos.reduce((soma, dia) => soma + dia.centavos, 0);
    const alvo = (TOTAL_POR_MES[chave] ?? 0) - fixos;

    let distribuido = 0;
    variaveis.forEach((dia, indice) => {
      dia.centavos = Math.round((alvo * (pesos[indice] ?? 0)) / somaPesos);
      distribuido += dia.centavos;
    });
    const maior = variaveis.reduce<Dia | null>((atual, dia) => (dia.centavos > (atual?.centavos ?? -1) ? dia : atual), null);
    if (maior) maior.centavos += alvo - distribuido;

    return { chave, deslocamento: dias[0]?.diaSemana ?? 0, dias };
  });
}

const MESES = montarMeses();
const TODOS = MESES.flatMap((mes) => mes.dias);
const VIVIDOS = TODOS.filter((dia) => dia.data <= HOJE);

function montarEscala(): [number, number, number] {
  const ordenados = VIVIDOS.map((dia) => dia.centavos)
    .filter((valor) => valor > 0)
    .sort((a, b) => a - b);
  const em = (proporcao: number) => ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * proporcao))] ?? 0;
  return [em(0.25), em(0.5), em(0.75)];
}

const ESCALA = montarEscala();

function nivelDe(centavos: number): number {
  if (centavos <= 0) return 0;
  if (centavos <= ESCALA[0]) return 1;
  if (centavos <= ESCALA[1]) return 2;
  if (centavos <= ESCALA[2]) return 3;
  return 4;
}

function diaDaSemanaMaisCaro(): string {
  const totais = [0, 0, 0, 0, 0, 0, 0];
  for (const dia of VIVIDOS) totais[dia.diaSemana] = (totais[dia.diaSemana] ?? 0) + dia.centavos;
  let melhor = 0;
  totais.forEach((valor, indice) => {
    if (valor > (totais[melhor] ?? 0)) melhor = indice;
  });
  return NOMES_DIAS_DA_SEMANA[melhor] ?? '';
}

const TOTAL = VIVIDOS.reduce((soma, dia) => soma + dia.centavos, 0);
const MEDIA = TOTAL / VIVIDOS.length / 100;
const PICO = Math.max(...VIVIDOS.map((dia) => dia.centavos)) / 100;
const DIA_MAIS_CARO = diaDaSemanaMaisCaro();
const DIAS_SEM_GASTO = VIVIDOS.filter((dia) => dia.centavos === 0).length;

function posicaoDoDia(data: string): { x: number; y: number } {
  const indiceMes = MESES.findIndex((mes) => mes.chave === data.slice(0, 7));
  const mes = MESES[indiceMes];
  const indiceDia = mes ? mes.dias.findIndex((dia) => dia.data === data) : 0;
  const casa = (mes?.deslocamento ?? 0) + indiceDia;
  const coluna = indiceMes % COLUNAS_MESES;
  const linha = Math.floor(indiceMes / COLUNAS_MESES);
  return {
    x: coluna * (LARGURA_MES + VAO_MES) + (casa % 7) * (CELULA + VAO) + CELULA / 2,
    y: linha * (ALTURA_MES + VAO_MES) + TOPO_GRADE + Math.floor(casa / 7) * (CELULA + VAO) + CELULA / 2,
  };
}

const DIA_DO_PICO = VIVIDOS.find((dia) => dia.data.startsWith('2026-09') && dia.centavos === PICO * 100) ?? VIVIDOS[0];
const DIA_SEM_GASTO = VIVIDOS.find((dia) => dia.data.startsWith('2026-10') && dia.dia > 12 && dia.centavos === 0) ?? VIVIDOS.find((dia) => dia.centavos === 0);
const FOCOS = [DIA_DO_PICO, DIA_SEM_GASTO, VIVIDOS.find((dia) => dia.data === HOJE)].filter((dia): dia is Dia => dia !== undefined);
const POSICOES_FOCO = FOCOS.map((dia) => posicaoDoDia(dia.data));

function formatarDataCompleta(iso: string): string {
  const data = deISO(iso);
  return `${String(data.getUTCDate()).padStart(2, '0')} de ${NOMES_MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}

function nomeMes(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number);
  return `${MESES_CURTOS[(mes ?? 1) - 1]}/${ano}`;
}

export function GastosDia() {
  const passo = usePasso();
  const contagem = (valor: number) =>
    interpolate(passo, [gastosDia.contagem, gastosDia.contagem + gastosDia.duracaoContagem], [0, valor], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    });
  const pesoFoco = (indice: number) => {
    const fim = gastosDia.focos[indice + 1];
    return Math.min(mola(passo, gastosDia.focos[indice] ?? 0, 220, 15), 1.2) * (fim === undefined ? 1 : 1 - progresso(passo, fim - 2, 6));
  };
  const presencaLeitura = (indice: number) => {
    const fim = gastosDia.focos[indice + 1];
    return progresso(passo, gastosDia.focos[indice] ?? 0, 8) * (fim === undefined ? 1 : 1 - progresso(passo, fim - 2, 5));
  };

  const estatisticas = [
    { rotulo: 'Média diária', valor: <ValorMonetario valor={contagem(MEDIA)} tamanho={21} /> },
    { rotulo: 'Maior gasto num dia', valor: <ValorMonetario valor={contagem(PICO)} tamanho={21} /> },
    { rotulo: 'Dia da semana mais caro', valor: <span style={{ fontSize: 20, fontWeight: 600 }}>{DIA_MAIS_CARO}</span> },
    {
      rotulo: 'Dias sem gasto',
      valor: (
        <span style={{ fontFamily: fontes.numero, fontSize: 21, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(contagem(DIAS_SEM_GASTO))} de {VIVIDOS.length}
        </span>
      ),
    },
  ];

  return (
    <CenaDividida
      duracao={cenas.gastosDia.duracao}
      ladoTexto="esquerda"
      sobretitulo="GASTOS POR DIA"
      titulo="Seis meses,"
      tituloDestaque="dia por dia."
      subtitulo="No dashboard, cada quadrado é um dia, e quanto mais forte o vermelho, mais dinheiro saiu."
      inicioTitulo={gastosDia.titulo}
      inicioCartao={gastosDia.cartao}
      larguraTexto={560}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 26, padding: '30px 32px', fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, minHeight: 58 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 650, color: cores.texto }}>Gastos por dia</span>
            <span style={{ fontSize: 18, color: cores.textoSecundario }}>Cada dia dos últimos seis meses</span>
          </span>
          <span style={{ display: 'grid', justifyItems: 'end', marginTop: 4 }}>
            {FOCOS.map((dia, indice) => {
              const presenca = presencaLeitura(indice);
              return (
                <span
                  key={dia.data}
                  style={{
                    gridArea: '1 / 1',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 14,
                    opacity: presenca,
                    transform: `translateY(${misturar(8, 0, presenca)}px)`,
                  }}
                >
                  <span style={{ fontSize: 18, color: cores.textoSecundario }}>{formatarDataCompleta(dia.data)}</span>
                  <ValorMonetario valor={dia.centavos / 100} tamanho={22} cor={dia.centavos > 0 ? cores.negativo : cores.textoSecundario} />
                </span>
              );
            })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', width: LARGURA_CALENDARIO, display: 'grid', gridTemplateColumns: `repeat(${COLUNAS_MESES}, ${LARGURA_MES}px)`, gap: VAO_MES, flexShrink: 0 }}>
            {MESES.map((mes, indiceMes) => {
              const inicioMes = gastosDia.meses[indiceMes] ?? 0;
              return (
                <div key={mes.chave} style={{ display: 'flex', flexDirection: 'column', gap: VAO_MES_INTERNO, height: ALTURA_MES }}>
                  <span style={{ height: ALTURA_NOME_MES, fontSize: 17, fontWeight: 500, color: cores.textoSecundario, opacity: progresso(passo, inicioMes - 2, 10) }}>{nomeMes(mes.chave)}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELULA}px)`, gap: VAO, height: ALTURA_SEMANA, fontSize: 15, color: cores.textoTerciario, textAlign: 'center', opacity: progresso(passo, inicioMes, 10) }}>
                    {DIAS_DA_SEMANA.map((inicial, indice) => (
                      <span key={indice}>{inicial}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELULA}px)`, gridAutoRows: CELULA, gap: VAO }}>
                    {Array.from({ length: mes.deslocamento }, (_, indice) => (
                      <span key={`vazio-${indice}`} />
                    ))}
                    {mes.dias.map((dia, indiceDia) => {
                      const casa = mes.deslocamento + indiceDia;
                      const atraso = Math.floor(casa / 7) * 0.9 + (casa % 7) * 0.4;
                      const entrada = progresso(passo, inicioMes + atraso, gastosDia.duracaoMes * 0.6);
                      const futuro = dia.data > HOJE;
                      const hoje = dia.data === HOJE;
                      const indiceFoco = FOCOS.findIndex((focado) => focado.data === dia.data);
                      const foco = indiceFoco === -1 ? 0 : pesoFoco(indiceFoco);
                      const escala = misturar(0.4, 1, entrada) * (1 + 0.2 * foco);
                      return (
                        <span
                          key={dia.data}
                          style={{
                            borderRadius: 5,
                            background: futuro ? 'transparent' : CORES_NIVEL[nivelDe(dia.centavos)],
                            boxShadow: futuro
                              ? `inset 0 0 0 1.5px ${cores.borda}`
                              : hoje
                                ? `0 0 0 ${misturar(2, 3, foco)}px ${cores.destaque}`
                                : foco > 0.01
                                  ? `0 0 0 ${2 * Math.min(foco, 1)}px ${cores.texto}`
                                  : undefined,
                            opacity: entrada,
                            transform: `scale(${escala})`,
                            position: hoje || foco > 0.01 ? 'relative' : undefined,
                            zIndex: hoje || foco > 0.01 ? 1 : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <Cursor
              de={{ x: (POSICOES_FOCO[0]?.x ?? 0) + 220, y: (POSICOES_FOCO[0]?.y ?? 0) + 160 }}
              paradas={POSICOES_FOCO.map((posicao, indice) => ({ x: posicao.x + 4, y: posicao.y + 4, clique: gastosDia.focos[indice] ?? 0 }))}
              semClique
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            {estatisticas.map(({ rotulo, valor }, indice) => {
              const t = progresso(passo, gastosDia.estatisticas[indice] ?? 0, 12);
              return (
                <div key={rotulo} style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: t, transform: `translateY(${misturar(10, 0, t)}px)` }}>
                  <span style={{ fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{rotulo}</span>
                  <span style={{ color: cores.texto }}>{valor}</span>
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingTop: 16,
                borderTop: `1.5px solid ${cores.borda}`,
                fontSize: 16,
                color: cores.textoTerciario,
                opacity: progresso(passo, gastosDia.legenda, 12),
              }}
            >
              <span style={{ marginRight: 4 }}>Menos</span>
              {CORES_NIVEL.map((cor, nivel) => (
                <span key={cor} style={{ width: 18, height: 18, borderRadius: 4, background: cor, transform: `scale(${mola(passo, gastosDia.legenda + nivel * 1.5, 220, 14)})` }} />
              ))}
              <span style={{ marginLeft: 4 }}>Mais</span>
            </div>
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
