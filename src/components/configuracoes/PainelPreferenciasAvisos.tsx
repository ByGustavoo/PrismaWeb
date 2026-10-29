import { useCallback, useEffect, useRef, useState } from 'react';
import { BellRing, Check, RotateCw } from 'lucide-react';
import { Botao, CampoSelecao, CabecalhoPainel, CorpoPainel, EstadoVazio, Esqueleto, IndicadorGiratorio, Interruptor, Painel } from '@/components/ui';
import {
  gruposTiposAviso,
  opcoesAntecedenciaAviso,
  opcoesLembreteAviso,
  opcoesLimiteCartaoAviso,
} from '@/constants/avisos';
import type { ControleTipoAviso } from '@/constants/avisos';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useAvisos } from '@/providers/ProvedorAvisos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { avisosService } from '@/services';
import type { Opcao, PreferenciasAvisosDTO, TipoAviso } from '@/types';
import styles from './PainelPreferenciasAvisos.module.css';

type CampoNumerico = 'diasAntecedencia' | 'percentualLimiteCartao' | 'diasLembreteInvestimento' | 'diasLembreteMeta';

const controles: Record<ControleTipoAviso, { campo: CampoNumerico; opcoes: Opcao[]; rotulo: string }> = {
  limiteCartao: { campo: 'percentualLimiteCartao', opcoes: opcoesLimiteCartaoAviso, rotulo: 'Avisar do limite do cartão' },
  lembreteInvestimento: {
    campo: 'diasLembreteInvestimento',
    opcoes: opcoesLembreteAviso,
    rotulo: 'Lembrar de atualizar investimentos',
  },
  lembreteMeta: { campo: 'diasLembreteMeta', opcoes: opcoesLembreteAviso, rotulo: 'Lembrar de registrar preço das metas' },
};

type EstadoGravacao = 'parado' | 'salvando' | 'salvo';

