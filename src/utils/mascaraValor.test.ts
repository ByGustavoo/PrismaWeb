import { describe, expect, it } from 'vitest';
import { interpretarEntradaValor, paraEntradaValor } from '@/utils/formatacao';
import {
  centavosDoValorColado,
  colarEntradaMonetaria,
  editarEntradaMonetaria,
  formatarCentavos,
} from '@/utils/mascaraValor';
import type { ResultadoMascara } from '@/utils/mascaraValor';

interface Estado extends ResultadoMascara {
  permitirNegativo?: boolean;
}

function inserir(estado: Estado, caracteres: string): Estado {
  return [...caracteres].reduce<Estado>((atual, caractere) => {
    const bruto = `${atual.texto.slice(0, atual.cursor)}${caractere}${atual.texto.slice(atual.cursor)}`;
    const resultado = editarEntradaMonetaria({
      anterior: atual.texto,
      bruto,
      cursor: atual.cursor + 1,
      tipo: 'insertText',
      permitirNegativo: atual.permitirNegativo,
    });
    return { ...atual, ...resultado };
  }, estado);
}

function apagar(estado: Estado, vezes = 1): Estado {
  let atual = estado;
  for (let vez = 0; vez < vezes; vez += 1) {
    if (atual.cursor === 0) break;
    const bruto = `${atual.texto.slice(0, atual.cursor - 1)}${atual.texto.slice(atual.cursor)}`;
    const resultado = editarEntradaMonetaria({
      anterior: atual.texto,
      bruto,
      cursor: atual.cursor - 1,
      tipo: 'deleteContentBackward',
      permitirNegativo: atual.permitirNegativo,
    });
    atual = { ...atual, ...resultado };
  }
  return atual;
}

function apagarAFrente(estado: Estado): Estado {
  const bruto = `${estado.texto.slice(0, estado.cursor)}${estado.texto.slice(estado.cursor + 1)}`;
  return {
    ...estado,
    ...editarEntradaMonetaria({
      anterior: estado.texto,
      bruto,
      cursor: estado.cursor,
      tipo: 'deleteContentForward',
      permitirNegativo: estado.permitirNegativo,
    }),
  };
}

function digitar(sequencia: string, permitirNegativo = false): Estado {
  return inserir({ texto: '', cursor: 0, permitirNegativo }, sequencia);
}

function emCursor(texto: string, cursor: number): Estado {
  return { texto, cursor };
}

describe('formatarCentavos', () => {
  it.each([
    ['1', '0,01'],
    ['15', '0,15'],
    ['150', '1,50'],
    ['1500', '15,00'],
    ['15500', '155,00'],
    ['155000', '1.550,00'],
    ['155083', '1.550,83'],
    ['1000000', '10.000,00'],
    ['10000000', '100.000,00'],
    ['100000000', '1.000.000,00'],
    ['99999999999999', '999.999.999.999,99'],
    ['0', '0,00'],
    ['00042', '0,42'],
  ])('%s centavos viram %s', (centavos, esperado) => {
    expect(formatarCentavos(centavos)).toBe(esperado);
  });

  it('só põe o sinal quando o valor não é zero', () => {
    expect(formatarCentavos('1250', true)).toBe('-12,50');
    expect(formatarCentavos('0', true)).toBe('0,00');
  });
});

describe('digitação contínua', () => {
  it.each([
    ['1', '0,01'],
    ['15', '0,15'],
    ['150', '1,50'],
    ['1500', '15,00'],
    ['15500', '155,00'],
    ['155000', '1.550,00'],
    ['155083', '1.550,83'],
    ['1000000', '10.000,00'],
    ['10000000', '100.000,00'],
    ['100000000', '1.000.000,00'],
  ])('digitar %s mostra R$ %s com o cursor no fim', (sequencia, esperado) => {
    expect(digitar(sequencia)).toEqual({ texto: esperado, cursor: esperado.length, permitirNegativo: false });
  });

  it('o texto exibido é exatamente o número enviado à API', () => {
    const { texto } = digitar('155083');
    expect(interpretarEntradaValor(texto)).toBe(1550.83);
    expect(JSON.stringify({ valor: interpretarEntradaValor(texto) })).toBe('{"valor":1550.83}');
  });

  it('ignora letras, vírgula, ponto e espaço', () => {
    expect(digitar('1a5,0 .0x').texto).toBe('15,00');
  });

  it('não deixa passar de doze dígitos antes da vírgula', () => {
    const cheio = digitar('99999999999999');
    expect(cheio.texto).toBe('999.999.999.999,99');
    const excedido = inserir(cheio, '9');
    expect(excedido.texto).toBe('999.999.999.999,99');
    expect(excedido.cursor).toBe(cheio.cursor);
  });

  it('zero digitado mostra 0,00 e o dígito seguinte entra nos centavos', () => {
    expect(digitar('0').texto).toBe('0,00');
    expect(digitar('00').texto).toBe('0,00');
    expect(digitar('05').texto).toBe('0,05');
  });
});

