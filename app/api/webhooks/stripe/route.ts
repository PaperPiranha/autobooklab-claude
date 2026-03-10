import type Stripe from "stripe"
import { getStripe, priceIdToPlan } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// Raw body required for Stripe signature verification — do NOT parse as JSON
export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature or secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed"
    console.error("[webhook/stripe] verification failed:", message)
    return Response.json({ error: message }, { status: 400 })
  }

  const db = createAdminClient()

  try {
    switch (event.type) {
      // ── Checkout completed: link Stripe customer → user ───────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        if (!userId || !session.customer || !session.subscription) break

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer.id
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id

        // Retrieve subscription to resolve plan from price ID
        const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = stripeSub.items.data[0]?.price.id ?? ""
        const plan = priceIdToPlan(priceId)

        await db.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: stripeSub.status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        break
      }

      // ── Subscription updated (plan change, pause, renewal, etc.) ──────────────
      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription
        const customerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id

        const priceId = stripeSub.items.data[0]?.price.id ?? ""
        const plan = priceIdToPlan(priceId)

        await db
          .from("subscriptions")
          .update({
            plan,
            status: stripeSub.status,
            stripe_subscription_id: stripeSub.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      // ── Subscription deleted: downgrade to free ───────────────────────────────
      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription
        const customerId =
          typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id

        await db
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      // ── Invoice paid: refresh monthly credits + store period end ──────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        if (
          invoice.billing_reason === "subscription_cycle" ||
          invoice.billing_reason === "subscription_create"
        ) {
          const customerId =
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
          if (!customerId) break

          // Period end comes from the invoice line item
          const periodEnd = invoice.lines.data[0]?.period?.end
          const periodEndIso = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null

          const { data: sub } = await db
            .from("subscriptions")
            .select("user_id, plan")
            .eq("stripe_customer_id", customerId)
            .single()

          if (sub) {
            // Store the period end for display
            if (periodEndIso) {
              await db
                .from("subscriptions")
                .update({ current_period_end: periodEndIso, updated_at: new Date().toISOString() })
                .eq("stripe_customer_id", customerId)
            }
            // Refresh credits to plan allowance
            await db.rpc("refresh_credits_for_plan", {
              p_user_id: sub.user_id,
              p_plan: sub.plan,
            })
          }
        }
        break
      }

      // ── Invoice payment failed: mark subscription past_due ────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        if (!customerId) break

        await db
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }
    }
  } catch (err) {
    // Log but return 200 so Stripe doesn't retry non-recoverable errors
    console.error("[webhook/stripe] handler error:", err)
  }

  return Response.json({ received: true })
}
