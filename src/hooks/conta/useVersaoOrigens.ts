import { useSyncExternalStore } from 'react';
import { origensAlteradas } from '@/services/conta/origensAlteradas';

export function useVersaoOrigens(): number {
  return useSyncExternalStore(origensAlteradas.assinar, origensAlteradas.versao);
}
