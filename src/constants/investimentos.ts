import { Bitcoin, Boxes, Building2, CandlestickChart, Coins, Landmark, LineChart, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ClasseAtivo } from '@/types';

export const rotuloClasseAtivo: Record<ClasseAtivo, string> = {
  'RENDA_FIXA': 'Renda fixa',
  CDB: 'CDB',
  TESOURO: 'Tesouro',
  ACOES: 'Ações',
  ETF: 'ETFs',
  FUNDOS: 'Fundos',
  CRIPTO: 'Criptomoedas',
  OUTROS: 'Outros',
};

export const classesAtivo: ClasseAtivo[] = [
  'RENDA_FIXA',
  'CDB',
  'TESOURO',
  'ACOES',
  'ETF',
  'FUNDOS',
  'CRIPTO',
  'OUTROS',
];

export const corClasseAtivo: Record<ClasseAtivo, number> = {
  'RENDA_FIXA': 1,
  CDB: 6,
  TESOURO: 5,
  ACOES: 2,
  ETF: 8,
  FUNDOS: 4,
  CRIPTO: 3,
  OUTROS: 7,
};

export const iconeClasseAtivo: Record<ClasseAtivo, LucideIcon> = {
  'RENDA_FIXA': PiggyBank,
  CDB: Landmark,
  TESOURO: Building2,
  ACOES: CandlestickChart,
  ETF: LineChart,
  FUNDOS: Boxes,
  CRIPTO: Bitcoin,
  OUTROS: Coins,
};

export const MESES_HISTORICO_CARTEIRA = 12;
