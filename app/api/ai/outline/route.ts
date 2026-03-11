import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkAiRateLimit } from "@/lib/rate-limit"
import { validateLength, INPUT_LIMITS, isEmailVerified, sanitizePromptInput } from "@/lib/plans"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Require email verification before AI usage
  if (!isEmailVerified(user)) {
    return NextResponse.json({ error: "Please verify your email before using AI features." }, { status: 403 })
  }

  // Rate limit
  const rateLimited = checkAiRateLimit(user.id)
  if (rateLimited) return rateLimited

  const { title, genre, description } = await req.json()
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  // Input validation
  const validationErrors = [
    validateLength(title, "Title", INPUT_LIMITS.bookTitle),
    validateLength(genre, "Genre", INPUT_LIMITS.bookTitle),
    validateLength(description, "Description", INPUT_LIMITS.description),
  ].filter(Boolean)

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0] }, { status: 400 })
  }

  // Charge 1 credit for outline generation
  const { data: spent } = await supabase.rpc("spend_credit", {
    p_user_id: user.id,
    p_amount: 1,
    p_action: "outline",
  })

  if (!spent) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
  }

  const prompt = [
    `You are helping an author plan their eBook.`,
    `Book title: "${sanitizePromptInput(title)}"`,
    genre ? `Genre: ${sanitizePromptInput(genre)}` : null,
    description ? `Description: ${sanitizePromptInput(description)}` : null,
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