describe('exclusão', () => {
  it('Backspace no fim desfaz o último dígito', () => {
    const estado = apagar(digitar('155083'));
    expect(estado.texto).toBe('155,08');
    expect(estado.cursor).toBe(6);
  });

  it('apagar tudo deixa o campo vazio, sem prender em 0,00', () => {
    expect(apagar(digitar('155083'), 6).texto).toBe('');
    expect(apagar(digitar('0')).texto).toBe('');
  });

  it('Backspace logo depois da vírgula apaga o dígito anterior a ela', () => {
    const estado = apagar(emCursor('1.550,83', 6));
    expect(estado).toEqual({ texto: '155,83', cursor: 3 });
  });

  it('Backspace logo depois do ponto de milhar apaga o dígito anterior a ele', () => {
    const estado = apagar(emCursor('1.550,83', 2));
    expect(estado).toEqual({ texto: '550,83', cursor: 0 });
  });

  it('Delete antes da vírgula apaga o primeiro centavo', () => {
    const estado = apagarAFrente(emCursor('1.550,83', 5));
    expect(estado).toEqual({ texto: '155,03', cursor: 5 });
  });

  it('Delete antes do ponto de milhar apaga o dígito seguinte a ele', () => {
    const estado = apagarAFrente(emCursor('1.550,83', 1));
    expect(estado).toEqual({ texto: '150,83', cursor: 1 });
  });
});

describe('edição no meio do valor', () => {
  it('inserir um dígito no meio mantém o cursor depois dele', () => {
    const estado = inserir(emCursor('1.550,83', 3), '9');
    expect(estado).toEqual({ texto: '15.950,83', cursor: 4 });
  });

  it('apagar um dígito no meio mantém o cursor no mesmo lugar em relação aos vizinhos', () => {
    const estado = apagar(emCursor('15.950,83', 4));
    expect(estado).toEqual({ texto: '1.550,83', cursor: 3 });
  });

  it('editar um valor que veio do servidor', () => {
    const inicial = paraEntradaValor(1550.83);
    expect(inicial).toBe('1.550,83');
    const estado = inserir(apagar(emCursor(inicial, inicial.length), 2), '00');
    expect(estado.texto).toBe('1.550,00');
    expect(interpretarEntradaValor(estado.texto)).toBe(1550);
  });

  it('digitar sobre o valor inteiro selecionado recomeça a contagem', () => {
    const estado = editarEntradaMonetaria({ anterior: '1.550,83', bruto: '7', cursor: 1, tipo: 'insertText' });
    expect(estado).toEqual({ texto: '0,07', cursor: 4 });
  });

  it('apagar o valor inteiro selecionado limpa o campo', () => {
    const estado = editarEntradaMonetaria({ anterior: '1.550,83', bruto: '', cursor: 0, tipo: 'deleteContentBackward' });
    expect(estado).toEqual({ texto: '', cursor: 0 });
  });
});

describe('sinal negativo', () => {
  it('é ignorado nos campos que não aceitam negativo', () => {
    expect(digitar('-150').texto).toBe('1,50');
  });

  it('o hífen alterna o sinal sem mexer nos dígitos', () => {
    const negativo = digitar('-150', true);
    expect(negativo.texto).toBe('-1,50');
    expect(interpretarEntradaValor(negativo.texto)).toBe(-1.5);
    expect(inserir(negativo, '-').texto).toBe('1,50');
  });

  it('apagar o hífen deixa o valor positivo, sem perder dígito', () => {
    const estado = apagar(emCursor('-1,50', 1));
    expect(estado).toEqual({ texto: '1,50', cursor: 0 });
  });

  it('o sinal digitado antes do zero sobrevive', () => {
    expect(digitar('-05', true).texto).toBe('-0,05');
  });
});

describe('colagem', () => {
  it.each([
    ['R$ 1.500,50', '150050'],
    ['1500.50', '150050'],
    ['1,500.50', '150050'],
    ['1500', '150000'],
    ['0,5', '50'],
    ['abc', ''],
  ])('%s vira %s centavos', (colado, centavos) => {
    expect(centavosDoValorColado(colado)).toBe(centavos);
  });

  it('colar num campo vazio usa o valor colado como está', () => {
    expect(colarEntradaMonetaria({ anterior: '', colado: 'R$ 1.500,50', inicio: 0, fim: 0 })).toEqual({
      texto: '1.500,50',
      cursor: 8,
    });
  });

  it('colar sobre o valor inteiro selecionado o substitui', () => {
    expect(colarEntradaMonetaria({ anterior: '9,99', colado: '1500', inicio: 0, fim: 4 }).texto).toBe('1.500,00');
  });

  it('colar no meio do valor insere só os dígitos', () => {
    expect(colarEntradaMonetaria({ anterior: '1,50', colado: '20', inicio: 1, fim: 1 })).toEqual({
      texto: '120,50',
      cursor: 3,
    });
  });

  it('colagem sem número não muda nada', () => {
    expect(colarEntradaMonetaria({ anterior: '1,50', colado: 'abc', inicio: 4, fim: 4 })).toEqual({ texto: '1,50', cursor: 4 });
  });

  it('colagem acima do limite é recusada', () => {
    expect(colarEntradaMonetaria({ anterior: '', colado: '1000000000000', inicio: 0, fim: 0 }).texto).toBe('');
  });

  it('o sinal colado só vale onde negativo é permitido', () => {
    expect(colarEntradaMonetaria({ anterior: '', colado: '-10,00', inicio: 0, fim: 0 }).texto).toBe('10,00');
    expect(colarEntradaMonetaria({ anterior: '', colado: '-10,00', inicio: 0, fim: 0, permitirNegativo: true }).texto).toBe(
      '-10,00',
    );
  });
});
