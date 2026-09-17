import { Check, Monitor, Moon, RotateCw, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Esqueleto, Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { ambiente } from '@/constants/ambiente';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useTema } from '@/providers/ProvedorTema';
import { sistemaService } from '@/services';
import { devolverFoco } from '@/utils/foco';
import { formatarInstanteCompleto, formatarVersao } from '@/utils/formatacao';
import type { ModoTema } from '@/providers/ProvedorTema';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './PaginaConfiguracoes.module.css';

const opcoesTema: Array<{ valor: ModoTema; rotulo: string; descricao: string; icone: LucideIcon }> = [
  { valor: 'light', rotulo: 'Claro', descricao: 'Ideal para ambientes bem iluminados', icone: Sun },
  { valor: 'dark', rotulo: 'Escuro', descricao: 'Menos brilho para uso noturno', icone: Moon },
  { valor: 'system', rotulo: 'Sistema', descricao: 'Acompanha a preferência do dispositivo', icone: Monitor },
];

function DescricaoVersao({ versao, dataLancamento }: { versao: string; dataLancamento: string | null }) {
  const data = dataLancamento ? formatarInstanteCompleto(dataLancamento) : null;

  return (
    <>
      <span className={juntarClasses(styles.versionNumber, 'tabular')}>{formatarVersao(versao)}</span>
      {data ? <span className={styles.versionMeta}>Lançada em {data}</span> : null}
    </>
  );
}

function LinhaVersao({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <dt>{nome}</dt>
      <dd className={styles.versionValue}>{children}</dd>
    </div>
  );
}

export function PaginaConfiguracoes() {
  const { modo, definirModo } = useTema();
  const versaoApi = useDadosAssincronos((signal) => sistemaService.buscarVersao(signal), []);

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
            descricao="Definida por variável de ambiente, no build ou ao subir o container"
          />
          <CorpoPainel>
            <dl className={styles.details}>
              <div className={styles.detailRow}>
                <dt>Endereço</dt>
                <dd className="tabular">{ambiente.urlApi}</dd>
              </div>
            </dl>
          </CorpoPainel>
        </Painel>

        <Painel>
          <CabecalhoPainel titulo="Versões" />
          <CorpoPainel>
            <dl className={styles.details}>
              <LinhaVersao nome="API">
                {versaoApi.dados ? (
                  <DescricaoVersao versao={versaoApi.dados.versao} dataLancamento={versaoApi.dados.dataLancamento} />
                ) : versaoApi.carregando ? (
                  <>
                    <Esqueleto largura={180} altura={14} />
                    <span className="visually-hidden">Consultando a versão da API</span>
                  </>
                ) : (
                  <>
                    <span className={styles.versionMeta}>Não foi possível consultar</span>
                    <Botao
                      variante="ghost"
                      tamanho="sm"
                      icone={RotateCw}
                      className={styles.retry}
                      onClick={(evento) => {
                        devolverFoco(evento.currentTarget);
                        versaoApi.recarregar();
                      }}
                    >
                      Tentar de novo
                    </Botao>
                  </>
                )}
              </LinhaVersao>
              <LinhaVersao nome="Web">
                {ambiente.versao ? (
                  <DescricaoVersao versao={ambiente.versao} dataLancamento={ambiente.dataLancamento} />
                ) : (
                  <span className={styles.versionMeta}>Versão de desenvolvimento</span>
                )}
              </LinhaVersao>
            </dl>
          </CorpoPainel>
        </Painel>
      </div>
    </>
  );
}
