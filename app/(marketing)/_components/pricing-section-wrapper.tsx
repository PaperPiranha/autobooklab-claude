import { PLANS } from "@/lib/stripe"
import { PLAN_FEATURES } from "@/lib/plans"
import { PricingSection } from "./pricing-section"

// Server component that reads PLANS (which uses process.env) and passes serializable data to the client PricingSection
export function PricingSectionWrapper() {
  const plansData = Object.fromEntries(
    Object.entries(PLANS).map(([key, plan]) => [
      key,
      {
        name: plan.name,
        credits: plan.credits,
        priceGBP: plan.priceGBP,
        annualPriceGBP: plan.annualPriceGBP,
        description: plan.description,
      },
    ])
  ) as Parameters<typeof PricingSection>[0]["plans"]

  return <PricingSection plans={plansData} features={PLAN_FEATURES} />
}
