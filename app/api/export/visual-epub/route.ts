import { EPub } from "epub-gen-memory"
import { createClient } from "@/lib/supabase/server"
import type { EditorPage, PageElement } from "@/lib/editor/types"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getUserPlanFeatures, checkExportLimit, recordExport } from "@/lib/plans"

export const runtime = "nodejs"

function stripHtml(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function elementsToHtml(elements: PageElement[], allPages: EditorPage[]): string {
  const sorted = [...elements].sort((a, b) => a.y - b.y)
  const parts: string[] = []

  for (const el of sorted) {
    switch (el.type) {
      case "chapter-heading":
        parts.push(`<h1>${stripHtml(el.content.text ?? "")}</h1>`)
        break
      case "heading":
        parts.push(`<h2>${stripHtml(el.content.text ?? "")}</h2>`)
        break
      case "text":
        // TipTap HTML is valid — pass through directly
        parts.push(el.content.text ?? "")
        break
      case "callout":
        parts.push(`<blockquote>${stripHtml(el.content.text ?? "")}</blockquote>`)
        break
      case "image":
        if (el.content.src) {
          parts.push(
            `<img src="${el.content.src}" alt="${el.content.alt ?? ""}" style="max-width:100%;height:auto;" />`
          )
        }
        break
      case "captioned-image":
        if (el.content.src) {
          parts.push(
            `<figure>` +
              `<img src="${el.content.src}" alt="${el.content.alt ?? ""}" style="max-width:100%;height:auto;" />` +
              `<figcaption>${el.content.caption ?? ""}</figcaption>` +
              `</figure>`
          )
        }
        break
      case "divider":
        parts.push(`<hr />`)
        break
      case "table": {
        const rows = el.content.rows ?? []
        const tableHtml =
          `<table border="1" cellpadding="6" cellspacing="0">` +
          rows
            .map((row, ri) =>
              `<tr>${row
                .map((cell) => (ri === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`))
                .join("")}</tr>`
            )
            .join("") +
          `</table>`
        parts.push(tableHtml)
        break
      }
      case "toc": {
        const chapters: string[] = []
        for (const page of allPages) {
          for (const pageEl of page.elements) {
            if (pageEl.type === "chapter-heading" && pageEl.content.text) {
              chapters.push(stripHtml(pageEl.content.text))
            }
          }
        }
        parts.push(
          `<h2>Table of Contents</h2><ul>` +
            chapters.map((ch) => `<li>${ch}</li>`).join("") +
            `</ul>`
        )
        break
      }
      case "page-number":
        // omit in EPUB — EPUB readers manage pagination
        break
    }
  }

  return parts.join("\n")
}

interface PageRow {
  id: string
  book_id: string
  order_index: number
  name: string
  background_color: string
  elements: PageElement[]
  created_at: string
  updated_at: string
}

function rowToPage(row: PageRow): EditorPage {
  return {
    id: row.id,
    bookId: row.book_id,
    orderIndex: row.order_index,
    name: row.name,
    backgroundColor: row.background_color,
    elements: (row.elements as PageElement[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function POST(req: Request) {
  try {
    const { bookId } = await req.json()
    if (!bookId) return Response.json({ error: "bookId required" }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

    const [{ data: book }, { data: pagesData }] = await Promise.all([
      supabase
        .from("books")
        .select("id, title, genre, description")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("pages")
        .select("*")
        .eq("book_id", bookId)
        .order("order_index", { ascending: true }),
    ])

    if (!book) return Response.json({ error: "Book not found" }, { status: 404 })

    const pages: EditorPage[] = ((pagesData as PageRow[]) ?? []).map(rowToPage)

    // Record pending export
    const { data: exportRecord } = await supabase
      .from("exports")
      .insert({ book_id: bookId, user_id: user.id, format: "epub", status: "pending" })
      .select()
      .single()

    // Build EPUB chapters from pages — each page becomes a chapter
    const chapters = pages
      .map((page) => {
        const html = elementsToHtml(page.elements, pages)
        if (!html.trim()) return null
        // Derive chapter title from chapter-heading element or fall back to page name
        const heading = page.elements.find((el) => el.type === "chapter-heading")
        const title = heading ? stripHtml(heading.content.text ?? "") : page.name
        return { title: title || page.name, content: html }
      })
      .filter(Boolean) as { title: string; content: string }[]

    if (chapters.length === 0) {
      chapters.push({ title: book.title, content: "<p>(No content yet)</p>" })
    }

    const epub = new EPub(
      {
        title: book.title,
        author: "AutoBookLab",
        publisher: "AutoBookLab",
        description: book.description ?? "",
        lang: "en",
        css: `
          body { font-family: Georgia, "Times New Roman", serif; line-height: 1.7; color: #1a1a1a; margin: 0 auto; max-width: 680px; padding: 2em; }
          h1 { font-family: Helvetica, Arial, sans-serif; font-size: 2em; font-weight: bold; border-bottom: 2px solid #f97316; padding-bottom: 0.25em; margin-top: 2em; margin-bottom: 0.5em; }
          h2 { font-family: Helvetica, Arial, sans-serif; font-size: 1.5em; font-weight: bold; margin-top: 2em; margin-bottom: 0.5em; }
          p { margin: 0 0 1em; text-align: justify; }
          blockquote { border-left: 3px solid #f97316; margin: 1.5em 0; padding: 0.5em 1em; color: #555; font-style: italic; }
          ul, ol { margin: 0 0 1em 1.5em; }
          li { margin-bottom: 0.25em; }
          hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
          img { max-width: 100%; height: auto; }
          figure { margin: 1.5em 0; }
          figcaption { text-align: center; font-size: 0.875em; color: #666; margin-top: 0.5em; }
          table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
          th, td { border: 1px solid #e0e0e0; padding: 0.5em; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
        `,
      },
      chapters
    )

    const epubBuffer = await epub.genEpub()

    const fileName = `${user.id}/${bookId}-visual-${Date.now()}.epub`
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, epubBuffer as Buffer, {
        contentType: "application/epub+zip",
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data: signed } = await supabase.storage
      .from("exports")
      .createSignedUrl(fileName, 60 * 60 * 24)

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
            <p>Your visual eBook <strong>${book.title}</strong> has been exported as an EPUB.</p>
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
    console.error("[export/visual-epub]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
