import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  abertura,
  cenas,
  dashboard,
  DURACAO_TOTAL,
  encerramento,
  gancho,
  investimentos,
  metas,
  orcamento,
  parcelas,
  previsao,
  QUADROS_POR_BATIDA,
  QUADROS_POR_SEGUNDO,
} from '../src/linhaDoTempo.ts';
import type { NomeCena } from '../src/linhaDoTempo.ts';
import {
  adsr,
  atrasoPingPong,
  decibeis,
  deDecibeis,
  Faixa,
  finalizar,
  medirPico,
  medirRms,
  nota,
  passaAlta,
  passaBaixa,
  percussivo,
  reverberar,
  swellReverso,
  TAXA,
  tocarBumbo,
  tocarGrave,
  tocarPad,
  tocarPluck,
  tocarSeno,
  tocarToque,
} from './sintese.ts';

const DURACAO = DURACAO_TOTAL / QUADROS_POR_SEGUNDO;
const BATIDA = QUADROS_POR_BATIDA / QUADROS_POR_SEGUNDO;
const AMOSTRAS = Math.ceil(DURACAO * TAXA);
const RMS_MUSICA_DB = -24;

function segundos(cena: NomeCena, quadroLocal: number): number {
  return (cenas[cena].inicio + quadroLocal) / QUADROS_POR_SEGUNDO;
}

const inicioCena = (cena: NomeCena) => segundos(cena, 0);

const entradaMusica = inicioCena('dashboard');
const saidaMusica = inicioCena('orcamento');
const retornoMusica = inicioCena('previsao');
const inicioConstrucao = inicioCena('confianca') + 5 * BATIDA;
const final = segundos('encerramento', encerramento.marca);

type Padrao = 'SUBINDO' | 'ONDA' | 'QUEBRADO';

interface Acorde {
  inicio: number;
  baixo: string | null;
  pad: string[];
  padrao: Padrao;
  notasPorBatida: 0 | 1 | 2 | 4;
  oitava?: 1 | 2;
  baixoPulsante?: boolean;
}

const acordes: Acorde[] = [
  { inicio: entradaMusica, baixo: 'F1', pad: ['A3', 'C4', 'F4', 'G4'], padrao: 'SUBINDO', notasPorBatida: 2, baixoPulsante: true },
  { inicio: entradaMusica + 6 * BATIDA, baixo: 'C2', pad: ['G3', 'C4', 'E4', 'A4'], padrao: 'ONDA', notasPorBatida: 2, baixoPulsante: true },
  { inicio: inicioCena('parcelas'), baixo: 'D2', pad: ['D4', 'F4', 'A4', 'C5'], padrao: 'QUEBRADO', notasPorBatida: 1, oitava: 2, baixoPulsante: true },
  { inicio: inicioCena('parcelas') + 6 * BATIDA, baixo: 'Bb1', pad: ['Bb3', 'D4', 'F4', 'A4'], padrao: 'ONDA', notasPorBatida: 1, oitava: 2, baixoPulsante: true },
  { inicio: saidaMusica, baixo: null, pad: [], padrao: 'SUBINDO', notasPorBatida: 0 },
  { inicio: retornoMusica, baixo: 'Bb1', pad: ['Bb3', 'C4', 'D4', 'F4'], padrao: 'SUBINDO', notasPorBatida: 2, oitava: 2, baixoPulsante: true },
  { inicio: retornoMusica + 6 * BATIDA, baixo: 'C2', pad: ['G3', 'C4', 'E4', 'G4'], padrao: 'ONDA', notasPorBatida: 2, oitava: 2, baixoPulsante: true },
  { inicio: inicioCena('investimentos'), baixo: 'F1', pad: ['A3', 'C4', 'F4', 'G4'], padrao: 'SUBINDO', notasPorBatida: 2, baixoPulsante: true },
  { inicio: inicioCena('investimentos') + 6 * BATIDA, baixo: 'C2', pad: ['G3', 'C4', 'E4', 'A4'], padrao: 'QUEBRADO', notasPorBatida: 2, baixoPulsante: true },
  { inicio: inicioCena('metas'), baixo: 'Bb1', pad: ['Bb3', 'D4', 'F4', 'A4'], padrao: 'ONDA', notasPorBatida: 1, oitava: 2, baixoPulsante: true },
  { inicio: inicioCena('metas') + 6 * BATIDA, baixo: 'C2', pad: ['G3', 'C4', 'E4', 'G4'], padrao: 'SUBINDO', notasPorBatida: 1, oitava: 2, baixoPulsante: true },
  { inicio: inicioCena('confianca'), baixo: 'D2', pad: ['D4', 'F4', 'A4', 'C5'], padrao: 'QUEBRADO', notasPorBatida: 1, oitava: 2 },
  { inicio: inicioConstrucao, baixo: 'C2', pad: ['E4', 'G4', 'C5', 'D5'], padrao: 'SUBINDO', notasPorBatida: 4 },
  { inicio: final, baixo: 'F1', pad: ['A4', 'C5', 'E5', 'G5'], padrao: 'SUBINDO', notasPorBatida: 0 },
];

