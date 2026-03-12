"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
  Save,
  Eye,
  Pencil,
  Sparkles,
  ImagePlus,
  Loader2,
  Search,
  ImageIcon,
} from "lucide-react"

interface BlogEditorProps {
  initialData?: {
    id: string
    title: string
    slug: string
    description: string
    content: string
    author: string
    tags: string[]
    cover_image_url: string | null
    published: boolean
  }
}

interface UnsplashImage {
  id: string
  url: string
  thumb: string
  description: string
  credit: string
  creditLink: string
}

export function BlogEditor({ initialData }: BlogEditorProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState(initialData?.title ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [author, setAuthor] = useState(
    initialData?.author ?? "AutoBookLab Team"
  )
  const [tagsStr, setTagsStr] = useState(initialData?.tags?.join(", ") ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? ""
  )
  const [published, setPublished] = useState(initialData?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // AI generation state
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiTone, setAiTone] = useState("professional")
  const [aiLength, setAiLength] = useState("medium")
  const [aiIncludeImages, setAiIncludeImages] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Cover generation state
  const [generatingCover, setGeneratingCover] = useState(false)

  // Unsplash picker state
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imageQuery, setImageQuery] = useState("")
  const [imageResults, setImageResults] = useState<UnsplashImage[]>([])
  const [searchingImages, setSearchingImages] = useState(false)

  useEffect(() => {
    if (!isEditing && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 80)
      )
    }
  }, [title, isEditing])

  async function handleSave() {
    setSaving(true)
    try {
      const tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const body = {
        title,
        slug,
        description,
        content,
        author,
        tags,
        cover_image_url: coverImageUrl || null,
        published,
      }

      const url = isEditing
        ? `/api/admin/blog/${initialData.id}`
        : "/api/admin/blog"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save")
      }

      router.push("/admin/blog")
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    if (!aiTopic.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          length: aiLength,
          includeImages: aiIncludeImages,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Generation failed")
      }

      const data = await res.json()
      setTitle(data.title || aiTopic)
      setDescription(data.description || "")
      setTagsStr((data.tags || []).join(", "))
      setSlug(data.slug || "")
      setContent(data.content || "")
      setShowAiDialog(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate")
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateCover() {
    if (!title.trim()) {
      alert("Add a title first")
      return
    }
    setGeneratingCover(true)
    try {
      const res = await fetch("/api/admin/blog/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Cover generation failed")
      }

      const data = await res.json()
      setCoverImageUrl(data.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate cover")
    } finally {
      setGeneratingCover(false)
    }
  }

  async function handleImageSearch() {
    if (!imageQuery.trim()) return
    setSearchingImages(true)
    try {
      const res = await fetch(
        `/api/images/search?query=${encodeURIComponent(imageQuery)}`
      )
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setImageResults(data.images || [])
    } catch {
      setImageResults([])
    } finally {
      setSearchingImages(false)
    }
  }

  function insertImageAtCursor(image: UnsplashImage) {
    const markdown = `\n\n![${image.description || imageQuery}](${image.url})\n*Photo by [${image.credit}](${image.creditLink}) on Unsplash*\n\n`

    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const before = content.slice(0, start)
      const after = content.slice(start)
      setContent(before + markdown + after)
    } else {
      setContent(content + markdown)
    }
    setShowImagePicker(false)
  }

  function insertImageAsCover(image: UnsplashImage) {
    setCoverImageUrl(image.url)
    setShowImagePicker(false)
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Post" : "New Post"}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setAiTopic(title || "")
              setShowAiDialog(true)
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <div className="flex items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label className="text-sm">
              {published ? "Published" : "Draft"}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={saving || !title || !slug}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="post-slug"
          />
        </div>
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="guides, ai, tutorial"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short description for cards and SEO"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="cover">Cover Image</Label>
          <div className="flex gap-2">
            <Input
              id="cover"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImageQuery(title || "blog")
                setShowImagePicker(true)
              }}
            >
              <Search className="h-4 w-4 mr-1" />
              Unsplash
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCover}
              disabled={generatingCover}
            >
              {generatingCover ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-1" />
              )}
              {generatingCover ? "Generating..." : "AI Cover"}
            </Button>
          </div>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="mt-2 rounded-lg max-h-40 object-cover"
            />
          )}
        </div>
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={!previewMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setPreviewMode(false)}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Write
        </Button>
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setPreviewMode(true)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setImageQuery(title || "blog")
              setShowImagePicker(true)
            }}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Insert Image
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[500px]">
        <div className={previewMode ? "hidden lg:block" : ""}>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full min-h-[500px] font-mono text-sm resize-none"
            placeholder="Write your post in Markdown..."
          />
        </div>
        <div
          className={`rounded-md border p-6 overflow-auto ${
            !previewMode ? "hidden lg:block" : ""
          }`}
        >
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Preview will appear here...
            </p>
          )}
        </div>
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Blog Post with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="ai-topic">Topic / Prompt</Label>
              <Textarea
                id="ai-topic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                placeholder="e.g. 10 tips for self-publishing your first eBook"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="conversational">
                      Conversational
                    </SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Length</Label>
                <Select value={aiLength} onValueChange={setAiLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (~800 words)</SelectItem>
                    <SelectItem value="medium">Medium (~1,400 words)</SelectItem>
                    <SelectItem value="long">Long (~2,200 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={aiIncludeImages}
                onCheckedChange={setAiIncludeImages}
              />
              <Label className="text-sm">
                Include Unsplash images in the article
              </Label>
            </div>
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generating || !aiTopic.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating post...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
            {generating && (
              <p className="text-xs text-muted-foreground text-center">
                Searching Unsplash images and writing content with Claude...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsplash Image Picker Dialog */}
      <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              Search Unsplash Images
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
              placeholder="Search photos..."
              onKeyDown={(e) => e.key === "Enter" && handleImageSearch()}
            />
            <Button
              onClick={handleImageSearch}
              disabled={searchingImages}
              size="sm"
            >
              {searchingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {imageResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {searchingImages
                  ? "Searching..."
                  : "Search for photos to insert into your post"}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
                {imageResults.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary"
                  >
                    <img
                      src={img.thumb}
                      alt={img.description}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => insertImageAtCursor(img)}
                      >
                        Insert in Post
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => insertImageAsCover(img)}
                      >
                        Use as Cover
                      </Button>
                    </div>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white px-2 py-1 truncate">
                      {img.credit}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
