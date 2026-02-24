import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    description: "Best for pilots",
    tryOns: "200 try-ons/month",
    features: [
      "200 try-ons per month",
      "Basic analytics dashboard",
      "Email support",
      "Standard integration support",
      "Cancel anytime",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹5,999",
    description: "Most Popular",
    tryOns: "600 try-ons/month",
    features: [
      "600 try-ons per month",
      "Advanced analytics",
      "Priority support",
      "Custom branding options",
      "API access",
    ],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "₹9,999",
    description: "Best for scaling brands",
    tryOns: "1,500 try-ons/month",
    features: [
      "1,500 try-ons per month",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom integrations",
      "Advanced customization",
    ],
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border ${
                plan.highlighted
                  ? "ring-2 ring-primary shadow-xl scale-105"
                  : "hover:shadow-lg"
              } transition-all duration-300`}
            >
              <CardHeader>
                {plan.highlighted && (
                  <div className="text-xs font-semibold text-primary mb-2 uppercase">
                    {plan.description}
                  </div>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {!plan.highlighted && (
                  <CardDescription>{plan.description}</CardDescription>
                )}
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {plan.tryOns}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  asChild
                >
                  <a href="#contact">Get Started</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Extra try-ons available at ₹5–₹10 per try-on
          </p>
          <p className="text-sm text-center text-muted-foreground">
            Usage-based pricing • Cancel anytime • No long-term contracts
          </p>
        </div>
      </div>
    </section>
  )
}
