"use client"

import { useEditor, makeDefaultElement } from "../editor-context"

interface TextPreset {
  label: string
  preview: React.ReactNode
  create: () => ReturnType<typeof makeDefaultElement>
}

function PresetCard({ label, preview, onClick }: { label: string; preview: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md border border-transparent p-3 bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors cursor-pointer"
    >
      <div className="mb-2 min-h-[32px] flex items-center">{preview}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </button>
  )
}

export function TextTab() {
  const { dispatch } = useEditor()

  function add(preset: () => ReturnType<typeof makeDefaultElement>) {
    dispatch({ type: "ADD_ELEMENT", element: preset() })
  }

  const presets = [
    {
      label: "H1 Heading",
      preview: <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>Heading</span>,
      create: () => {
        const el = makeDefaultElement("heading")
        return { ...el, styles: { ...el.styles, fontSize: 64, fontWeight: 700 } }
      },
    },
    {
      label: "H2 Heading",
      preview: <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>Heading</span>,
      create: () => {
        const el = makeDefaultElement("heading")
        return { ...el, content: { text: "H2 Heading" }, styles: { ...el.styles, fontSize: 48, fontWeight: 600 } }
      },
    },
    {
      label: "H3 Heading",
      preview: <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1 }}>Heading</span>,
      create: () => {
        const el = makeDefaultElement("heading")
        return { ...el, content: { text: "H3 Heading" }, styles: { ...el.styles, fontSize: 36, fontWeight: 600 } }
      },
    },
    {
      label: "Body Paragraph",
      preview: <span style={{ fontSize: 12, lineHeight: 1.7, color: "#555" }}>Lorem ipsum dolor sit amet…</span>,
      create: () => makeDefaultElement("text"),
    },
    {
      label: "Small Print",
      preview: <span style={{ fontSize: 9, color: "#888" }}>Fine print text</span>,
      create: () => {
        const el = makeDefaultElement("text")
        return { ...el, content: { text: "Small print text" }, styles: { ...el.styles, fontSize: 12, color: "#888888" } }
      },
    },
    {
      label: "Blockquote",
      preview: (
        <div style={{ borderLeft: "3px solid #F97316", paddingLeft: 8, fontStyle: "italic", fontSize: 11, color: "#555" }}>
          "Great things are done by a series of small things."
        </div>
      ),
      create: () => makeDefaultElement("blockquote"),
    },
    {
      label: "Author Name",
      preview: <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#555" }}>AUTHOR NAME</span>,
      create: () => {
        const el = makeDefaultElement("text")
        return {
          ...el,
          x: 97, y: 900, w: 600, h: 50,
          content: { text: "Author Name" },
          styles: { ...el.styles, fontSize: 16, fontWeight: 600, letterSpacing: "0.1em" as unknown as undefined },
        }
      },
    },
    {
      label: "Call to Action",
      preview: (
        <div style={{ background: "#F97316", color: "#fff", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>
          Get Started Now
        </div>
      ),
      create: () => makeDefaultElement("cta-button"),
    },
    {
      label: "Divider",
      preview: <div style={{ width: "100%", height: 2, background: "#e0e0e0", marginTop: 4 }} />,
      create: () => makeDefaultElement("divider"),
    },
  ]

  return (
    <div className="p-3 space-y-2 overflow-y-auto flex-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Click to insert a pre-styled element
      </p>
      {presets.map((preset) => (
        <PresetCard
          key={preset.label}
          label={preset.label}
          preview={preset.preview}
          onClick={() => add(preset.create)}
        />
      ))}
    </div>
  )
}
