import Stripe from "stripe"

export type Plan = "free" | "starter" | "creator" | "pro" | "business"

export const PLANS: Record<
  Plan,
  {
    name: string
    credits: number
    priceGBP: number
    annualPriceGBP: number
    priceId: string | null
    annualPriceId: string | null
    description: string
  }
> = {
  free: {
    name: "Free",
    credits: 10,
    priceGBP: 0,
    annualPriceGBP: 0,
    priceId: null,
    annualPriceId: null,
    description: "10 credits to get started",
  },
  starter: {
    name: "Starter",
    credits: 75,
    priceGBP: 9,
    annualPriceGBP: 7,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? null,
    description: "75 credits refreshed monthly",
  },
  creator: {
    name: "Creator",
    credits: 200,
    priceGBP: 19,
    annualPriceGBP: 15,
    priceId: process.env.STRIPE_CREATOR_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID ?? null,
    description: "200 credits, unlimited books",
  },
  pro: {
    name: "Pro",
    credits: 500,
    priceGBP: 39,
    annualPriceGBP: 31,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? null,
    description: "500 credits, priority AI",
  },
  business: {
    name: "Business",
    credits: 1500,
    priceGBP: 79,
    annualPriceGBP: 63,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID ?? null,
    description: "1,500 credits, team & API",
  },
}

/** All paid plan keys in tier order */
export const PAID_PLANS: Plan[] = ["starter", "creator", "pro", "business"]

export function priceIdToPlan(priceId: string): Plan {
  if (!priceId) return "free"
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID || priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE_ID) return "starter"
  if (priceId === process.env.STRIPE_CREATOR_PRICE_ID || priceId === process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID) return "creator"
  if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) return "pro"
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID || priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID) return "business"
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
