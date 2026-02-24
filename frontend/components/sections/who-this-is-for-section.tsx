import { Check } from "lucide-react"

const targetCustomers = [
  "D2C fashion brands",
  "Saree, kurti, dress & apparel stores",
  "Brands with existing websites (Shopify or custom)",
  "Teams looking to increase conversion and reduce returns",
]

export function WhoThisIsForSection() {
  return (
    <section className="py-16 sm:py-20 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Who This Is For
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {targetCustomers.map((customer, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-base text-foreground">{customer}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
