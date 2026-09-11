import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import { IndicadorGiratorio } from './Carregamento';
import styles from './Botao.module.css';

export type VarianteBotao = 'primary' | 'secondary' | 'ghost' | 'danger';
export type TamanhoBotao = 'sm' | 'md';

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: LucideIcon;
  posicaoIcone?: 'left' | 'right';
  carregando?: boolean;
  larguraTotal?: boolean;
  children?: ReactNode;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Button(
  {
    variante = 'primary',
    tamanho = 'md',
    icone: Icon,
    posicaoIcone = 'left',
    carregando = false,
    larguraTotal = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const iconNode = carregando ? <IndicadorGiratorio tamanho={16} /> : Icon ? <Icon size={16} strokeWidth={2} /> : null;

  return (
    <button
      ref={ref}
      className={juntarClasses(
        styles.button,
        styles[variante],
        styles[tamanho],
        larguraTotal && styles.fullWidth,
        !children && styles.iconOnly,
        className,
      )}
      disabled={disabled ?? carregando}
      {...rest}
    >
      {posicaoIcone === 'left' && iconNode}
      {children}
      {posicaoIcone === 'right' && !carregando && iconNode}
    </button>
  );
});
