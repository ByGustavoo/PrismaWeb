import { useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { Botao } from '@/components/ui/Botao';
import { NOME_APLICACAO } from '@/constants/aplicacao';
import { interpretarFalhaDeTela } from '@/utils/falhaDeTela';
import { recarregarPagina } from './LimiteDeErro';
import { ConteudoDaMarcaDeErro, MolduraDeErro, classeDaMarcaDeErro } from './MolduraDeErro';

export function TelaDeFalha({ erro }: { erro: unknown }) {
  const falha = interpretarFalhaDeTela(erro, 'APLICACAO');

  useEffect(() => {
    document.title = falha.tituloDaAba;
  }, [falha.tituloDaAba]);

  return (
    <MolduraDeErro
      alerta
      marca={
        <a href="/" className={classeDaMarcaDeErro} aria-label={`${NOME_APLICACAO}, ir para o início`}>
          <ConteudoDaMarcaDeErro />
        </a>
      }
      sobretitulo={falha.sobretitulo}
      titulo={falha.titulo}
      descricao={`${falha.descricao} Nada foi alterado nos seus dados.`}
      acoes={
        <Botao icone={RotateCw} onClick={recarregarPagina}>
          Recarregar a página
        </Botao>
      }
    />
  );
}
