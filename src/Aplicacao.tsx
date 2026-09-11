import { BrowserRouter } from 'react-router-dom';
import { ProvedoresAplicacao } from '@/providers/ProvedoresAplicacao';
import { RotasAplicacao } from '@/routes';

export default function Aplicacao() {
  return (
    <BrowserRouter>
      <ProvedoresAplicacao>
        <RotasAplicacao />
      </ProvedoresAplicacao>
    </BrowserRouter>
  );
}
