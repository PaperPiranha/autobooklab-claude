"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimateOnScroll } from "./animate-on-scroll"

const FAQS = [
  {
    q: "How do AI credits work?",
    a: "Each plan comes with a monthly credit allowance. Different AI actions cost different amounts — for example, generating a chapter costs 2 credits while a rewrite costs 1 credit. Credits refresh at the start of each billing cycle.",
  },
  {
    q: "What export formats are supported?",
    a: "All plans include PDF export. Starter plans and above also get EPUB export, which is compatible with Kindle, Apple Books, and other major eBook readers.",
  },
  {
    q: "Can I use my own content?",
    a: "Absolutely. You can paste text directly, import from PDF files, pull content from web URLs, or even import YouTube video transcripts. The AI can then help you refine and structure the content.",
  },
  {
    q: "Is my content private?",
    a: "Yes. Your books and content are stored securely in your private account. We use Supabase with row-level security, so only you can access your data. AI-generated content is not used for training.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel at any time through the billing portal. You'll continue to have access to your paid features until the end of your current billing period.",
  },
  {
    q: "What AI model powers the writing assistant?",
    a: "AutoBookLab uses Anthropic's Claude AI for all text generation, including chapter writing, rewriting, summarization, and the AI chat assistant. Cover images are generated using DALL·E 3.",
  },
  {
    q: "Do I own the content I create?",
    a: "Yes, 100%. Everything you create with AutoBookLab — including AI-generated text and images — is yours to use, publish, and sell however you want.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan includes 10 AI credits, up to 2 books, and PDF export. It's a great way to try the platform before committing to a paid plan.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export function FaqSection() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
              Frequently asked questions
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="border-t border-border">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
