import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, ChartPie, Check, CreditCard, Eye, EyeOff, LayoutDashboard, LoaderCircle, Monitor, Moon, Settings, Sun, Target, TrendingUp } from 'lucide-react';
import { curvaEntradaSaida, misturar, mola, progresso, usePasso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Cursor } from '../componentes/Cursor';
import { MarcaAnimada } from '../componentes/MarcaAnimada';
import { cenas, configuracoes } from '../linhaDoTempo';
import { fontes } from '../tema';

const TELA_OCULTA = 'Relatórios';
const ALTURA_JANELA = 700;
const LARGURA_MENU = 84;
const ALTURA_ITEM_MENU = 48;
const ROLAGEM = 334;
const LARGURA_TRILHO = 44;
const ALTURA_TRILHO = 24;

const temaEscuro = {
  canvas: '#0e0e10',
  superficie: '#17181b',
  superficieSuave: '#212226',
  borda: '#2b2c31',
  bordaForte: '#3d3f46',
  texto: '#eceef0',
  textoSecundario: '#a3a6ad',
  textoTerciario: '#888b93',
  destaque: '#7c9aff',
  destaqueSuave: '#1e2540',
  destaqueContraste: '#0b1020',
  neutroSuave: '#26272c',
};

type Paleta = typeof temaEscuro;
type Canais = [number, number, number];

const temaClaro: Paleta = {
  canvas: '#f2f3f5',
  superficie: '#ffffff',
  superficieSuave: '#f5f6f8',
  borda: '#e3e5ea',
  bordaForte: '#c9ccd4',
  texto: '#16171a',
  textoSecundario: '#5a5e68',
  textoTerciario: '#696d77',
  destaque: '#2b4ee6',
  destaqueSuave: '#e5eaff',
  destaqueContraste: '#ffffff',
  neutroSuave: '#eceef2',
};

function canais(hex: string): Canais {
  const valor = Number.parseInt(hex.slice(1), 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

function misturarCanais(de: Canais, para: Canais, t: number): Canais {
  return [misturar(de[0], para[0], t), misturar(de[1], para[1], t), misturar(de[2], para[2], t)];
}

function rgb([r, g, b]: Canais): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function corDoTema(chave: keyof Paleta, tema: number): string {
  return rgb(misturarCanais(canais(temaEscuro[chave]), canais(temaClaro[chave]), tema));
}

function paletaEm(tema: number): Paleta {
  return Object.fromEntries((Object.keys(temaEscuro) as (keyof Paleta)[]).map((chave) => [chave, corDoTema(chave, tema)])) as Paleta;
}

function fundoDaOpcao(selecao: number, tema: number): string {
  const escuro = misturarCanais(canais(temaEscuro.superficie), canais(temaEscuro.destaqueSuave), selecao);
  const claro = misturarCanais(canais(temaClaro.superficie), canais(temaClaro.destaqueSuave), selecao);
  return rgb(misturarCanais(escuro, claro, tema));
}

interface ItemMenu {
  rotulo: string;
  icone: LucideIcon;
  separador?: boolean;
  ativo?: boolean;
}

const menu: ItemMenu[] = [
  { rotulo: 'Dashboard', icone: LayoutDashboard },
  { rotulo: 'Lançamentos', icone: ArrowLeftRight, separador: true },
  { rotulo: 'Contas e cartões', icone: CreditCard },
  { rotulo: 'Planejamento', icone: Target, separador: true },
  { rotulo: 'Investimentos', icone: TrendingUp },
  { rotulo: TELA_OCULTA, icone: ChartPie, separador: true },
  { rotulo: 'Configurações', icone: Settings, ativo: true },
];

const temas = [
  { valor: 'claro', rotulo: 'Claro', descricao: 'Ideal para ambientes bem iluminados', icone: Sun },
  { valor: 'escuro', rotulo: 'Escuro', descricao: 'Menos brilho para uso noturno', icone: Moon },
  { valor: 'sistema', rotulo: 'Sistema', descricao: 'Acompanha a preferência do dispositivo', icone: Monitor },
];

const versoes = [
  { nome: 'API', versao: '1.0.8' },
  { nome: 'Web', versao: '1.0.16' },
];

const grupos = [
  { titulo: 'Lançamentos', telas: ['Todas', 'Receitas', 'Despesas', 'Transferências'] },
  { titulo: 'Contas e cartões', telas: ['Contas', 'Cartões', 'Faturas', 'Compras parceladas'] },
  { titulo: 'Planejamento', telas: ['Metas', 'Orçamento', 'Previsão financeira', 'Despesas recorrentes'] },
  { titulo: 'Outras telas', telas: ['Investimentos', TELA_OCULTA] },
];

function Painel({ children, opacidade, cores, estilo }: { children: ReactNode; opacidade: number; cores: Paleta; estilo?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: 22,
        borderRadius: 18,
        background: cores.superficie,
        border: `1.5px solid ${cores.borda}`,
        opacity: opacidade,
        transform: `translateY(${misturar(18, 0, opacidade)}px)`,
        ...estilo,
      }}
    >
      {children}
    </div>
  );
}

