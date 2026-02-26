"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PhotoUpload } from "@/components/demo/photo-upload"
import { ProductCard } from "@/components/demo/product-card"
import { ProductModal } from "@/components/demo/product-modal"
import { PRODUCTS, type Product } from "@/lib/products"
import { TryOnAPIClient } from "@/lib/api-client"

/** Key for persisting try-on results in localStorage */
const STORAGE_KEY = "tryonai_results"
const PHOTO_KEY = "tryonai_user_photo"

interface TryOnResultMap {
  [productId: string]: {
    imageUrl: string
    sessionId: string
    timestamp: number
  }
}

export default function DemoPage() {
  // User photo
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [userFile, setUserFile] = useState<File | null>(null)
  const userFileRef = useRef<File | null>(null)

  // Try-on results
  const [results, setResults] = useState<TryOnResultMap>({})
  const [processingProduct, setProcessingProduct] = useState<string | null>(null)

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Photo upload prompt
  const [showUploadPrompt, setShowUploadPrompt] = useState(false)
  const pendingTryOnRef = useRef<Product | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -----------------------------------------------------------------------
  // Persistence: load results + user photo from localStorage
  // -----------------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as TryOnResultMap
        // Only keep results less than 24h old
        const now = Date.now()
        const valid: TryOnResultMap = {}
        for (const [k, v] of Object.entries(parsed)) {
          if (now - v.timestamp < 24 * 60 * 60 * 1000) {
            valid[k] = v
          }
        }
        setResults(valid)
      }
    } catch {}

    // Restore user photo preview (we can't restore the File, but we show the preview)
    const savedPhoto = localStorage.getItem(PHOTO_KEY)
    if (savedPhoto) {
      setUserPhoto(savedPhoto)
    }
  }, [])

  // Persist results
  useEffect(() => {
    if (Object.keys(results).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
    }
  }, [results])

  // -----------------------------------------------------------------------
  // Photo handling
  // -----------------------------------------------------------------------
  const handlePhotoSelect = useCallback((file: File, previewUrl: string) => {
    setUserPhoto(previewUrl)
    setUserFile(file)
    userFileRef.current = file
    // Persist the preview (base64 would be better but object URLs work for session)
    // Convert to base64 for persistence
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        localStorage.setItem(PHOTO_KEY, reader.result)
        setUserPhoto(reader.result)
      }
    }
    reader.readAsDataURL(file)

    // If there's a pending try-on, process it now
    if (pendingTryOnRef.current) {
      const product = pendingTryOnRef.current
      pendingTryOnRef.current = null
      setShowUploadPrompt(false)
      // Small delay to let state settle
      setTimeout(() => processTryOn(product, file), 300)
    }
  }, [])

  const handlePhotoClear = useCallback(() => {
    setUserPhoto(null)
    setUserFile(null)
    userFileRef.current = null
    localStorage.removeItem(PHOTO_KEY)
  }, [])

  // -----------------------------------------------------------------------
  // Try-on processing
  // -----------------------------------------------------------------------
  const processTryOn = async (product: Product, photoFile?: File) => {
    const file = photoFile || userFileRef.current || userFile
    if (!file) {
      // Need photo first — show prompt
      pendingTryOnRef.current = product
      setShowUploadPrompt(true)
      fileInputRef.current?.click()
      return
    }

    setProcessingProduct(product.id)

    try {
      const userToken = TryOnAPIClient.generateUserToken()

      // We need to create a File from the garment image URL
      const garmentRes = await fetch(product.image)
      const garmentBlob = await garmentRes.blob()
      const garmentFile = new File(
        [garmentBlob],
        `${product.id}.jpg`,
        { type: "image/jpeg" }
      )

      const response = await TryOnAPIClient.createSession(
        file,
        garmentFile,
        userToken,
        product.category
      )

      // Poll for result
      const finalStatus = await TryOnAPIClient.pollSessionStatus(
        response.session_id,
        () => {} // silent progress
      )

      if (finalStatus.status.toLowerCase() === "completed" && finalStatus.output_image_url) {
        setResults((prev) => ({
          ...prev,
          [product.id]: {
            imageUrl: finalStatus.output_image_url!,
            sessionId: response.session_id,
            timestamp: Date.now(),
          },
        }))
      } else {
        console.error("Try-on failed:", finalStatus.error_reason)
      }
    } catch (err) {
      console.error("Try-on error:", err)
    } finally {
      setProcessingProduct(null)
    }
  }

  const handleTryOn = (product: Product) => {
    if (!userFile && !userFileRef.current) {
      // Need photo first
      pendingTryOnRef.current = product
      fileInputRef.current?.click()
      return
    }
    processTryOn(product)
  }

  // Hidden file input for photo-from-tryOn-button flow
  const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 10 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        localStorage.setItem(PHOTO_KEY, reader.result)
        setUserPhoto(reader.result)
        setUserFile(file)
        userFileRef.current = file

        if (pendingTryOnRef.current) {
          const product = pendingTryOnRef.current
          pendingTryOnRef.current = null
          setTimeout(() => processTryOn(product, file), 300)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar — Myntra style */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Back</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <Link href="/" className="text-xl font-bold text-foreground">
                TryOnAI
              </Link>
              <span className="hidden sm:inline text-sm text-rose-500 font-medium">
                STORE
              </span>
            </div>

            {/* Center — search bar (cosmetic) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-md text-sm border border-transparent focus:border-border focus:outline-none"
                  readOnly
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Photo upload banner */}
      <PhotoUpload
        userPhoto={userPhoto}
        onPhotoSelect={handlePhotoSelect}
        onPhotoClear={handlePhotoClear}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            Men&apos;s Upper Body
          </span>
          <span className="ml-2 text-muted-foreground">
            - {PRODUCTS.length} items
          </span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            Men&apos;s Upper Body Wear
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select className="text-sm border border-input rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tryOnResult={results[product.id]?.imageUrl || null}
              isProcessing={processingProduct === product.id}
              userPhotoReady={!!userPhoto && (!!userFile || !!userFileRef.current)}
              onTryOn={handleTryOn}
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-8 text-center p-6 bg-muted/30 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground">
            🤖 Powered by <strong>TryOnAI</strong> — Upload your photo once, then
            click &quot;Try On&quot; on any product to see yourself wearing it.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI processing takes ~1–2 minutes per item. Limited to one try-on at a
            time.
          </p>
        </div>
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          tryOnResult={results[selectedProduct.id]?.imageUrl || null}
          isProcessing={processingProduct === selectedProduct.id}
          userPhotoReady={!!userPhoto && (!!userFile || !!userFileRef.current)}
          onClose={() => setSelectedProduct(null)}
          onTryOn={handleTryOn}
        />
      )}

      {/* Hidden file input for try-on button flow */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleHiddenFileChange}
        className="hidden"
      />

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            This is a demo store by{" "}
            <Link href="/" className="text-rose-500 hover:underline font-medium">
              TryOnAI
            </Link>
            . Products are for demonstration purposes only.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} TryOnAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
