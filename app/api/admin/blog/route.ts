import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { getAllPostsAdmin, createPost } from "@/lib/blog"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  try {
    const posts = await getAllPostsAdmin()
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}
