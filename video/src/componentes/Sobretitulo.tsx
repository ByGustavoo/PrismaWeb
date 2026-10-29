import { misturar, progresso, usePasso } from '../animacao';
import { cores, fontes } from '../tema';

interface SobretituloProps {
  texto: string;
  inicio: number;
}

export function Sobretitulo({ texto, inicio }: SobretituloProps) {
  const passo = usePasso();
  const t = progresso(passo, inicio, 18);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: fontes.texto,
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: '0.18em',
        color: cores.destaque,
        opacity: t,
        transform: `translateX(${misturar(-24, 0, t)}px)`,
      }}
    >
      <span style={{ width: misturar(0, 40, t), height: 2, background: cores.destaque, borderRadius: 2 }} />
      {texto}
    </div>
  );
}
