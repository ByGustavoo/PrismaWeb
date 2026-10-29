import { X } from 'lucide-react';
import { Easing } from 'remotion';
import { misturar, mola, progresso, usePasso } from '../animacao';
import { cores, fontes } from '../tema';

const DURACAO_SAIDA = 10;

interface NotificacaoProps {
  titulo: string;
  descricao: string;
  inicio: number;
  saida: number;
}

export function Notificacao({ titulo, descricao, inicio, saida }: NotificacaoProps) {
  const passo = usePasso();
  if (passo < inicio - 1 || passo > saida + DURACAO_SAIDA + 1) return null;

  const entrada = mola(passo, inicio, 190, 15);
  const surgimento = progresso(passo, inicio, 6);
  const partida = progresso(passo, saida, DURACAO_SAIDA, Easing.in(Easing.cubic));
  const selo = mola(passo, inicio + 3, 260, 13);
  const onda = progresso(passo, inicio + 4, 18);
  const traco = progresso(passo, inicio + 6, 8);
  const titulo1 = progresso(passo, inicio + 4, 10);
  const descricao1 = progresso(passo, inicio + 7, 10);
  const restante = 1 - progresso(passo, inicio + 8, saida - inicio - 8, (t) => t);

  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        bottom: 48,
        width: 520,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '20px 18px 23px 20px',
        boxSizing: 'border-box',
        borderRadius: 16,
        overflow: 'hidden',
        background: cores.superficieElevada,
        border: `1.5px solid ${cores.bordaForte}`,
        boxShadow: `0 ${misturar(10, 30, entrada)}px ${misturar(20, 60, entrada)}px -20px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(0, 0, 0, 0.4)`,
        fontFamily: fontes.texto,
        opacity: surgimento * (1 - partida),
        transform: `translate(${36 * partida}px, ${misturar(48, 0, entrada)}px) scale(${misturar(0.94, 1, entrada)})`,
        transformOrigin: '100% 100%',
      }}
    >
      <span style={{ position: 'relative', display: 'flex', width: 34, height: 34, flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${cores.positivo}`,
            opacity: passo >= inicio + 4 ? 0.7 * (1 - onda) : 0,
            transform: `scale(${misturar(1, 1.9, onda)})`,
          }}
        />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: cores.positivoSuave,
            transform: `scale(${selo})`,
          }}
        >
          <svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" pathLength={1} stroke={cores.positivo} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - traco} />
          </svg>
        </span>
      </span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 3, minWidth: 0 }}>
        <span style={{ fontSize: 21, fontWeight: 620, color: cores.texto, lineHeight: 1.25, opacity: titulo1, transform: `translateX(${misturar(10, 0, titulo1)}px)` }}>{titulo}</span>
        <span style={{ fontSize: 18, color: cores.textoSecundario, lineHeight: 1.3, opacity: descricao1, transform: `translateX(${misturar(10, 0, descricao1)}px)` }}>{descricao}</span>
      </span>
      <span style={{ display: 'flex', padding: 5, color: cores.textoSecundario }}>
        <X size={20} strokeWidth={2.2} />
      </span>
      <span style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: '100%', background: cores.positivo, transform: `scaleX(${restante})`, transformOrigin: '0 50%' }} />
    </div>
  );
}
