import type { PageElement, ElementType } from "./types"

export type PageType = "cover" | "content" | "back-cover"

export interface PagePreset {
  id: string
  pageType: PageType
  label: string
  description: string
  backgroundColor: string
  elements: Omit<PageElement, "id">[]
}

function el(
  type: ElementType,
  x: number, y: number, w: number, h: number,
  zIndex: number,
  content: PageElement["content"],
  styles: PageElement["styles"]
): Omit<PageElement, "id"> {
  return { type, x, y, w, h, zIndex, locked: false, content, styles }
}

// ─── Cover Presets ──────────────────────────────────────────────────────────

const coverClassic: PagePreset = {
  id: "cover-classic",
  pageType: "cover",
  label: "Classic",
  description: "Dark background with orange accent bar and centered title",
  backgroundColor: "#0f0f0f",
  elements: [
    el("shape", 0, 0, 794, 8, 1, { shapeType: "rect" }, { backgroundColor: "#F97316", opacity: 100, strokeColor: "transparent", strokeWidth: 0 }),
    el("heading", 72, 340, 650, 180, 2, { text: "Book Title" }, { fontSize: 56, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.15 }),
    el("text", 122, 530, 550, 80, 3, { text: "Subtitle or tagline" }, { fontSize: 18, color: "#a0a0a0", textAlign: "center", lineHeight: 1.5 }),
    el("divider", 297, 480, 200, 3, 4, {}, { backgroundColor: "#F97316" }),
    el("text", 222, 950, 350, 40, 5, { text: "Author Name" }, { fontSize: 16, color: "#666666", textAlign: "center" }),
  ],
}

const coverFullBleed: PagePreset = {
  id: "cover-full-bleed",
  pageType: "cover",
  label: "Full-Bleed Image",
  description: "Background image with dark gradient overlay and white title",
  backgroundColor: "#1a1a1a",
  elements: [
    el("image", 0, 0, 794, 1123, 1, { src: "", alt: "Cover background" }, { objectFit: "cover", borderRadius: 0 }),
    el("shape", 0, 500, 794, 623, 2, { shapeType: "rect" }, { backgroundColor: "#000000", opacity: 60, strokeColor: "transparent", strokeWidth: 0 }),
    el("heading", 72, 600, 650, 200, 3, { text: "Book Title" }, { fontSize: 60, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.1 }),
    el("text", 122, 810, 550, 60, 4, { text: "A compelling subtitle goes here" }, { fontSize: 20, color: "#e0e0e0", textAlign: "center", lineHeight: 1.4 }),
    el("text", 222, 950, 350, 40, 5, { text: "Author Name" }, { fontSize: 16, color: "#cccccc", textAlign: "center" }),
  ],
}

const coverMinimal: PagePreset = {
  id: "cover-minimal",
  pageType: "cover",
  label: "Minimal",
  description: "Clean dark background with large centered title only",
  backgroundColor: "#0f0f0f",
  elements: [
    el("heading", 72, 400, 650, 200, 1, { text: "Book Title" }, { fontSize: 64, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.1 }),
    el("divider", 347, 620, 100, 2, 2, {}, { backgroundColor: "#F97316" }),
    el("text", 222, 650, 350, 40, 3, { text: "Author Name" }, { fontSize: 18, color: "#888888", textAlign: "center" }),
  ],
}

// ─── Content Presets ────────────────────────────────────────────────────────

const contentStandard: PagePreset = {
  id: "content-standard",
  pageType: "content",
  label: "Standard",
  description: "White page with heading area and page number at bottom",
  backgroundColor: "#ffffff",
  elements: [
    el("heading", 72, 72, 650, 60, 1, { text: "Section Title" }, { fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "left" }),
    el("text", 72, 160, 650, 880, 2, { text: "Start writing your content here..." }, { fontSize: 16, color: "#1a1a1a", textAlign: "left", lineHeight: 1.7 }),
    el("page-number", 357, 1070, 80, 36, 3, { text: "—" }, { fontSize: 13, color: "#888888", textAlign: "center" }),
  ],
}

