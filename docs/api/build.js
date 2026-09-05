/*
 * Gera um PDF para cada documento de endpoint desta pasta.
 *
 * Usa o Chrome ja instalado em modo headless (`--print-to-pdf`), e nao Puppeteer
 * ou Playwright: baixar um Chromium proprio para imprimir um HTML estatico
 * acrescentaria centenas de megabytes de dependencia ao projeto para fazer o que
 * o navegador da maquina ja faz.
 *
 *   node docs/api/build.js            # gera todos
 *   node docs/api/build.js 01         # gera so os que comecam com "01"
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// O projeto e ESM ("type": "module" no package.json), entao nao ha __dirname.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'pdf');

/** Caminhos usuais do Chrome no Windows, do mais provavel ao menos. */
const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
];

function findChrome() {
  const found = CANDIDATES.find((candidate) => candidate && fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      'Chrome nao encontrado. Ajuste CANDIDATES em docs/api/build.js com o caminho da sua instalacao.',
    );
  }
  return found;
}

/** file:// com as barras e o escape que o Chrome espera. */
function fileUrl(absolute) {
  return `file:///${absolute.replace(/\\/g, '/').replace(/ /g, '%20')}`;
}

function main() {
  const chrome = findChrome();
  const filter = process.argv[2];

  const pages = fs
    .readdirSync(HERE)
    .filter((name) => name.endsWith('.html'))
    .filter((name) => (filter ? name.startsWith(filter) : true))
    .sort();

  if (pages.length === 0) {
    console.log(filter ? `Nenhum HTML comecando com "${filter}".` : 'Nenhum HTML nesta pasta.');
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });

  for (const page of pages) {
    const pdf = path.join(OUT, page.replace(/\.html$/, '.pdf'));

    execFileSync(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        // Sem isto o Chrome nao le o CSS ao lado do HTML sob file://.
        '--allow-file-access-from-files',
        '--no-pdf-header-footer',
        '--virtual-time-budget=4000',
        `--print-to-pdf=${pdf}`,
        fileUrl(path.join(HERE, page)),
      ],
      { stdio: 'pipe' },
    );

    const kb = Math.round(fs.statSync(pdf).size / 1024);
    console.log(`${page}  ->  pdf/${path.basename(pdf)}  (${kb} KB)`);
  }
}

main();
