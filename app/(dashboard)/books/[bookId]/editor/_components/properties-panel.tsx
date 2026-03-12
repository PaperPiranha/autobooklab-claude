"use client"

import { useState, useEffect } from "react"
import {
  Trash2, AlignLeft, AlignCenter, AlignRight, Star,
  Lock, Unlock,
  ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PageElement } from "@/lib/editor/types"
import { extractYouTubeId } from "./renderers/video-embed-element"
import { useEditor } from "./editor-context"
import * as LucideIcons from "lucide-react"

interface PropertiesPanelProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  onDelete: () => void
  userId?: string
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
      {label}
    </p>
  )
}

function FieldLabel({ label }: { label: string }) {
  return <span className="text-xs text-muted-foreground">{label}</span>
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 rounded border border-input cursor-pointer bg-transparent p-0.5"
        />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  )
}

const TEXT_TYPES = new Set(["text", "heading", "chapter-heading", "callout", "page-number"])
const IMAGE_TYPES = new Set(["image", "captioned-image"])

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  heading: "Heading",
  "chapter-heading": "Chapter Heading",
  image: "Image",
  "captioned-image": "Captioned Image",
  divider: "Divider",
  callout: "Callout",
  "page-number": "Page Number",
  table: "Table",
  toc: "Table of Contents",
  shape: "Shape",
  blockquote: "Blockquote",
  "ordered-list": "Ordered List",
  "unordered-list": "Unordered List",
  "cta-button": "CTA Button",
  "video-embed": "Video Embed",
  "author-bio": "Author Bio",
  "icon-element": "Icon",
}