const contentChapterOpener: PagePreset = {
  id: "content-chapter-opener",
  pageType: "content",
  label: "Chapter Opener",
  description: "Chapter heading with orange accent and body text",
  backgroundColor: "#ffffff",
  elements: [
    el("chapter-heading", 72, 100, 650, 120, 1, { text: "Chapter Title" }, { fontSize: 48, fontWeight: 700, color: "#1a1a1a", textAlign: "left" }),
    el("text", 72, 260, 650, 780, 2, { text: "Begin your chapter content here..." }, { fontSize: 16, color: "#1a1a1a", textAlign: "left", lineHeight: 1.7 }),
    el("page-number", 357, 1070, 80, 36, 3, { text: "—" }, { fontSize: 13, color: "#888888", textAlign: "center" }),
  ],
}

const contentTwoColumn: PagePreset = {
  id: "content-two-column",
  pageType: "content",
  label: "Two-Column",
  description: "Side-by-side text columns for dense content",
  backgroundColor: "#ffffff",
  elements: [
    el("heading", 72, 72, 650, 60, 1, { text: "Section Title" }, { fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "left" }),
    el("text", 52, 160, 340, 860, 2, { text: "Left column content..." }, { fontSize: 14, color: "#1a1a1a", textAlign: "left", lineHeight: 1.6 }),
    el("text", 402, 160, 340, 860, 3, { text: "Right column content..." }, { fontSize: 14, color: "#1a1a1a", textAlign: "left", lineHeight: 1.6 }),
    el("page-number", 357, 1070, 80, 36, 4, { text: "—" }, { fontSize: 13, color: "#888888", textAlign: "center" }),
  ],
}

// ─── Back Cover Presets ─────────────────────────────────────────────────────

const backCoverAuthor: PagePreset = {
  id: "back-cover-author",
  pageType: "back-cover",
  label: "Author",
  description: "About the Author section with bio and publisher info",
  backgroundColor: "#0f0f0f",
  elements: [
    el("heading", 72, 120, 650, 60, 1, { text: "About the Author" }, { fontSize: 28, fontWeight: 600, color: "#ffffff", textAlign: "center" }),
    el("divider", 297, 200, 200, 2, 2, {}, { backgroundColor: "#F97316" }),
    el("author-bio", 72, 240, 650, 140, 3, { name: "Author Name", bio: "A brief biography about the author goes here. Share your background, expertise, and what inspired you to write this book.", src: "" }, { fontSize: 14, color: "#cccccc", backgroundColor: "#1a1a1a", padding: 20, borderRadius: 8 }),
    el("text", 72, 900, 650, 60, 4, { text: "Published by Publisher Name" }, { fontSize: 12, color: "#666666", textAlign: "center" }),
    el("shape", 594, 960, 140, 100, 5, { shapeType: "rect" }, { backgroundColor: "#333333", opacity: 100, strokeColor: "#555555", strokeWidth: 1 }),
    el("text", 594, 1065, 140, 20, 6, { text: "ISBN Placeholder" }, { fontSize: 9, color: "#666666", textAlign: "center" }),
  ],
}

const backCoverSimple: PagePreset = {
  id: "back-cover-simple",
  pageType: "back-cover",
  label: "Simple",
  description: "Centered summary with minimal design",
  backgroundColor: "#0f0f0f",
  elements: [
    el("text", 97, 300, 600, 300, 1, { text: "A brief summary of your book goes here. This is your chance to hook potential readers with a compelling description of what they'll find inside." }, { fontSize: 18, color: "#cccccc", textAlign: "center", lineHeight: 1.8 }),
    el("divider", 347, 640, 100, 2, 2, {}, { backgroundColor: "#F97316" }),
    el("text", 197, 680, 400, 40, 3, { text: "www.yourwebsite.com" }, { fontSize: 14, color: "#888888", textAlign: "center" }),
    el("text", 197, 1050, 400, 30, 4, { text: "ISBN 000-0-00-000000-0" }, { fontSize: 11, color: "#555555", textAlign: "center" }),
  ],
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const COVER_PRESETS = [coverClassic, coverFullBleed, coverMinimal]
export const CONTENT_PRESETS = [contentStandard, contentChapterOpener, contentTwoColumn]
export const BACK_COVER_PRESETS = [backCoverAuthor, backCoverSimple]

export const ALL_PRESETS: PagePreset[] = [
  ...COVER_PRESETS,
  ...CONTENT_PRESETS,
  ...BACK_COVER_PRESETS,
]

export function getPresetById(id: string): PagePreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id)
}
