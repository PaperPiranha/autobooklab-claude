import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"

interface UnsplashPhoto {
  urls: { regular: string }
  description: string | null
  alt_description: string | null
  user: { name: string; links: { html: string } }
}

async function searchUnsplash(query: string): Promise<string[]> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!accessKey) return []

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results.map(
      (p: UnsplashPhoto) =>
        `![${p.alt_description || p.description || query}](${p.urls.regular})\n*Photo by [${p.user.name}](${p.user.links.html}?utm_source=autobooklab&utm_medium=referral) on Unsplash*`
    )
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const { topic, tone, length, includeImages } = await request.json()

  if (!topic || typeof topic !== "string") {
    return NextResponse.json(
      { error: "Topic is required" },
      { status: 400 }
    )
  }

  // Fetch Unsplash images in parallel with AI generation if requested
  let unsplashImages: string[] = []
  if (includeImages !== false) {
    unsplashImages = await searchUnsplash(topic)
  }

  const imageInstruction =
    unsplashImages.length > 0
      ? `\n\nYou have ${unsplashImages.length} Unsplash images available. Insert them naturally throughout the article where they add visual value. Here are the image markdown snippets to use (copy exactly as provided):\n\n${unsplashImages.map((img, i) => `Image ${i + 1}:\n${img}`).join("\n\n")}\n\nPlace images between sections where they complement the content. Don't cluster them — spread them throughout the article.`
      : ""

  const wordCount =
    length === "short" ? "800-1000" : length === "long" ? "2000-2500" : "1200-1600"
  const toneDesc = tone || "professional yet approachable"

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      maxOutputTokens: 4096,
      prompt: `Write a blog post about: "${topic}"

Requirements:
- Tone: ${toneDesc}
- Length: approximately ${wordCount} words
- Format: Markdown with proper headings (## for sections, ### for subsections)
- Include a compelling introduction that hooks the reader
- Use clear, scannable structure with multiple sections
- End with a conclusion or call-to-action
- Write for the AutoBookLab blog — a platform for creating AI-powered eBooks
- Where natural, relate the topic back to eBook creation, publishing, or content creation
- Do NOT include the title as an H1 — it will be rendered separately
- Do NOT include frontmatter or metadata${imageInstruction}

Output ONLY the Markdown content of the blog post body. No title, no metadata, just the article content starting with the first paragraph.`,
    })

    // Also generate metadata
    const { text: metaText } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      maxOutputTokens: 300,
      prompt: `Given this blog post topic: "${topic}"

And this article content (first 500 chars): "${text.slice(0, 500)}"

Generate a JSON object with:
- "title": a compelling, SEO-friendly blog post title (max 70 chars)
- "description": a meta description for SEO (max 160 chars)
- "tags": an array of 2-4 lowercase tags relevant to the content
- "slug": a URL-friendly slug derived from the title (lowercase, hyphens, no special chars)

Return ONLY valid JSON, no other text.`,
    })

    let meta = { title: topic, description: "", tags: [] as string[], slug: "" }
    try {
      const parsed = JSON.parse(metaText.trim())
      meta = { ...meta, ...parsed }
    } catch {
      meta.title = topic
      meta.slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80)
    }

    return NextResponse.json({
      content: text,
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      slug: meta.slug,
    })
  } catch (err) {
    console.error("Blog generation error:", err)
    return NextResponse.json(
      { error: "Failed to generate blog post" },
      { status: 500 }
    )
  }
}
