import { DIAS_HORIZONTE_AVISOS } from '@/constants/avisos';
import { PROPORCAO_CRITICA_LIMITE_CARTAO } from '@/constants/cartoes';
import { rotuloTipoLancamento } from '@/constants/lancamentos';
import { caminhos } from '@/routes/caminhos';
import type { AvisoDTO } from '@/types';
import { diasEntre, hojeISO } from '@/utils/data';
import { formatarRotuloVencimento } from '@/utils/formatacao';
import { montarFaturas, cartoesPertoDoLimite } from './cartoes.mock';
import { lancamentos } from './dados';

function severidadePorDias(days: number): AvisoDTO['severidade'] {
  if (days <= 2) return 'CRITICO';
  if (days <= 7) return 'ATENCAO';
  return 'INFO';
}

export function montarAvisos(): AvisoDTO[] {
  const today = hojeISO();
  const alerts: AvisoDTO[] = [];

  for (const invoice of montarFaturas()) {
    if (invoice.situacao === 'PAGA' || invoice.situacao === 'FUTURA') continue;
    const days = diasEntre(today, invoice.dataVencimento);
    if (days > DIAS_HORIZONTE_AVISOS || days < -DIAS_HORIZONTE_AVISOS) continue;

    alerts.push({
      id: `alert-invoice-${invoice.id}`,
      tipo: 'FATURA_VENCENDO',
      severidade: days < 0 ? 'CRITICO' : severidadePorDias(days),
      titulo: `Fatura ${invoice.nomeCartao}`,
      descricao: `Fatura ${formatarRotuloVencimento(invoice.dataVencimento, today)}`,
      data: invoice.dataVencimento,
      valor: invoice.total,
      rota: caminhos.faturas,
    });
  }

  for (const transaction of lancamentos) {
    if (transaction.situacao === 'PAGO') continue;
    const days = diasEntre(today, transaction.data);
    if (days > DIAS_HORIZONTE_AVISOS) continue;

    const pending = transaction.situacao === 'PENDENTE';
    alerts.push({
      id: `alert-tx-${transaction.id}`,
      tipo: pending ? 'CONTA_VENCENDO' : 'LANCAMENTO_AGENDADO',
      severidade: pending ? severidadePorDias(days) : 'INFO',
      titulo: transaction.descricao,
      descricao: pending
        ? `${transaction.categoria?.nome ?? rotuloTipoLancamento[transaction.tipo]} · ${formatarRotuloVencimento(transaction.data, today)}`
        : `Agendado · ${formatarRotuloVencimento(transaction.data, today)}`,
      data: transaction.data,
      valor: transaction.valor,
      rota: caminhos.lancamentos,
    });
  }

  for (const { card, used, ratio } of cartoesPertoDoLimite()) {
    alerts.push({
      id: `alert-card-${card.id}`,
      tipo: 'LIMITE_CARTAO',
      severidade: ratio >= PROPORCAO_CRITICA_LIMITE_CARTAO ? 'CRITICO' : 'ATENCAO',
      titulo: `${card.nome} perto do limite`,
      descricao: `${Math.round(ratio * 100)}% do limite utilizado`,
      data: today,
      valor: card.limiteCredito - used,
      rota: caminhos.cartoes,
    });
  }

  const order: Record<AvisoDTO['severidade'], number> = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
  return alerts.sort((a, b) => order[a.severidade] - order[b.severidade] || a.data.localeCompare(b.data));
}
