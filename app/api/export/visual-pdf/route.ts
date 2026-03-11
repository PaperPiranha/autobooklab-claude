import { createClient } from "@/lib/supabase/server"
import { Document, Page, View, Text, Image as PDFImage, pdf } from "@react-pdf/renderer"
import type { EditorPage, PageElement } from "@/lib/editor/types"
import React from "react"

export const runtime = "nodejs"

const SCALE_X = 595 / 794
const SCALE_Y = 842 / 1123

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

function tableToRows(rows: string[][]): React.ReactElement {
  return React.createElement(
    View,
    null,
    ...rows.map((row, ri) =>
      React.createElement(
        View,
        { key: ri, style: { flexDirection: "row" } },
        ...row.map((cell, ci) =>
          React.createElement(
            View,
            {
              key: ci,
              style: {
                flex: 1,
                borderWidth: 1,
                borderColor: "#e0e0e0",
                padding: 4,
              },
            },
            React.createElement(Text, { style: { fontSize: 10 } }, cell)
          )
        )
      )
    )
  )
}

function renderElement(el: PageElement, allPages: EditorPage[]): React.ReactElement {
  const containerStyle = {
    position: "absolute" as const,
    left: el.x * SCALE_X,
    top: el.y * SCALE_Y,
    width: el.w * SCALE_X,
    height: el.h * SCALE_Y,
  }

  switch (el.type) {
    case "text":
    case "heading":
    case "chapter-heading":
    case "callout":
    case "page-number": {
      const textStyle = {
        fontSize: (el.styles.fontSize ?? 16) * SCALE_X,
        color: el.styles.color ?? "#1a1a1a",
        fontWeight: (el.styles.fontWeight as number) ?? 400,
        textAlign: (el.styles.textAlign ?? "left") as "left" | "center" | "right",
        lineHeight: el.styles.lineHeight ?? 1.4,
        backgroundColor: el.styles.backgroundColor,
        padding: el.styles.padding ? el.styles.padding * SCALE_X : 0,
        borderRadius: el.styles.borderRadius ?? 0,
      }
      return React.createElement(
        View,
        { key: el.id, style: containerStyle },
        React.createElement(Text, { style: textStyle }, stripHtml(el.content.text ?? ""))
      )
    }

    case "image": {
      if (!el.content.src) return React.createElement(View, { key: el.id, style: containerStyle })
      return React.createElement(
        View,
        { key: el.id, style: containerStyle },
        React.createElement(PDFImage, {
          src: el.content.src,
          style: { width: "100%", height: "100%", objectFit: el.styles.objectFit ?? "cover" },
        })
      )
    }

    case "captioned-image": {
      if (!el.content.src) return React.createElement(View, { key: el.id, style: containerStyle })
      return React.createElement(
        View,
        { key: el.id, style: containerStyle },
        React.createElement(PDFImage, {
          src: el.content.src,
          style: { width: "100%", height: "85%", objectFit: el.styles.objectFit ?? "cover" },
        }),
        React.createElement(
          Text,
          { style: { fontSize: 11, color: "#666", textAlign: "center", marginTop: 4 } },
          el.content.caption ?? ""
        )
      )
    }

    case "divider":
      return React.createElement(View, {
        key: el.id,
        style: {
          ...containerStyle,
          backgroundColor: el.styles.backgroundColor ?? "#e0e0e0",
        },
      })

    case "shape":
      return React.createElement(View, {
        key: el.id,
        style: {
          ...containerStyle,
          backgroundColor: el.styles.backgroundColor ?? "#F97316",
          borderRadius: el.styles.borderRadius ?? 0,
        },
      })

    case "table": {
      const rows = el.content.rows ?? []
      return React.createElement(
        View,
        { key: el.id, style: containerStyle },
        tableToRows(rows)
      )
    }

    case "toc": {
      // Collect all chapter headings across all pages
      const chapters: string[] = []
      for (const page of allPages) {
        for (const pageEl of page.elements) {
          if (pageEl.type === "chapter-heading" && pageEl.content.text) {
            chapters.push(stripHtml(pageEl.content.text))
          }
        }
      }
      return React.createElement(
        View,
        { key: el.id, style: containerStyle },
        React.createElement(
          Text,
          { style: { fontSize: 18 * SCALE_X, fontWeight: 700, marginBottom: 8 } },
          "Table of Contents"
        ),
        ...chapters.map((ch, i) =>
          React.createElement(
            Text,
            { key: i, style: { fontSize: 12 * SCALE_X, marginBottom: 4 } },
            ch
          )
        )
      )
    }

    default:
      return React.createElement(View, { key: el.id, style: containerStyle })
  }
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

    // Fetch book
    const { data: book } = await supabase
      .from("books")
      .select("id, title, genre, description")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single()

    if (!book) return Response.json({ error: "Book not found" }, { status: 404 })

    // Fetch pages directly (not via server action)
    const { data: pagesData, error: pagesError } = await supabase
      .from("pages")
      .select("*")
      .eq("book_id", bookId)
      .order("order_index", { ascending: true })

    if (pagesError) throw new Error(pagesError.message)

    const pages: EditorPage[] = ((pagesData as PageRow[]) ?? []).map(rowToPage)

    // Insert pending export record
    const { data: exportRecord } = await supabase
      .from("exports")
      .insert({ book_id: bookId, user_id: user.id, format: "pdf", status: "pending" })
      .select()
      .single()

    // Build PDF document
    const doc = React.createElement(
      Document,
      { title: book.title },
      ...pages.map((page) =>
        React.createElement(
          Page,
          {
            key: page.id,
            size: "A4",
            style: { position: "relative", backgroundColor: page.backgroundColor ?? "#ffffff" },
          },
          ...page.elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => renderElement(el, pages))
        )
      )
    )

    const buffer = await pdf(doc).toBuffer()

    // Upload to Supabase Storage
    const fileName = `${user.id}/${bookId}-visual-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
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
          subject: `Your eBook "${book.title}" PDF is ready`,
          html: `
            <p>Hi,</p>
            <p>Your visual eBook <strong>${book.title}</strong> has been exported as a PDF.</p>
            <p><a href="${signed?.signedUrl}">Download PDF</a> (link valid for 24 hours)</p>
            <p>— AutoBookLab</p>
          `,
        })
      }
    }

    return Response.json({
      url: signed?.signedUrl,
      exportId: exportRecord?.id,
      fileName: `${book.title}.pdf`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed"
    console.error("[export/visual-pdf]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
