import type { CSSProperties, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { misturar, mola, progresso, pulso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { Botao, formatarNumero, Selo, ValorMonetario } from '../componentes/Interface';
import { Notificacao } from '../componentes/Notificacao';
import { ANTECEDENCIA_SAIDA_NOTIFICACAO, cenas, DESCRICAO_LANCAMENTO, DIGITOS_VALOR, lancamentos, passoDaLetra } from '../linhaDoTempo';
import { cores, fontes, paleta } from '../tema';

const LARGURA_CARTAO = 984;
const RESPIRO = 30;
const ALTURA_CAMPO = 58;
const ALTURA_FORMULARIO = 290;
const ALTURA_LINHA = 66;
const LARGURA_BOTAO = 236;
const ALTURA_BOTAO = 52;
const TOPO_BOTAO = ALTURA_FORMULARIO - RESPIRO - ALTURA_BOTAO;

const situacoes = {
  AGENDADO: { rotulo: 'Agendado', cor: cores.destaque, fundo: cores.destaqueSuave },
  PENDENTE: { rotulo: 'Pendente', cor: cores.aviso, fundo: cores.avisoSuave },
  PAGO: { rotulo: 'Concluído', cor: cores.positivo, fundo: cores.positivoSuave },
};

type Situacao = keyof typeof situacoes;

interface Linha {
  data: string;
  descricao: string;
  categoria: string | null;
  cor: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  situacao: Situacao;
}

const existentes: Linha[] = [
  { data: '04 de Nov', descricao: 'Consulta médica', categoria: 'Saúde', cor: paleta[6], valor: 350, tipo: 'DESPESA', situacao: 'AGENDADO' },
  { data: '07 de Out', descricao: 'Bônus do trimestre', categoria: 'Salário', cor: paleta[14], valor: 1600, tipo: 'RECEITA', situacao: 'AGENDADO' },
  { data: '03 de Out', descricao: 'Reforço da reserva', categoria: null, cor: cores.textoSecundario, valor: 1000, tipo: 'TRANSFERENCIA', situacao: 'AGENDADO' },
  { data: '01 de Out', descricao: 'Reembolso de despesas', categoria: 'Outras receitas', cor: paleta[13], valor: 430, tipo: 'RECEITA', situacao: 'PENDENTE' },
];

const nova: Linha = {
  data: '25 de Out',
  descricao: DESCRICAO_LANCAMENTO,
  categoria: 'Alimentação',
  cor: paleta[4],
  valor: Number(DIGITOS_VALOR) / 100,
  tipo: 'DESPESA',
  situacao: 'PAGO',
};

const POSICAO_NOVA = 1;

function valorDigitado(digitos: string): string {
  return digitos === '' ? '' : formatarNumero(Number(digitos) / 100);
}

function Campo({ rotulo, children, foco }: { rotulo: string; children: ReactNode; foco: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 18, fontWeight: 560, color: cores.textoSecundario }}>{rotulo}</span>
      <div
        style={{
          height: ALTURA_CAMPO,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 18px',
          borderRadius: 12,
          background: cores.superficieSuave,
          border: `1.5px solid ${foco > 0 ? cores.destaque : cores.bordaForte}`,
          boxShadow: `0 0 0 ${4 * foco}px rgba(124, 154, 255, ${0.22 * foco})`,
          fontSize: 22,
          color: cores.texto,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Cursorzinho({ visivel }: { visivel: boolean }) {
  return <span style={{ width: 2, height: 26, marginLeft: -8, background: cores.destaque, opacity: visivel ? 1 : 0 }} />;
}

function LinhaTabela({ linha, destaque, estilo }: { linha: Linha; destaque: number; estilo: CSSProperties }) {
  const situacao = situacoes[linha.situacao];
  const corValor = linha.tipo === 'DESPESA' ? cores.negativo : linha.tipo === 'RECEITA' ? cores.positivo : cores.texto;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: ALTURA_LINHA,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 26px',
        borderTop: `1.5px solid ${cores.borda}`,
        background: `rgba(124, 154, 255, ${0.1 * destaque})`,
        fontSize: 20,
        ...estilo,
      }}
    >
      <span style={{ width: 104, color: cores.textoSecundario }}>{linha.data}</span>
      <span style={{ flex: 1, fontWeight: 600, color: cores.texto }}>{linha.descricao}</span>
      <span style={{ width: 196, display: 'flex', alignItems: 'center', gap: 10, color: cores.textoSecundario }}>
        {linha.categoria ? (
          <>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: linha.cor }} />
            {linha.categoria}
          </>
        ) : (
          '—'
        )}
      </span>
      <span style={{ width: 160, display: 'flex', justifyContent: 'flex-end' }}>
        <ValorMonetario valor={linha.tipo === 'DESPESA' ? -linha.valor : linha.valor} sinal={linha.tipo === 'RECEITA'} tamanho={21} cor={corValor} />
      </span>
      <span style={{ width: 130, display: 'flex', justifyContent: 'flex-end' }}>
        <Selo cor={situacao.cor} fundo={situacao.fundo} tamanho={16}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
          {situacao.rotulo}
        </Selo>
      </span>
    </div>
  );
}

