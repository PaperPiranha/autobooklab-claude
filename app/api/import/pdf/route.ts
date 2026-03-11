import { createClient } from "@/lib/supabase/server"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit
  const rateLimited = checkRouteRateLimit(user.id, "import", RATE_LIMITS.import)
  if (rateLimited) return rateLimited

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return Response.json({ error: "Only PDF files are supported" }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large. Maximum size is 10 MB." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // Use direct lib path to avoid pdf-parse test file issue in Next.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js")
    const result = await pdfParse(buffer)
    const content = result.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20_000)

    return Response.json({ content, pageCount: result.numpages })
  } catch {
    return Response.json(
      { error: "Could not extract text from this PDF. It may be scanned or encrypted." },
      { status: 422 }
    )
  }
}
