import { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TelaBoasVindas } from '@/components/boasVindas';
import { CHAVE_BOAS_VINDAS_VISTA } from '@/constants/aplicacao';
import { ProvedoresAplicacao } from '@/providers/ProvedoresAplicacao';
import { RotasAplicacao } from '@/routes';

function boasVindasJaVistasNestaSessao(): boolean {
  try {
    return window.sessionStorage.getItem(CHAVE_BOAS_VINDAS_VISTA) === 'true';
  } catch {
    return false;
  }
}

export default function Aplicacao() {
  const [boasVindasVista, setBoasVindasVista] = useState(boasVindasJaVistasNestaSessao);

  const marcarBoasVindasVista = useCallback(() => {
    setBoasVindasVista(true);
    try {
      window.sessionStorage.setItem(CHAVE_BOAS_VINDAS_VISTA, 'true');
    } catch {
      return;
    }
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProvedoresAplicacao>
        {boasVindasVista ? <RotasAplicacao /> : <TelaBoasVindas aoComecar={marcarBoasVindasVista} />}
      </ProvedoresAplicacao>
    </BrowserRouter>
  );
}