export function PainelPreferenciasAvisos() {
  const toast = useNotificacoes();
  const { versaoAvisos, atualizarAvisos } = useAvisos();
  const [preferences, setPreferences] = useState<PreferenciasAvisosDTO | null>(null);
  const [saveState, setSaveState] = useState<EstadoGravacao>('parado');
  const [restoring, setRestoring] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  const fetchPreferences = useCallback((signal: AbortSignal) => avisosService.buscarPreferencias(signal), []);
  const loaded = useDadosAssincronos(fetchPreferences);

  const fetchAlerts = useCallback((signal: AbortSignal) => avisosService.listar(signal), []);
  const alerts = useDadosAssincronos(fetchAlerts, [versaoAvisos]);
  const setAside = (alerts.dados ?? []).filter((alert) => alert.estado !== 'NOVO').length;

  useEffect(() => {
    if (loaded.dados) setPreferences(loaded.dados);
  }, [loaded.dados]);

  const save = (next: PreferenciasAvisosDTO, previous: PreferenciasAvisosDTO) => {
    setPreferences(next);
    setSaveState('salvando');
    pending.current += 1;

    queue.current = queue.current
      .then(() => avisosService.atualizarPreferencias(next))
      .then(() => {
        atualizarAvisos();
      })
      .catch((causa: unknown) => {
        setPreferences(previous);
        toast.erro('Não foi possível salvar as preferências de avisos.', causa);
      })
      .finally(() => {
        pending.current -= 1;
        if (pending.current === 0) setSaveState('salvo');
      });
  };

  const toggleType = (tipo: TipoAviso, ligado: boolean) => {
    if (!preferences) return;
    const tiposDesligados = ligado
      ? preferences.tiposDesligados.filter((item) => item !== tipo)
      : [...preferences.tiposDesligados, tipo];
    save({ ...preferences, tiposDesligados }, preferences);
  };

  const changeNumber = (campo: CampoNumerico, valor: string) => {
    if (!preferences) return;
    const numero = Number(valor);
    if (preferences[campo] === numero) return;
    save({ ...preferences, [campo]: numero }, preferences);
  };

  const restoreAll = async () => {
    setRestoring(true);
    try {
      await avisosService.devolverTodosAosNovos();
      toast.sucesso(
        'Avisos devolvidos ao sino!',
        setAside === 1 ? '1 aviso lido ou adiado voltou aos novos.' : `${setAside} avisos lidos ou adiados voltaram aos novos.`,
      );
      atualizarAvisos();
    } catch (causa) {
      toast.erro('Não foi possível devolver os avisos ao sino.', causa);
    } finally {
      setRestoring(false);
    }
  };

  const enabled = (tipo: TipoAviso) => !preferences?.tiposDesligados.includes(tipo);

  return (
    <Painel>
      <CabecalhoPainel
        titulo="Avisos"
        descricao="Escolha o que aparece no sino e com quanta antecedência"
        acao={
          <span className={styles.saveState} aria-live="polite">
            {saveState === 'salvando' ? (
              <>
                <IndicadorGiratorio tamanho={13} />
                Salvando
              </>
            ) : saveState === 'salvo' ? (
              <>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                Alterações salvas
              </>
            ) : null}
          </span>
        }
      />
      <CorpoPainel>
        {loaded.erro && !preferences ? (
          <EstadoVazio
            titulo="Não foi possível carregar as preferências"
            descricao={loaded.erro.message}
            acao={
              <Botao variante="secondary" icone={RotateCw} onClick={loaded.recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        ) : !preferences ? (
          <div className={styles.skeleton} aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Esqueleto key={index} largura={index % 2 === 0 ? 260 : 200} altura={18} />
            ))}
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.groups}>
              {gruposTiposAviso.map((group) => {
                const anyEnabled = group.itens.some((item) => enabled(item.tipo));

                return (
                  <section key={group.titulo} className={styles.group} aria-label={group.titulo}>
                    <header className={styles.groupHeader}>
                      <h3 className={styles.groupTitle}>{group.titulo}</h3>
                      {group.usaAntecedencia ? (
                        <CampoSelecao
                          opcoes={opcoesAntecedenciaAviso}
                          value={String(preferences.diasAntecedencia)}
                          onChange={(valor) => changeNumber('diasAntecedencia', valor)}
                          tamanho="sm"
                          larguraPelaMaiorOpcao
                          prefixo="Avisar:"
                          disabled={!anyEnabled}
                          aria-label="Antecedência dos avisos de pagamentos e agenda"
                        />
                      ) : null}
                    </header>

                    <ul className={styles.items}>
                      {group.itens.map((item) => {
                        const on = enabled(item.tipo);
                        const control = item.controle ? controles[item.controle] : null;

                        return (
                          <li key={item.tipo} className={styles.item}>
                            <Interruptor
                              checked={on}
                              onChange={(ligado) => toggleType(item.tipo, ligado)}
                              rotulo={item.rotulo}
                              {...(item.dica ? { dica: item.dica } : {})}
                              className={styles.switch}
                            />
                            {control ? (
                              <CampoSelecao
                                opcoes={control.opcoes}
                                value={String(preferences[control.campo])}
                                onChange={(valor) => changeNumber(control.campo, valor)}
                                tamanho="sm"
                                larguraPelaMaiorOpcao
                                disabled={!on}
                                aria-label={control.rotulo}
                                className={styles.itemControl}
                              />
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              <div className={styles.restore}>
                <span className={styles.restoreIcon} aria-hidden="true">
                  <BellRing size={16} strokeWidth={2} />
                </span>
                <div className={styles.restoreText}>
                  <span className={styles.restoreTitle}>Avisos lidos e adiados</span>
                  <span className={styles.restoreDescription}>
                    {setAside === 0
                      ? 'Nenhum aviso lido ou adiado no momento.'
                      : setAside === 1
                        ? '1 aviso está fora dos novos. Ele volta sozinho quando a situação mudar.'
                        : `${setAside} avisos estão fora dos novos. Eles voltam sozinhos quando a situação mudar.`}
                  </span>
                </div>
                <Botao
                  variante="secondary"
                  tamanho="sm"
                  icone={RotateCw}
                  onClick={restoreAll}
                  carregando={restoring}
                  disabled={setAside === 0 || restoring}
                >
                  Mostrar de novo
                </Botao>
              </div>
            </div>
          </div>
        )}
      </CorpoPainel>
    </Painel>
  );
}
