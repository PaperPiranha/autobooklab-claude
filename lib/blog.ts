import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface BlogPost {
  id: string
  title: string
  slug: string
  description: string
  content: string
  author: string
  tags: string[]
  cover_image_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type BlogPostInsert = {
  title: string
  slug: string
  description: string
  content: string
  author: string
  tags: string[]
  cover_image_url?: string | null
  published: boolean
  published_at?: string | null
}

export type BlogPostUpdate = Partial<BlogPostInsert>

// --- Public (respects RLS) ---

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single()
  if (error) return null
  return data
}

// --- Admin (bypasses RLS) ---

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data
}

export async function createPost(post: BlogPostInsert): Promise<BlogPost> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      ...post,
      published_at: post.published ? new Date().toISOString() : null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePost(
  id: string,
  updates: BlogPostUpdate
): Promise<BlogPost> {
  const admin = createAdminClient()
  // If publishing for the first time, set published_at
  if (updates.published === true) {
    const existing = await getPostById(id)
    if (existing && !existing.published_at) {
      updates.published_at = new Date().toISOString()
    }
  }
  const { data, error } = await admin
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePost(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("blog_posts").delete().eq("id", id)
  if (error) throw error
}
