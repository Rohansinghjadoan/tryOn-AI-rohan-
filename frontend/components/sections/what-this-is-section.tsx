import { Card, CardContent } from "@/components/ui/card"
import { Check, X } from "lucide-react"

const whatThisIs = [
  "A visual try-on preview system",
  "Designed to improve purchase confidence",
  "Helps reduce returns",
]

const whatThisIsNot = [
  "Not a custom tailoring solution",
  "Not a size guarantee",
  "Not a replacement for size charts",
]

export function WhatThisIsSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/20 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            What This Is
          </h2>
          <p className="text-muted-foreground">Clear expectations from the start</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">What This Is</h3>
              </div>
              <ul className="space-y-3">
                {whatThisIs.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <X className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">What This Is Not</h3>
              </div>
              <ul className="space-y-3">
                {whatThisIsNot.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
