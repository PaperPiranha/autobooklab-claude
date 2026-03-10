export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim()

  if (!query) return Response.json([])

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!accessKey) return Response.json([])

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
    if (!res.ok) return Response.json([])

    const data = await res.json()
    return Response.json(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.results ?? []).map((p: any) => ({
        id: p.id,
        url: p.urls.regular,
        thumb: p.urls.small,
        description: p.description || p.alt_description || "Photo",
        credit: p.user.name,
        creditLink: `${p.user.links.html}?utm_source=autobooklab&utm_medium=referral`,
        downloadLink: p.links.download_location,
      }))
    )
  } catch {
    return Response.json([])
  }
}
