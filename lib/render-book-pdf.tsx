import { renderToBuffer } from "@react-pdf/renderer"
import { BookPDF } from "./pdf-template"

interface Book {
  title: string
  genre: string
  description: string
}

interface Chapter {
  id: string
  title: string
  content: string
  position: number
}

export async function renderBookPDF(book: Book, chapters: Chapter[]) {
  return renderToBuffer(
    <BookPDF book={book} chapters={chapters} />
  )
}
