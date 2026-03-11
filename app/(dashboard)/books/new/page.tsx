"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, BookOpen, ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react"
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
import { createBook } from "@/app/actions/books"

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

const STEPS = ["Title & Genre", "Description", "Chapters"]

type WizardData = {
  title: string
  genre: string
  description: string
  chapters: string[]
}

export default function NewBookPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isGenerating, setIsGenerating] = useState(false)

  const [data, setData] = useState<WizardData>({
    title: "",
    genre: "",
    description: "",
    chapters: ["Chapter 1"],
  })

  function nextStep() {
    setError("")
    if (step === 0) {
      if (!data.title.trim()) return setError("Book title is required")
      if (!data.genre) return setError("Please select a genre")
    }
    if (step === 2) {
      const valid = data.chapters.filter((c) => c.trim())
      if (valid.length === 0) return setError("Add at least one chapter")
      return handleCreate()
    }
    setStep((s) => s + 1)
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createBook({
        ...data,
        chapters: data.chapters.filter((c) => c.trim()),
      })
      if (result.error) {
        setError(result.error)
      } else if (result.bookId) {
        router.push(`/books/${result.bookId}`)
      }
    })
  }

  function addChapter() {
    setData((d) => ({
      ...d,
      chapters: [...d.chapters, `Chapter ${d.chapters.length + 1}`],
    }))
  }

  function removeChapter(i: number) {
    setData((d) => ({ ...d, chapters: d.chapters.filter((_, idx) => idx !== i) }))
  }

  async function generateOutline() {
    setIsGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/ai/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          genre: data.genre,
          description: data.description,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else if (Array.isArray(json.chapters) && json.chapters.length > 0) {
        setData((d) => ({ ...d, chapters: json.chapters }))
      }
    } catch {
      setError("Failed to generate outline. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function updateChapter(i: number, value: string) {
    setData((d) => {
      const chapters = [...d.chapters]
      chapters[i] = value
      return { ...d, chapters }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-8 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">New Book</h1>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((label, i) => (
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
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Title & Genre */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-2xl font-normal mb-1"
                  style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                >
                  What&apos;s your book called?
                </h2>
                <p className="text-sm text-muted-foreground">You can always change this later.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Book title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                  placeholder="e.g. The Art of Deep Work"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && nextStep()}
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select
                  value={data.genre}
                  onValueChange={(v) => setData((d) => ({ ...d, genre: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a genre…" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-2xl font-normal mb-1"
                  style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                >
                  What&apos;s it about?
                </h2>
                <p className="text-sm text-muted-foreground">
                  A short description helps AI understand your book. Optional.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
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
                <h2
                  className="text-2xl font-normal mb-1"
                  style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                >
                  Plan your chapters
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add your chapter titles. You can edit and reorder them later.
                </p>
              </div>

              {/* AI generate button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={generateOutline}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating outline…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate outline with AI
                  </>
                )}
              </Button>

              <div className="space-y-2">
                {data.chapters.map((chapter, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-muted-foreground text-right shrink-0">
                      {i + 1}
                    </span>
                    <Input
                      value={chapter}
                      onChange={(e) => updateChapter(i, e.target.value)}
                      placeholder={`Chapter ${i + 1}`}
                    />
                    {data.chapters.length > 1 && (
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={addChapter}
              >
                <Plus className="h-3.5 w-3.5" />
                Add chapter
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? router.push("/dashboard") : setStep((s) => s - 1))}
              disabled={isPending}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={nextStep} disabled={isPending} className="gap-2 min-w-28">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : step === 2 ? (
                <>
                  <BookOpen className="h-4 w-4" />
                  Create book
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
