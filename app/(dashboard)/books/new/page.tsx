"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Globe,
  FileText,
  ClipboardPaste,
  Bot,
  AlertCircle,
  Upload,
  Youtube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBook, createBookFromImport } from "@/app/actions/books"

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Business",
  "Self-Help",
  "Biography",
  "Technology",
  "Science",
  "History",
  "Health & Wellness",
  "Children's",
  "Poetry",
  "Other",
]

const AI_STEPS = ["Title & Genre", "Description", "Chapters"]

type Source = "ai" | "url" | "pdf" | "paste" | "youtube" | null

type WizardData = {
  title: string
  genre: string
  description: string
  chapters: string[]
}

type UrlImportState = "input" | "loading" | "preview"

// ─────────────────────────────────────────────────────────────
// Source selection cards
// ─────────────────────────────────────────────────────────────
const SOURCES = [
  {
    id: "ai" as Source,
    icon: Bot,
    label: "AI Generate",
    description: "Start from scratch — AI writes your chapters",
  },
  {
    id: "url" as Source,
    icon: Globe,
    label: "URL / Blog",
    description: "Import content from any webpage or blog post",
  },
  {
    id: "pdf" as Source,
    icon: FileText,
    label: "PDF / Doc",
    description: "Upload a PDF and extract its text",
  },
  {
    id: "paste" as Source,
    icon: ClipboardPaste,
    label: "Paste Text",
    description: "Paste your own content to reformat as an eBook",
  },
  {
    id: "youtube" as Source,
    icon: Youtube,
    label: "YouTube",
    description: "Turn a video transcript into an eBook chapter",
  },
]

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function NewBookPage() {
  const router = useRouter()
  const [source, setSource] = useState<Source>(null)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // ── AI wizard state ──────────────────────────────────────
  const [step, setStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData>({
    title: "",
    genre: "",
    description: "",
    chapters: ["Chapter 1"],
  })

  // ── URL import state ─────────────────────────────────────
  const [urlState, setUrlState] = useState<UrlImportState>("input")
  const [urlInput, setUrlInput] = useState("")
  const [urlData, setUrlData] = useState({ title: "", content: "", genre: "" })

  // ── PDF import state ─────────────────────────────────────
  const [pdfTitle, setPdfTitle] = useState("")
  const [pdfGenre, setPdfGenre] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Paste import state ───────────────────────────────────
  const [pasteTitle, setPasteTitle] = useState("")
  const [pasteGenre, setPasteGenre] = useState("")
  const [pasteContent, setPasteContent] = useState("")

  // ── YouTube import state ─────────────────────────────────
  const [ytInput, setYtInput] = useState("")
  const [ytState, setYtState] = useState<"input" | "loading" | "preview">("input")
  const [ytData, setYtData] = useState({ title: "", content: "", genre: "" })

  // ─────────────────────────────────────────────────────────
  // AI wizard helpers
  // ─────────────────────────────────────────────────────────
  function nextAiStep() {
    setError("")
    if (step === 0) {
      if (!wizardData.title.trim()) return setError("Book title is required")
      if (!wizardData.genre) return setError("Please select a genre")
    }
    if (step === 2) {
      const valid = wizardData.chapters.filter((c) => c.trim())
      if (valid.length === 0) return setError("Add at least one chapter")
      return handleAiCreate()
    }
    setStep((s) => s + 1)
  }

  function handleAiCreate() {
    startTransition(async () => {
      const result = await createBook({
        ...wizardData,
        chapters: wizardData.chapters.filter((c) => c.trim()),
      })
      if (result.error) setError(result.error)
      else if (result.bookId) router.push(`/books/${result.bookId}`)
    })
  }

  function addChapter() {
    setWizardData((d) => ({
      ...d,
      chapters: [...d.chapters, `Chapter ${d.chapters.length + 1}`],
    }))
  }

  function removeChapter(i: number) {
    setWizardData((d) => ({ ...d, chapters: d.chapters.filter((_, idx) => idx !== i) }))
  }

  function updateChapter(i: number, value: string) {
    setWizardData((d) => {
      const chapters = [...d.chapters]
      chapters[i] = value
      return { ...d, chapters }
    })
  }

  async function generateOutline() {
    setIsGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/ai/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: wizardData.title,
          genre: wizardData.genre,
          description: wizardData.description,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else if (Array.isArray(json.chapters) && json.chapters.length > 0) {
        setWizardData((d) => ({ ...d, chapters: json.chapters }))
      }
    } catch {
      setError("Failed to generate outline. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // URL import helpers
  // ─────────────────────────────────────────────────────────
  async function handleUrlImport() {
    if (!urlInput.trim()) return setError("Please enter a URL")
    setError("")
    setUrlState("loading")
    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        setUrlState("input")
        return
      }
      setUrlData({ title: json.title || urlInput, content: json.content, genre: "" })
      setUrlState("preview")
    } catch {
      setError("Something went wrong. Please try again.")
      setUrlState("input")
    }
  }

  function handleUrlCreate() {
    if (!urlData.title.trim()) return setError("Please add a book title")
    setError("")
    startTransition(async () => {
      const result = await createBookFromImport({
        title: urlData.title,
        genre: urlData.genre,
        description: `Imported from ${urlInput}`,
        chapterTitle: "Imported Content",
        content: urlData.content,
      })
      if (result.error) setError(result.error)
      else if (result.bookId) router.push(`/books/${result.bookId}`)
    })
  }

  // ─────────────────────────────────────────────────────────
  // PDF import helpers
  // ─────────────────────────────────────────────────────────
  async function handlePdfCreate() {
    if (!pdfTitle.trim()) return setError("Please enter a book title")
    if (!pdfFile) return setError("Please select a PDF file")
    setError("")
    setIsUploadingPdf(true)
    try {
      const form = new FormData()
      form.append("file", pdfFile)
      const res = await fetch("/api/import/pdf", { method: "POST", body: form })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        return
      }
      startTransition(async () => {
        const result = await createBookFromImport({
          title: pdfTitle,
          genre: pdfGenre,
          description: `Extracted from ${pdfFile.name}`,
          chapterTitle: "Extracted Content",
          content: json.content,
        })
        if (result.error) setError(result.error)
        else if (result.bookId) router.push(`/books/${result.bookId}`)
      })
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setIsUploadingPdf(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // Paste import helpers
  // ─────────────────────────────────────────────────────────
  function handlePasteCreate() {
    if (!pasteTitle.trim()) return setError("Please enter a book title")
    if (!pasteContent.trim()) return setError("Please paste some content")
    setError("")
    startTransition(async () => {
      const result = await createBookFromImport({
        title: pasteTitle,
        genre: pasteGenre,
        description: "",
        chapterTitle: "Chapter 1",
        content: pasteContent,
      })
      if (result.error) setError(result.error)
      else if (result.bookId) router.push(`/books/${result.bookId}`)
    })
  }

  // ─────────────────────────────────────────────────────────
  // YouTube import helpers
  // ─────────────────────────────────────────────────────────
  async function handleYoutubeImport() {
    if (!ytInput.trim()) return setError("Please enter a YouTube URL or video ID")
    setError("")
    setYtState("loading")
    try {
      const res = await fetch("/api/import/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytInput.trim() }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        setYtState("input")
        return
      }
      setYtData({ title: json.title || ytInput, content: json.content, genre: "" })
      setYtState("preview")
    } catch {
      setError("Something went wrong. Please try again.")
      setYtState("input")
    }
  }

  function handleYoutubeCreate() {
    if (!ytData.title.trim()) return setError("Please add a book title")
    setError("")
    startTransition(async () => {
      const result = await createBookFromImport({
        title: ytData.title,
        genre: ytData.genre,
        description: `Transcript imported from YouTube`,
        chapterTitle: "Video Transcript",
        content: ytData.content,
      })
      if (result.error) setError(result.error)
      else if (result.bookId) router.push(`/books/${result.bookId}`)
    })
  }

  // ─────────────────────────────────────────────────────────
  // Back navigation
  // ─────────────────────────────────────────────────────────
  function handleBack() {
    setError("")
    if (source === null) {
      router.push("/dashboard")
    } else if (source === "ai" && step > 0) {
      setStep((s) => s - 1)
    } else if (source === "url" && urlState === "preview") {
      setUrlState("input")
    } else if (source === "youtube" && ytState === "preview") {
      setYtState("input")
    } else {
      setSource(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-8 py-4">
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={isPending || isUploadingPdf}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">New Book</h1>
          <p className="text-sm text-muted-foreground">
            {source === null && "Choose how to create your book"}
            {source === "ai" && `Step ${step + 1} of ${AI_STEPS.length} — ${AI_STEPS[step]}`}
            {source === "url" && (urlState === "preview" ? "Review & create" : "Import from URL")}
            {source === "pdf" && "Upload a PDF"}
            {source === "paste" && "Paste your content"}
            {source === "youtube" && (ytState === "preview" ? "Review & create" : "Import from YouTube")}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Source picker ─────────────────────────────── */}
          {source === null && <SourcePicker onSelect={(s) => { setError(""); setSource(s) }} />}

          {/* ── AI wizard ─────────────────────────────────── */}
          {source === "ai" && (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {AI_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        i < step
                          ? "bg-primary text-primary-foreground"
                          : i === step
                          ? "bg-primary/20 text-primary ring-1 ring-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-sm hidden sm:block ${
                        i === step ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    {i < AI_STEPS.length - 1 && (
                      <div className={`h-px w-8 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Title & Genre */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-normal mb-1">What&apos;s your book called?</h2>
                    <p className="text-sm text-muted-foreground">You can always change this later.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Book title</Label>
                    <Input
                      id="title"
                      value={wizardData.title}
                      onChange={(e) => setWizardData((d) => ({ ...d, title: e.target.value }))}
                      placeholder="e.g. The Art of Deep Work"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && nextAiStep()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <GenreSelect
                      value={wizardData.genre}
                      onChange={(v) => setWizardData((d) => ({ ...d, genre: v }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Description */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-normal mb-1">What&apos;s it about?</h2>
                    <p className="text-sm text-muted-foreground">
                      A short description helps AI understand your book. Optional.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={wizardData.description}
                      onChange={(e) => setWizardData((d) => ({ ...d, description: e.target.value }))}
                      placeholder="A practical guide to achieving focused, high-quality work in a distracted world…"
                      rows={5}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Chapters */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-normal mb-1">Plan your chapters</h2>
                    <p className="text-sm text-muted-foreground">
                      Add your chapter titles. You can edit and reorder them later.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={generateOutline}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating outline…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" />Generate outline with AI</>
                    )}
                  </Button>
                  <div className="space-y-2">
                    {wizardData.chapters.map((chapter, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
                        <Input
                          value={chapter}
                          onChange={(e) => updateChapter(i, e.target.value)}
                          placeholder={`Chapter ${i + 1}`}
                        />
                        {wizardData.chapters.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeChapter(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addChapter}>
                    <Plus className="h-3.5 w-3.5" />
                    Add chapter
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={isPending}>
                  {step === 0 ? "← All sources" : "Back"}
                </Button>
                <Button onClick={nextAiStep} disabled={isPending} className="gap-2 min-w-28">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                  ) : step === 2 ? (
                    <><BookOpen className="h-4 w-4" />Create book</>
                  ) : (
                    <>Next<ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ── URL import ────────────────────────────────── */}
          {source === "url" && urlState === "input" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Import from a URL</h2>
                <p className="text-sm text-muted-foreground">
                  Paste any blog post, article, or webpage URL to extract its content.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack}>← All sources</Button>
                <Button onClick={handleUrlImport} className="gap-2">
                  <Globe className="h-4 w-4" />
                  Import
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {source === "url" && urlState === "loading" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching content from {urlInput}…</p>
            </div>
          )}

          {source === "url" && urlState === "preview" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Review import</h2>
                <p className="text-sm text-muted-foreground">
                  Edit the title and genre, then create your book.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url-title">Book title</Label>
                <Input
                  id="url-title"
                  value={urlData.title}
                  onChange={(e) => setUrlData((d) => ({ ...d, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <GenreSelect
                  value={urlData.genre}
                  onChange={(v) => setUrlData((d) => ({ ...d, genre: v }))}
                />
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Content preview</p>
                <p className="text-xs text-muted-foreground line-clamp-5 leading-relaxed">
                  {urlData.content.slice(0, 400)}…
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{urlData.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={isPending}>Back</Button>
                <Button onClick={handleUrlCreate} disabled={isPending} className="gap-2 min-w-32">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                  ) : (
                    <><BookOpen className="h-4 w-4" />Create book</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── PDF import ────────────────────────────────── */}
          {source === "pdf" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Upload a PDF</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll extract the text and create a book you can edit and export.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-title">Book title</Label>
                <Input
                  id="pdf-title"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="e.g. My Business Report"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <GenreSelect value={pdfGenre} onChange={setPdfGenre} />
              </div>
              <div className="space-y-2">
                <Label>PDF file</Label>
                <div
                  className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                    pdfFile
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className={`h-6 w-6 ${pdfFile ? "text-primary" : "text-muted-foreground"}`} />
                  {pdfFile ? (
                    <>
                      <p className="text-sm font-medium">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(1)} MB · Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to choose a PDF</p>
                      <p className="text-xs text-muted-foreground">Max 10 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setPdfFile(f)
                      if (!pdfTitle) setPdfTitle(f.name.replace(/\.pdf$/i, ""))
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={isUploadingPdf || isPending}>
                  ← All sources
                </Button>
                <Button
                  onClick={handlePdfCreate}
                  disabled={isUploadingPdf || isPending || !pdfFile}
                  className="gap-2 min-w-36"
                >
                  {isUploadingPdf || isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Extracting…</>
                  ) : (
                    <><FileText className="h-4 w-4" />Upload &amp; Create</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Paste import ──────────────────────────────── */}
          {source === "paste" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Paste your content</h2>
                <p className="text-sm text-muted-foreground">
                  Paste text from any source — we&apos;ll create a book you can style and export.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-title">Book title</Label>
                <Input
                  id="paste-title"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. My Guide to Productivity"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <GenreSelect value={pasteGenre} onChange={setPasteGenre} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-content">Content</Label>
                <Textarea
                  id="paste-content"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste your text here…"
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                {pasteContent && (
                  <p className="text-xs text-muted-foreground text-right">
                    ~{pasteContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={isPending}>← All sources</Button>
                <Button onClick={handlePasteCreate} disabled={isPending} className="gap-2 min-w-32">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                  ) : (
                    <><BookOpen className="h-4 w-4" />Create book</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── YouTube import ────────────────────────────── */}
          {source === "youtube" && ytState === "input" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Import from YouTube</h2>
                <p className="text-sm text-muted-foreground">
                  Paste a YouTube URL or video ID to extract the transcript.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yt-url">YouTube URL or video ID</Label>
                <Input
                  id="yt-url"
                  value={ytInput}
                  onChange={(e) => setYtInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=… or dQw4w9WgXcQ"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleYoutubeImport()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Works with any video that has auto-generated or manual captions enabled.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack}>← All sources</Button>
                <Button onClick={handleYoutubeImport} className="gap-2">
                  <Youtube className="h-4 w-4" />
                  Import transcript
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {source === "youtube" && ytState === "loading" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching transcript…</p>
            </div>
          )}

          {source === "youtube" && ytState === "preview" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Review import</h2>
                <p className="text-sm text-muted-foreground">
                  Edit the title and genre, then create your book.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yt-title">Book title</Label>
                <Input
                  id="yt-title"
                  value={ytData.title}
                  onChange={(e) => setYtData((d) => ({ ...d, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <GenreSelect
                  value={ytData.genre}
                  onChange={(v) => setYtData((d) => ({ ...d, genre: v }))}
                />
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Transcript preview</p>
                <p className="text-xs text-muted-foreground line-clamp-5 leading-relaxed">
                  {ytData.content.slice(0, 400)}…
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{ytData.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={isPending}>Back</Button>
                <Button onClick={handleYoutubeCreate} disabled={isPending} className="gap-2 min-w-32">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                  ) : (
                    <><BookOpen className="h-4 w-4" />Create book</>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function SourcePicker({ onSelect }: { onSelect: (s: Source) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-normal mb-1">How do you want to create your book?</h2>
        <p className="text-sm text-muted-foreground">Choose a source to get started.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SOURCES.map(({ id, icon: Icon, label, description }, i) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              // Last card spans full width when total is odd
              i === SOURCES.length - 1 && SOURCES.length % 2 !== 0 ? "col-span-2 flex-row items-center gap-4" : ""
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5">{label}</p>
              <p className="text-xs text-muted-foreground leading-snug">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function GenreSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a genre… (optional)" />
      </SelectTrigger>
      <SelectContent>
        {GENRES.map((g) => (
          <SelectItem key={g} value={g}>
            {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
