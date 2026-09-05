import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';
import styles from './NotFoundPage.module.css';

/*
 * Quem erra o endereco quase sempre queria uma das telas de entrada. Oferecer
 * quatro destinos concretos custa uma linha e evita que a saida da tela seja
 * so o botao de voltar.
 */
const shortcuts = [
  { label: 'Lançamentos', to: paths.transactions },
  { label: 'Contas', to: paths.accounts },
  { label: 'Cartões', to: paths.cards },
  { label: 'Relatórios', to: paths.reports },
];

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * `default` e a chave da primeira entrada do historico: quem colou a URL
   * errada direto na barra do navegador nao tem pagina anterior dentro do app,
   * e um botao "Voltar" ali ou nao faria nada ou jogaria a pessoa para fora.
   */
  const canGoBack = location.key !== 'default';

  return (
    <section className={styles.page}>
      <Card className={styles.panel} padding="none">
        <p className={cn(styles.code, 'list-item-in')} style={{ '--i': 0 } as CSSProperties} aria-hidden="true">
          4<span className={styles.zero}>0</span>4
        </p>

        <h1 className={cn(styles.title, 'list-item-in')} style={{ '--i': 1 } as CSSProperties}>
          Página não encontrada
        </h1>

        <p className={cn(styles.description, 'list-item-in')} style={{ '--i': 2 } as CSSProperties}>
          O endereço <code className={styles.path}>{location.pathname}</code> não corresponde a nenhuma tela do
          Prisma. Ele pode ter sido digitado com um erro ou pertencer a uma tela que mudou de lugar.
        </p>

        <div className={cn(styles.actions, 'list-item-in')} style={{ '--i': 3 } as CSSProperties}>
          <Button icon={LayoutDashboard} onClick={() => navigate(paths.dashboard)}>
            Ir para o dashboard
          </Button>
          {canGoBack ? (
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Voltar
            </Button>
          ) : null}
        </div>

        <nav className={cn(styles.shortcuts, 'list-item-in')} style={{ '--i': 4 } as CSSProperties} aria-label="Atalhos">
          <span className={styles.shortcutsLabel}>Talvez você procure</span>
          <ul className={styles.links}>
            {shortcuts.map((shortcut) => (
              <li key={shortcut.to}>
                <Link className={styles.link} to={shortcut.to}>
                  {shortcut.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Card>
    </section>
  );
}
