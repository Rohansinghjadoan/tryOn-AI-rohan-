"use client"

import { useState } from "react"
import {
  X,
  Heart,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/products"

interface ProductModalProps {
  product: Product
  tryOnResult: string | null
  isProcessing: boolean
  userPhotoReady: boolean
  onClose: () => void
  onTryOn: (product: Product) => void
}

export function ProductModal({
  product,
  tryOnResult,
  isProcessing,
  userPhotoReady,
  onClose,
  onTryOn,
}: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToBag, setAddedToBag] = useState(false)
  const [pincode, setPincode] = useState("")
  const [showTryOn, setShowTryOn] = useState(!!tryOnResult)

  const displayImage = showTryOn && tryOnResult ? tryOnResult : product.image

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background w-full max-w-5xl mx-4 my-8 rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur rounded-full p-2 shadow-md hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image */}
          <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[600px] bg-muted/30 overflow-hidden">
            <img
              src={displayImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-12 w-12 text-white animate-spin mb-3" />
                <p className="text-white text-lg font-semibold">
                  AI is dressing you up…
                </p>
                <p className="text-white/70 text-sm mt-1">
                  This takes about 1–2 minutes
                </p>
                <div className="mt-4 w-48 bg-white/20 rounded-full h-1.5">
                  <div className="bg-white h-1.5 rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {/* Toggle original / try-on */}
            {tryOnResult && !isProcessing && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setShowTryOn(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg ${
                    !showTryOn
                      ? "bg-white text-foreground"
                      : "bg-black/50 text-white hover:bg-black/70"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowTryOn(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg ${
                    showTryOn
                      ? "bg-rose-500 text-white"
                      : "bg-black/50 text-white hover:bg-black/70"
                  }`}
                >
                  ✨ Your Look
                </button>
              </div>
            )}

            {/* Discount badge */}
            <div className="absolute top-4 left-4 bg-rose-500 text-white text-sm font-bold px-3 py-1 rounded">
              {product.discount}% OFF
            </div>
          </div>

          {/* Right: Details */}
          <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
            {/* Brand & Name */}
            <h2 className="text-xl font-bold text-foreground">
              {product.brand}
            </h2>
            <p className="text-muted-foreground mt-1">{product.name}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded">
                {product.rating}
                <Star className="h-3 w-3 fill-current" />
              </div>
              <span className="text-sm text-muted-foreground">
                {product.ratingCount.toLocaleString("en-IN")} Ratings
              </span>
            </div>

            {/* Separator */}
            <div className="border-t border-border my-4" />

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-foreground">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                MRP ₹{product.mrp.toLocaleString("en-IN")}
              </span>
              <span className="text-lg font-semibold text-rose-500">
                ({product.discount}% off)
              </span>
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">
              inclusive of all taxes
            </p>

            {/* Try On button */}
            <div className="mt-5">
              <Button
                onClick={() => onTryOn(product)}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold h-12 text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    AI Processing…
                  </>
                ) : userPhotoReady ? (
                  tryOnResult ? (
                    "✨ Try On Again"
                  ) : (
                    "👕 Try This On Me"
                  )
                ) : (
                  "📸 Upload Photo to Try On"
                )}
              </Button>
            </div>

            {/* Separator */}
            <div className="border-t border-border my-5" />

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">
                SELECT SIZE
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 min-w-[44px] px-3 rounded-full border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-border text-foreground hover:border-rose-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setAddedToBag(true)}
                className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold text-base"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {addedToBag ? "ADDED ✓" : "ADD TO BAG"}
              </Button>
              <Button
                onClick={() => setWishlisted(!wishlisted)}
                variant="outline"
                className={`flex-1 h-12 font-bold text-base ${
                  wishlisted ? "border-rose-500 text-rose-500" : ""
                }`}
              >
                <Heart
                  className={`h-5 w-5 mr-2 ${
                    wishlisted ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
                WISHLIST
              </Button>
            </div>

            {/* Separator */}
            <div className="border-t border-border my-5" />

            {/* Delivery */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">
                DELIVERY OPTIONS
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full pl-9 pr-3 py-2.5 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <Button variant="outline" className="text-rose-500 font-semibold">
                  Check
                </Button>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span>Get it by <strong className="text-foreground">Feb 28 – Mar 2</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>14 day easy returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Cash on Delivery available</span>
                </div>
              </div>
            </div>

            {/* Product details accordion */}
            <div className="border-t border-border my-5" />
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between py-2"
            >
              <h3 className="text-sm font-bold text-foreground">
                PRODUCT DETAILS
              </h3>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showDetails && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
                <ul className="mt-3 space-y-1">
                  {product.details.map((d, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Demo disclaimer */}
            <div className="border-t border-border my-5" />
            <p className="text-xs text-center text-muted-foreground">
              🛍️ This is a demo store powered by TryOnAI. Products are for
              demonstration only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
