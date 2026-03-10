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

  const { selectedText, instruction } = await req.json()

  if (!selectedText?.trim()) {
    return Response.json({ error: "No text selected" }, { status: 400 })
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
    prompt: `Rewrite the following text${instruction ? ` to ${instruction}` : " to improve clarity and flow"}. Keep approximately the same length.

Text to rewrite:
${selectedText}`,
    maxOutputTokens: 1000,
  })

  return result.toTextStreamResponse()
}
