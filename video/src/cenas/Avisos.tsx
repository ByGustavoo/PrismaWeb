import { Bell, Plus, Receipt, Repeat, Search, Sun, TrendingUp, TriangleAlert } from 'lucide-react';
import { misturar, mola, progresso, usePasso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Botao, ValorMonetario } from '../componentes/Interface';
import { avisos, cenas, TOTAL_AVISOS } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const LARGURA_CARTAO = 984;
const LARGURA_PAINEL = 660;

const severidades = {
  CRITICO: { cor: cores.negativo, fundo: cores.negativoSuave },
  ATENCAO: { cor: cores.aviso, fundo: cores.avisoSuave },
  INFO: { cor: cores.destaque, fundo: cores.destaqueSuave },
};

const itens = [
  { icone: TriangleAlert, severidade: severidades.CRITICO, titulo: 'Conta de gás', descricao: 'Contas — Venceu há 50 dias', valor: 88, data: '05 de Set' },
  { icone: Repeat, severidade: severidades.ATENCAO, titulo: 'Diarista', descricao: 'Despesa recorrente — Vence em 4 dias', valor: 180, data: '29 de Out' },
  { icone: TrendingUp, severidade: severidades.ATENCAO, titulo: 'CDB 110% do CDI', descricao: 'Sem atualização há 58 dias — Confira o saldo em Banco Aurora', valor: null, data: '28 de Ago' },
  { icone: Receipt, severidade: severidades.INFO, titulo: 'Fatura do Horizonte Gold', descricao: 'Aberta até 25/10 — Vence em 11 dias', valor: 490, data: '05 de Nov' },
];

const INDICE_DESTAQUE = 2;

export function Avisos() {
  const passo = usePasso();
  const barra = mola(passo, avisos.cartao, 110, 18);
  const balanco = passo >= avisos.sino ? Math.sin((passo - avisos.sino) * 0.9) * 16 * Math.exp(-(passo - avisos.sino) / 8) : 0;
  const contador = mola(passo, avisos.contador, 220, 13);
  const painel = mola(passo, avisos.painel, 150, 18);
  const destaque = progresso(passo, avisos.destaque, 12);

  return (
    <CenaDividida
      duracao={cenas.avisos.duracao}
      ladoTexto="esquerda"
      sobretitulo="AVISOS"
      titulo="Antes de vencer,"
      tituloDestaque="o sino avisa."
      subtitulo="Contas, faturas, recorrentes e até o investimento sem saldo atualizado há trinta dias. O número é o total."
      inicioTitulo={avisos.titulo}
      inicioCartao={avisos.cartao}
      larguraTexto={600}
    >
      <div style={{ position: 'relative', width: LARGURA_CARTAO, height: 690, fontFamily: fontes.texto }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            height: 88,
            padding: '0 24px',
            boxSizing: 'border-box',
            borderRadius: 22,
            background: cores.superficie,
            border: `1.5px solid ${cores.borda}`,
            boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
            opacity: Math.min(barra, 1),
            transform: `translateY(${misturar(30, 0, barra)}px)`,
          }}
        >
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${cores.bordaForte}`, fontSize: 19, color: cores.textoTerciario }}>
            <Search size={20} strokeWidth={2.1} />
            Buscar lançamento, conta ou categoria
          </span>
          <span style={{ display: 'flex', padding: 10, color: cores.textoSecundario }}>
            <Sun size={24} strokeWidth={2} />
          </span>
          <span style={{ position: 'relative', display: 'flex', padding: 10, borderRadius: 12, background: painel > 0.05 ? cores.superficieSuave : 'transparent', color: cores.texto }}>
            <span style={{ display: 'flex', transform: `rotate(${balanco}deg)`, transformOrigin: '50% 10%' }}>
              <Bell size={26} strokeWidth={2} />
            </span>
            <span
              style={{
                position: 'absolute',
                left: 33,
                top: 3,
                minWidth: 30,
                height: 22,
                padding: '0 6px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                background: cores.contador,
                color: '#ffffff',
                fontFamily: fontes.numero,
                fontSize: 15,
                fontWeight: 700,
                boxShadow: `0 0 0 3px ${cores.superficie}`,
                transform: `translateX(-50%) scale(${contador})`,
              }}
            >
              {TOTAL_AVISOS}
            </span>
          </span>
          <Botao principal estilo={{ fontSize: 19, padding: '11px 18px' }}>
            <Plus size={20} strokeWidth={2.4} />
            Novo lançamento
          </Botao>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 196,
            top: 104,
            width: LARGURA_PAINEL,
            borderRadius: 22,
            background: cores.superficieElevada,
            border: `1.5px solid ${cores.bordaForte}`,
            boxShadow: '0 40px 90px -24px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden',
            opacity: Math.min(painel * 1.3, 1),
            transform: `translateY(${misturar(-16, 0, painel)}px) scale(${misturar(0.94, 1, painel)})`,
            transformOrigin: '86% 0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '22px 26px 18px', borderBottom: `1.5px solid ${cores.borda}` }}>
            <span style={{ fontSize: 22, fontWeight: 650, color: cores.texto }}>Avisos</span>
            <span style={{ fontSize: 17, color: cores.textoSecundario }}>{TOTAL_AVISOS} avisos</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: 10 }}>
            {itens.map(({ icone: Icone, severidade, titulo, descricao, valor, data }, indice) => {
              const entrada = progresso(passo, avisos.itens[indice] ?? 0, 14);
              const realce = indice === INDICE_DESTAQUE ? destaque : 0;
              return (
                <div
                  key={titulo}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '16px 16px',
                    borderRadius: 14,
                    background: `rgba(232, 180, 74, ${0.08 * realce})`,
                    boxShadow: `inset 0 0 0 1.5px rgba(232, 180, 74, ${0.5 * realce})`,
                    opacity: entrada,
                    transform: `translateX(${misturar(18, 0, entrada)}px)`,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: severidade.fundo, color: severidade.cor }}>
                    <Icone size={21} strokeWidth={2.2} />
                  </span>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 620, color: cores.texto }}>{titulo}</span>
                    <span style={{ fontSize: 17, lineHeight: 1.35, color: cores.textoSecundario }}>{descricao}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {valor !== null ? <ValorMonetario valor={valor} tamanho={18} /> : null}
                    <span style={{ fontSize: 16, color: cores.textoSecundario }}>{data}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CenaDividida>
  );
}
