export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("tr-TR").format(num);
}

export function formatPrice(amount: number): string {
  return formatCurrency(amount);
}

export function formatTL(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return formatCurrency(amount);
}
