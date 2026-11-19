/** Backend wallet amounts are USD. The UI shows 100 credits per dollar. */
export const CREDITS_PER_USD = 100;

export function usdToCredits(usdAmount: number): number {
  return usdAmount * CREDITS_PER_USD;
}

export function formatCredits(usdAmount: number): string {
  const credits = usdToCredits(usdAmount);
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(credits);
  const unit = Math.abs(credits) === 1 ? 'credit' : 'credits';
  return `${formatted} ${unit}`;
}
