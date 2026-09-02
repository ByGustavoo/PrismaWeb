import { env } from '@/constants/env';

/**
 * Simula uma resposta de rede. Toda a camada de mocks passa por aqui,
 * o que garante que os componentes ja lidem com estados de carregamento.
 */
export function mockResponse<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(structuredClone(data)), env.mockDelay);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Requisicao cancelada', 'AbortError'));
      },
      { once: true },
    );
  });
}
