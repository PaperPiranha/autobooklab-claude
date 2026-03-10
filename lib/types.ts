export type Book = {
  id: string
  user_id: string
  title: string
  description: string
  genre: string
  cover_image_url: string | null
  status: "draft" | "published"
  chapter_count: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: string
  book_id: string
  title: string
  content: string
  position: number
  word_count: number
  created_at: string
  updated_at: string
}
