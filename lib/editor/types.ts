export type ElementType =
  | "text"
  | "heading"
  | "image"
  | "chapter-heading"
  | "captioned-image"
  | "divider"
  | "callout"
  | "page-number"
  | "table"
  | "toc"
  | "shape"

export interface ElementContent {
  text?: string
  src?: string
  alt?: string
  caption?: string
  rows?: string[][]          // for table: 2D array of cell text
  shapeType?: "rect" | "circle" | "line"  // for shape
  cols?: number              // for table: number of columns
}

export interface ElementStyles {
  fontSize?: number
  fontWeight?: string | number
  color?: string
  backgroundColor?: string
  textAlign?: "left" | "center" | "right"
  fontFamily?: string
  padding?: number
  borderRadius?: number
  objectFit?: "cover" | "contain" | "fill"
  opacity?: number
  lineHeight?: number
  borderColor?: string
  borderWidth?: number
  italic?: boolean
  strokeColor?: string       // for shapes: border/stroke color
  strokeWidth?: number       // for shapes: stroke width
  fillColor?: string         // for shapes: fill color (alias for backgroundColor)
}

export interface PageElement {
  id: string
  type: ElementType
  x: number
  y: number
  w: number
  h: number
  content: ElementContent
  styles: ElementStyles
  zIndex: number
  locked?: boolean
}

export interface EditorPage {
  id: string
  bookId: string
  orderIndex: number
  name: string
  backgroundColor: string
  elements: PageElement[]
  createdAt: string
  updatedAt: string
}

export const PAGE_W = 794
export const PAGE_H = 1123
