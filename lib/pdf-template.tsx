import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

// Built-in PDF fonts — no network fetch needed
Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 80,
    paddingHorizontal: 72,
    backgroundColor: "#ffffff",
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#1a1a1a",
    lineHeight: 1.7,
  },
  // ── Title page ──────────────────────────────────────────────
  titlePage: {
    paddingTop: 160,
    paddingBottom: 80,
    paddingHorizontal: 80,
    backgroundColor: "#0f0f0f",
  },
  titlePageLabel: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#f97316",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  titlePageTitle: {
    fontFamily: "Times-Roman",
    fontSize: 38,
    color: "#ffffff",
    lineHeight: 1.25,
    marginBottom: 20,
  },
  titlePageGenre: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#888888",
    marginBottom: 48,
  },
  titlePageDescription: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#aaaaaa",
    lineHeight: 1.65,
    maxWidth: 340,
  },
  titlePageFooter: {
    position: "absolute",
    bottom: 56,
    left: 80,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#555555",
  },
  // ── Chapter header ────────────────────────────────────────
  chapterHeader: {
    marginBottom: 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    borderBottomStyle: "solid",
  },
  chapterNumber: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#f97316",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chapterTitle: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    lineHeight: 1.25,
    color: "#111111",
  },
  // ── Body elements ─────────────────────────────────────────
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  h1: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    color: "#111111",
  },
  h2: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginTop: 20,
    marginBottom: 6,
    color: "#222222",
  },
  h3: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
    color: "#333333",
  },
  blockquote: {
    fontFamily: "Times-Italic",
    fontSize: 11,
    color: "#555555",
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#f97316",
    borderLeftStyle: "solid",
    lineHeight: 1.7,
  },
  listItem: {
    marginBottom: 4,
    paddingLeft: 14,
  },
  hr: {
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    borderBottomStyle: "solid",
  },
  // ── Page number ───────────────────────────────────────────
  pageNumber: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#aaaaaa",
  },
})

// ── HTML → structured blocks ──────────────────────────────────

type Block =
  | { type: "h1" | "h2" | "h3" | "p" | "blockquote" | "li"; text: string }
  | { type: "hr" }

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripInline(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim()
}

export function htmlToBlocks(html: string): Block[] {
  if (!html) return []
  const blocks: Block[] = []

  const blockRe =
    /<(h[1-3]|p|blockquote|li|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr[^>]*\/?>/gi
  let m: RegExpExecArray | null

  while ((m = blockRe.exec(html)) !== null) {
    const tag = (m[1] ?? "hr").toLowerCase()
    const inner = m[3] ?? ""

    if (tag === "hr") {
      blocks.push({ type: "hr" })
      continue
    }

    if (tag === "blockquote") {
      // Recurse: blockquote often wraps a <p>
      const inner2 = inner.replace(/<\/?p>/gi, "").trim()
      const text = stripInline(inner2)
      if (text) blocks.push({ type: "blockquote", text })
      continue
    }

    const text = stripInline(inner)
    if (text) {
      blocks.push({ type: tag as "h1" | "h2" | "h3" | "p" | "li", text })
    }
  }

  return blocks
}

// ── React-PDF renderers ────────────────────────────────────────

function RenderBlock({ block }: { block: Block }) {
  if (block.type === "hr") return <View style={styles.hr} />
  if (block.type === "h1") return <Text style={styles.h1}>{block.text}</Text>
  if (block.type === "h2") return <Text style={styles.h2}>{block.text}</Text>
  if (block.type === "h3") return <Text style={styles.h3}>{block.text}</Text>
  if (block.type === "blockquote")
    return <Text style={styles.blockquote}>{block.text}</Text>
  if (block.type === "li")
    return (
      <View style={styles.listItem}>
        <Text style={styles.paragraph}>• {block.text}</Text>
      </View>
    )
  // paragraph
  return <Text style={styles.paragraph}>{block.text}</Text>
}

// ── Main document ─────────────────────────────────────────────

interface BookPDFProps {
  book: { title: string; genre: string; description: string }
  chapters: { id: string; title: string; content: string; position: number }[]
}

export function BookPDF({ book, chapters }: BookPDFProps) {
  return (
    <Document
      title={book.title}
      author="AutoBookLab"
      subject={book.description}
    >
      {/* Title page */}
      <Page size="A4" style={styles.titlePage}>
        <Text style={styles.titlePageLabel}>eBook</Text>
        <Text style={styles.titlePageTitle}>{book.title}</Text>
        {book.genre && (
          <Text style={styles.titlePageGenre}>{book.genre}</Text>
        )}
        {book.description && (
          <Text style={styles.titlePageDescription}>{book.description}</Text>
        )}
        <Text style={styles.titlePageFooter}>
          Created with AutoBookLab · {new Date().getFullYear()}
        </Text>
      </Page>

      {/* Chapter pages */}
      {chapters.map((chapter, i) => {
        const blocks = htmlToBlocks(chapter.content)
        return (
          <Page key={chapter.id} size="A4" style={styles.page}>
            {/* Chapter heading */}
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterNumber}>
                Chapter {i + 1}
              </Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>

            {/* Content blocks */}
            {blocks.length > 0 ? (
              blocks.map((block, j) => <RenderBlock key={j} block={block} />)
            ) : (
              <Text style={{ ...styles.paragraph, color: "#aaaaaa", fontFamily: "Times-Italic" }}>
                (No content yet)
              </Text>
            )}

            {/* Page number */}
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
              fixed
            />
          </Page>
        )
      })}
    </Document>
  )
}