function CabecalhoPainel({ titulo, descricao, acao, cores }: { titulo: string; descricao?: string; acao?: ReactNode; cores: Paleta }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 21, fontWeight: 650, color: cores.texto }}>{titulo}</span>
        {descricao ? <span style={{ fontSize: 16, lineHeight: 1.35, color: cores.textoSecundario }}>{descricao}</span> : null}
      </span>
      {acao}
    </div>
  );
}

function Interruptor({ ligado, cores }: { ligado: number; cores: Paleta }) {
  return (
    <span
      style={{
        position: 'relative',
        flexShrink: 0,
        width: LARGURA_TRILHO,
        height: ALTURA_TRILHO,
        borderRadius: 999,
        background: cores.neutroSuave,
        border: `1.5px solid ${ligado > 0.5 ? cores.destaque : cores.bordaForte}`,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: 999,
          background: cores.destaque,
          transformOrigin: '78% center',
          transform: `scale(${misturar(0.24, 1, ligado)})`,
          opacity: ligado,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 1.5,
          left: 1.5,
          width: ALTURA_TRILHO - 6,
          height: ALTURA_TRILHO - 6,
          borderRadius: 999,
          background: ligado > 0.5 ? cores.destaqueContraste : cores.superficie,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.28)',
          transform: `translateX(${(LARGURA_TRILHO - ALTURA_TRILHO) * ligado}px)`,
        }}
      />
    </span>
  );
}

