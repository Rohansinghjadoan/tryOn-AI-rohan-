"use client"

import Link from "next/link"
import { ArrowRight, ShoppingBag, Camera, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/products"

export function DemoSection() {
  return (
    <section id="demo" className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Try It Yourself
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience AI virtual try-on like a real e-commerce store. Upload your photo and see yourself in every outfit.
          </p>
        </div>

        {/* How it works mini */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-rose-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Upload your photo</p>
            <p className="text-xs text-muted-foreground mt-1">Just one selfie</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
              <ShoppingBag className="h-6 w-6 text-rose-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Browse products</p>
            <p className="text-xs text-muted-foreground mt-1">Like a real store</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-rose-500" />
            </div>
            <p className="text-sm font-medium text-foreground">See yourself in it</p>
            <p className="text-xs text-muted-foreground mt-1">AI magic in ~1 min</p>
          </div>
        </div>

        {/* Product preview strip */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {PRODUCTS.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href="/demo"
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-xs font-bold">{product.brand}</p>
                  <p className="text-white/80 text-xs truncate">{product.name}</p>
                  <p className="text-white text-sm font-bold mt-1">
                    ₹{product.price.toLocaleString("en-IN")}
                    <span className="text-rose-300 text-xs font-normal ml-2">
                      {product.discount}% off
                    </span>
                  </p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white text-rose-600 font-semibold text-sm px-4 py-2 rounded-full shadow-lg">
                    Try On →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 shadow-lg"
            >
              <Link href="/demo">
                Try the Full Experience
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Free demo • No signup required • AI-powered
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
