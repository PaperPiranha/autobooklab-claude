import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, genre, description } = await req.json()
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  const prompt = [
    `You are helping an author plan their eBook.`,
    `Book title: "${title}"`,
    genre ? `Genre: ${genre}` : null,
    description ? `Description: ${description}` : null,
    ``,
    `Generate a logical, well-structured chapter outline with 6–10 chapter titles.`,
    `Return ONLY a JSON array of strings — chapter titles, nothing else.`,
    `Example: ["Introduction", "Chapter 1: ...", "Chapter 2: ...", "Conclusion"]`,
  ]
    .filter(Boolean)
    .join("\n")

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt,
    maxOutputTokens: 512,
  })

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return NextResponse.json({ error: "Failed to parse outline" }, { status: 500 })

  try {
    const chapters = JSON.parse(match[0]) as string[]
    return NextResponse.json({ chapters })
  } catch {
    return NextResponse.json({ error: "Failed to parse outline" }, { status: 500 })
  }
}