const ordensPadrao: Record<Padrao, number[]> = {
  SUBINDO: [0, 1, 2, 3, 2, 3, 1, 2],
  ONDA: [0, 2, 1, 3, 2, 1, 3, 1],
  QUEBRADO: [3, 1, 2, 0, 2, 1, 3, 2],
};

const fimDe = (indice: number) => acordes[indice + 1]?.inicio ?? DURACAO;

const pad = new Faixa(AMOSTRAS);
const brilhoPad = new Faixa(AMOSTRAS);
const baixo = new Faixa(AMOSTRAS);
const bateria = new Faixa(AMOSTRAS);
const arpejo = new Faixa(AMOSTRAS);
const efeitos = new Faixa(AMOSTRAS);
const efeitosSecos = new Faixa(AMOSTRAS);

acordes.forEach((acorde, indice) => {
  const inicio = acorde.inicio;
  const fim = fimDe(indice);
  const duracao = fim - inicio;
  const ehFinal = inicio >= final;
  acorde.pad.forEach((nome, posicao) => {
    tocarPad({
      faixa: pad,
      inicio,
      duracao: duracao + 1.2,
      frequencia: nota(nome),
      envelope: adsr(0.35, duracao, ehFinal ? 1.2 : 0.8),
      ganho: ehFinal ? 0.04 : 0.034,
      panorama: (posicao / 3) * 0.8 - 0.4,
      brilho: ehFinal ? 2.4 : 1.7,
    });
    tocarSeno({
      faixa: brilhoPad,
      inicio,
      duracao: duracao + 1.2,
      frequencia: () => nota(nome) * 2,
      harmonicos: [
        [1, 1],
        [2, 0.25],
      ],
      envelope: adsr(0.6, duracao, ehFinal ? 1.2 : 0.8),
      ganho: ehFinal ? 0.014 : 0.008,
      panorama: 0.5 - posicao / 3,
    });
  });
  if (!acorde.baixo) return;
  const frequenciaBaixo = nota(acorde.baixo) * 2;
  const harmonicosBaixo: [number, number][] = [
    [1, 1],
    [2, 0.5],
    [3, 0.2],
    [4, 0.08],
  ];
  tocarSeno({ faixa: baixo, inicio, duracao: duracao + 0.3, frequencia: () => frequenciaBaixo / 2, envelope: adsr(0.08, duracao - 0.05, 0.3), ganho: 0.05 });
  if (acorde.baixoPulsante) {
    for (let tempo = inicio; tempo < fim - 0.01; tempo += BATIDA / 2) {
      tocarSeno({ faixa: baixo, inicio: tempo, duracao: BATIDA / 2 + 0.05, frequencia: () => frequenciaBaixo, harmonicos: harmonicosBaixo, envelope: percussivo(0.006, 0.12), ganho: 0.12 });
    }
  } else {
    tocarSeno({ faixa: baixo, inicio, duracao: duracao + 0.3, frequencia: () => frequenciaBaixo, harmonicos: harmonicosBaixo, envelope: adsr(0.05, duracao - 0.05, 0.3, 0.85), ganho: ehFinal ? 0.1 : 0.08 });
  }
});

