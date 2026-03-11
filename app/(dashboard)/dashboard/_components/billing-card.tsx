"use client"

import { useState } from "react"
import { Loader2, Sparkles, CreditCard, Zap, Star, ArrowUpRight, Crown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PLANS, PAID_PLANS, type Plan } from "@/lib/stripe"

interface BillingCardProps {
  currentPlan: Plan
  credits: number
  currentPeriodEnd: string | null
}

const PLAN_ICONS: Record<Plan, typeof Sparkles> = {
  free: Sparkles,
  starter: Zap,
  creator: Star,
  pro: Crown,
  business: Building2,
}

const PLAN_COLORS: Record<Plan, string> = {
  free: "text-muted-foreground",
  starter: "text-blue-400",
  creator: "text-violet-400",
  pro: "text-primary",
  business: "text-emerald-400",
}

export function BillingCard({ currentPlan, credits, currentPeriodEnd }: BillingCardProps) {
  const [loading, setLoading] = useState<Plan | "portal" | null>(null)

  async function handleUpgrade(plan: Plan) {
    setLoading(plan)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading("portal")
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  const plan = PLANS[currentPlan]
  const PlanIcon = PLAN_ICONS[currentPlan]
  const creditPct = Math.min(100, Math.round((credits / plan.credits) * 100))

  // Plans available for upgrade (only show higher tiers)
  const planOrder: Plan[] = ["free", "starter", "creator", "pro", "business"]
  const currentIndex = planOrder.indexOf(currentPlan)
  const upgradePlans = PAID_PLANS.filter((p) => planOrder.indexOf(p) > currentIndex)

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Current plan header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <PlanIcon className={cn("h-4 w-4", PLAN_COLORS[currentPlan])} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{plan.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Current plan
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          </div>
        </div>

        {currentPlan !== "free" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-muted-foreground gap-1"
            onClick={handlePortal}
            disabled={loading === "portal"}
          >
            {loading === "portal" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CreditCard className="h-3 w-3" />
            )}
            Manage
          </Button>
        )}
      </div>

      {/* Credits bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">AI credits</span>
          <span className={cn("font-medium tabular-nums", credits <= 5 ? "text-destructive" : "text-foreground")}>
            {credits} / {plan.credits}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              creditPct <= 20 ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${creditPct}%` }}
          />
        </div>
        {currentPeriodEnd && (
          <p className="text-[10px] text-muted-foreground">
            Resets{" "}
            {new Date(currentPeriodEnd).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </p>
        )}
      </div>

      {/* Upgrade plans */}
      {upgradePlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Upgrade
          </p>
          <div className={cn(
            "grid gap-2",
            upgradePlans.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}>
            {upgradePlans.map((p) => {
              const planDef = PLANS[p]
              const Icon = PLAN_ICONS[p]
              const isRecommended = p === "creator"
              return (
                <button
                  key={p}
                  onClick={() => handleUpgrade(p)}
                  disabled={!!loading}
                  className={cn(
                    "relative flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-accent/30 disabled:opacity-60",
                    isRecommended
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-secondary/30"
                  )}
                >
                  {isRecommended && (
                    <span className="absolute top-1.5 right-2 text-[8px] font-semibold text-primary uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {loading === p ? (
                      <Loader2 className={cn("h-3.5 w-3.5 animate-spin", PLAN_COLORS[p])} />
                    ) : (
                      <Icon className={cn("h-3.5 w-3.5", PLAN_COLORS[p])} />
                    )}
                    <span className="text-xs font-medium">{planDef.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{planDef.credits} credits/mo</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-semibold">{"\u00A3"}{planDef.priceGBP}</span>
                    <span className="text-[10px] text-muted-foreground">/mo</span>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground ml-auto" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
