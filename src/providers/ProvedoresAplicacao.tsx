import type { ReactNode } from 'react';
import { ProvedorPeriodo } from './ProvedorPeriodo';
import { ProvedorTema } from './ProvedorTema';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>
        <ProvedorPeriodo>{children}</ProvedorPeriodo>
      </ProvedorNotificacoes>
    </ProvedorTema>
  );
}
