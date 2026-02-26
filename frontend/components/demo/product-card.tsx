"use client"

import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
  tryOnResult: string | null
  isProcessing: boolean
  userPhotoReady: boolean
  onTryOn: (product: Product) => void
  onViewDetails: (product: Product) => void
}

export function ProductCard({
  product,
  tryOnResult,
  isProcessing,
  userPhotoReady,
  onTryOn,
  onViewDetails,
}: ProductCardProps) {
  const displayImage = tryOnResult || product.image

  return (
    <div
      className="group cursor-pointer bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={() => onViewDetails(product)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
        <img
          src={displayImage}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount badge */}
        <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">
          {product.discount}% OFF
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <p className="text-white text-sm font-medium">Trying on…</p>
            <p className="text-white/70 text-xs">~1-2 min</p>
          </div>
        )}

        {/* Try-on result badge */}
        {tryOnResult && !isProcessing && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            ✨ Your Look
          </div>
        )}

        {/* Try On button overlay on hover */}
        {!isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onTryOn(product)
              }}
              disabled={isProcessing}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-lg"
              size="sm"
            >
              {userPhotoReady
                ? tryOnResult
                  ? "✨ Try Again"
                  : "👕 Try On"
                : "📸 Upload Photo to Try On"}
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Brand */}
        <h3 className="text-sm font-bold text-foreground truncate">
          {product.brand}
        </h3>

        {/* Name */}
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-sm font-bold text-foreground">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>
          <span className="text-xs font-semibold text-rose-500">
            ({product.discount}% off)
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {product.rating}
            <Star className="h-2.5 w-2.5 fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.ratingCount.toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </div>
  )
}
