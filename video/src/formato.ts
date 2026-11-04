import { createContext, useContext } from 'react';

export type Formato = 'paisagem' | 'retrato';

export const FormatoContexto = createContext<Formato>('paisagem');

export function useRetrato(): boolean {
  return useContext(FormatoContexto) === 'retrato';
}
