import { ambiente } from '@/constants/ambiente';

export function respostaMock<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(structuredClone(data)), ambiente.atrasoMocks);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Requisição cancelada', 'AbortError'));
      },
      { once: true },
    );
  });
}
