import { createClient } from "@/lib/supabase/server"
import { YoutubeTranscript } from "youtube-transcript"
import { checkRouteRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

function extractVideoId(input: string): string | null {
  // Handle youtu.be/ID and youtube.com/watch?v=ID and /embed/ID
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = input.match(re)
    if (m) return m[1]
  }
  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim()
  return null
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AutoBookLab/1.0)" },
      signal: AbortSignal.timeout(8_000),
    })
    const html = await res.text()
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const raw = m?.[1]?.trim() ?? ""
    return raw.replace(/\s*[-–—]\s*YouTube\s*$/, "").trim() || `YouTube Video ${videoId}`
  } catch {
    return `YouTube Video ${videoId}`
  }
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

  const { url } = await req.json()
  if (!url?.trim()) {
    return Response.json({ error: "Please enter a YouTube URL or video ID" }, { status: 400 })
  }

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return Response.json(
      { error: "Could not find a YouTube video ID in that URL" },
      { status: 400 }
    )
  }

  let transcriptItems: { text: string }[]
  try {
    transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
  } catch {
    return Response.json(
      {
        error:
          "No transcript found for this video. The video may have captions disabled, be private, or unavailable.",
      },
      { status: 422 }
    )
  }

  const rawText = transcriptItems
    .map((t) => t.text)
    .join(" ")
    .replace(/\[.*?\]/g, "") // strip [Music], [Applause] etc.
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000)

  const title = await fetchVideoTitle(videoId)

  return Response.json({ title, content: rawText, videoId })
}
