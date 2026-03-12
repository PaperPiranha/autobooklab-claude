"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Upload, Trash2, Image as ImageIcon, AlertCircle, Sparkles, Wand2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEditor, makeDefaultElement } from "../editor-context"

interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  description: string
  credit: string
  creditLink: string
}

interface MyImage {
  url: string
  name: string
  size: number
}

interface ImagesTabProps {
  bookId: string
  bookTitle: string
  bookGenre: string
}

type SubTab = "suggested" | "mine" | "ai-generate"

const AI_STYLE_PRESETS = [
  { label: "Photographic", value: "photographic, realistic photography" },
  { label: "Illustration", value: "digital illustration, detailed artwork" },
  { label: "Abstract", value: "abstract art, geometric shapes, modern" },
  { label: "Minimalist", value: "minimalist, clean, simple composition" },
]

export function ImagesTab({ bookId, bookTitle, bookGenre }: ImagesTabProps) {
  const { state, dispatch } = useEditor()
  const [subTab, setSubTab] = useState<SubTab>("suggested")

  // Unsplash
  const [query, setQuery] = useState("")
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoPage, setPhotoPage] = useState(1)
  const [photoTotalPages, setPhotoTotalPages] = useState(0)
  const [photoError, setPhotoError] = useState("")
  const [loadingMore, setLoadingMore] = useState(false)
  const didAutoSearch = useRef(false)

  // My images
  const [myImages, setMyImages] = useState<MyImage[]>([])
  const [myImagesLoading, setMyImagesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Generate
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiStyle, setAiStyle] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState("")
  const [aiError, setAiError] = useState("")
  const didAutoFillPrompt = useRef(false)

  // Auto-search on suggested tab open
  useEffect(() => {
    if (subTab === "suggested" && !didAutoSearch.current && !photos.length) {
      const autoQuery = [bookTitle, bookGenre].filter(Boolean).join(" ")
      if (autoQuery) {
        setQuery(autoQuery)
        didAutoSearch.current = true
        doSearch(autoQuery, 1)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab])

  // Load my images when sub tab opened
  useEffect(() => {
    if (subTab === "mine") {
      loadMyImages()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab])

  // Auto-fill AI prompt
  useEffect(() => {
    if (subTab === "ai-generate" && !didAutoFillPrompt.current) {
      const autoPrompt = [bookTitle, bookGenre].filter(Boolean).join(", ")
      if (autoPrompt) {
        setAiPrompt(`Book cover for "${autoPrompt}"`)
        didAutoFillPrompt.current = true
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab])

  async function doSearch(q: string, page: number) {
    setPhotoLoading(true)
    setPhotoError("")
    try {
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(q)}&page=${page}`)
      const data = await res.json()
      if (page === 1) setPhotos(data.photos ?? [])
      else setPhotos((prev) => [...prev, ...(data.photos ?? [])])
      setPhotoTotalPages(data.totalPages ?? 0)
      setPhotoPage(page)
    } catch {
      setPhotoError("Failed to search images.")
    } finally {
      setPhotoLoading(false)
    }
  }

  async function loadMorePhotos() {
    setLoadingMore(true)
    try {
      await doSearch(query, photoPage + 1)
    } finally {
      setLoadingMore(false)
    }
  }

  async function loadMyImages() {
    setMyImagesLoading(true)
    try {
      const res = await fetch(`/api/images/mine?bookId=${bookId}`)
      const data = await res.json()
      setMyImages(data.images ?? [])
    } catch {
      // ignore
    } finally {
      setMyImagesLoading(false)
    }
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError("")
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("bookId", bookId)
      const res = await fetch("/api/images/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      await loadMyImages()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function insertPhoto(url: string, alt?: string) {
    const { selectedElementId, pages, activePageId } = state
    const activePage = pages.find((p) => p.id === activePageId)
    const selected = activePage?.elements.find((e) => e.id === selectedElementId)

    if (selected && (selected.type === "image" || selected.type === "captioned-image")) {
      dispatch({
        type: "UPDATE_ELEMENT",
        elementId: selectedElementId!,
        updates: { content: { ...selected.content, src: url, alt: alt ?? "" } },
      })
    } else {
      const el = makeDefaultElement("image")
      dispatch({
        type: "ADD_ELEMENT",
        element: { ...el, content: { src: url, alt: alt ?? "" } },
      })
    }
  }

  function insertAsCoverBackground(url: string) {
    const { pages, activePageId } = state
    const activePage = pages.find((p) => p.id === activePageId)
    if (!activePage?.isCover) {
      // Switch to cover page first if not already there
      const coverPage = pages.find((p) => p.isCover)
      if (coverPage) {
        dispatch({ type: "SET_ACTIVE_PAGE", pageId: coverPage.id })
      }
    }

    // Insert full-bleed background image at z-index 0
    const el = makeDefaultElement("image")
    dispatch({
      type: "ADD_ELEMENT",
      element: {
        ...el,
        x: 0,
        y: 0,
        w: 794,
        h: 1123,
        zIndex: 0,
        content: { src: url, alt: "Cover background" },
        styles: { objectFit: "cover", borderRadius: 0 },
      },
    })
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    setAiError("")
    setAiGeneratedUrl("")
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, bookId, style: aiStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setAiGeneratedUrl(data.url)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setAiGenerating(false)
    }
  }

  async function deleteMyImage(name: string) {
    try {
      await fetch(`/api/images/mine?bookId=${bookId}&name=${encodeURIComponent(name)}`, { method: "DELETE" })
      await loadMyImages()
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub tabs */}
      <div className="flex gap-0.5 p-2 border-b border-border">
        {(["suggested", "mine", "ai-generate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "flex-1 rounded py-1 text-xs font-medium transition-colors",
              subTab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "suggested" ? "Suggested" : t === "mine" ? "My Images" : (
              <span className="flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Suggested */}
      {subTab === "suggested" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex gap-2 p-2 border-b border-border">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Unsplash..."
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === "Enter" && doSearch(query, 1)}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 shrink-0"
              onClick={() => doSearch(query, 1)}
              disabled={photoLoading || !query.trim()}
            >
              {photoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {photoError && (
              <div className="flex items-center gap-2 text-xs text-destructive py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                {photoError}
              </div>
            )}
            {photos.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => insertPhoto(photo.url, photo.description)}
                      className="group relative aspect-video overflow-hidden rounded-md border border-border hover:border-primary/60 transition-colors"
                      title={`${photo.description} — by ${photo.credit}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumb}
                        alt={photo.description}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
                {photoPage < photoTotalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs mt-2"
                    onClick={loadMorePhotos}
                    disabled={loadingMore}
                  >
                    {loadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                    Load more
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-2">Photos from Unsplash. Click to insert.</p>
              </>
            ) : !photoLoading ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                {query ? "No results found." : "Search for photos above"}
              </p>
            ) : null}
            {photoLoading && photos.length === 0 && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Images */}
      {subTab === "mine" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs h-7"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Uploading..." : "Upload image"}
            </Button>
            {uploadError && (
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {myImagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : myImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs text-center">No images yet. Upload one above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {myImages.map((img) => (
                  <div key={img.name} className="group relative aspect-video overflow-hidden rounded-md border border-border">
                    <button
                      onClick={() => insertPhoto(img.url, img.name)}
                      className="w-full h-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                    <button
                      onClick={() => deleteMyImage(img.name)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Generate */}
      {subTab === "ai-generate" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3 space-y-3 border-b border-border">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Describe your cover image
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="A dramatic mountain landscape at sunset..."
                className="w-full h-16 text-xs bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={500}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {AI_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAiStyle(aiStyle === preset.value ? "" : preset.value)}
                    className={cn(
                      "text-[10px] py-1.5 px-2 rounded border transition-colors",
                      aiStyle === preset.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/60"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
            >
              {aiGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              {aiGenerating ? "Generating..." : "Generate image"}
              <span className="text-[10px] opacity-70">(3 credits)</span>
            </Button>

            {aiError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {aiError}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {aiGeneratedUrl ? (
              <div className="space-y-2">
                <div className="aspect-[1024/1792] w-full overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aiGeneratedUrl}
                    alt="AI generated cover"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => insertPhoto(aiGeneratedUrl, "AI generated image")}
                  >
                    Insert
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => insertAsCoverBackground(aiGeneratedUrl)}
                  >
                    Use as cover
                  </Button>
                </div>
              </div>
            ) : !aiGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Wand2 className="h-8 w-8 opacity-30" />
                <p className="text-xs text-center">Enter a prompt above to generate a cover image with DALL-E 3</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Generating your image...</p>
                <p className="text-[10px] text-muted-foreground/60">This may take 10-20 seconds</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
