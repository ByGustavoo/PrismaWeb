type ClassValue = string | false | null | undefined;

/** Junta classes condicionalmente, ignorando valores vazios. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
