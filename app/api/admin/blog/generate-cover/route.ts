import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const { title, description } = await request.json()

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })

    const prompt = `Create a modern, professional blog cover image for an article titled "${title}". ${description ? `The article is about: ${description}.` : ""} Style: clean, minimal, tech-forward with warm orange accents. Abstract or conceptual — no text, no words, no letters. Suitable as a wide landscape banner image for a blog post on a dark-themed website.`

    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "b64_json",
    })

    const b64 = result.data?.[0]?.b64_json
    if (!b64) {
      throw new Error("No image returned from DALL-E")
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(b64, "base64")
    const filename = `blog-covers/${randomUUID()}.webp`
    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from("book-assets")
      .upload(filename, buffer, {
        contentType: "image/webp",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = admin.storage.from("book-assets").getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error("Cover generation error:", err)
    return NextResponse.json(
      { error: "Failed to generate cover image" },
      { status: 500 }
    )
  }
}
