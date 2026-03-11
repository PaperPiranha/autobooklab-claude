import { createClient } from "@/lib/supabase/server"
import { renderBookPDF } from "@/lib/render-book-pdf"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { checkExportLimit, recordExport } from "@/lib/plans"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { bookId } = await req.json()
    if (!bookId) return Response.json({ error: "bookId required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    // Rate limit
    const rateLimited = checkRouteRateLimit(user.id, "export", RATE_LIMITS.export)
    if (rateLimited) return rateLimited

    // Export metering
    const exportCheck = await checkExportLimit(user.id)
    if (!exportCheck.allowed) {
      return Response.json(
        { error: `Monthly export limit reached (${exportCheck.used}/${exportCheck.limit}). Please upgrade your plan.` },
        { status: 403 }
      )
    }

    // Fetch book + chapters in parallel
    const [{ data: book }, { data: chapters }] = await Promise.all([
      supabase
        .from("books")
        .select("id, title, genre, description")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("chapters")
        .select("id, title, content, position")
        .eq("book_id", bookId)
        .order("position", { ascending: true }),
    ])

    if (!book) return Response.json({ error: "Book not found" }, { status: 404 })

    // Insert pending export record
    const { data: exportRecord } = await supabase
      .from("exports")
      .insert({ book_id: bookId, user_id: user.id, format: "pdf", status: "pending" })
      .select()
      .single()

    // Generate PDF buffer
    const pdfBuffer = await renderBookPDF(
      book,
      (chapters ?? []).map((c) => ({ ...c, content: c.content ?? "" }))
    )

    // Upload to Supabase Storage
    const fileName = `${user.id}/${bookId}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Create 24-hour signed URL for immediate download
    const { data: signed } = await supabase.storage
      .from("exports")
      .createSignedUrl(fileName, 60 * 60 * 24)

    // Update export record to ready
    if (exportRecord) {
      await supabase
        .from("exports")
        .update({ status: "ready", file_path: fileName })
        .eq("id", exportRecord.id)
    }

    // Send Resend email if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const { data: profile } = await supabase.auth.getUser()
      const email = profile.user?.email
      if (email) {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: `Your eBook "${book.title}" PDF is ready`,
          html: `
            <p>Hi,</p>
            <p>Your eBook <strong>${book.title}</strong> has been exported as a PDF.</p>
            <p><a href="${signed?.signedUrl}">Download PDF</a> (link valid for 24 hours)</p>
            <p>— AutoBookLab</p>
          `,
        })
      }
    }

    // Record export for metering
    await recordExport(user.id, "pdf")

    return Response.json({
      url: signed?.signedUrl,
      exportId: exportRecord?.id,
      fileName: `${book.title}.pdf`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed"
    console.error("[export/pdf]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
