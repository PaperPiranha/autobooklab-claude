import Stripe from "stripe"

export type Plan = "free" | "starter" | "pro"

export const PLANS: Record<
  Plan,
  { name: string; credits: number; priceGBP: number; priceId: string | null; description: string }
> = {
  free: {
    name: "Free",
    credits: 10,
    priceGBP: 0,
    priceId: null,
    description: "10 credits to get started",
  },
  starter: {
    name: "Starter",
    credits: 50,
    priceGBP: 9,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
    description: "50 credits refreshed monthly",
  },
  pro: {
    name: "Pro",
    credits: 200,
    priceGBP: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    description: "200 credits refreshed monthly",
  },
}

export function priceIdToPlan(priceId: string): Plan {
  if (priceId && priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter"
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro"
  return "free"
}

// Lazy singleton — only instantiated when STRIPE_SECRET_KEY is present at runtime
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured")
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" })
  }
  return _stripe
}
