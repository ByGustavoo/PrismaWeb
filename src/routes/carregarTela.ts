import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { CHAVE_RECARGA_TELA } from '@/constants/aplicacao';

const ESPERA_MAXIMA_OCIOSO_MS = 3000;
const ESPERA_ANTES_DE_PRECARREGAR_MS = 2000;

export type TelaSobDemanda<P extends object = never> = LazyExoticComponent<ComponentType<P>> & {
  precarregar: () => Promise<void>;
};

const telas: Array<() => Promise<void>> = [];

function jaRecarregou(): boolean {
  try {
    return window.sessionStorage.getItem(CHAVE_RECARGA_TELA) === 'true';
  } catch {
    return true;
  }
}

function marcarRecarga(valor: boolean): void {
  try {
    if (valor) window.sessionStorage.setItem(CHAVE_RECARGA_TELA, 'true');
    else window.sessionStorage.removeItem(CHAVE_RECARGA_TELA);
  } catch {
    return;
  }
}

function quandoOcioso(tarefa: () => void): void {
  if ('requestIdleCallback' in window) window.requestIdleCallback(tarefa, { timeout: ESPERA_MAXIMA_OCIOSO_MS });
  else setTimeout(tarefa, ESPERA_MAXIMA_OCIOSO_MS);
}

export function carregarTela<P extends object>(importar: () => Promise<ComponentType<P>>): TelaSobDemanda<P> {
  let pedido: Promise<ComponentType<P>> | null = null;
  const buscar = () => (pedido ??= importar());

  const componente = lazy(async () => {
    try {
      const carregado = await buscar();
      marcarRecarga(false);
      return { default: carregado };
    } catch (erro) {
      if (jaRecarregou()) throw erro;
      marcarRecarga(true);
      window.location.reload();
      return new Promise<never>(() => undefined);
    }
  });

  const precarregar = () =>
    buscar().then(
      () => undefined,
      () => undefined,
    );
  telas.push(precarregar);

  return Object.assign(componente, { precarregar });
}

function depoisDoCarregamento(tarefa: () => void): void {
  if (document.readyState === 'complete') tarefa();
  else window.addEventListener('load', tarefa, { once: true });
}

export function precarregarTelas(primeira?: { precarregar: () => Promise<void> }): void {
  const inicio = primeira ? primeira.precarregar() : Promise.resolve();
  inicio.then(() =>
    depoisDoCarregamento(() =>
      setTimeout(() => quandoOcioso(() => telas.forEach((precarregar) => void precarregar())), ESPERA_ANTES_DE_PRECARREGAR_MS),
    ),
  );
}
