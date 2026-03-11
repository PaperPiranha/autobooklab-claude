import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { checkAiRateLimit } from "@/lib/rate-limit"
import { validateLength, INPUT_LIMITS, isEmailVerified, sanitizePromptInput } from "@/lib/plans"

export async function POST(req: Request) {
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 })
  }

  const { action, bookTitle, chapterTitle, genre, description, chapterContent, customPrompt } =
    await req.json()

  // Input validation
  const validationErrors = [
    validateLength(bookTitle, "Book title", INPUT_LIMITS.bookTitle),
    validateLength(chapterTitle, "Chapter title", INPUT_LIMITS.chapterTitle),
    validateLength(description, "Description", INPUT_LIMITS.description),
    validateLength(customPrompt, "Custom prompt", INPUT_LIMITS.customPrompt),
    validateLength(chapterContent, "Chapter content", INPUT_LIMITS.chapterContent),
  ].filter(Boolean)

  if (validationErrors.length > 0) {
    return Response.json({ error: validationErrors[0] }, { status: 400 })
  }

  const creditCost = action === "generate" ? 2 : 1

  const { data: spent } = await supabase.rpc("spend_credit", {
    p_user_id: user.id,
    p_amount: creditCost,
    p_action: action,
  })

  if (!spent) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 })
  }

  const anthropicProvider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let system: string
  let prompt: string

  // Sanitize user inputs before injecting into prompts
  const safeBookTitle = sanitizePromptInput(bookTitle ?? "")
  const safeChapterTitle = sanitizePromptInput(chapterTitle ?? "")
  const safeGenre = sanitizePromptInput(genre ?? "")
  const safeDescription = sanitizePromptInput(description ?? "")
  const safeCustomPrompt = sanitizePromptInput(customPrompt ?? "")
  const safeChapterContent = sanitizePromptInput(chapterContent ?? "")

  if (action === "generate") {
    system =
      "You are a professional author writing an eBook chapter. Write compelling, well-structured prose that matches the genre and style. Do not include the chapter title in your output."
    prompt = `Write a chapter draft for this eBook:

Book: "${safeBookTitle}"
Genre: ${safeGenre || "General"}
${safeDescription ? `Description: ${safeDescription}\n` : ""}Chapter: "${safeChapterTitle}"
${safeCustomPrompt ? `\nAdditional instructions: ${safeCustomPrompt}\n` : ""}
Write 400–600 words of engaging prose. Use paragraph breaks. Match the genre's tone.`
  } else {
    // summarize
    system = "You are a professional editor. Create concise, accurate summaries."
    prompt = `Summarize the following chapter content in 2–3 sentences:\n\n${safeChapterContent || "(empty chapter)"}`
  }

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system,
    prompt,
    maxOutputTokens: 1500,
  })

  return result.toTextStreamResponse()
}
