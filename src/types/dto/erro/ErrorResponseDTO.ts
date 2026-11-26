import type { ErroCampoDTO } from './ErroCampoDTO';

export interface ErrorResponseDTO {
  status: number;
  title: string;
  instance: string;
  type: string;
  detail: string;
  errors?: ErroCampoDTO[];
  timestamp: string;
}
