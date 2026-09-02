import { env } from '@/constants/env';
import { ApiError } from './ApiError';

type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 15000;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Token de autenticacao. Hoje devolve null; quando o backend Spring Security
 * entrar, basta ler daqui (storage, cookie ou contexto de auth).
 */
function getAuthToken(): string | null {
  return null;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Falha na requisicao (${response.status})`;
  let code = 'http_error';
  let details: unknown;

  try {
    const body = (await response.json()) as { message?: string; code?: string; errors?: unknown };
    message = body.message ?? message;
    code = body.code ?? code;
    details = body.errors;
  } catch {
    // resposta sem corpo JSON: mantem a mensagem padrao
  }

  return new ApiError(message, response.status, code, details);
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const token = getAuthToken();

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('A requisicao demorou demais e foi cancelada.', 0, 'timeout');
    }
    throw new ApiError('Nao foi possivel falar com o servidor.', 0, 'network_error', error);
  } finally {
    clearTimeout(timeout);
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};
