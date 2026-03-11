import { EPub } from "epub-gen-memory"
import { createClient } from "@/lib/supabase/server"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getUserPlanFeatures, checkExportLimit, recordExport } from "@/lib/plans"

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

    // Feature gate: ePub export requires Starter+
    const { features } = await getUserPlanFeatures(user.id)
    if (!features.exports.includes("epub")) {
      return Response.json(
        { error: "ePub export is available on Starter plan and above. Please upgrade." },
        { status: 403 }
      )
    }

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
      .insert({ book_id: bookId, user_id: user.id, format: "epub", status: "pending" })
      .select()
      .single()

    const chapterList = (chapters ?? []).map((c) => ({
      title: c.title,
      content: c.content ?? "<p>(No content yet)</p>",
    }))

    // EPUB metadata and CSS
    const epub = new EPub(
      {
        title: book.title,
        author: "AutoBookLab",
        publisher: "AutoBookLab",
        description: book.description ?? "",
        lang: "en",
        css: `
          body { font-family: Georgia, "Times New Roman", serif; line-height: 1.7; color: #1a1a1a; margin: 0 auto; max-width: 680px; padding: 2em; }
          h1, h2, h3 { font-family: Helvetica, Arial, sans-serif; font-weight: bold; margin-top: 2em; margin-bottom: 0.5em; }
          h1 { font-size: 2em; border-bottom: 2px solid #f97316; padding-bottom: 0.25em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.2em; }
          p { margin: 0 0 1em; text-align: justify; }
          blockquote { border-left: 3px solid #f97316; margin: 1.5em 0; padding: 0.5em 1em; color: #555; font-style: italic; }
          ul, ol { margin: 0 0 1em 1.5em; }
          li { margin-bottom: 0.25em; }
          hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
          img { max-width: 100%; height: auto; }
        `,
      },
      chapterList
    )

    const epubBuffer = await epub.genEpub()

    // Upload to Supabase Storage
    const fileName = `${user.id}/${bookId}-${Date.now()}.epub`
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, epubBuffer as Buffer, {
        contentType: "application/epub+zip",
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Signed URL (24 hours)
    const { data: signed } = await supabase.storage
      .from("exports")
      .createSignedUrl(fileName, 60 * 60 * 24)

    // Update export record
    if (exportRecord) {
      await supabase
        .from("exports")
        .update({ status: "ready", file_path: fileName })
        .eq("id", exportRecord.id)
    }

    // Resend email if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const { data: profile } = await supabase.auth.getUser()
      const email = profile.user?.email
      if (email) {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: `Your eBook "${book.title}" EPUB is ready`,
          html: `
            <p>Hi,</p>
            <p>Your eBook <strong>${book.title}</strong> has been exported as an EPUB.</p>
            <p><a href="${signed?.signedUrl}">Download EPUB</a> (link valid for 24 hours)</p>
            <p>— AutoBookLab</p>
          `,
        })
      }
    }

    // Record export for metering
    await recordExport(user.id, "epub")

    return Response.json({
      url: signed?.signedUrl,
      exportId: exportRecord?.id,
      fileName: `${book.title}.epub`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed"
    console.error("[export/epub]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
