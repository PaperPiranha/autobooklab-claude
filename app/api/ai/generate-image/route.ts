import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkAiRateLimit } from "@/lib/rate-limit"
import {
  isEmailVerified,
  getUserPlanFeatures,
  validateLength,
  sanitizePromptInput,
} from "@/lib/plans"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    if (!isEmailVerified(user)) {
      return Response.json(
        { error: "Please verify your email before using AI features." },
        { status: 403 }
      )
    }

    // Feature gate: Starter+ only
    const { features } = await getUserPlanFeatures(user.id)
    if (!features.aiImageGeneration) {
      return Response.json(
        { error: "AI image generation requires a Starter plan or higher. Please upgrade to use this feature." },
        { status: 403 }
      )
    }

    // Rate limit
    const rateLimited = checkAiRateLimit(user.id)
    if (rateLimited) return rateLimited

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 })
    }

    const { prompt, bookId, style } = await req.json()

    if (!prompt || !bookId) {
      return Response.json({ error: "prompt and bookId are required" }, { status: 400 })
    }

    const lengthErr = validateLength(prompt, "Prompt", 500)
    if (lengthErr) return Response.json({ error: lengthErr }, { status: 400 })

    // Verify book ownership
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single()
    if (!book) return Response.json({ error: "Book not found" }, { status: 404 })

    // Charge 3 credits
    const { data: spent } = await supabase.rpc("spend_credit", {
      p_user_id: user.id,
      p_amount: 3,
      p_action: "generate-image",
    })
    if (!spent) {
      return Response.json({ error: "Insufficient credits" }, { status: 402 })
    }

    const sanitized = sanitizePromptInput(prompt)
    const styleHint = style ? ` Style: ${sanitizePromptInput(style)}.` : ""
    const fullPrompt = `Book cover artwork: ${sanitized}.${styleHint} High quality, professional book cover design, portrait orientation.`

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1792",
      quality: "standard",
      response_format: "b64_json",
    })

    const b64 = result.data?.[0]?.b64_json
    if (!b64) {
      return Response.json({ error: "Image generation failed" }, { status: 500 })
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(b64, "base64")
    const filename = `${crypto.randomUUID()}.webp`
    const storagePath = `${user.id}/${bookId}/${filename}`

    const admin = createAdminClient()
    const { error: uploadErr } = await admin.storage
      .from("book-assets")
      .upload(storagePath, buffer, {
        contentType: "image/webp",
        upsert: false,
      })

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr)
      return Response.json({ error: "Failed to store generated image" }, { status: 500 })
    }

    const { data: urlData } = admin.storage
      .from("book-assets")
      .getPublicUrl(storagePath)

    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed"
    console.error("[ai/generate-image]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
