import { describe, expect, it } from 'vitest';
import { interpretarFalhaDeTela, motivoDaFalhaDeTela } from './falhaDeTela';

describe('motivoDaFalhaDeTela', () => {
  it('reconhece pacote que não chegou no Chrome, no Firefox e no Safari', () => {
    expect(motivoDaFalhaDeTela(new TypeError('Failed to fetch dynamically imported module: /assets/PaginaContas-1a2b.js'))).toBe(
      'CARREGAMENTO',
    );
    expect(motivoDaFalhaDeTela(new TypeError('error loading dynamically imported module'))).toBe('CARREGAMENTO');
    expect(motivoDaFalhaDeTela(new TypeError('Importing a module script failed.'))).toBe('CARREGAMENTO');
    expect(motivoDaFalhaDeTela(new Error('Unable to preload CSS for /assets/PaginaContas-1a2b.css'))).toBe('CARREGAMENTO');
  });

  it('trata o resto como erro de execução', () => {
    expect(motivoDaFalhaDeTela(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe('EXECUCAO');
    expect(motivoDaFalhaDeTela(null)).toBe('EXECUCAO');
  });
});

describe('interpretarFalhaDeTela', () => {
  it('fala da aplicação ou da tela conforme o alcance', () => {
    const erro = new Error('quebrou');
    expect(interpretarFalhaDeTela(erro, 'APLICACAO').titulo).toBe('O Prisma parou de funcionar');
    expect(interpretarFalhaDeTela(erro, 'TELA').titulo).toBe('Esta tela parou de funcionar');
  });

  it('nunca repete a mensagem técnica do erro', () => {
    const falha = interpretarFalhaDeTela(new Error('segredo interno 42'), 'APLICACAO');
    expect(Object.values(falha).join(' ')).not.toContain('segredo interno 42');
  });
});
