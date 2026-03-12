import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MarketingNav } from "./(marketing)/_components/marketing-nav"
import { MarketingFooter } from "./(marketing)/_components/marketing-footer"
import { HeroSection } from "./(marketing)/_components/hero-section"
import { FeaturesSection } from "./(marketing)/_components/features-section"
import { HowItWorksSection } from "./(marketing)/_components/how-it-works-section"
import { EditorShowcaseSection } from "./(marketing)/_components/editor-showcase-section"
import { PricingSectionWrapper } from "./(marketing)/_components/pricing-section-wrapper"
import { TestimonialsSection } from "./(marketing)/_components/testimonials-section"
import { FaqSection } from "./(marketing)/_components/faq-section"
import { CtaSection } from "./(marketing)/_components/cta-section"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <EditorShowcaseSection />
        <PricingSectionWrapper />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <MarketingFooter />
    </div>
  )
}
