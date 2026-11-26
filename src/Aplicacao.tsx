import { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TelaBoasVindas } from '@/components/boasVindas';
import { LimiteDeErro } from '@/components/erro/LimiteDeErro';
import { TelaDeFalha } from '@/components/erro/TelaDeFalha';
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
    <LimiteDeErro alternativa={(erro) => <TelaDeFalha erro={erro} />}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProvedoresAplicacao>
          {boasVindasVista ? <RotasAplicacao /> : <TelaBoasVindas aoComecar={marcarBoasVindasVista} />}
        </ProvedoresAplicacao>
      </BrowserRouter>
    </LimiteDeErro>
  );
}
