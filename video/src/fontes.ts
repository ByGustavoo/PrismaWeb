import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export function carregarFontes(): Promise<unknown> {
  return Promise.all([
    loadFont({ family: 'Instrument Sans', url: staticFile('fontes/instrument-sans.woff2'), weight: '400 700' }),
    loadFont({ family: 'Archivo', url: staticFile('fontes/archivo.woff2'), weight: '100 900' }),
  ]);
}
