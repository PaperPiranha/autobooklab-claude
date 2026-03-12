import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(25 95% 53% / 0.12), transparent)",
        }}
      />
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust line */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-sm text-orange-400 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-powered eBook creation platform</span>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-[1.1] mb-6">
          Create stunning eBooks
          <br />
          <span className="text-orange-500">in minutes, not months</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
          Write with AI assistance, design with a visual editor, and export
          publication-ready PDFs and EPUBs. From idea to finished book — faster than ever.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 text-base">
            <Link href="/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
            <Link href="#features">See How It Works</Link>
          </Button>
        </div>

        {/* Editor mockup */}
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl shadow-orange-500/5 overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">AutoBookLab — Visual Editor</span>
            </div>
            {/* Mockup content */}
            <div className="flex min-h-[300px] sm:min-h-[400px]">
              {/* Left panel */}
              <div className="hidden sm:flex w-14 flex-col items-center gap-3 py-4 border-r border-border bg-background/30">
                {["T", "I", "S", "L", "AI"].map((label) => (
                  <div key={label} className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>
              {/* Canvas */}
              <div className="flex-1 p-6 sm:p-10 flex items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                  <div className="h-6 w-3/4 rounded bg-muted/30 animate-pulse" />
                  <div className="h-4 w-full rounded bg-muted/20 animate-pulse delay-75" />
                  <div className="h-4 w-5/6 rounded bg-muted/20 animate-pulse delay-150" />
                  <div className="h-32 w-full rounded-lg bg-muted/15 mt-6 animate-pulse delay-200" />
                  <div className="h-4 w-4/5 rounded bg-muted/20 animate-pulse delay-300" />
                  <div className="h-4 w-3/5 rounded bg-muted/20 animate-pulse delay-500" />
                </div>
              </div>
              {/* Right panel */}
              <div className="hidden md:flex w-48 flex-col gap-3 p-4 border-l border-border bg-background/30">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pages</div>
                {[1, 2, 3].map((n) => (
                  <div key={n} className={`h-16 rounded border ${n === 1 ? "border-orange-500/50 bg-orange-500/5" : "border-border bg-muted/10"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
