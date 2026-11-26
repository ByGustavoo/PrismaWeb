import { useEffect } from 'react';
import { CloudOff, OctagonAlert, RotateCw } from 'lucide-react';
import { Botao, EstadoVazio, Painel } from '@/components/ui';
import { interpretarFalhaDeTela } from '@/utils/falhaDeTela';
import { recarregarPagina } from './LimiteDeErro';

export function FalhaNaTela({ erro }: { erro: unknown }) {
  const falha = interpretarFalhaDeTela(erro, 'TELA');

  useEffect(() => {
    const anterior = document.title;
    document.title = falha.tituloDaAba;
    return () => {
      document.title = anterior;
    };
  }, [falha.tituloDaAba]);

  return (
    <div role="alert">
      <Painel>
        <EstadoVazio
          nivelTitulo={1}
          icone={falha.motivo === 'CARREGAMENTO' ? CloudOff : OctagonAlert}
          titulo={falha.titulo}
          descricao={falha.descricao}
          acao={
            <Botao icone={RotateCw} onClick={recarregarPagina}>
              Recarregar a página
            </Botao>
          }
        />
      </Painel>
    </div>
  );
}
