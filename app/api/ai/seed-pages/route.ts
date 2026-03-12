import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import type { EditorPage } from "@/lib/editor/types"
import { checkAiRateLimit } from "@/lib/rate-limit"
import { isEmailVerified } from "@/lib/plans"

export const runtime = "nodejs"

function makeId() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

interface ChapterSeed {
  title: string
  body: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function buildCoverPage(bookId: string, title: string, subtitle: string): EditorPage {
  const ts = now()
  return {
    id: makeId(),
    bookId,
    orderIndex: 0,
    name: "Cover",
    backgroundColor: "#0f0f0f",
    isCover: true,
    elements: [
      {
        id: makeId(),
        type: "shape",
        x: 0,
        y: 0,
        w: 794,
        h: 8,
        zIndex: 1,
        locked: false,
        content: { shapeType: "rect" },
        styles: { backgroundColor: "#F97316", opacity: 100, strokeColor: "transparent", strokeWidth: 0 },
      },
      {
        id: makeId(),
        type: "heading",
        x: 72,
        y: 340,
        w: 650,
        h: 180,
        zIndex: 2,
        locked: false,
        content: { text: title },
        styles: {
          fontSize: 56,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.15,
        },
      },
      {
        id: makeId(),
        type: "text",
        x: 122,
        y: 530,
        w: 550,
        h: 80,
        zIndex: 3,
        locked: false,
        content: { text: subtitle },
        styles: { fontSize: 18, color: "#a0a0a0", textAlign: "center", lineHeight: 1.5 },
      },
      {
        id: makeId(),
        type: "divider",
        x: 297,
        y: 480,
        w: 200,
        h: 3,
        zIndex: 4,
        locked: false,
        content: {},
        styles: { backgroundColor: "#F97316" },
      },
      {
        id: makeId(),
        type: "page-number",
        x: 357,
        y: 1070,
        w: 80,
        h: 36,
        zIndex: 5,
        locked: false,
        content: { text: "—" },
        styles: { fontSize: 13, color: "#555555", textAlign: "center" },
      },
    ],
    createdAt: ts,
    updatedAt: ts,
  }
}

function buildTocPage(bookId: string, orderIndex: number, chapters: ChapterSeed[]): EditorPage {
  const ts = now()
  return {
    id: makeId(),
    bookId,
    orderIndex,
    name: "Table of Contents",
    backgroundColor: "#ffffff",
    elements: [
      {
        id: makeId(),
        type: "heading",
        x: 72,
        y: 80,
        w: 650,
        h: 80,
        zIndex: 1,
        locked: false,
        content: { text: "Contents" },
        styles: { fontSize: 40, fontWeight: 700, color: "#1a1a1a", textAlign: "left" },
      },
      {
        id: makeId(),
        type: "divider",
        x: 72,
        y: 168,
        w: 650,
        h: 3,
        zIndex: 2,
        locked: false,
        content: {},
        styles: { backgroundColor: "#F97316" },
      },
      {
        id: makeId(),
        type: "toc",
        x: 72,
        y: 200,
        w: 650,
        h: Math.min(700, chapters.length * 52 + 40),
        zIndex: 3,
        locked: false,
        content: { text: "Table of Contents" },
        styles: { fontSize: 16, color: "#1a1a1a", lineHeight: 2 },
      },
      {
        id: makeId(),
        type: "page-number",
        x: 357,
        y: 1070,
        w: 80,
        h: 36,
        zIndex: 4,
        locked: false,
        content: { text: "—" },
        styles: { fontSize: 13, color: "#888888", textAlign: "center" },
      },
    ],
    createdAt: ts,
    updatedAt: ts,
  }
}

function buildChapterPage(
  bookId: string,
  orderIndex: number,
  chapter: ChapterSeed,
  chapterNum: number
): EditorPage {
  const ts = now()
  return {
    id: makeId(),
    bookId,
    orderIndex,
    name: chapter.title,
    backgroundColor: "#ffffff",
    elements: [
      {
        id: makeId(),
        type: "text",
        x: 72,
        y: 68,
        w: 300,
        h: 30,
        zIndex: 1,
        locked: false,
        content: { text: `Chapter ${chapterNum}` },
        styles: {
          fontSize: 13,
          color: "#F97316",
          fontWeight: 600,
          textAlign: "left",
          lineHeight: 1.4,
        },
      },
      {
        id: makeId(),
        type: "chapter-heading",
        x: 72,
        y: 100,
        w: 650,
        h: 140,
        zIndex: 2,
        locked: false,
        content: { text: chapter.title },
        styles: {
          fontSize: 44,
          fontWeight: 700,
          color: "#1a1a1a",
          textAlign: "left",
          lineHeight: 1.15,
        },
      },
      {
        id: makeId(),
        type: "divider",
        x: 72,
        y: 252,
        w: 120,
        h: 4,
        zIndex: 3,
        locked: false,
        content: {},
        styles: { backgroundColor: "#F97316" },
      },
      {
        id: makeId(),
        type: "text",
        x: 72,
        y: 280,
        w: 650,
        h: 720,
        zIndex: 4,
        locked: false,
        content: { text: chapter.body },
        styles: {
          fontSize: 16,
          color: "#1a1a1a",
          textAlign: "left",
          lineHeight: 1.7,
        },
      },
      {
        id: makeId(),
        type: "page-number",
        x: 357,
        y: 1070,
        w: 80,
        h: 36,
        zIndex: 5,
        locked: false,
        content: { text: "—" },
        styles: { fontSize: 13, color: "#888888", textAlign: "center" },
      },
    ],
    createdAt: ts,
    updatedAt: ts,
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

    // Require email verification before AI usage
    if (!isEmailVerified(user)) {
      return Response.json({ error: "Please verify your email before using AI features." }, { status: 403 })
    }

    // Rate limit
    const rateLimited = checkAiRateLimit(user.id)
    if (rateLimited) return rateLimited

    // Charge 3 credits for seed-pages (makes multiple AI calls)
    const { data: spent } = await supabase.rpc("spend_credit", {
      p_user_id: user.id,
      p_amount: 3,
      p_action: "seed-pages",
    })

    if (!spent) {
      return Response.json({ error: "Insufficient credits" }, { status: 402 })
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

    const chapterList = (chapters ?? []) as {
      id: string
      title: string
      content: string | null
      position: number
    }[]

    // Build chapter seeds — use existing content or AI-generate brief opening
    let chapterSeeds: ChapterSeed[]

    if (chapterList.length === 0) {
      // No chapters — ask AI to create chapter outline + content
      const { text } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        prompt: `You are creating an eBook layout. Given the book details below, generate 4-6 chapters with brief opening paragraphs (2-3 sentences each).

Book title: ${book.title}
Genre: ${book.genre ?? "General"}
Description: ${book.description ?? ""}

Return a JSON array only (no markdown), like:
[{"title":"Chapter Title","body":"Opening paragraph text here."},...]`,
        maxOutputTokens: 1200,
      })
      try {
        const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "")
        chapterSeeds = JSON.parse(cleaned)
      } catch {
        chapterSeeds = [{ title: book.title, body: book.description ?? "Content goes here." }]
      }
    } else {
      // Use existing chapters — AI fills in empty ones
      const needsContent = chapterList.filter((c) => !c.content?.trim())

      let aiContent: Record<string, string> = {}

      if (needsContent.length > 0) {
        const { text } = await generateText({
          model: anthropic("claude-haiku-4-5-20251001"),
          prompt: `You are creating content for an eBook. For each chapter listed, write a brief opening paragraph (2-3 sentences).

Book: "${book.title}" (${book.genre ?? "General"})
${book.description ? `About: ${book.description}` : ""}

Chapters needing content:
${needsContent.map((c) => `- "${c.title}"`).join("\n")}

Return a JSON object mapping chapter title to opening paragraph text only (no markdown):
{"Chapter Title": "Opening paragraph text..."}`,
          maxOutputTokens: 800,
        })
        try {
          const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "")
          aiContent = JSON.parse(cleaned)
        } catch {
          // fallback — empty string means placeholder text
        }
      }

      chapterSeeds = chapterList.map((c) => ({
        title: c.title,
        body:
          (c.content?.trim() ? stripHtml(c.content) : null) ||
          aiContent[c.title] ||
          `Begin writing your content for "${c.title}" here.`,
      }))
    }

    // Build the page array
    const coverSubtitle =
      book.description && book.description.length > 0
        ? book.description.slice(0, 120) + (book.description.length > 120 ? "…" : "")
        : `A ${book.genre ?? ""} book`

    const pages: EditorPage[] = [
      buildCoverPage(bookId, book.title, coverSubtitle),
      buildTocPage(bookId, 1, chapterSeeds),
      ...chapterSeeds.map((ch, i) => buildChapterPage(bookId, i + 2, ch, i + 1)),
    ]

    return Response.json({ pages })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed"
    console.error("[ai/seed-pages]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
