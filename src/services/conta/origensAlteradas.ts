type Ouvinte = () => void;

let versao = 0;
const ouvintes = new Set<Ouvinte>();

export const origensAlteradas = {
  versao(): number {
    return versao;
  },

  assinar(ouvinte: Ouvinte): () => void {
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  },

  marcar<T>(resposta: T): T {
    versao += 1;
    ouvintes.forEach((ouvinte) => ouvinte());
    return resposta;
  },
};
