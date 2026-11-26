import { NOME_APLICACAO } from '@/constants/aplicacao';

export type MotivoFalhaDeTela = 'CARREGAMENTO' | 'EXECUCAO';

export type AlcanceFalhaDeTela = 'TELA' | 'APLICACAO';

export interface FalhaDeTela {
  motivo: MotivoFalhaDeTela;
  sobretitulo: string;
  titulo: string;
  tituloDaAba: string;
  descricao: string;
}

const MENSAGENS_DE_CARREGAMENTO = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css/i,
  /loading (css )?chunk [\w-]+ failed/i,
];

function mensagemDoErro(erro: unknown): string {
  if (erro instanceof Error) return `${erro.name} ${erro.message}`;
  return typeof erro === 'string' ? erro : '';
}

export function motivoDaFalhaDeTela(erro: unknown): MotivoFalhaDeTela {
  if (erro instanceof Error && erro.name === 'ChunkLoadError') return 'CARREGAMENTO';
  const mensagem = mensagemDoErro(erro);
  return MENSAGENS_DE_CARREGAMENTO.some((padrao) => padrao.test(mensagem)) ? 'CARREGAMENTO' : 'EXECUCAO';
}

export function interpretarFalhaDeTela(erro: unknown, alcance: AlcanceFalhaDeTela): FalhaDeTela {
  const motivo = motivoDaFalhaDeTela(erro);
  const sujeito = alcance === 'TELA' ? 'Esta tela' : `O ${NOME_APLICACAO}`;

  if (motivo === 'CARREGAMENTO') {
    return {
      motivo,
      sobretitulo: 'Falha de carregamento',
      titulo: `${sujeito} não carregou`,
      tituloDaAba: `Não carregou — ${NOME_APLICACAO}`,
      descricao: `Uma parte do ${NOME_APLICACAO} não chegou ao navegador. Isso costuma acontecer quando sai uma versão nova com a página aberta ou quando a rede cai por um instante. Recarregar a página resolve.`,
    };
  }

  return {
    motivo,
    sobretitulo: 'Erro inesperado',
    titulo: `${sujeito} parou de funcionar`,
    tituloDaAba: `Parou de funcionar — ${NOME_APLICACAO}`,
    descricao:
      alcance === 'TELA'
        ? 'Algo deu errado ao montar esta tela. Recarregue a página para tentar de novo; as outras telas continuam pelo menu.'
        : 'Algo deu errado ao montar a aplicação. Recarregue a página para tentar de novo.',
  };
}
