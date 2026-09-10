export function normalizeRussianSearch(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function matchesRussianSearch(query: string, fields: readonly string[]): boolean {
  const normalizedQuery = normalizeRussianSearch(query);
  if (!normalizedQuery) return true;
  return normalizeRussianSearch(fields.join(' ')).includes(normalizedQuery);
}
