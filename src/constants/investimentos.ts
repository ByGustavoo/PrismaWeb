import { Bitcoin, Boxes, Building2, CandlestickChart, Coins, Landmark, LineChart, PiggyBank, Sprout, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ClasseAtivo, TokenCor } from '@/types';

export const rotuloClasseAtivo: Record<ClasseAtivo, string> = {
  'RENDA_FIXA': 'Renda fixa',
  CDB: 'CDB',
  RDB: 'RDB e caixinhas',
  TESOURO: 'Tesouro',
  PREVIDENCIA: 'Previdência privada',
  ACOES: 'Ações',
  ETF: 'ETFs',
  FUNDOS: 'Fundos',
  CRIPTO: 'Criptomoedas',
  OUTROS: 'Outros',
};

export const classesAtivo: ClasseAtivo[] = [
  'RENDA_FIXA',
  'CDB',
  'RDB',
  'TESOURO',
  'PREVIDENCIA',
  'ACOES',
  'ETF',
  'FUNDOS',
  'CRIPTO',
  'OUTROS',
];

export const corClasseAtivo: Record<ClasseAtivo, TokenCor> = {
  'RENDA_FIXA': 1,
  CDB: 2,
  RDB: 7,
  TESOURO: 5,
  PREVIDENCIA: 10,
  ACOES: 4,
  ETF: 11,
  FUNDOS: 3,
  CRIPTO: 8,
  OUTROS: 13,
};

export const dicaClasseAtivo: Partial<Record<ClasseAtivo, string>> = {
  RDB: 'Caixinhas e cofrinhos de bancos digitais costumam ser RDBs com resgate a qualquer momento — boas para reservas.',
  PREVIDENCIA: 'PGBL ou VGBL. Registre as contribuições como aportes e atualize o saldo quando consultar o extrato.',
};

export const iconeClasseAtivo: Record<ClasseAtivo, LucideIcon> = {
  'RENDA_FIXA': PiggyBank,
  CDB: Landmark,
  RDB: Wallet,
  TESOURO: Building2,
  PREVIDENCIA: Sprout,
  ACOES: CandlestickChart,
  ETF: LineChart,
  FUNDOS: Boxes,
  CRIPTO: Bitcoin,
  OUTROS: Coins,
};

export const QUANTIDADE_INICIAL_MOVIMENTACOES = 8;
