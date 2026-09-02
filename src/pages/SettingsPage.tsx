import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { env } from '@/constants/env';
import { useTheme } from '@/providers/ThemeProvider';
import type { ThemeMode } from '@/providers/ThemeProvider';
import { cn } from '@/utils/cn';
import styles from './SettingsPage.module.css';

const themeOptions: Array<{ value: ThemeMode; label: string; description: string; icon: LucideIcon }> = [
  { value: 'light', label: 'Claro', description: 'Ideal para ambientes bem iluminados', icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Menos brilho para uso noturno', icon: Moon },
  { value: 'system', label: 'Sistema', description: 'Acompanha a preferencia do dispositivo', icon: Monitor },
];

export function SettingsPage() {
  const { mode, setMode } = useTheme();

  return (
    <>
      <PageHeader title="Configuracoes" description="Preferencias da aplicacao e informacoes do ambiente" />

      <div className={styles.stack}>
        <Card>
          <CardHeader title="Aparencia" description="Escolha como a interface deve ser exibida" />
          <CardBody>
            <div className={styles.themeGrid} role="radiogroup" aria-label="Tema da interface">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const selected = mode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={cn(styles.themeOption, selected && styles.themeOptionSelected)}
                    onClick={() => setMode(option.value)}
                  >
                    <span className={styles.themeIcon} aria-hidden="true">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className={styles.themeText}>
                      <span className={styles.themeLabel}>{option.label}</span>
                      <span className={styles.themeDescription}>{option.description}</span>
                    </span>
                    {selected ? <Check className={styles.check} size={16} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Conexao com a API"
            description="Configurada por variaveis de ambiente, sem URLs espalhadas pelo codigo"
          />
          <CardBody>
            <dl className={styles.details}>
              <div className={styles.detailRow}>
                <dt>VITE_API_URL</dt>
                <dd className="tabular">{env.apiUrl}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Origem dos dados</dt>
                <dd>
                  {env.useMocks ? (
                    <Badge tone="warning" dot>
                      Dados mockados
                    </Badge>
                  ) : (
                    <Badge tone="positive" dot>
                      API real
                    </Badge>
                  )}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Latencia simulada</dt>
                <dd className="tabular">{env.mockDelay} ms</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
