import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function CTASection() {
  return (
    <section id="contact" className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              See how TryOnAI fits into your store
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join leading Indian fashion brands using AI virtual try-on to increase conversions, 
              reduce returns, and give customers confidence in their purchases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href="mailto:hello@tryonai.com">Request Pilot</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:hello@tryonai.com">Talk to Us</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
