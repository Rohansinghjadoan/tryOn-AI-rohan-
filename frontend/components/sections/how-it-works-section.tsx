import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ShoppingBag, Sparkles } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Upload photo once",
    description: "Customer uploads a full-body photo — stored securely and used for all future try-ons across your entire catalog",
    icon: Upload,
  },
  {
    number: "02",
    title: "Browse products normally",
    description: "Shop your sarees, dresses, and apparel just like any other website — no extra steps or apps needed",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "See clothes on yourself instantly",
    description: "AI generates realistic try-on images in seconds, showing exactly how the product looks on them",
    icon: Sparkles,
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your customer shopping experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card
                key={step.number}
                className="border-border hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-5xl font-bold text-muted-foreground/20">
                      {step.number}
                    </span>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
