import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { classePorTipo, iconePorTipo, sinalPorTipo, tomPorTipo, tomPorSituacao } from '@/components/lancamentos/aparencia';
import { Selo, Painel, CorpoPainel, CabecalhoPainel, CorpoTabela, CabecaTabela, Tabela, ContainerTabela, Celula, CelulaCabecalho, LinhaTabela, EstadoVazio } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { rotuloSituacaoLancamento } from '@/constants/lancamentos';
import { caminhos } from '@/routes/caminhos';
import type { LancamentoDTO } from '@/types';
import { formatarDataCurta } from '@/utils/formatacao';
import styles from './UltimosLancamentos.module.css';

interface UltimosLancamentosProps {
  lancamentos: LancamentoDTO[];
  descricao: string;
}

export function UltimosLancamentos({ lancamentos, descricao }: UltimosLancamentosProps) {
  return (
    <Painel espacamento="sm">
      <div className={styles.header}>
        <CabecalhoPainel titulo="Últimos lançamentos" descricao={descricao} />
        <Link className={styles.link} to={caminhos.lancamentos}>
          Ver todos
        </Link>
      </div>

      <CorpoPainel>
        {lancamentos.length === 0 ? (
          <EstadoVazio
            icone={Receipt}
            titulo="Nenhum lançamento neste período"
            descricao="Receitas, despesas e transferências registradas aparecem aqui, das mais recentes para as mais antigas."
          />
        ) : (
          <ContainerTabela>
            <Tabela>
              <CabecaTabela>
                <LinhaTabela>
                  <CelulaCabecalho>Descrição</CelulaCabecalho>
                  <CelulaCabecalho>Categoria</CelulaCabecalho>
                  <CelulaCabecalho>Conta</CelulaCabecalho>
                  <CelulaCabecalho>Data</CelulaCabecalho>
                  <CelulaCabecalho>Situação</CelulaCabecalho>
                  <CelulaCabecalho numerico>Valor</CelulaCabecalho>
                </LinhaTabela>
              </CabecaTabela>
              <CorpoTabela>
                {lancamentos.map((transaction, index) => (
                  <LinhaLancamento key={transaction.id} lancamento={transaction} indice={index} />
                ))}
              </CorpoTabela>
            </Tabela>
          </ContainerTabela>
        )}
      </CorpoPainel>
    </Painel>
  );
}

interface LinhaLancamentoProps {
  lancamento: LancamentoDTO;
  indice?: number;
}

export function LinhaLancamento({ lancamento, indice = 0 }: LinhaLancamentoProps) {
  const Icon = iconePorTipo[lancamento.tipo];

  return (
    <LinhaTabela interativo className="list-item-in" style={{ '--i': indice } as CSSProperties}>
      <Celula>
        <div className={styles.description}>
          <span className={`${styles.kindIcon} ${styles[classePorTipo[lancamento.tipo]]}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
          {lancamento.descricao}
        </div>
      </Celula>
      <Celula>
        {lancamento.categoria ? (
          <span className={styles.category}>
            <span
              className={styles.categoryDot}
              style={{ backgroundColor: corDaPaleta(lancamento.categoria.tokenCor) }}
              aria-hidden="true"
            />
            {lancamento.categoria.nome}
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        )}
      </Celula>
      <Celula className={styles.muted}>
        {lancamento.nomeContaDestino ? `${lancamento.nomeOrigem} → ${lancamento.nomeContaDestino}` : lancamento.nomeOrigem}
      </Celula>
      <Celula className={`${styles.muted} tabular`}>{formatarDataCurta(lancamento.data)}</Celula>
      <Celula>
        <Selo tom={tomPorSituacao[lancamento.situacao]} ponto>
          {rotuloSituacaoLancamento[lancamento.situacao]}
        </Selo>
      </Celula>
      <Celula numerico>
        <ValorMonetario
          valor={lancamento.valor}
          tom={tomPorTipo[lancamento.tipo]}
          tamanho="sm"
          sinal={sinalPorTipo[lancamento.tipo]}
        />
      </Celula>
    </LinhaTabela>
  );
}
