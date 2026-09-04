import { cn } from '@/utils/cn';
import styles from './ViewToggle.module.css';

/** Como a listagem desenha cada lancamento: linha de tabela ou cartao. */
export type TransactionsView = 'table' | 'cards';

interface ViewToggleProps {
  value: TransactionsView;
  onChange: (view: TransactionsView) => void;
  className?: string;
}

const options: Array<{ value: TransactionsView; label: string; description: string }> = [
  { value: 'table', label: 'Tabela', description: 'Ver os lançamentos como tabela' },
  { value: 'cards', label: 'Cartões', description: 'Ver os lançamentos como cartões' },
];

/**
 * Escolha explicita de densidade da listagem. Ate aqui a tela decidia sozinha
 * pela largura: abaixo de 900px a tabela nao cabe e vira cartao. Isso continua
 * valendo — o que faltava era a escolha de quem esta no desktop e prefere ler
 * cada lancamento inteiro, com observacao e categoria, a percorrer oito colunas.
 *
 * Nas larguras em que so cabe uma das duas formas o controle sai da tela: um
 * seletor com uma opcao viavel so seria um botao que nao faz nada.
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn(styles.group, className)} role="radiogroup" aria-label="Modo de exibição">
      {/*
        O indicador desliza de uma opcao a outra em vez de acender e apagar: o
        movimento e o que diz que as duas sao a mesma lista vista de outro jeito.
      */}
      <span className={styles.indicator} data-view={value} aria-hidden="true" />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.description}
          className={cn(styles.option, value === option.value && styles.selected)}
          onClick={() => onChange(option.value)}
        >
          <StackIcon variant={option.value} />
          <span className={styles.label}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Os dois icones sao o mesmo desenho — tres barras empilhadas — em duas
 * espessuras: linhas finas viram blocos ao engordar. Por isso sao SVG proprio e
 * nao dois icones do lucide, que seriam duas formas sem parentesco. A barra da
 * opcao escolhida cresce ate a espessura cheia; a da outra fica um pouco aquem,
 * e a diferenca sozinha ja separa a ativa da inativa antes mesmo da cor.
 */
function StackIcon({ variant }: { variant: TransactionsView }) {
  return (
    <svg
      className={cn(styles.icon, styles[variant])}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.bar} x="1.5" y="2.5" width="13" height="2" rx="1" />
      <rect className={styles.bar} x="1.5" y="7" width="13" height="2" rx="1" />
      <rect className={styles.bar} x="1.5" y="11.5" width="13" height="2" rx="1" />
    </svg>
  );
}
