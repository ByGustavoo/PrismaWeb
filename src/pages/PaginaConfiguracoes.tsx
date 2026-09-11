import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CabecalhoPagina } from '@/components/layout';
import { Selo, Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { ambiente } from '@/constants/ambiente';
import { useTema } from '@/providers/ProvedorTema';
import type { ModoTema } from '@/providers/ProvedorTema';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './PaginaConfiguracoes.module.css';

const opcoesTema: Array<{ valor: ModoTema; rotulo: string; descricao: string; icone: LucideIcon }> = [
  { valor: 'light', rotulo: 'Claro', descricao: 'Ideal para ambientes bem iluminados', icone: Sun },
  { valor: 'dark', rotulo: 'Escuro', descricao: 'Menos brilho para uso noturno', icone: Moon },
  { valor: 'system', rotulo: 'Sistema', descricao: 'Acompanha a preferência do dispositivo', icone: Monitor },
];

export function PaginaConfiguracoes() {
  const { modo, definirModo } = useTema();

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Preferências da aplicação e informações do ambiente" />

      <div className={styles.stack}>
        <Painel>
          <CabecalhoPainel titulo="Aparência" descricao="Escolha como a interface deve ser exibida" />
          <CorpoPainel>
            <div className={styles.themeGrid} role="radiogroup" aria-label="Tema da interface">
              {opcoesTema.map((option) => {
                const Icon = option.icone;
                const selected = modo === option.valor;

                return (
                  <button
                    key={option.valor}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={juntarClasses(styles.themeOption, selected && styles.themeOptionSelected)}
                    onClick={() => definirModo(option.valor)}
                  >
                    <span className={styles.themeIcon} aria-hidden="true">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className={styles.themeText}>
                      <span className={styles.themeLabel}>{option.rotulo}</span>
                      <span className={styles.themeDescription}>{option.descricao}</span>
                    </span>
                    {selected ? <Check className={styles.check} size={16} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </CorpoPainel>
        </Painel>

        <Painel>
          <CabecalhoPainel
            titulo="Conexão com a API"
            descricao="Configurada por variáveis de ambiente, sem URLs espalhadas pelo código"
          />
          <CorpoPainel>
            <dl className={styles.details}>
              <div className={styles.detailRow}>
                <dt>VITE_API_URL</dt>
                <dd className="tabular">{ambiente.urlApi}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Origem dos dados</dt>
                <dd>
                  {ambiente.usarMocks ? (
                    <Selo tom="warning" ponto>
                      Dados mockados
                    </Selo>
                  ) : (
                    <Selo tom="positive" ponto>
                      API real
                    </Selo>
                  )}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Latência simulada</dt>
                <dd className="tabular">{ambiente.atrasoMocks} ms</dd>
              </div>
            </dl>
          </CorpoPainel>
        </Painel>
      </div>
    </>
  );
}
