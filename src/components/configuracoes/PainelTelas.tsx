import { Check, Eye, EyeOff, RotateCw } from 'lucide-react';
import { Botao, CabecalhoPainel, CorpoPainel, EstadoVazio, Esqueleto, IndicadorGiratorio, Interruptor, Painel } from '@/components/ui';
import { gruposTelas, rotuloTela } from '@/constants/telas';
import { useTelas } from '@/providers/ProvedorTelas';
import type { Tela } from '@/types';
import styles from './PainelTelas.module.css';

const ordemDasTelas = gruposTelas.flatMap((grupo) => grupo.telas.map((opcao) => opcao.tela));

function listarRotulos(telas: Tela[]): string {
  const rotulos = [...telas]
    .sort((a, b) => ordemDasTelas.indexOf(a) - ordemDasTelas.indexOf(b))
    .map((tela) => rotuloTela[tela]);
  const ultimo = rotulos.pop();
  return rotulos.length > 0 ? `${rotulos.join(', ')} e ${ultimo}` : (ultimo ?? '');
}

export function PainelTelas() {
  const { telasOcultas, carregado, erro, estadoGravacao, definirOculta, mostrarTodas, recarregar } = useTelas();
  const quantidade = telasOcultas.length;

  return (
    <Painel>
      <CabecalhoPainel
        titulo="Telas"
        descricao="Desligue uma tela para tirá-la do menu e dos atalhos, sem apagar dado nenhum"
        acao={
          <span className={styles.saveState} aria-live="polite">
            {estadoGravacao === 'salvando' ? (
              <>
                <IndicadorGiratorio tamanho={13} />
                Salvando
              </>
            ) : estadoGravacao === 'salvo' ? (
              <>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                Alterações salvas
              </>
            ) : null}
          </span>
        }
      />
      <CorpoPainel>
        {!carregado ? (
          <div className={styles.skeleton} aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Esqueleto key={index} largura={index % 2 === 0 ? 220 : 160} altura={18} />
            ))}
          </div>
        ) : erro ? (
          <EstadoVazio
            titulo="Não foi possível carregar as telas"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" icone={RotateCw} onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        ) : (
          <div className={styles.layout}>
            <div className={styles.groups}>
              {gruposTelas.map((grupo) => (
                <section key={grupo.titulo} className={styles.group} aria-label={grupo.titulo}>
                  <h3 className={styles.groupTitle}>{grupo.titulo}</h3>
                  <ul className={styles.items}>
                    {grupo.telas.map((opcao) => (
                      <li key={opcao.tela} className={styles.item}>
                        <Interruptor
                          checked={!telasOcultas.includes(opcao.tela)}
                          onChange={(visivel) => definirOculta(opcao.tela, !visivel)}
                          rotulo={opcao.rotulo}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <div className={styles.summary}>
                <span className={styles.summaryIcon} aria-hidden="true">
                  {quantidade > 0 ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </span>
                <div className={styles.summaryText}>
                  <span className={styles.summaryTitle}>
                    {quantidade === 0
                      ? 'Todas as telas no menu'
                      : quantidade === 1
                        ? '1 tela oculta'
                        : `${quantidade} telas ocultas`}
                  </span>
                  <span className={styles.summaryDescription}>
                    {quantidade === 0
                      ? 'Dashboard e Configurações ficam sempre visíveis.'
                      : `${listarRotulos(telasOcultas)} ${quantidade === 1 ? 'está fora' : 'estão fora'} do menu. Os dados continuam guardados.`}
                  </span>
                </div>
                <Botao variante="secondary" tamanho="sm" icone={Eye} onClick={mostrarTodas} disabled={quantidade === 0}>
                  Mostrar todas
                </Botao>
              </div>
            </div>
          </div>
        )}
      </CorpoPainel>
    </Painel>
  );
}
