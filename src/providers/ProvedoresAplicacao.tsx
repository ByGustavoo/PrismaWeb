import type { ReactNode } from 'react';
import { ProvedorAvisos } from './ProvedorAvisos';
import { ProvedorPeriodo } from './ProvedorPeriodo';
import { ProvedorTema } from './ProvedorTema';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>
        <ProvedorAvisos>
          <ProvedorPeriodo>{children}</ProvedorPeriodo>
        </ProvedorAvisos>
      </ProvedorNotificacoes>
    </ProvedorTema>
  );
}
