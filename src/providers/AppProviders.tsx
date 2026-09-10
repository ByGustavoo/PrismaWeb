import type { ReactNode } from 'react';
import { PeriodProvider } from './PeriodProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PeriodProvider>{children}</PeriodProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
