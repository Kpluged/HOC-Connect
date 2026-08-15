export type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}
