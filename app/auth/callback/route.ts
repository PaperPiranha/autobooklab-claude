import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Send a welcome email on first sign-in (created_at ≈ confirmed_at)
      const user = data.user
      const isNewUser =
        user.created_at &&
        user.email_confirmed_at &&
        Math.abs(
          new Date(user.email_confirmed_at).getTime() -
          new Date(user.created_at).getTime()
        ) < 60_000 // within 1 minute of signup

      if (isNewUser && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && user.email) {
        try {
          const { Resend } = await import("resend")
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: "Welcome to AutoBookLab ✦",
            html: `
              <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a1a;">
                <div style="margin-bottom:32px;">
                  <span style="font-size:22px;font-weight:400;letter-spacing:-0.5px;">
                    AutoBook<span style="color:#f97316;">Lab</span>
                  </span>
                </div>
                <h1 style="font-size:28px;font-weight:400;margin:0 0 12px;line-height:1.2;">
                  Welcome aboard 👋
                </h1>
                <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 20px;">
                  Your account is confirmed. You're ready to start writing AI-powered eBooks.
                </p>
                <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 28px;">
                  You have <strong style="color:#f97316;">10 free AI credits</strong> to get started —
                  enough to generate a full chapter draft, rewrite sections, and search for images.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/books/new"
                   style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
                  Create your first book →
                </a>
                <hr style="border:none;border-top:1px solid #eee;margin:40px 0 20px;" />
                <p style="font-size:12px;color:#aaa;margin:0;">
                  AutoBookLab · You're receiving this because you signed up at autobooklab.com
                </p>
              </div>
            `,
          })
        } catch (emailErr) {
          // Non-fatal — don't break the auth flow
          console.error("[auth/callback] welcome email failed:", emailErr)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=Auth+callback+failed`)
}
