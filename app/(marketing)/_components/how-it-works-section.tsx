import { FileUp, Wand2, Download, ArrowRight } from "lucide-react"
import { AnimateOnScroll } from "./animate-on-scroll"

const STEPS = [
  {
    icon: FileUp,
    step: "01",
    title: "Import or Write",
    description:
      "Paste your content, import a PDF, or let AI generate chapters from scratch. Start however works best for you.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "Design with AI",
    description:
      "Use the visual editor to arrange elements, apply layouts, and let AI polish your content and generate cover art.",
  },
  {
    icon: Download,
    step: "03",
    title: "Export & Publish",
    description:
      "Download publication-ready PDF or EPUB files. Share with the world or print on demand — your book, your way.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Three steps to your eBook
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From raw ideas to a finished publication in minutes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <AnimateOnScroll key={step.step}>
              <div className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <step.icon className="h-7 w-7 text-orange-500" />
                </div>
                <div className="text-xs font-mono text-orange-500/60 mb-2">
                  STEP {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-6 lg:-right-8 h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
