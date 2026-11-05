import type { OrigemDTO, TipoRecorrente } from '@/types';

export function ehCartaoCredito(origem: OrigemDTO | undefined): boolean {
  return origem?.tipoCartao === 'CREDITO';
}

export function ehCartaoVale(origem: OrigemDTO | undefined): boolean {
  return origem?.tipoCartao === 'VALE_ALIMENTACAO' || origem?.tipoCartao === 'VALE_REFEICAO';
}

export function dicaLancamentoAutomatico(tipo: TipoRecorrente, origem: OrigemDTO | undefined): string {
  if (tipo === 'RECEITA') {
    if (!origem) return 'Na data, a receita entra sozinha na conta ou no vale escolhido.';
    if (ehCartaoVale(origem)) return `Na data, o valor soma sozinho no saldo do ${origem.nome}.`;
    return `Na data, a receita entra sozinha em ${origem.nome}.`;
  }

  if (!origem) return 'No vencimento, a despesa é lançada sozinha na conta ou no cartão escolhido.';
  if (ehCartaoCredito(origem)) return `No vencimento, a despesa entra sozinha na fatura do ${origem.nome}.`;
  return `No vencimento, a despesa é lançada sozinha em ${origem.nome}.`;
}

function efeitoNaOrigem(tipo: TipoRecorrente, origem: OrigemDTO | undefined) {
  if (tipo === 'RECEITA') {
    if (!origem) return 'Numa conta, o saldo sobe no mesmo dia; num vale, o saldo do cartão sobe.';

    if (ehCartaoVale(origem)) {
      return (
        <>
          O saldo do <strong>{origem.nome}</strong> sobe no mesmo dia. Como todo vale, ele fica fora do saldo total.
        </>
      );
    }

    return (
      <>
        O saldo de <strong>{origem.nome}</strong> sobe no mesmo dia.
      </>
    );
  }

  if (!origem) return 'Numa conta, o saldo baixa no mesmo dia; num cartão de crédito, ela entra na fatura e ocupa o limite.';

  if (ehCartaoCredito(origem)) {
    return (
      <>
        Ela entra na fatura do <strong>{origem.nome}</strong> e ocupa o limite do cartão, como uma compra feita
        naquele dia.
      </>
    );
  }

  if (origem.grupo === 'CARTAO') {
    return (
      <>
        O saldo do <strong>{origem.nome}</strong> baixa no mesmo dia.
      </>
    );
  }

  return (
    <>
      O saldo de <strong>{origem.nome}</strong> baixa no mesmo dia.
    </>
  );
}

interface ExplicacaoLancamentoAutomaticoProps {
  tipo: TipoRecorrente;
  origem: OrigemDTO | undefined;
  proximaData?: string;
}

export function ExplicacaoLancamentoAutomatico({ tipo, origem, proximaData }: ExplicacaoLancamentoAutomaticoProps) {
  const receita = tipo === 'RECEITA';
  const nome = receita ? 'receita' : 'despesa';

  return (
    <ul>
      <li>
        {receita ? 'Em cada data' : 'No dia de cada vencimento'}, o Prisma registra a {nome} como concluída, com o
        valor e a categoria daqui.
      </li>
      <li>{efeitoNaOrigem(tipo, origem)}</li>
      <li>
        Ela aparece em Lançamentos e no Dashboard{receita ? '' : ', e conta no Orçamento'}. Se num mês o valor for outro,
        edite só aquele lançamento.
      </li>
      {proximaData ? (
        <li>
          Este lançamento é o primeiro. O próximo entra sozinho em <strong>{proximaData}</strong>.
        </li>
      ) : (
        <li>Só entram as datas a partir de hoje{receita ? '.' : ', e o sino deixa de lembrar desta despesa.'}</li>
      )}
      <li>
        {proximaData
          ? 'Para pausar, mudar o valor ou parar de repetir, use a tela Recorrentes.'
          : 'Pausar ou desligar interrompe os próximos lançamentos. Os que já foram feitos continuam.'}
      </li>
    </ul>
  );
}