const batidasBumbo: number[] = [];
function tocarBatida(tempo: number, ganho: number): void {
  tocarBumbo(bateria, tempo, ganho);
  batidasBumbo.push(tempo);
}
for (let tempo = entradaMusica; tempo < saidaMusica - 0.01; tempo += 2 * BATIDA) tocarBatida(tempo, 0.36);
for (let tempo = retornoMusica, indice = 0; tempo < inicioCena('confianca') - 0.01; tempo += 2 * BATIDA, indice += 1) {
  const nasMetas = tempo >= inicioCena('metas') - 0.01 && tempo < inicioCena('metas') + 6 * BATIDA;
  if (!nasMetas || indice % 2 === 0) tocarBatida(tempo, 0.36);
}
for (let tempo = inicioConstrucao; tempo < final - 0.01; tempo += BATIDA) {
  tocarBatida(tempo, 0.2 + 0.18 * ((tempo - inicioConstrucao) / (final - inicioConstrucao)));
}
tocarBatida(final, 0.3);

acordes.forEach((acorde, indice) => {
  const fim = Math.min(fimDe(indice), final);
  if (acorde.notasPorBatida === 0 || fim <= acorde.inicio) return;
  const ordem = ordensPadrao[acorde.padrao];
  const subdivisao = BATIDA / acorde.notasPorBatida;
  const passos = Math.round((fim - acorde.inicio) / subdivisao);
  const construcao = acorde.inicio >= inicioConstrucao;
  for (let passo = 0; passo < passos; passo += 1) {
    const nome = acorde.pad[ordem[passo % ordem.length] ?? 0] ?? acorde.pad[0] ?? 'A4';
    const crescendo = construcao ? 0.45 + 0.75 * (passo / passos) : 1;
    const acento = passo % acorde.notasPorBatida === 0 ? 1 : 0.7;
    const densidade = acorde.notasPorBatida === 4 ? 0.6 : acorde.notasPorBatida === 1 ? 1.15 : 1;
    tocarPluck({
      faixa: arpejo,
      inicio: acorde.inicio + passo * subdivisao,
      duracao: 0.5,
      frequencia: nota(nome) * 2 * (acorde.oitava ?? 1),
      envelope: percussivo(0.003, acorde.notasPorBatida === 1 ? 0.3 : 0.16),
      ganho: 0.075 * acento * crescendo * densidade,
      panorama: passo % 2 === 0 ? -0.3 : 0.3,
    });
  }
});

swellReverso(pad, entradaMusica, [nota('F4'), nota('C5'), nota('A5')], 1.4, 0.05);
swellReverso(pad, retornoMusica, [nota('Bb3'), nota('F4'), nota('D5')], 1.2, 0.045);
swellReverso(pad, final, [nota('F4'), nota('C5'), nota('A5'), nota('E6')], 1.6, 0.05);

function automacaoFiltro(t: number): number {
  const pontos: [number, number][] = [
    [0, 1800],
    [entradaMusica, 4200],
    [inicioCena('parcelas'), 3400],
    [saidaMusica, 1600],
    [retornoMusica, 4200],
    [inicioCena('confianca'), 2600],
    [final, 8000],
    [DURACAO, 3500],
  ];
  for (let indice = 1; indice < pontos.length; indice += 1) {
    const [t1, v1] = pontos[indice] ?? [0, 0];
    const [t0, v0] = pontos[indice - 1] ?? [0, 0];
    if (t <= t1) return v0 * (v1 / v0) ** ((t - t0) / Math.max(t1 - t0, 1e-6));
  }
  return pontos[pontos.length - 1]?.[1] ?? 2000;
}
passaBaixa(pad, automacaoFiltro, 0.9);
passaBaixa(brilhoPad, automacaoFiltro, 0.7);
passaBaixa(arpejo, (t) => Math.min(automacaoFiltro(t) * 2.2, 14000), 0.7);

const bombeamento = new Float32Array(AMOSTRAS).fill(1);
for (const tempo of batidasBumbo) {
  const primeira = Math.floor(tempo * TAXA);
  for (let n = 0; n < Math.floor(0.4 * TAXA) && primeira + n < AMOSTRAS; n += 1) {
    bombeamento[primeira + n] = Math.min(bombeamento[primeira + n] ?? 1, 1 - 0.3 * Math.exp(-n / TAXA / 0.11));
  }
}
for (const faixa of [pad, brilhoPad, arpejo, baixo]) {
  for (let n = 0; n < AMOSTRAS; n += 1) {
    const fator = bombeamento[n] ?? 1;
    faixa.esquerda[n] = (faixa.esquerda[n] ?? 0) * fator;
    faixa.direita[n] = (faixa.direita[n] ?? 0) * fator;
  }
}

