import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/sections/hero-section"
import { WhoThisIsForSection } from "@/components/sections/who-this-is-for-section"
import { WhatThisIsSection } from "@/components/sections/what-this-is-section"
import { HowItWorksSection } from "@/components/sections/how-it-works-section"
import { FeaturesSection } from "@/components/sections/features-section"
import { DemoSection } from "@/components/sections/demo-section-interactive"
import { HowBrandsIntegrateSection } from "@/components/sections/how-brands-integrate-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { DisclaimerSection } from "@/components/sections/disclaimer-section"
import { CTASection } from "@/components/sections/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <WhoThisIsForSection />
        <WhatThisIsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DemoSection />
        <HowBrandsIntegrateSection />
        <PricingSection />
        <DisclaimerSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
