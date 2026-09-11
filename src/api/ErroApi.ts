export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes?: unknown;

  constructor(message: string, status: number, code = 'unknown_error', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = code;
    this.detalhes = details;
  }
}
