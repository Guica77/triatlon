export const BILLING_PLANS = {
  athlete: { priceEnv: 'STRIPE_PRICE_ATHLETE', label: 'Atleta', amount: '5 €/mes' },
  coach: { priceEnv: 'STRIPE_PRICE_COACH', label: 'Entrenador', amount: '30 €/mes' },
} as const;

export type BillingPlan = keyof typeof BILLING_PLANS;

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === 'athlete' || value === 'coach';
}
