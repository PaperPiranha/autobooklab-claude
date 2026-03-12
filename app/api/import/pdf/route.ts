import { createClient } from "@/lib/supabase/server"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

function getFileType(file: File): "pdf" | "docx" | null {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return "pdf"
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  )
    return "docx"
  return null
}

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

  const fileType = getFileType(file)

  if (!fileType) {
    return Response.json(
      { error: "Unsupported file type. Please upload a PDF or Word (.docx) file." },
      { status: 400 }
    )
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large. Maximum size is 10 MB." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    if (fileType === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js")
      const result = await pdfParse(buffer)
      const content = result.text
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 20_000)

      return Response.json({ content, pageCount: result.numpages })
    }

    // DOCX
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    const content = result.value
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20_000)

    return Response.json({ content })
  } catch {
    return Response.json(
      {
        error: fileType === "pdf"
          ? "Could not extract text from this PDF. It may be scanned or encrypted."
          : "Could not extract text from this Word document. The file may be corrupted.",
      },
      { status: 422 }
    )
  }
}