export function PropertiesPanel({ element, onUpdate, onDelete, userId }: PropertiesPanelProps) {
  const { dispatch } = useEditor()
  const { styles, content } = element
  const isTextType = TEXT_TYPES.has(element.type)
  const isImageType = IMAGE_TYPES.has(element.type)
  const isCaptioned = element.type === "captioned-image"
  const isShape = element.type === "shape"
  const isTable = element.type === "table"
  const isToc = element.type === "toc"
  const isBlockquote = element.type === "blockquote"
  const isOrderedList = element.type === "ordered-list"
  const isUnorderedList = element.type === "unordered-list"
  const isList = isOrderedList || isUnorderedList
  const isCtaButton = element.type === "cta-button"
  const isVideoEmbed = element.type === "video-embed"
  const isAuthorBio = element.type === "author-bio"
  const isIconElement = element.type === "icon-element"

  const [iconSearch, setIconSearch] = useState("")
  const [isFaved, setIsFaved] = useState(false)

  // Common icon names for the picker
  const ICON_NAMES = [
    "Star", "Heart", "Check", "CheckCircle", "X", "XCircle", "AlertCircle", "Info",
    "Lightbulb", "Zap", "Target", "ArrowRight", "ArrowLeft", "ChevronRight",
    "BookOpen", "Quote", "MessageSquare", "Mail", "Phone", "Globe", "Link",
    "Download", "Upload", "Share2", "Copy", "Edit", "Trash2", "Plus", "Minus",
    "Search", "Filter", "Settings", "User", "Users", "Shield", "Lock", "Unlock",
    "Eye", "EyeOff", "Bell", "Calendar", "Clock", "Map", "Camera", "Video",
    "Music", "Headphones", "Mic", "Image", "FileText", "Folder", "Tag",
  ]

  const filteredIcons = iconSearch
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()))
    : ICON_NAMES

  function updateStyle(key: keyof typeof styles, value: unknown) {
    onUpdate({ styles: { ...styles, [key]: value } })
  }

  function updateContent(key: keyof typeof content, value: unknown) {
    onUpdate({ content: { ...content, [key]: value } })
  }

  function saveToFavourites() {
    try {
      const key = `autobooklab:favourites:${userId ?? "anon"}`
      const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as PageElement[]
      const stripped = { ...element, id: "" } // id will be replaced on insert
      localStorage.setItem(key, JSON.stringify([...existing, stripped]))
      setIsFaved(true)
      setTimeout(() => setIsFaved(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
      {/* Element type header + lock toggle */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {TYPE_LABELS[element.type] ?? element.type}
        </span>
        <button
          onClick={() => onUpdate({ locked: !element.locked })}
          title={element.locked ? "Unlock element (Cmd+L)" : "Lock element (Cmd+L)"}
          className={cn(
            "p-1 rounded transition-colors",
            element.locked
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Position & Size */}
      <div className="px-3 py-3 border-b border-border">
        <SectionHeader label="Position & Size" />
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <div className="flex flex-col gap-1">
            <FieldLabel label="X" />
            <Input
              type="number"
              step={1}
              value={Math.round(element.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="h-7 text-xs px-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel label="Y" />
            <Input
              type="number"
              step={1}
              value={Math.round(element.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="h-7 text-xs px-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel label="W" />
            <Input
              type="number"
              step={1}
              value={Math.round(element.w)}
              onChange={(e) => onUpdate({ w: Number(e.target.value) })}
              className="h-7 text-xs px-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel label="H" />
            <Input
              type="number"
              step={1}
              value={Math.round(element.h)}
              onChange={(e) => onUpdate({ h: Number(e.target.value) })}
              className="h-7 text-xs px-2"
            />
          </div>
        </div>
      </div>

      {/* Layer (z-index) controls */}
      <div className="px-3 py-3 border-b border-border">
        <SectionHeader label="Layer" />
        <div className="flex gap-1">
          <button
            onClick={() => dispatch({ type: "SEND_TO_BACK", elementId: element.id })}
            title="Send to Back"
            className="flex-1 flex items-center justify-center h-7 rounded border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => dispatch({ type: "SEND_BACKWARD", elementId: element.id })}
            title="Send Backward (Cmd+[)"
            className="flex-1 flex items-center justify-center h-7 rounded border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => dispatch({ type: "BRING_FORWARD", elementId: element.id })}
            title="Bring Forward (Cmd+])"
            className="flex-1 flex items-center justify-center h-7 rounded border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => dispatch({ type: "BRING_TO_FRONT", elementId: element.id })}
            title="Bring to Front"
            className="flex-1 flex items-center justify-center h-7 rounded border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* TOC note */}
      {isToc && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Table of Contents" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Table of Contents auto-generates from Chapter Heading elements across all pages.
          </p>
        </div>
      )}

      {/* Typography */}
      {(isTextType || isTable || isToc || isBlockquote || isList) && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Typography" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Font size" />
              <Input
                type="number"
                min={8}
                max={96}
                step={1}
                value={styles.fontSize ?? 16}
                onChange={(e) => updateStyle("fontSize", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>

            {(isTextType || isBlockquote || isList) && (
              <>
                <div className="flex flex-col gap-1">
                  <FieldLabel label="Font weight" />
                  <select
                    className="h-7 text-xs px-2 rounded-md border border-input bg-background text-foreground w-full"
                    value={String(styles.fontWeight ?? "400")}
                    onChange={(e) => updateStyle("fontWeight", e.target.value)}
                  >
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <FieldLabel label="Text align" />
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updateStyle("textAlign", align)}
                        className={cn(
                          "flex-1 flex items-center justify-center h-7 rounded border border-input transition-colors",
                          styles.textAlign === align
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                        {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                        {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <FieldLabel label="Line height" />
                  <Input
                    type="number"
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    value={styles.lineHeight ?? 1.6}
                    onChange={(e) => updateStyle("lineHeight", Number(e.target.value))}
                    className="h-7 text-xs px-2"
                  />
                </div>
              </>
            )}

            <ColorField
              label="Text color"
              value={styles.color ?? "#000000"}
              onChange={(v) => updateStyle("color", v)}
            />
          </div>
        </div>
      )}

      {/* Blockquote */}
      {isBlockquote && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Blockquote" />
          <div className="flex flex-col gap-2">
            <ColorField
              label="Border color"
              value={styles.borderColor ?? "#F97316"}
              onChange={(v) => updateStyle("borderColor", v)}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel label="Attribution" />
              <Input
                type="text"
                value={content.attribution ?? ""}
                onChange={(e) => updateContent("attribution", e.target.value)}
                placeholder="— Source name"
                className="h-7 text-xs px-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      {isCtaButton && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="CTA Button" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Button text" />
              <Input
                type="text"
                value={content.text ?? ""}
                onChange={(e) => updateContent("text", e.target.value)}
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="URL (optional)" />
              <Input
                type="text"
                value={content.url ?? ""}
                onChange={(e) => updateContent("url", e.target.value)}
                placeholder="https://..."
                className="h-7 text-xs px-2"
              />
            </div>
            <ColorField
              label="Background color"
              value={styles.backgroundColor ?? "#F97316"}
              onChange={(v) => updateStyle("backgroundColor", v)}
            />
            <ColorField
              label="Text color"
              value={styles.color ?? "#ffffff"}
              onChange={(v) => updateStyle("color", v)}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel label="Font size" />
              <Input
                type="number"
                min={10}
                max={36}
                value={styles.fontSize ?? 16}
                onChange={(e) => updateStyle("fontSize", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Border radius" />
              <Input
                type="number"
                min={0}
                max={50}
                value={styles.borderRadius ?? 8}
                onChange={(e) => updateStyle("borderRadius", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Embed */}
      {isVideoEmbed && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Video Embed" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="YouTube URL" />
              <Input
                type="text"
                value={content.url ?? ""}
                onChange={(e) => {
                  const url = e.target.value
                  const videoId = extractYouTubeId(url) ?? ""
                  onUpdate({ content: { ...content, url, videoId, platform: "youtube" } })
                }}
                placeholder="https://youtube.com/watch?v=..."
                className="h-7 text-xs px-2"
              />
            </div>
            {content.videoId && (
              <p className="text-xs text-muted-foreground">
                Video ID: <span className="font-mono">{content.videoId}</span>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground bg-secondary/50 rounded px-2 py-1.5">
              Video embeds appear in web preview only, not in PDF export.
            </p>
          </div>
        </div>
      )}

      {/* Author Bio */}
      {isAuthorBio && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Author Bio" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Name" />
              <Input
                type="text"
                value={content.name ?? ""}
                onChange={(e) => updateContent("name", e.target.value)}
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Bio" />
              <Input
                type="text"
                value={content.bio ?? ""}
                onChange={(e) => updateContent("bio", e.target.value)}
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Photo URL" />
              <Input
                type="text"
                value={content.src ?? ""}
                onChange={(e) => updateContent("src", e.target.value)}
                placeholder="https://..."
                className="h-7 text-xs px-2"
              />
            </div>
            <ColorField
              label="Background color"
              value={styles.backgroundColor ?? "#f9f9f9"}
              onChange={(v) => updateStyle("backgroundColor", v)}
            />
          </div>
        </div>
      )}

      {/* Icon Element */}
      {isIconElement && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Icon" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Search icons" />
              <Input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Search..."
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-[160px] overflow-y-auto">
              {filteredIcons.map((name) => {
                const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
                if (!Icon) return null
                const isActive = content.iconName === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => updateContent("iconName", name)}
                    title={name}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded border transition-colors",
                      isActive
                        ? "bg-primary/20 border-primary"
                        : "border-transparent hover:bg-muted/60 hover:border-border"
                    )}
                  >
                    <Icon size={14} />
                  </button>
                )
              })}
            </div>
            <ColorField
              label="Icon color"
              value={content.color ?? "#F97316"}
              onChange={(v) => updateContent("color", v)}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel label={`Opacity: ${styles.opacity ?? 100}%`} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={styles.opacity ?? 100}
                onChange={(e) => updateStyle("opacity", Number(e.target.value))}
                className="w-full h-2 accent-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Appearance */}
      {!isShape && !isTable && !isCtaButton && !isVideoEmbed && !isAuthorBio && !isIconElement && !isBlockquote && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Appearance" />
          <div className="flex flex-col gap-2">
            <ColorField
              label="Background color"
              value={styles.backgroundColor ?? "#ffffff"}
              onChange={(v) => updateStyle("backgroundColor", v)}
            />

            <div className="flex flex-col gap-1">
              <FieldLabel label={`Opacity: ${styles.opacity ?? 100}%`} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={styles.opacity ?? 100}
                onChange={(e) => updateStyle("opacity", Number(e.target.value))}
                className="w-full h-2 accent-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <FieldLabel label="Border radius" />
              <Input
                type="number"
                min={0}
                max={50}
                step={1}
                value={styles.borderRadius ?? 0}
                onChange={(e) => updateStyle("borderRadius", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <FieldLabel label="Padding" />
              <Input
                type="number"
                min={0}
                max={80}
                step={1}
                value={styles.padding ?? 0}
                onChange={(e) => updateStyle("padding", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shape properties */}
      {isShape && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Shape" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Shape type" />
              <div className="flex gap-1">
                {(["rect", "circle", "line"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateContent("shapeType", st)}
                    className={cn(
                      "flex-1 text-[10px] py-1 rounded border border-input transition-colors capitalize",
                      content.shapeType === st
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <ColorField
              label="Fill color"
              value={styles.backgroundColor ?? "#F97316"}
              onChange={(v) => updateStyle("backgroundColor", v)}
            />

            <ColorField
              label="Stroke color"
              value={styles.strokeColor ?? "#000000"}
              onChange={(v) => updateStyle("strokeColor", v)}
            />

            <div className="flex flex-col gap-1">
              <FieldLabel label="Stroke width" />
              <Input
                type="number"
                min={0}
                max={20}
                step={1}
                value={styles.strokeWidth ?? 0}
                onChange={(e) => updateStyle("strokeWidth", Number(e.target.value))}
                className="h-7 text-xs px-2"
              />
            </div>

            {content.shapeType !== "circle" && content.shapeType !== "line" && (
              <div className="flex flex-col gap-1">
                <FieldLabel label="Border radius" />
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={styles.borderRadius ?? 0}
                  onChange={(e) => updateStyle("borderRadius", Number(e.target.value))}
                  className="h-7 text-xs px-2"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <FieldLabel label={`Opacity: ${styles.opacity ?? 100}%`} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={styles.opacity ?? 100}
                onChange={(e) => updateStyle("opacity", Number(e.target.value))}
                className="w-full h-2 accent-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table properties */}
      {isTable && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Table" />
          <div className="flex flex-col gap-2">
            <ColorField
              label="Border color"
              value={styles.borderColor ?? "#e0e0e0"}
              onChange={(v) => updateStyle("borderColor", v)}
            />
            <ColorField
              label="Header background"
              value={styles.backgroundColor ?? "#f5f5f5"}
              onChange={(v) => updateStyle("backgroundColor", v)}
            />
          </div>
        </div>
      )}

      {/* Image */}
      {isImageType && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Image" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <FieldLabel label="Image URL" />
              <Input
                type="text"
                value={content.src ?? ""}
                onChange={(e) => updateContent("src", e.target.value)}
                placeholder="https://..."
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Alt text" />
              <Input
                type="text"
                value={content.alt ?? ""}
                onChange={(e) => updateContent("alt", e.target.value)}
                placeholder="Describe image..."
                className="h-7 text-xs px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Object fit" />
              <select
                className="h-7 text-xs px-2 rounded-md border border-input bg-background text-foreground w-full"
                value={styles.objectFit ?? "cover"}
                onChange={(e) =>
                  updateStyle("objectFit", e.target.value as "cover" | "contain" | "fill")
                }
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Caption */}
      {isCaptioned && (
        <div className="px-3 py-3 border-b border-border">
          <SectionHeader label="Caption" />
          <div className="flex flex-col gap-1">
            <FieldLabel label="Caption text" />
            <Input
              type="text"
              value={content.caption ?? ""}
              onChange={(e) => updateContent("caption", e.target.value)}
              placeholder="Image caption..."
              className="h-7 text-xs px-2"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-3 mt-auto flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn("w-full gap-2 text-xs", isFaved && "text-yellow-500 border-yellow-500/50")}
          onClick={saveToFavourites}
        >
          <Star className={cn("h-3.5 w-3.5", isFaved && "fill-yellow-500 text-yellow-500")} />
          {isFaved ? "Saved to Favourites!" : "Save to Favourites"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete element
        </Button>
      </div>
    </div>
  )
}
