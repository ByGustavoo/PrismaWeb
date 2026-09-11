import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Aplicacao from './Aplicacao';
import './styles/global.css';

const raiz = document.getElementById('root');

if (!raiz) {
  throw new Error('Elemento #root não encontrado no index.html.');
}

createRoot(raiz).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
);
