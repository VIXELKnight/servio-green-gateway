// Stripe pricing configuration for Servio
export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price_id: "price_1SdJxjBBqKy6E8PpMZcsz08f",
    product_id: "prod_TaUxKd7nC9V8he",
    price: 49,
  },
  professional: {
    name: "Professional",
    price_id: "price_1SdJy0BBqKy6E8PpIyUGyD2Q",
    product_id: "prod_TaUxWjLTJMYkpU",
    price: 149,
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export const getPlanByProductId = (productId: string): PlanKey | null => {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) {
      return key as PlanKey;
    }
  }
  return null;
};