const ecoArpejo = atrasoPingPong(arpejo, BATIDA * 0.75, 0.38, 0.45);
const envioMusica = new Faixa(AMOSTRAS);
envioMusica.somarFaixa(pad, 0.3);
envioMusica.somarFaixa(brilhoPad, 0.5);
envioMusica.somarFaixa(arpejo, 0.45);
envioMusica.somarFaixa(ecoArpejo, 0.35);

const musica = new Faixa(AMOSTRAS);
for (const faixa of [pad, brilhoPad, baixo, bateria, arpejo, ecoArpejo]) musica.somarFaixa(faixa, 1);
musica.somarFaixa(reverberar(envioMusica, 0.88, 0.4), 3.2);

function volumeMusica(t: number): number {
  if (t < entradaMusica - 1.5) return 0;
  if (t < saidaMusica - 0.5) return 1;
  if (t < saidaMusica + 0.3) return 1 - (t - (saidaMusica - 0.5)) / 0.8;
  if (t < retornoMusica - 1.3) return 0;
  return 1;
}
for (let n = 0; n < AMOSTRAS; n += 1) {
  const fator = volumeMusica(n / TAXA) ** 2;
  musica.esquerda[n] = (musica.esquerda[n] ?? 0) * fator;
  musica.direita[n] = (musica.direita[n] ?? 0) * fator;
}
const ajusteMusica = deDecibeis(RMS_MUSICA_DB) / medirRms(musica, entradaMusica + 1.6, saidaMusica - 0.5);

let semente = 23;
const aleatorio = () => {
  semente = (semente * 16807) % 2147483647;
  return semente / 2147483647;
};

function curvaSaida(t: number): number {
  const bezier = (u: number, a: number, b: number) => 3 * a * u * (1 - u) ** 2 + 3 * b * u ** 2 * (1 - u) + u ** 3;
  let inferior = 0;
  let superior = 1;
  for (let passo = 0; passo < 40; passo += 1) {
    const meio = (inferior + superior) / 2;
    if (bezier(meio, 0.22, 0.36) < t) inferior = meio;
    else superior = meio;
  }
  return bezier((inferior + superior) / 2, 1, 1);
}

function quadroAoCruzar(inicio: number, duracao: number, gasto: number, limite: number, proporcao: number): number | null {
  for (let quadro = 0; quadro <= duracao; quadro += 0.25) {
    if ((gasto * curvaSaida(quadro / duracao)) / limite >= proporcao) return inicio + quadro;
  }
  return null;
}

function sinal(inicio: number, frequencias: number[], ganho: number, panorama: number, decaimento = 0.18): void {
  frequencias.forEach((frequencia, indice) =>
    tocarSeno({
      faixa: efeitos,
      inicio: inicio + indice * 0.07,
      duracao: decaimento * 5,
      frequencia: () => frequencia,
      harmonicos: [
        [1, 1],
        [2, 0.15],
      ],
      envelope: percussivo(0.008, decaimento),
      ganho,
      panorama,
    }),
  );
}

tocarGrave(efeitos, segundos('abertura', abertura.marca), 0.3, 1.6);
swellReverso(efeitos, segundos('abertura', abertura.marca), [nota('A4'), nota('E5')], 0.5, 0.02);
abertura.faces.forEach((quadro, indice) => tocarToque(efeitosSecos, segundos('abertura', quadro), 0.06, 1.1 + indice * 0.12, -0.25 + indice * 0.25));

gancho.portas.forEach((quadro, indice) => {
  tocarToque(efeitosSecos, segundos('gancho', quadro), 0.065 + aleatorio() * 0.02, 0.95 + indice * 0.05 + aleatorio() * 0.04, -0.4 + indice * 0.2);
});
tocarGrave(efeitos, segundos('gancho', gancho.saldo), 0.16, 1.1);
sinal(segundos('gancho', gancho.saldo) + 0.05, [nota('C6'), nota('F6')], 0.022, 0.1, 0.22);

dashboard.indicadores.forEach((quadro, indice) => tocarToque(efeitosSecos, segundos('dashboard', quadro), 0.05 + aleatorio() * 0.015, 1.05 + indice * 0.07, -0.3 + indice * 0.2));

