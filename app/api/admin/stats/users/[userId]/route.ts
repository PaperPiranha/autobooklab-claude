import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const { userId } = await params
  const admin = createAdminClient()

  // Get user auth data
  const {
    data: { user: targetUser },
  } = await admin.auth.admin.getUserById(userId)
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Parallel queries
  const [subRes, creditRes, booksRes, transactionsRes, exportsRes] =
    await Promise.all([
      admin
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single(),
      admin.from("credits").select("*").eq("user_id", userId).single(),
      admin
        .from("books")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("export_usage")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

  return NextResponse.json({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      createdAt: targetUser.created_at,
      lastSignIn: targetUser.last_sign_in_at,
      emailConfirmed: targetUser.email_confirmed_at,
    },
    subscription: subRes.data ?? { plan: "free", status: "active" },
    credits: creditRes.data ?? { balance: 0 },
    books: booksRes.data ?? [],
    transactions: transactionsRes.data ?? [],
    exports: exportsRes.data ?? [],
  })
}
