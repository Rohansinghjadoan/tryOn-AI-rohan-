import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plug, Shield, Smartphone, Store } from "lucide-react"

const features = [
  {
    title: "Persistent User Try-On",
    description: "Upload once, use everywhere. One photo works across all products in your catalog for a truly personalized shopping journey",
    icon: Users,
  },
  {
    title: "Plug-and-Play Integration",
    description: "Add a simple script to your website. Works with Shopify, custom stores, or any platform — ready in minutes",
    icon: Plug,
  },
  {
    title: "Works with Existing Stores",
    description: "No website rebuild needed. TryOnAI integrates seamlessly with your current e-commerce setup",
    icon: Store,
  },
  {
    title: "Privacy-First (Auto-Delete Photos)",
    description: "Customer photos are encrypted and automatically deleted after use. Full GDPR compliance and data security",
    icon: Shield,
  },
  {
    title: "No App Required",
    description: "Everything happens in the browser. No downloads, no app store, no friction — just instant try-on",
    icon: Smartphone,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Modern E-Commerce
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to reduce returns and increase conversions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="border-border hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
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
