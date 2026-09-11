import { BrowserRouter } from 'react-router-dom';
import { ProvedoresAplicacao } from '@/providers/ProvedoresAplicacao';
import { RotasAplicacao } from '@/routes';

export default function Aplicacao() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProvedoresAplicacao>
        <RotasAplicacao />
      </ProvedoresAplicacao>
    </BrowserRouter>
  );
}
