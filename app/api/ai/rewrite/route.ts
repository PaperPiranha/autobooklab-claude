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

  const { selectedText, instruction } = await req.json()

  if (!selectedText?.trim()) {
    return Response.json({ error: "No text selected" }, { status: 400 })
  }

  // Input validation
  const validationErrors = [
    validateLength(selectedText, "Selected text", INPUT_LIMITS.selectedText),
    validateLength(instruction, "Instruction", INPUT_LIMITS.instruction),
  ].filter(Boolean)

  if (validationErrors.length > 0) {
    return Response.json({ error: validationErrors[0] }, { status: 400 })
  }

  const { data: spent } = await supabase.rpc("spend_credit", {
    p_user_id: user.id,
    p_amount: 1,
    p_action: "rewrite",
  })

  if (!spent) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 })
  }

  const anthropicProvider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const result = streamText({
    model: anthropicProvider("claude-sonnet-4-6"),
    system:
      "You are a professional editor. Rewrite the given text as instructed. Return ONLY the rewritten text — no preamble, no explanation.",
    prompt: `Rewrite the following text${instruction ? ` to ${sanitizePromptInput(instruction)}` : " to improve clarity and flow"}. Keep approximately the same length.

Text to rewrite:
${sanitizePromptInput(selectedText)}`,
    maxOutputTokens: 1000,
  })

  return result.toTextStreamResponse()
}
