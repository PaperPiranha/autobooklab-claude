import { createClient } from "@/lib/supabase/server"
import { getStripe, PLANS, type Plan } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { plan } = await req.json() as { plan: Plan }

    const planConfig = PLANS[plan]
    if (!planConfig?.priceId) {
      return Response.json({ error: "Invalid plan" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    // Look up existing Stripe customer ID (if they've subscribed before)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      // Pre-link the Stripe customer if we already have one
      ...(sub?.stripe_customer_id
        ? { customer: sub.stripe_customer_id }
        : { customer_email: user.email }),
      // Embed user ID so the webhook can link without guessing
      client_reference_id: user.id,
      subscription_data: {
        metadata: { user_id: user.id, plan },
      },
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/dashboard`,
      allow_promotion_codes: true,
      currency: "gbp",
    })

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed"
    console.error("[billing/checkout]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
