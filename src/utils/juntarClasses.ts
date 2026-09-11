type ValorClasse = string | false | null | undefined;

export function juntarClasses(...values: ValorClasse[]): string {
  return values.filter(Boolean).join(' ');
}
