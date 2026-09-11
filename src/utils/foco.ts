const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ESPERA_MAXIMA_RETORNO_FOCO_MS = 20_000;

export function focaveisVisiveis(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS)].filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  );
}

export function manterTabDentro(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const focusable = focaveisVisiveis(container);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (!container.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function focarConteudoPrincipal(): void {
  document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
}

export function devolverFoco(opener: HTMLElement | null): void {
  if (!opener?.isConnected || opener === document.body) {
    focarConteudoPrincipal();
    return;
  }

  opener.focus();

  const observer = new MutationObserver(() => {
    const focused = document.activeElement;
    if (focused !== opener && focused !== document.body) {
      stop();
      return;
    }
    if (focused !== document.body) return;

    if (opener.isConnected) {
      opener.focus();
    } else {
      stop();
      focarConteudoPrincipal();
    }
  });
  const timer = window.setTimeout(stop, ESPERA_MAXIMA_RETORNO_FOCO_MS);

  function stop() {
    observer.disconnect();
    window.clearTimeout(timer);
    document.removeEventListener('pointerdown', stop, true);
  }

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('pointerdown', stop, true);
}
