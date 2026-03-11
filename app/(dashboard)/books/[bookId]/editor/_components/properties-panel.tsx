"use client"

import { Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PageElement } from "@/lib/editor/types"

interface PropertiesPanelProps {
  element: PageElement
  onUpdate: (updates: Partial<PageElement>) => void
  onDelete: () => void
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

export function PropertiesPanel({ element, onUpdate, onDelete }: PropertiesPanelProps) {
  const { styles, content } = element
  const isTextType = TEXT_TYPES.has(element.type)
  const isImageType = IMAGE_TYPES.has(element.type)
  const isCaptioned = element.type === "captioned-image"
  const isShape = element.type === "shape"
  const isTable = element.type === "table"
  const isToc = element.type === "toc"

  function updateStyle(key: keyof typeof styles, value: unknown) {
    onUpdate({ styles: { ...styles, [key]: value } })
  }

  function updateContent(key: keyof typeof content, value: unknown) {
    onUpdate({ content: { ...content, [key]: value } })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-sm">
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
      {(isTextType || isTable || isToc) && (
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

            {isTextType && (
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

      {/* Appearance */}
      {!isShape && !isTable && (
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
            {/* Shape type selector */}
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
      <div className="px-3 py-3 mt-auto">
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
