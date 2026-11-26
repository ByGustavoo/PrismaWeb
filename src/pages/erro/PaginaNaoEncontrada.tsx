import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { CodigoDeErro, ConteudoDaMarcaDeErro, MolduraDeErro, classeDaMarcaDeErro } from '@/components/erro';
import { Botao } from '@/components/ui';
import { NOME_APLICACAO } from '@/constants/aplicacao';
import { useTelas } from '@/providers/ProvedorTelas';
import { caminhos } from '@/routes/caminhos';
import styles from './PaginaNaoEncontrada.module.css';

const atalhos = [
  { label: 'Lançamentos', to: caminhos.lancamentos },
  { label: 'Contas', to: caminhos.contas },
  { label: 'Cartões', to: caminhos.cartoes },
  { label: 'Relatórios', to: caminhos.relatorios },
];

export function PaginaNaoEncontrada() {
  const navigate = useNavigate();
  const location = useLocation();
  const { estaOculto } = useTelas();

  const canGoBack = location.key !== 'default';
  const visibleShortcuts = atalhos.filter((shortcut) => !estaOculto(shortcut.to));

  useEffect(() => {
    const previous = document.title;
    document.title = `Página não encontrada — ${NOME_APLICACAO}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <MolduraDeErro
      marca={
        <Link className={classeDaMarcaDeErro} to={caminhos.dashboard} aria-label={`${NOME_APLICACAO}, ir para o início`}>
          <ConteudoDaMarcaDeErro />
        </Link>
      }
      codigo={<CodigoDeErro antes="4" destaque="0" depois="4" />}
      titulo="Página não encontrada"
      descricao={
        <>
          O endereço <code className={styles.path}>{location.pathname}</code> não corresponde a nenhuma tela do
          Prisma. Ele pode ter sido digitado com um erro ou pertencer a uma tela que mudou de lugar.
        </>
      }
      acoes={
        <>
          <Botao icone={LayoutDashboard} onClick={() => navigate(caminhos.dashboard)}>
            Ir para o dashboard
          </Botao>
          {canGoBack ? (
            <Botao variante="secondary" icone={ArrowLeft} onClick={() => navigate(-1)}>
              Voltar
            </Botao>
          ) : null}
        </>
      }
      rodape={
        visibleShortcuts.length > 0 ? (
          <nav className={styles.shortcuts} aria-label="Atalhos">
            <span className={styles.shortcutsLabel}>Talvez você procure</span>
            <ul className={styles.links}>
              {visibleShortcuts.map((shortcut) => (
                <li key={shortcut.to}>
                  <Link className={styles.link} to={shortcut.to}>
                    {shortcut.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null
      }
    />
  );
}
