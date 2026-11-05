import { ArrowLeftRight, Landmark, Users, Wallet, WalletCards } from 'lucide-react';
import { interpolate } from 'remotion';
import { curvaEntradaSaida, misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { BarraProgresso, ItemResumo, Selo, ValorMonetario } from '../componentes/Interface';
import { cenas, contas, DESCRICAO_LANCAMENTO, DIGITOS_VALOR, SALDO_ATUAL } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const VALOR_LANCAMENTO = Number(DIGITOS_VALOR) / 100;
const FORA_DO_TOTAL = 3200;
const VALOR_TRANSFERENCIA = 1000;
const LARGURA_COLUNA = (984 - 18) / 2;

const lista = [
  { nome: 'Conta principal', detalhe: 'Banco Aurora — Conta corrente', icone: Landmark, saldo: 9670.35, noTotal: true, debitada: true, transferencia: 1 },
  { nome: 'Conta salário', detalhe: 'Banco Horizonte — Conta salário', icone: WalletCards, saldo: 2550, noTotal: true, debitada: false, transferencia: -1 },
  { nome: 'Carteira', detalhe: 'Dinheiro vivo — Outros', icone: Wallet, saldo: 260, noTotal: true, debitada: false, transferencia: 0 },
  { nome: 'Conta conjunta', detalhe: 'Banco Aurora — Conta corrente', icone: Users, saldo: FORA_DO_TOTAL, noTotal: false, debitada: false, transferencia: 0 },
];

export function Contas() {
  const passo = usePasso();
  const contagem = (valor: number) =>
    interpolate(passo, [contas.contagem, contas.contagem + contas.duracaoContagem], [0, valor], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    });
  const debito = progresso(passo, contas.debito, contas.duracaoDebito);
  const desconto = VALOR_LANCAMENTO * (1 - debito);
  const saldoTotal = SALDO_ATUAL + desconto;
  const chegada = mola(passo, contas.lancamento, 170, 16);
  const absorcao = progresso(passo, contas.debito - 4, 12);
  const impacto = pulso(passo, contas.debito, 16);
  const partida = progresso(passo, contas.transferencia + 8, 18);
  const chegadaTransferencia = progresso(passo, contas.chegadaTransferencia, contas.duracaoTransferencia);
  const surgimento = mola(passo, contas.transferencia, 180, 16);
  const viagem = progresso(passo, contas.transferencia + 14, contas.chegadaTransferencia - contas.transferencia - 16, curvaEntradaSaida);
  const pouso = progresso(passo, contas.chegadaTransferencia - 2, 12);
  const brilhoSaida = pulso(passo, contas.transferencia + 6, 12);
  const brilhoChegada = pulso(passo, contas.chegadaTransferencia, 12);
  const ajusteTransferencia = (sentido: number) =>
    sentido < 0 ? VALOR_TRANSFERENCIA * (1 - partida) : sentido > 0 ? -VALOR_TRANSFERENCIA * (1 - chegadaTransferencia) : 0;

  const resumo = [
    { rotulo: 'Saldo total', apoio: 'Soma das contas ativas que entram no total', conteudo: <ValorMonetario valor={contagem(saldoTotal)} tamanho={34} estilo={{ minWidth: 236 }} /> },
    { rotulo: 'Fora do saldo total', apoio: 'Contas marcadas para não somar', conteudo: <ValorMonetario valor={contagem(FORA_DO_TOTAL)} tamanho={26} cor={cores.textoSecundario} estilo={{ minWidth: 150 }} /> },
    { rotulo: 'Contas', apoio: 'Nenhuma inativa', conteudo: <span style={{ fontSize: 26, fontWeight: 600, color: cores.texto }}>4 ativas</span> },
  ];

  return (
    <CenaDividida
      duracao={cenas.contas.duracao}
      ladoTexto="esquerda"
      sobretitulo="CONTAS"
      titulo="Saldo de hoje,"
      tituloDestaque="em cada conta."
      subtitulo="Gravou uma despesa? O saldo da conta baixa na hora. E a transferência só troca o dinheiro de conta."
      inicioTitulo={contas.titulo}
      inicioCartao={contas.cartao}
      larguraTexto={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', borderRadius: 22, border: `1.5px solid ${cores.borda}`, background: cores.superficie, boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)' }}>
          {resumo.map(({ rotulo, apoio, conteudo }, indice) => (
            <ItemResumo key={rotulo} rotulo={rotulo} apoio={apoio} opacidade={progresso(passo, contas.resumo[indice] ?? 0, 14)} primeiro={indice === 0}>
              {conteudo}
            </ItemResumo>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {lista.map(({ nome, detalhe, icone: Icone, saldo, noTotal, debitada, transferencia }, indice) => {
            const entrada = mola(passo, contas.contas[indice] ?? 0, 160, 16);
            const saldoAgora = (debitada ? saldo + desconto : saldo) + ajusteTransferencia(transferencia);
            const brilho = transferencia < 0 ? brilhoSaida : transferencia > 0 ? brilhoChegada : 0;
            const participacao = saldoAgora / saldoTotal;
            return (
              <div
                key={nome}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  padding: '24px 26px 22px',
                  borderRadius: 20,
                  background: cores.superficie,
                  border: `1.5px solid ${cores.borda}`,
                  boxShadow: debitada && impacto > 0.01
                    ? `inset 0 0 0 1.5px rgba(250, 82, 82, ${0.6 * impacto})`
                    : brilho > 0.01
                      ? `inset 0 0 0 1.5px rgba(124, 154, 255, ${0.7 * brilho})`
                      : undefined,
                  opacity: Math.min(entrada, 1),
                  transform: `translateY(${misturar(30, 0, entrada)}px)`,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ display: 'flex', padding: 9, borderRadius: 11, background: cores.superficieSuave, color: cores.textoSecundario }}>
                    <Icone size={22} strokeWidth={2.1} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 21, fontWeight: 620, color: cores.texto }}>{nome}</span>
                    <span style={{ fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{detalhe}</span>
                  </span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 17, color: cores.textoSecundario }}>Saldo</span>
                  <ValorMonetario valor={contagem(saldoAgora)} tamanho={32} />
                </span>
                {noTotal ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <BarraProgresso valor={participacao * progresso(passo, (contas.contas[indice] ?? 0) + 6, 24)} cor={cores.destaque} altura={7} />
                    <span style={{ fontSize: 17, color: cores.textoSecundario }}>
                      <span style={{ fontFamily: fontes.numero, fontVariantNumeric: 'tabular-nums' }}>{Math.round(participacao * 100)}%</span> do saldo total
                    </span>
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 41 }}>
                    <Selo cor={cores.positivo} fundo={cores.positivoSuave} tamanho={16}>Ativa</Selo>
                    <span style={{ fontSize: 17, color: cores.textoSecundario }}>Fora do saldo total</span>
                  </span>
                )}
                {debitada ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 102,
                      right: 22,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: cores.superficieElevada,
                      border: `1.5px solid ${cores.bordaForte}`,
                      boxShadow: '0 18px 36px -18px rgba(0, 0, 0, 0.8)',
                      opacity: Math.min(chegada, 1) * (1 - absorcao),
                      transform: `translate(${misturar(60, 0, chegada) - absorcao * 110}px, ${misturar(-24, 0, chegada)}px) scale(${misturar(1, 0.7, absorcao)})`,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 600, color: cores.texto }}>{DESCRICAO_LANCAMENTO}</span>
                    <ValorMonetario valor={-VALOR_LANCAMENTO} tamanho={17} cor={cores.negativo} />
                  </span>
                ) : null}
              </div>
            );
          })}
          <span
            style={{
              position: 'absolute',
              top: 100,
              left: misturar(LARGURA_COLUNA * 2 + 18 - 200, LARGURA_COLUNA - 200, viagem),
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 14px',
              borderRadius: 12,
              background: cores.superficieElevada,
              border: `1.5px solid ${cores.destaque}`,
              boxShadow: '0 18px 36px -14px rgba(0, 0, 0, 0.85)',
              whiteSpace: 'nowrap',
              opacity: Math.min(surgimento, 1) * (1 - pouso),
              transform: `translateY(${misturar(-20, 0, surgimento) - Math.sin(Math.PI * viagem) * 14}px) scale(${misturar(1, 0.75, pouso)})`,
              zIndex: 5,
            }}
          >
            <span style={{ display: 'flex', color: cores.destaque }}>
              <ArrowLeftRight size={18} strokeWidth={2.2} />
            </span>
            <ValorMonetario valor={VALOR_TRANSFERENCIA} tamanho={18} />
          </span>
        </div>
      </div>
    </CenaDividida>
  );
}
