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

  const { url } = await req.json()

  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "Please enter a valid URL starting with http:// or https://" }, { status: 400 })
  }

  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AutoBookLab/1.0; +https://autobooklab.com)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return Response.json(
        { error: `Could not fetch the URL (HTTP ${res.status}). Check the address and try again.` },
        { status: 422 }
      )
    }
    html = await res.text()
  } catch {
    return Response.json({ error: "Could not reach that URL. It may be blocked or unavailable." }, { status: 422 })
  }

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const rawTitle = titleMatch?.[1]?.trim() ?? ""
  // Strip common suffixes like " | Site Name" or " - Blog"
  const title = rawTitle.replace(/\s*[|\-–—]\s*.{1,50}$/, "").trim()

  // Remove scripts, styles, nav, footer, header noise
  const content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000)

  return Response.json({ title, content })
}
