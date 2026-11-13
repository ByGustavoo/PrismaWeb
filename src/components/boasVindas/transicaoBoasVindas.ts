import { flushSync } from 'react-dom';

const CLASSE_TRANSICAO = 'saindo-das-boas-vindas';
const CLASSE_CHEGADA = 'chegando-das-boas-vindas';
const CLASSE_MARCA_EM_VOO = 'marca-em-voo';
const DURACAO_CHEGADA_MS = 1500;
const ESPERA_MAXIMA_PAGINA_MS = 600;
const INTERVALO_VERIFICACAO_MS = 16;
const ESPERA_MAXIMA_ROLAGEM_MS = 700;

interface TransicaoDeVisao {
  ready: Promise<void>;
  finished: Promise<void>;
}

interface DocumentoComTransicao {
  startViewTransition?: (atualizar: () => Promise<void> | void) => TransicaoDeVisao;
}

function esperarPaginaPronta(): Promise<void> {
  return new Promise((resolver) => {
    const inicio = performance.now();
    const verificar = () => {
      const pronta = document.querySelector('main#conteudo h1');
      if (pronta || performance.now() - inicio > ESPERA_MAXIMA_PAGINA_MS) resolver();
      else window.setTimeout(verificar, INTERVALO_VERIFICACAO_MS);
    };
    verificar();
  });
}

export function rolarAteOTopo(suave: boolean): Promise<void> {
  if (window.scrollY <= 1) return Promise.resolve();

  return new Promise((resolver) => {
    const inicio = performance.now();
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
    const verificar = () => {
      if (window.scrollY <= 1 || performance.now() - inicio > ESPERA_MAXIMA_ROLAGEM_MS) resolver();
      else window.requestAnimationFrame(verificar);
    };
    window.requestAnimationFrame(verificar);
  });
}

function entrarNoTopo(aoComecar: () => void): void {
  aoComecar();
  window.scrollTo(0, 0);
}

export function transicionarParaAplicacao(aoComecar: () => void): void {
  const documento = document as unknown as DocumentoComTransicao;

  if (!documento.startViewTransition || document.visibilityState !== 'visible') {
    flushSync(() => entrarNoTopo(aoComecar));
    window.scrollTo(0, 0);
    return;
  }

  const raiz = document.documentElement;
  const limpar = () => raiz.classList.remove(CLASSE_TRANSICAO);
  const encerrarChegada = () => raiz.classList.remove(CLASSE_CHEGADA, CLASSE_MARCA_EM_VOO);
  raiz.classList.add(CLASSE_TRANSICAO, CLASSE_CHEGADA);

  const transicao = documento.startViewTransition(async () => {
    flushSync(aoComecar);
    window.scrollTo(0, 0);
    await esperarPaginaPronta();
    window.scrollTo(0, 0);
  });
  transicao.ready.then(
    () => {
      raiz.classList.add(CLASSE_MARCA_EM_VOO);
      window.setTimeout(encerrarChegada, DURACAO_CHEGADA_MS);
    },
    () => {
      limpar();
      encerrarChegada();
    },
  );
  transicao.finished.then(limpar, limpar);
}
