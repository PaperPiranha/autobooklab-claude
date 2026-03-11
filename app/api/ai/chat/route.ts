import { streamText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { checkAiRateLimit } from "@/lib/rate-limit"
import { getUserPlanFeatures, INPUT_LIMITS, isEmailVerified, sanitizePromptInput } from "@/lib/plans"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Require email verification before AI usage
  if (!isEmailVerified(user)) {
    return Response.json({ error: "Please verify your email before using AI features." }, { status: 403 })
  }

  // Rate limit
  const rateLimited = checkAiRateLimit(user.id)
  if (rateLimited) return rateLimited

  // Feature gate: AI Chat requires Starter+
  const { features } = await getUserPlanFeatures(user.id)
  if (!features.aiChat) {
    return Response.json(
      { error: "AI Chat is available on Starter plan and above. Please upgrade." },
      { status: 403 }
    )
  }

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

  // Validate messages array
  if (!Array.isArray(messages)) {
    return Response.json({ error: "Messages must be an array" }, { status: 400 })
  }
  if (messages.length > INPUT_LIMITS.chatMessageMaxCount) {
    return Response.json(
      { error: `Too many messages. Maximum is ${INPUT_LIMITS.chatMessageMaxCount}.` },
      { status: 400 }
    )
  }
  for (const msg of messages) {
    if (typeof msg.content === "string" && msg.content.length > INPUT_LIMITS.chatMessageMaxLength) {
      return Response.json(
        { error: `Message exceeds maximum length of ${INPUT_LIMITS.chatMessageMaxLength.toLocaleString()} characters` },
        { status: 400 }
      )
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

  // Sanitize messages before sending to AI
  const sanitizedMessages = messages.map((msg) => ({
    ...msg,
    content: typeof msg.content === "string" ? sanitizePromptInput(msg.content) : msg.content,
  }))

  const systemPrompt = [
    `You are an AI writing assistant helping create an eBook called "${sanitizePromptInput(context.bookTitle ?? "")}"`,
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
    messages: sanitizedMessages,
    maxOutputTokens: 1000,
  })

  return result.toTextStreamResponse()
}
