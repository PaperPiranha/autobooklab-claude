import { AnimateOnScroll } from "./animate-on-scroll"

const TESTIMONIALS = [
  {
    quote:
      "AutoBookLab transformed my workflow. I went from a rough draft to a polished eBook in an afternoon — something that used to take me weeks.",
    name: "Sarah M.",
    role: "Self-Published Author",
  },
  {
    quote:
      "The visual editor is incredible. Drag-and-drop page design with AI-generated content? It feels like the future of publishing.",
    name: "James K.",
    role: "Content Creator",
  },
  {
    quote:
      "I've tried every eBook tool out there. AutoBookLab is the first one that actually makes the whole process enjoyable. The AI assistant is genuinely helpful.",
    name: "Priya R.",
    role: "Course Creator",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Loved by creators
            </h2>
            <p className="text-muted-foreground text-lg">
              See what authors and content creators are saying.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <AnimateOnScroll key={t.name}>
              <div className="rounded-xl border border-border bg-card/50 p-6 lg:p-8 h-full flex flex-col">
                <blockquote className="text-sm leading-relaxed text-muted-foreground flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
