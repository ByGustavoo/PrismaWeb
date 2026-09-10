import { env } from '@/constants/env';

export function mockResponse<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(structuredClone(data)), env.mockDelay);

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
