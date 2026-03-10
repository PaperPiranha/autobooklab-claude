import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 })
  }

  const { action, bookTitle, chapterTitle, genre, description, chapterContent, customPrompt } =
    await req.json()

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

  if (action === "generate") {
    system =
      "You are a professional author writing an eBook chapter. Write compelling, well-structured prose that matches the genre and style. Do not include the chapter title in your output."
    prompt = `Write a chapter draft for this eBook:

Book: "${bookTitle}"
Genre: ${genre || "General"}
${description ? `Description: ${description}\n` : ""}Chapter: "${chapterTitle}"
${customPrompt ? `\nAdditional instructions: ${customPrompt}\n` : ""}
Write 400–600 words of engaging prose. Use paragraph breaks. Match the genre's tone.`
  } else {
    // summarize
    system = "You are a professional editor. Create concise, accurate summaries."
    prompt = `Summarize the following chapter content in 2–3 sentences:\n\n${chapterContent || "(empty chapter)"}`
  }

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system,
    prompt,
    maxOutputTokens: 1500,
  })

  return result.toTextStreamResponse()
}
