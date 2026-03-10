import Link from "next/link"
import { Check, Zap, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    period: "/mo",
    description: "Try AutoBookLab at no cost",
    credits: "10 AI credits / month",
    icon: BookOpen,
    features: [
      "3 books",
      "10 AI credits / month",
      "PDF export",
      "Basic templates",
    ],
    cta: "Start free",
    variant: "outline" as const,
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "£9",
    period: "/mo",
    description: "For solo creators getting serious",
    credits: "200 AI credits / month",
    icon: Zap,
    features: [
      "Unlimited books",
      "200 AI credits / month",
      "PDF + EPUB export",
      "All templates",
      "Unsplash image library",
    ],
    cta: "Start Starter",
    variant: "default" as const,
    highlight: true,
    badge: "Most popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: "£29",
    period: "/mo",
    description: "For power users and teams",
    credits: "1,000 AI credits / month",
    icon: Sparkles,
    features: [
      "Everything in Starter",
      "1,000 AI credits / month",
      "Priority AI generation",
      "Custom cover designer",
      "Priority support",
    ],
    cta: "Start Pro",
    variant: "outline" as const,
    highlight: false,
  },
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl font-normal tracking-tight mb-3"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Choose your plan
        </h1>
        <p className="text-muted-foreground text-lg">
          Start free, upgrade when you&apos;re ready
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {plans.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-6 flex flex-col gap-6 transition-all",
                plan.highlight
                  ? "border-primary bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card"
              )}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                  {plan.badge}
                </Badge>
              )}

              {/* Plan info */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      plan.highlight
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        plan.highlight ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={
                        plan.highlight ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant={plan.variant} className="w-full" asChild>
                <Link href="/dashboard">{plan.cta}</Link>
              </Button>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        No credit card required for Free plan.{" "}
        <Link
          href="/dashboard"
          className="text-foreground hover:text-primary transition-colors"
        >
          Skip for now →
        </Link>
      </p>
    </div>
  )
}