export function Lancamentos() {
  const passo = usePasso();
  const formulario = mola(passo, lancamentos.formulario, 120, 17);
  const fechamento = progresso(passo, lancamentos.salvar + 3, 14);
  const insercao = mola(passo, lancamentos.novaLinha, 150, 18);
  const brilhoNova = passo >= lancamentos.novaLinha ? 1 - progresso(passo, lancamentos.novaLinha + 16, 40) : 0;
  const letras = DESCRICAO_LANCAMENTO.split('').filter((_, indice) => passo >= passoDaLetra(indice)).length;
  const digitos = DIGITOS_VALOR.split('').filter((_, indice) => passo >= (lancamentos.digitos[indice] ?? Infinity)).join('');
  const focoDescricao = progresso(passo, lancamentos.descricao - 4, 6) * (1 - progresso(passo, (lancamentos.digitos[0] ?? 0) - 6, 6));
  const focoValor = progresso(passo, (lancamentos.digitos[0] ?? 0) - 6, 6) * (1 - progresso(passo, lancamentos.salvar - 4, 6));
  const piscar = Math.floor(passo / 8) % 2 === 0;
  const ultimoDigito = lancamentos.digitos.filter((inicio) => passo >= inicio).pop();
  const saltoValor = ultimoDigito === undefined ? 0 : pulso(passo, ultimoDigito, 6);
  const pressaoBotao = pulso(passo, lancamentos.salvar, 6);
  const alturaFormulario = (ALTURA_FORMULARIO + 20) * (1 - fechamento);

  return (
    <CenaDividida
      duracao={cenas.lancamentos.duracao}
      ladoTexto="direita"
      sobretitulo="LANÇAMENTOS"
      titulo="Toda entrada"
      tituloDestaque="e toda saída."
      subtitulo="Receitas, despesas e transferências numa lista com filtros. No valor, digita-se só número: os centavos se ajeitam."
      inicioTitulo={lancamentos.titulo}
      inicioCartao={lancamentos.cartao}
      larguraTexto={560}
      sobreposicao={<Notificacao titulo="Despesa cadastrada com sucesso!" descricao={DESCRICAO_LANCAMENTO} inicio={lancamentos.notificacao} saida={cenas.lancamentos.duracao - ANTECEDENCIA_SAIDA_NOTIFICACAO} />}
    >
      <div style={{ position: 'relative', width: LARGURA_CARTAO, fontFamily: fontes.texto }}>
        <div style={{ height: alturaFormulario, overflow: 'visible' }}>
          <div
            style={{
              position: 'relative',
              height: ALTURA_FORMULARIO,
              padding: RESPIRO,
              boxSizing: 'border-box',
              borderRadius: 24,
              background: cores.superficieElevada,
              border: `1.5px solid ${cores.bordaForte}`,
              boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.85)',
              opacity: Math.min(formulario, 1) * (1 - fechamento),
              transform: `translateY(${misturar(30, 0, formulario) - 30 * fechamento}px) scale(${misturar(0.96, 1, formulario) * misturar(1, 0.96, fechamento)})`,
            }}
          >
            <span style={{ display: 'block', fontSize: 26, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto, lineHeight: '32px' }}>Nova despesa</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '18px 20px', marginTop: 22 }}>
              <Campo rotulo="Descrição" foco={focoDescricao}>
                {DESCRICAO_LANCAMENTO.slice(0, letras)}
                {focoDescricao > 0.5 ? <Cursorzinho visivel={piscar || passo < passoDaLetra(DESCRICAO_LANCAMENTO.length)} /> : null}
              </Campo>
              <Campo rotulo="Valor" foco={focoValor}>
                <span style={{ fontSize: 17, fontWeight: 600, color: cores.textoSecundario }}>R$</span>
                <span
                  style={{
                    fontFamily: fontes.numero,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: digitos === '' ? cores.textoTerciario : cores.texto,
                    display: 'inline-block',
                    transform: `translateY(${-3 * saltoValor}px)`,
                  }}
                >
                  {digitos === '' ? '0,00' : valorDigitado(digitos)}
                </span>
                {focoValor > 0.5 ? <Cursorzinho visivel={piscar || digitos.length < DIGITOS_VALOR.length} /> : null}
              </Campo>
            </div>
            <div style={{ position: 'absolute', left: RESPIRO, right: RESPIRO, top: TOPO_BOTAO, height: ALTURA_BOTAO, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, color: cores.textoSecundario }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: paleta[4] }} />
                Alimentação — Conta principal — 25 de outubro de 2026
                <ChevronDown size={18} strokeWidth={2.2} />
              </span>
              <Botao principal escala={1 - 0.06 * pressaoBotao} estilo={{ marginLeft: 'auto', width: LARGURA_BOTAO, height: ALTURA_BOTAO, boxSizing: 'border-box', padding: 0 }}>
                Cadastrar despesa
              </Botao>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            marginTop: 0,
            height: 64 + ALTURA_LINHA * (existentes.length + insercao),
            borderRadius: 24,
            overflow: 'hidden',
            background: cores.superficie,
            border: `1.5px solid ${cores.borda}`,
            boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
          }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px', fontSize: 17, fontWeight: 600, color: cores.textoSecundario }}>
            <span style={{ width: 104 }}>Data</span>
            <span style={{ flex: 1 }}>Descrição</span>
            <span style={{ width: 196 }}>Categoria</span>
            <span style={{ width: 160, textAlign: 'right' }}>Valor</span>
            <span style={{ width: 130, textAlign: 'right' }}>Situação</span>
          </div>
          {existentes.map((linha, indice) => {
            const entrada = progresso(passo, lancamentos.linhas[indice] ?? 0, 14);
            const deslocamento = indice >= POSICAO_NOVA ? insercao : 0;
            return (
              <LinhaTabela
                key={linha.descricao}
                linha={linha}
                destaque={0}
                estilo={{ top: 64 + ALTURA_LINHA * (indice + deslocamento), opacity: entrada, transform: `translateY(${misturar(14, 0, entrada)}px)` }}
              />
            );
          })}
          {passo >= lancamentos.novaLinha ? (
            <LinhaTabela
              linha={nova}
              destaque={brilhoNova}
              estilo={{
                top: 64 + ALTURA_LINHA * POSICAO_NOVA,
                opacity: Math.min(insercao, 1),
                transform: `translateX(${misturar(-30, 0, insercao)}px)`,
                boxShadow: `inset 4px 0 0 rgba(124, 154, 255, ${brilhoNova})`,
              }}
            />
          ) : null}
        </div>

        <Cursor
          de={{ x: LARGURA_CARTAO - 60, y: ALTURA_FORMULARIO + 240 }}
          paradas={[{ x: LARGURA_CARTAO - RESPIRO - LARGURA_BOTAO / 2 + 30, y: TOPO_BOTAO + ALTURA_BOTAO / 2 + 6, clique: lancamentos.salvar }]}
          saida={lancamentos.salvar + 6}
        />
      </div>
    </CenaDividida>
  );
}
