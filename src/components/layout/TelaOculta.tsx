import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import { Botao, EstadoVazio, Painel } from '@/components/ui';
import { rotuloTela } from '@/constants/telas';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { useTelas } from '@/providers/ProvedorTelas';
import { caminhos } from '@/routes/caminhos';
import type { Tela } from '@/types';
import { CabecalhoPagina } from './CabecalhoPagina';
import styles from './TelaOculta.module.css';

export function TelaOculta({ tela }: { tela: Tela }) {
  const navigate = useNavigate();
  const toast = useNotificacoes();
  const { definirOculta } = useTelas();
  const rotulo = rotuloTela[tela];

  return (
    <>
      <CabecalhoPagina titulo={rotulo} descricao="Tela oculta em Configurações" />

      <Painel>
        <EstadoVazio
          icone={EyeOff}
          titulo="Esta tela está oculta"
          descricao="Você a tirou do menu em Configurações. Nada foi apagado: os dados continuam guardados e aparecem de novo assim que ela voltar."
          acao={
            <div className={styles.actions}>
              <Botao
                icone={Eye}
                onClick={(evento) => {
                  const conteudo = evento.currentTarget.closest('main');
                  definirOculta(tela, false);
                  toast.sucesso(`${rotulo} voltou ao menu!`);
                  conteudo?.focus({ preventScroll: true });
                }}
              >
                Mostrar de novo
              </Botao>
              <Botao variante="secondary" icone={LayoutDashboard} onClick={() => navigate(caminhos.dashboard)}>
                Ir para o Dashboard
              </Botao>
            </div>
          }
        />
      </Painel>
    </>
  );
}
