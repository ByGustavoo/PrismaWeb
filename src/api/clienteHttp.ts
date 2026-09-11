import { ambiente } from '@/constants/ambiente';
import type { ErrorResponseDTO } from '@/types';
import { ErroApi } from './ErroApi';

type ValorConsulta = string | number | boolean | undefined | null;

export interface OpcoesRequisicao {
  consulta?: Record<string, ValorConsulta>;
  signal?: AbortSignal;
  cabecalhos?: Record<string, string>;
}

const TEMPO_LIMITE_PADRAO_MS = 15000;

function montarUrl(path: string, query?: Record<string, ValorConsulta>): string {
  const base = ambiente.urlApi.replace(/\/$/, '');
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

function obterTokenAutenticacao(): string | null {
  return null;
}

async function interpretarErro(response: Response): Promise<ErroApi> {
  let message = `Falha na requisição (${response.status})`;
  let code = 'erro_http';
  let details: unknown;

  try {
    const body = (await response.json()) as Partial<ErrorResponseDTO>;
    message = body.detail ?? body.title ?? message;
    code = body.type ?? code;
    details = body.errors;
  } catch {
  }

  return new ErroApi(message, response.status, code, details);
}

async function requisitar<T>(method: string, path: string, body?: unknown, options: OpcoesRequisicao = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEMPO_LIMITE_PADRAO_MS);
  const token = obterTokenAutenticacao();

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(montarUrl(path, options.consulta), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.cabecalhos,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw await interpretarErro(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ErroApi) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ErroApi('A requisição demorou demais e foi cancelada!', 0, 'timeout');
    }
    throw new ErroApi('Não foi possível falar com o servidor!', 0, 'network_error', error);
  } finally {
    clearTimeout(timeout);
  }
}

export const clienteHttp = {
  get: <T>(path: string, options?: OpcoesRequisicao) => requisitar<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: OpcoesRequisicao) => requisitar<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: OpcoesRequisicao) => requisitar<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: OpcoesRequisicao) => requisitar<T>('DELETE', path, undefined, options),
};
