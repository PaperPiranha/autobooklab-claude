import { AnimateOnScroll } from "./animate-on-scroll"

export function EditorShowcaseSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              A visual editor built for books
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Not just a text editor — a full page designer with 18+ element types,
              drag-and-drop, and live preview.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="relative rounded-2xl border border-border bg-card/30 overflow-hidden">
            {/* Editor mockup */}
            <div className="flex min-h-[500px]">
              {/* Left panel with tabs */}
              <div className="hidden lg:flex flex-col w-64 border-r border-border bg-background/40">
                <div className="flex border-b border-border">
                  {["Elements", "Text", "Images"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`flex-1 py-3 text-xs font-medium transition-colors ${
                        i === 0
                          ? "text-orange-500 border-b-2 border-orange-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-4 space-y-3">
                  {[
                    "Heading",
                    "Paragraph",
                    "Image",
                    "Blockquote",
                    "Divider",
                    "Callout",
                    "Table",
                    "Author Bio",
                  ].map((el) => (
                    <div
                      key={el}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground hover:border-orange-500/30 hover:text-foreground transition-colors cursor-default"
                    >
                      <div className="w-6 h-6 rounded bg-muted/40 flex-shrink-0" />
                      {el}
                    </div>
                  ))}
                </div>
              </div>

              {/* Canvas area */}
              <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
                {/* Page */}
                <div className="w-full max-w-lg bg-white/[0.03] border border-border rounded-lg p-8 lg:p-12 space-y-6">
                  <div className="space-y-2">
                    <div className="h-8 w-2/3 rounded bg-foreground/10" />
                    <div className="h-0.5 w-12 rounded bg-orange-500/40" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-foreground/5" />
                    <div className="h-3 w-11/12 rounded bg-foreground/5" />
                    <div className="h-3 w-4/5 rounded bg-foreground/5" />
                  </div>
                  <div className="h-40 w-full rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 flex items-center justify-center">
                    <span className="text-xs text-orange-500/40">Image Element</span>
                  </div>
                  <div className="border-l-2 border-orange-500/30 pl-4 py-1">
                    <div className="h-3 w-4/5 rounded bg-foreground/5" />
                    <div className="h-3 w-3/5 rounded bg-foreground/5 mt-2" />
                  </div>
                </div>

                {/* Callout annotations */}
                <div className="hidden xl:block absolute top-12 right-8">
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">
                    Drag to reorder elements
                  </div>
                </div>
                <div className="hidden xl:block absolute bottom-16 left-[calc(50%+14rem)]">
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">
                    AI-generated content
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="hidden md:flex flex-col w-52 border-l border-border bg-background/40 p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Pages
                </div>
                {["Cover", "Chapter 1", "Chapter 2", "Chapter 3"].map((page, i) => (
                  <div
                    key={page}
                    className={`mb-2 rounded-lg border p-2 text-xs ${
                      i === 1
                        ? "border-orange-500/50 bg-orange-500/5 text-orange-400"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <div className="h-12 rounded bg-muted/20 mb-1.5" />
                    {page}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
