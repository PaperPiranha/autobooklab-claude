import {
  Sparkles,
  PenTool,
  FileUp,
  Download,
  Image,
  LayoutTemplate,
} from "lucide-react"
import { AnimateOnScroll } from "./animate-on-scroll"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Writing Assistant",
    description:
      "Generate entire chapters, rewrite passages, or brainstorm outlines — powered by Claude AI with streaming responses.",
    span: true,
  },
  {
    icon: PenTool,
    title: "Visual Page Editor",
    description:
      "Drag-and-drop elements, custom layouts, and real-time preview. Design every page exactly how you want it.",
    span: true,
  },
  {
    icon: FileUp,
    title: "Multi-Source Import",
    description:
      "Import content from PDFs, URLs, YouTube transcripts, or paste text directly. Start from what you already have.",
    span: false,
  },
  {
    icon: Download,
    title: "PDF & EPUB Export",
    description:
      "Export publication-ready files. Print-quality PDFs and standard EPUBs compatible with all major readers.",
    span: false,
  },
  {
    icon: Image,
    title: "AI Cover Images",
    description:
      "Generate unique cover art with DALL·E 3 or search millions of royalty-free photos from Unsplash.",
    span: false,
  },
  {
    icon: LayoutTemplate,
    title: "Ready-Made Templates",
    description:
      "Start with professionally designed page layouts — or build your own from 18+ element types.",
    span: false,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Everything you need to create
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete toolkit for writing, designing, and publishing professional eBooks.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {FEATURES.map((feature) => (
            <AnimateOnScroll
              key={feature.title}
              className={feature.span ? "lg:col-span-1 md:col-span-1" : ""}
            >
              <div className="group relative h-full rounded-xl border border-border bg-card/50 p-6 lg:p-8 transition-colors hover:border-orange-500/30 hover:bg-orange-500/[0.02]">
                <div className="mb-4 inline-flex rounded-lg bg-orange-500/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
