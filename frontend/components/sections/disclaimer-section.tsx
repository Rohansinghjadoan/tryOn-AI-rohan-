import { AlertCircle } from "lucide-react"

export function DisclaimerSection() {
  return (
    <section className="py-12 sm:py-16 border-t border-border bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4 p-6 rounded-xl bg-background border border-border">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Important Notice
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TryOnAI provides a visual preview to help customers make better purchase decisions. 
              It does not guarantee exact sizing or tailoring accuracy. Final fit may vary based on 
              individual body measurements and garment specifications.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
