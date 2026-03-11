import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Separator } from "@/components/ui/separator"
import { BillingCard } from "@/app/(dashboard)/dashboard/_components/billing-card"
import { PLANS, type Plan } from "@/lib/stripe"
import { PLAN_FEATURES } from "@/lib/plans"
import { Check, X } from "lucide-react"

function FeatureCheck({ available }: { available: boolean }) {
  return available ? (
    <Check className="h-3.5 w-3.5 text-emerald-500" />
  ) : (
    <X className="h-3.5 w-3.5 text-muted-foreground/40" />
  )
}

const PLAN_ORDER: Plan[] = ["free", "starter", "creator", "pro", "business"]

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const [{ data: credits }, { data: subscription }] = await Promise.all([
    supabase.from("credits").select("balance").eq("user_id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single(),
  ])

  const currentPlan = (subscription?.plan ?? "free") as Plan
  const creditBalance = credits?.balance ?? 0
  const periodEnd = subscription?.current_period_end ?? null

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and preferences</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl space-y-8">
          {/* Billing */}
          <div>
            <h2 className="text-sm font-medium mb-3">Billing & subscription</h2>
            <div className="max-w-lg">
              <BillingCard
                currentPlan={currentPlan}
                credits={creditBalance}
                currentPeriodEnd={periodEnd}
              />
            </div>
          </div>

          <Separator />

          {/* Plan comparison table */}
          <div>
            <h2 className="text-sm font-medium mb-4">Compare plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-40">Feature</th>
                    {PLAN_ORDER.map((p) => (
                      <th
                        key={p}
                        className={`text-center py-2 px-3 font-medium ${p === currentPlan ? "text-primary" : "text-foreground"}`}
                      >
                        {PLANS[p].name}
                        <div className="font-normal text-muted-foreground mt-0.5">
                          {PLANS[p].priceGBP === 0 ? "Free" : `\u00A3${PLANS[p].priceGBP}/mo`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">AI Credits/mo</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3 tabular-nums">{PLANS[p].credits}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Books</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        {PLAN_FEATURES[p].maxBooks === -1 ? "Unlimited" : PLAN_FEATURES[p].maxBooks}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Import: URL / PDF / YouTube</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].imports.includes("url")} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Export: ePub</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].exports.includes("epub")} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">AI Chat</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].aiChat} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Batch Generate</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].batchGenerate} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Priority AI</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].priorityAi} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Custom Branding</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].customBranding} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Public Profile</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].publicProfile} /></span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Team Members</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        {PLAN_FEATURES[p].teamMembers > 0 ? `Up to ${PLAN_FEATURES[p].teamMembers}` : "\u2014"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">API Access</td>
                    {PLAN_ORDER.map((p) => (
                      <td key={p} className="text-center py-2 px-3">
                        <span className="inline-flex justify-center"><FeatureCheck available={PLAN_FEATURES[p].apiAccess} /></span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Account email */}
          <div>
            <h2 className="text-sm font-medium mb-3">Account</h2>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-sm font-medium">Email address</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
