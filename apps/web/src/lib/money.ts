export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(amountMinor / 100);
}
