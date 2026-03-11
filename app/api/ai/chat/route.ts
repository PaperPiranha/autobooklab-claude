import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 })
  }

  const { messages, context } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[]
    context: {
      bookTitle: string
      genre: string
      description: string
      currentPageName: string
      selectedElementContent: string
    }
  }

  const { data: spent } = await supabase.rpc("spend_credit", {
    p_user_id: user.id,
    p_amount: 1,
    p_action: "chat",
  })

  if (!spent) {
    return Response.json({ error: "Insufficient credits. Please upgrade your plan." }, { status: 402 })
  }

  const systemPrompt = [
    `You are an AI writing assistant helping create an eBook called "${context.bookTitle}"`,
    context.genre ? `(${context.genre})` : "",
    ".",
    context.currentPageName ? ` Current page: ${context.currentPageName}.` : "",
    context.selectedElementContent
      ? ` The user has selected this text: "${context.selectedElementContent}".`
      : "",
    " Provide concise, helpful writing assistance. When generating content, format it cleanly without markdown headings unless asked.",
  ].join("")

  const anthropicProvider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1000,
  })

  return result.toTextStreamResponse()
}