export function Configuracoes() {
  const passo = usePasso();
  const tema =
    progresso(passo, configuracoes.cliqueClaro + 1, configuracoes.duracaoTema, curvaEntradaSaida) *
    (1 - progresso(passo, configuracoes.cliqueEscuro + 1, configuracoes.duracaoTema, curvaEntradaSaida));
  const cores = paletaEm(tema);
  const rolagem = progresso(passo, configuracoes.rolagem, configuracoes.duracaoRolagem, curvaEntradaSaida);
  const ligado = 1 - Math.min(mola(passo, configuracoes.clique, 220, 18), 1);
  const destaqueMenu = Math.min(mola(passo, configuracoes.destaqueMenu, 200, 15), 1);
  const saidaMenu = progresso(passo, configuracoes.saidaMenu, configuracoes.duracaoSaida, curvaEntradaSaida);
  const recolher = progresso(passo, configuracoes.saidaMenu + configuracoes.duracaoSaida - 4, 12, curvaEntradaSaida);
  const salvando = progresso(passo, configuracoes.clique, 4) * (1 - progresso(passo, configuracoes.salvo, 4));
  const salvo = progresso(passo, configuracoes.salvo, 8);
  const resumo = progresso(passo, configuracoes.resumo, 10);
  const selecaoDe = (valor: string) => (valor === 'claro' ? tema : valor === 'escuro' ? 1 - tema : 0);

  return (
    <CenaDividida
      duracao={cenas.configuracoes.duracao}
      ladoTexto="direita"
      sobretitulo="CONFIGURAÇÕES"
      titulo="Só as telas"
      tituloDestaque="que você usa."
      subtitulo="Tema claro ou escuro e as telas do menu. Desligue uma tela e ela sai do menu e dos atalhos, sem apagar nada."
      inicioTitulo={configuracoes.titulo}
      inicioCartao={configuracoes.cartao}
      larguraTexto={560}
    >
      <Cartao estilo={{ display: 'flex', height: ALTURA_JANELA, padding: 0, overflow: 'hidden', fontFamily: fontes.texto, background: cores.canvas, border: `1.5px solid ${cores.borda}` }}>
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: LARGURA_MENU,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: cores.superficie,
            borderRight: `1.5px solid ${cores.borda}`,
          }}
        >
          <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: 80, borderBottom: `1.5px solid ${cores.borda}`, opacity: progresso(passo, configuracoes.menu, 10) }}>
            <MarcaAnimada tamanho={40} faces={[1, 1, 1]} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18 }}>
            {menu.map(({ rotulo, icone: Icone, separador, ativo }, indice) => {
              const oculto = rotulo === TELA_OCULTA;
              const entrada = progresso(passo, configuracoes.menu + indice * 1.5, 10);
              const realce = oculto ? destaqueMenu * (1 - saidaMenu) : 0;
              return (
                <div key={rotulo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {separador ? <span style={{ width: 28, height: 2, margin: '10px 0', borderRadius: 1, background: cores.borda, opacity: entrada }} /> : null}
                  <span style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 52, height: oculto ? ALTURA_ITEM_MENU * (1 - recolher) : ALTURA_ITEM_MENU }}>
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 52,
                        height: ALTURA_ITEM_MENU,
                        flexShrink: 0,
                        borderRadius: 12,
                        background: ativo || realce > 0.01 ? cores.destaqueSuave : 'transparent',
                        boxShadow: realce > 0.01 ? `inset 0 0 0 2px ${cores.destaque}` : undefined,
                        color: ativo || realce > 0.5 ? cores.destaque : cores.textoSecundario,
                        opacity: entrada * (oculto ? 1 - saidaMenu : 1),
                        transform: `translateX(${misturar(-10, 0, entrada) - (oculto ? saidaMenu * 70 : 0)}px)`,
                      }}
                    >
                      <Icone size={23} strokeWidth={2} />
                    </span>
                    {oculto ? (
                      <span
                        style={{
                          position: 'absolute',
                          left: 64,
                          top: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 12px',
                          borderRadius: 10,
                          background: cores.texto,
                          color: cores.canvas,
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 12px 28px -12px rgba(0, 0, 0, 0.6)',
                          opacity: destaqueMenu * (1 - saidaMenu),
                          transform: `translate(${misturar(-8, 0, destaqueMenu) - saidaMenu * 90}px, -50%) scale(${misturar(0.85, 1, destaqueMenu)})`,
                          transformOrigin: 'left center',
                        }}
                      >
                        <EyeOff size={16} strokeWidth={2.2} />
                        {TELA_OCULTA} — Oculta
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '28px 30px', marginTop: -ROLAGEM * rolagem }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: progresso(passo, configuracoes.paineis[0] - 4, 12) }}>
              <span style={{ fontSize: 30, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Configurações</span>
              <span style={{ fontSize: 18, color: cores.textoSecundario }}>Preferências da aplicação e informações do ambiente</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <Painel cores={cores} opacidade={progresso(passo, configuracoes.paineis[0], 14)}>
                <CabecalhoPainel cores={cores} titulo="Aparência" descricao="Escolha como a interface deve ser exibida" />
                <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {temas.map(({ valor, rotulo, descricao, icone: Icone }) => {
                    const selecao = selecaoDe(valor);
                    return (
                      <span
                        key={valor}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          padding: 14,
                          borderRadius: 14,
                          border: `1.5px solid ${selecao > 0.5 ? cores.destaque : cores.borda}`,
                          background: fundoDaOpcao(selecao, tema),
                        }}
                      >
                        <span
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: selecao > 0.5 ? cores.superficie : cores.superficieSuave,
                            color: selecao > 0.5 ? cores.destaque : cores.textoSecundario,
                          }}
                        >
                          <Icone size={19} strokeWidth={2} />
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 18, fontWeight: 550, color: cores.texto }}>{rotulo}</span>
                          <span style={{ fontSize: 14, lineHeight: 1.35, color: cores.textoSecundario }}>{descricao}</span>
                        </span>
                        <span style={{ position: 'absolute', top: 12, right: 12, display: 'flex', color: cores.destaque, opacity: selecao, transform: `scale(${misturar(0.5, 1, selecao)})` }}>
                          <Check size={18} strokeWidth={2.6} />
                        </span>
                      </span>
                    );
                  })}
                  <Cursor
                    de={{ x: 320, y: 200 }}
                    paradas={[
                      { x: 92, y: 74, clique: configuracoes.cliqueClaro },
                      { x: 262, y: 74, clique: configuracoes.cliqueEscuro },
                    ]}
                    saida={configuracoes.cliqueEscuro + 14}
                  />
                </div>
              </Painel>

              <Painel cores={cores} opacidade={progresso(passo, configuracoes.paineis[1], 14)}>
                <CabecalhoPainel cores={cores} titulo="Versões" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {versoes.map(({ nome, versao }, indice) => (
                    <div
                      key={nome}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                        padding: '12px 0',
                        borderTop: indice === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                      }}
                    >
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 16 }}>
                        <span style={{ color: cores.textoSecundario }}>{nome}</span>
                        <span style={{ fontFamily: fontes.numero, fontWeight: 600, color: cores.texto }}>{versao}</span>
                      </span>
                      <span style={{ fontSize: 14, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>Lançada em 29 de Outubro de 2026</span>
                    </div>
                  ))}
                </div>
              </Painel>
            </div>

            <Painel cores={cores} opacidade={progresso(passo, configuracoes.paineis[1] + 4, 14)}>
              <CabecalhoPainel
                cores={cores}
                titulo="Telas"
                descricao="Desligue uma tela para tirá-la do menu e dos atalhos, sem apagar dado nenhum"
                acao={
                  <span style={{ display: 'grid', flexShrink: 0, marginTop: 4, fontSize: 15, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                    <span style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7, opacity: salvando }}>
                      <LoaderCircle size={15} strokeWidth={2.4} style={{ transform: `rotate(${passo * 24}deg)` }} />
                      Salvando
                    </span>
                    <span style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 7, opacity: salvo }}>
                      <Check size={15} strokeWidth={2.6} />
                      Alterações salvas
                    </span>
                  </span>
                }
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 30, rowGap: 22 }}>
                {grupos.map(({ titulo, telas }) => (
                  <section key={titulo} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span
                      style={{
                        paddingBottom: 8,
                        marginBottom: 4,
                        borderBottom: `1.5px solid ${cores.borda}`,
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: cores.textoTerciario,
                      }}
                    >
                      {titulo}
                    </span>
                    {telas.map((tela) => {
                      const alvo = tela === TELA_OCULTA;
                      return (
                        <span key={tela} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 38, fontSize: 17, fontWeight: 500, color: cores.texto, whiteSpace: 'nowrap' }}>
                          <Interruptor cores={cores} ligado={alvo ? ligado : 1} />
                          {tela}
                          {alvo ? (
                            <Cursor
                              de={{ x: 240, y: -90 }}
                              paradas={[{ x: LARGURA_TRILHO / 2 + 4, y: 19 + 4, clique: configuracoes.clique }]}
                              saida={configuracoes.clique + 24}
                            />
                          ) : null}
                        </span>
                      );
                    })}
                  </section>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, background: cores.superficieSuave }}>
                <span style={{ display: 'grid', flexShrink: 0, padding: 8, borderRadius: 9, background: cores.superficie, color: cores.textoSecundario }}>
                  <Eye size={18} strokeWidth={2} style={{ gridArea: '1 / 1', opacity: 1 - resumo }} />
                  <EyeOff size={18} strokeWidth={2} style={{ gridArea: '1 / 1', opacity: resumo }} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
                  <span style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', gap: 3, opacity: 1 - resumo }}>
                    <span style={{ fontSize: 17, fontWeight: 550, color: cores.texto }}>Todas as telas no menu</span>
                    <span style={{ fontSize: 15, color: cores.textoSecundario }}>Dashboard e Configurações ficam sempre visíveis.</span>
                  </span>
                  <span style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', gap: 3, opacity: resumo, transform: `translateY(${misturar(8, 0, resumo)}px)` }}>
                    <span style={{ fontSize: 17, fontWeight: 550, color: cores.texto }}>1 tela oculta</span>
                    <span style={{ fontSize: 15, color: cores.textoSecundario }}>{TELA_OCULTA} está fora do menu. Os dados continuam guardados.</span>
                  </span>
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${cores.bordaForte}`,
                    color: cores.texto,
                    fontSize: 16,
                    fontWeight: 600,
                    opacity: misturar(0.45, 1, resumo),
                  }}
                >
                  <Eye size={16} strokeWidth={2} />
                  Mostrar todas
                </span>
              </div>
            </Painel>
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
