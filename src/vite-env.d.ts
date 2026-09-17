/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ConfiguracaoExecucaoPrisma {
  readonly urlApi?: string;
  readonly versao?: string;
  readonly dataLancamento?: string;
}

interface Window {
  __PRISMA_CONFIG__?: ConfiguracaoExecucaoPrisma;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
