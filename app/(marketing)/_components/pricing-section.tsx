"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimateOnScroll } from "./animate-on-scroll"
import type { Plan } from "@/lib/stripe"
import type { PlanFeatures } from "@/lib/plans"

type PlanData = {
  name: string
  credits: number
  priceGBP: number
  annualPriceGBP: number
  description: string
}

interface PricingSectionProps {
  plans: Record<Plan, PlanData>
  features: Record<Plan, PlanFeatures>
}

const PLAN_ORDER: Plan[] = ["free", "starter", "creator", "pro", "business"]

function getFeatureList(plan: Plan, features: PlanFeatures, credits: number): string[] {
  const list: string[] = [`${credits.toLocaleString()} AI credits/month`]

  if (features.maxBooks === -1) list.push("Unlimited books")
  else list.push(`Up to ${features.maxBooks} books`)

  list.push(features.exports.includes("epub") ? "PDF & EPUB export" : "PDF export only")

  if (features.aiChat) list.push("AI chat assistant")
  if (features.aiImageGeneration) list.push("AI cover image generation")
  if (features.batchGenerate) list.push("Batch chapter generation")
  if (features.priorityAi) list.push("Priority AI processing")
  if (features.customBranding) list.push("Custom branding")
  if (features.publicProfile) list.push("Public author profile")
  if (features.teamMembers > 0) list.push(`${features.teamMembers} team members`)
  if (features.apiAccess) list.push("API access")

  return list
}

export function PricingSection({ plans, features }: PricingSectionProps) {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need more. All plans include the visual editor and AI writing tools.
            </p>

            {/* Monthly/Annual toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/50 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  !annual
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  annual
                    ? "bg-orange-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <span className="ml-1.5 text-xs opacity-80">Save 20%</span>
              </button>
            </div>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3">
          {PLAN_ORDER.map((planKey) => {
            const plan = plans[planKey]
            const feat = features[planKey]
            const isPopular = planKey === "creator"
            const price = annual ? plan.annualPriceGBP : plan.priceGBP
            const featureList = getFeatureList(planKey, feat, plan.credits)

            return (
              <AnimateOnScroll key={planKey}>
                <div
                  className={cn(
                    "relative flex flex-col h-full rounded-xl border p-6 transition-colors",
                    isPopular
                      ? "border-orange-500/50 bg-orange-500/[0.03] shadow-lg shadow-orange-500/5"
                      : "border-border bg-card/50 hover:border-border/80"
                  )}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white hover:bg-orange-500 border-0">
                      Most Popular
                    </Badge>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold">
                      {price === 0 ? "Free" : `£${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground ml-1">/mo</span>
                    )}
                  </div>

                  <Button
                    asChild
                    className={cn(
                      "w-full mb-6",
                      isPopular
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : ""
                    )}
                    variant={isPopular ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href="/sign-up">
                      {price === 0 ? "Get Started" : "Start Free Trial"}
                    </Link>
                  </Button>

                  <ul className="space-y-2.5 text-sm flex-1">
                    {featureList.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}
