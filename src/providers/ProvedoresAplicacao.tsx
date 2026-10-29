import type { ReactNode } from 'react';
import { ProvedorAvisos } from './ProvedorAvisos';
import { ProvedorPeriodo } from './ProvedorPeriodo';
import { ProvedorTelas } from './ProvedorTelas';
import { ProvedorTema } from './ProvedorTema';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>
        <ProvedorTelas>
          <ProvedorAvisos>
            <ProvedorPeriodo>{children}</ProvedorPeriodo>
          </ProvedorAvisos>
        </ProvedorTelas>
      </ProvedorNotificacoes>
    </ProvedorTema>
  );
}