parcelas.pagamentos.forEach((quadro, indice) => {
  tocarToque(efeitosSecos, segundos('parcelas', quadro), 0.055, 0.82 + indice * 0.1, -0.35 + indice * 0.12);
});
parcelas.voos.forEach((quadro, indice) => {
  tocarToque(efeitosSecos, segundos('parcelas', quadro), 0.045, 1.4 + aleatorio() * 0.1, -0.2);
  sinal(segundos('parcelas', quadro + parcelas.duracaoVoo), [nota(['A5', 'C6', 'E6'][indice] ?? 'A5')], 0.026, -0.1 + indice * 0.2, 0.14);
});

const linhasOrcamento = [
  { gasto: 1180.4, limite: 1400 },
  { gasto: 312.8, limite: 600 },
  { gasto: 468, limite: 400 },
  { gasto: 94.9, limite: 150 },
];
linhasOrcamento.forEach(({ gasto, limite }, indice) => {
  const entrada = orcamento.linhas[indice] ?? 0;
  tocarToque(efeitosSecos, segundos('orcamento', entrada), 0.04, 1.2 + indice * 0.05, 0.2);
  const alerta = quadroAoCruzar(entrada + 4, orcamento.duracaoBarra, gasto, limite, 0.8);
  if (alerta !== null) sinal(segundos('orcamento', alerta), [nota('E5'), nota('C5')], 0.03, -0.15, 0.12);
  const estouro = quadroAoCruzar(entrada + 4, orcamento.duracaoBarra, gasto, limite, 1);
  if (estouro === null) return;
  tocarSeno({
    faixa: efeitos,
    inicio: segundos('orcamento', estouro),
    duracao: 0.8,
    frequencia: () => nota('E2'),
    harmonicos: [
      [1, 1],
      [2, 0.5],
      [3, 0.2],
    ],
    envelope: percussivo(0.005, 0.22),
    ganho: 0.11,
  });
  tocarSeno({ faixa: efeitosSecos, inicio: segundos('orcamento', estouro), duracao: 0.4, frequencia: (t) => 70 + 70 * Math.exp(-t / 0.03), envelope: percussivo(0.002, 0.09), ganho: 0.2 });
});

sinal(segundos('previsao', previsao.mesApertado), [nota('D5'), nota('Bb4')], 0.026, 0.2, 0.16);

investimentos.legenda.forEach((quadro, indice) => tocarToque(efeitosSecos, segundos('investimentos', quadro), 0.04, 1.15 + indice * 0.08, -0.2 + indice * 0.15));

const precosMeta = [2199, 2089.8, 2149, 1899];
metas.pontos.forEach((quadro, indice) => {
  const altura = ((precosMeta[indice] ?? 2000) - 1800) / 500;
  tocarToque(efeitosSecos, segundos('metas', quadro), 0.06, 0.9 + altura * 0.5, -0.3 + indice * 0.2);
});
sinal(segundos('metas', metas.selo), [nota('C6'), nota('E6'), nota('G6')], 0.022, 0.25, 0.2);

tocarGrave(efeitos, final, 0.28, 2.2);
sinal(segundos('encerramento', encerramento.fechoSlogan), [nota('C6'), nota('A6')], 0.022, 0.2, 0.7);

const envioEfeitos = new Faixa(AMOSTRAS);
envioEfeitos.somarFaixa(efeitos, 0.6);
envioEfeitos.somarFaixa(efeitosSecos, 0.12);

const mestre = new Faixa(AMOSTRAS);
mestre.somarFaixa(musica, ajusteMusica);
mestre.somarFaixa(efeitos, 1);
mestre.somarFaixa(efeitosSecos, 1);
mestre.somarFaixa(reverberar(envioEfeitos, 0.82, 0.45), 3);
passaAlta(mestre, 35, 0.7);

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'trilha.wav');
mkdirSync(dirname(destino), { recursive: true });
console.log(`Música: ${RMS_MUSICA_DB} dB RMS no corpo. Pico antes do limitador: ${decibeis(medirPico(mestre)).toFixed(1)} dB`);
writeFileSync(destino, finalizar(mestre, 0.89, 1.4));
console.log(`Trilha gerada: ${destino} (${DURACAO.toFixed(2)} s)`);
