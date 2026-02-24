import { Card, CardContent } from "@/components/ui/card"
import { Code, Check } from "lucide-react"

const integrationSteps = [
  {
    step: "1",
    title: "Add a small script or plugin",
    description: "Copy-paste our lightweight script into your website's header. Works with Shopify, WooCommerce, or custom platforms.",
  },
  {
    step: "2",
    title: "\"Try on me\" button appears on product pages",
    description: "The button is automatically added to your product pages. Customers can start trying on clothes immediately.",
  },
  {
    step: "3",
    title: "No backend or website rebuild required",
    description: "Everything runs client-side. Your existing infrastructure stays untouched. No technical overhead.",
  },
]

export function HowBrandsIntegrateSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How Brands Integrate
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Simple integration in three steps. No developers needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Integration time: under 15 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">No backend changes required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Works via script or plugin</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto mb-12">
          {integrationSteps.map((item) => (
            <Card key={item.step} className="border-border hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-border bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Code className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Example Integration Snippet
                </span>
              </div>
              <div className="bg-background rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto border border-border">
                <code className="text-foreground">
                  {`<script src="https://cdn.tryonai.com/widget.js"></script>\n<script>\n  TryOnAI.init({ apiKey: 'your-key-here' });\n</script>`}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                For demonstration purposes only. Actual integration is provided during onboarding.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
