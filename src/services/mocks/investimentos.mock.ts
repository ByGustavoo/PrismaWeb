import { MESES_HISTORICO_CARTEIRA, classesAtivo } from '@/constants/investimentos';
import type {
  AlocacaoDTO,
  CarteiraDTO,
  ClasseAtivo,
  EvolucaoCarteiraDTO,
  InvestimentoDTO,
  PosicaoDTO,
} from '@/types';
import { mesesEntre, deslocarChaveMes } from '@/utils/data';
import { variacaoPercentual, rotuloMesCurto } from './agregacao';
import { mesAtual, investimentos } from './dados';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

const ondaMercado = [
  1, 0.986, 1.017, 0.973, 1.024, 0.991, 1.012, 0.968, 1.021, 0.988, 1.009, 0.977, 1.015, 0.994,
  1.006, 0.982, 1.019, 0.99,
];

const volatilidadeClasse: Record<ClasseAtivo, number> = {
  'RENDA_FIXA': 0.06,
  CDB: 0.04,
  TESOURO: 0.35,
  ACOES: 1,
  ETF: 0.85,
  FUNDOS: 0.6,
  CRIPTO: 2.4,
  OUTROS: 0.2,
};

function rentabilidadeDe(item: InvestimentoDTO): number {
  return item.aportado > 0 ? (item.valorAtual - item.aportado) / item.aportado : 0;
}

function progressoDe(item: InvestimentoDTO, monthKey: string): number {
  const start = item.dataInicio.slice(0, 7);
  if (monthKey < start) return 0;

  const life = mesesEntre(start, mesAtual);
  const elapsed = mesesEntre(start, monthKey);
  return Math.min(elapsed / life, 1);
}

function valorDe(item: InvestimentoDTO, monthKey: string, offset: number): number {
  const progress = progressoDe(item, monthKey);
  if (progress === 0) return 0;

  const wave = ondaMercado[offset] ?? 1;
  const swing = 1 + (wave - 1) * (volatilidadeClasse[item.classeAtivo] ?? 0.5);

  return item.aportado * progress * (1 + rentabilidadeDe(item) * progress) * swing;
}

export function valorCarteiraEm(monthKey: string): number {
  const offset = mesesEntre(monthKey, mesAtual) - 1;
  return dinheiro(investimentos.reduce((total, item) => total + valorDe(item, monthKey, Math.max(offset, 0)), 0));
}

function montarHistorico(months: number): EvolucaoCarteiraDTO[] {
  return Array.from({ length: months }, (_, index) => {
    const offset = months - 1 - index;
    const month = deslocarChaveMes(mesAtual, -offset);

    return {
      mes: month,
      rotulo: rotuloMesCurto(month),
      aportado: dinheiro(investimentos.reduce((total, item) => total + item.aportado * progressoDe(item, month), 0)),
      valor: valorCarteiraEm(month),
    };
  });
}

function montarAlocacao(total: number): AlocacaoDTO[] {
  return classesAtivo
    .map((assetClass) => {
      const items = investimentos.filter((item) => item.classeAtivo === assetClass);
      const currentValue = dinheiro(items.reduce((sum, item) => sum + item.valorAtual, 0));
      const invested = dinheiro(items.reduce((sum, item) => sum + item.aportado, 0));

      return {
        classeAtivo: assetClass,
        aportado: invested,
        valorAtual: currentValue,
        rendimento: dinheiro(currentValue - invested),
        participacao: total > 0 ? currentValue / total : 0,
        quantidade: items.length,
      };
    })
    .filter((entry) => entry.quantidade > 0)
    .sort((a, b) => b.valorAtual - a.valorAtual);
}

function montarPosicoes(total: number): PosicaoDTO[] {
  return [...investimentos]
    .sort((a, b) => b.valorAtual - a.valorAtual)
    .map((investment) => ({
      investimento: investment,
      rendimento: dinheiro(investment.valorAtual - investment.aportado),
      rentabilidade: rentabilidadeDe(investment),
      participacao: total > 0 ? investment.valorAtual / total : 0,
    }));
}

export function montarResumoCarteira(): CarteiraDTO {
  const invested = dinheiro(investimentos.reduce((total, item) => total + item.aportado, 0));
  const currentValue = dinheiro(investimentos.reduce((total, item) => total + item.valorAtual, 0));
  const history = montarHistorico(MESES_HISTORICO_CARTEIRA);
  const previous = history[history.length - 2];

  return {
    aportado: invested,
    valorAtual: currentValue,
    rendimento: dinheiro(currentValue - invested),
    rentabilidade: invested > 0 ? (currentValue - invested) / invested : 0,
    variacaoValorAtual: variacaoPercentual(currentValue, previous?.valor ?? currentValue),
    alocacao: montarAlocacao(currentValue),
    historico: history,
    posicoes: montarPosicoes(currentValue),
  };
}
