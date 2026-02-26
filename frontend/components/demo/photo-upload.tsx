"use client"

import { useRef } from "react"
import { Camera, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoUploadProps {
  userPhoto: string | null
  onPhotoSelect: (file: File, previewUrl: string) => void
  onPhotoClear: () => void
}

export function PhotoUpload({ userPhoto, onPhotoSelect, onPhotoClear }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 10 * 1024 * 1024) return
    const url = URL.createObjectURL(file)
    onPhotoSelect(file, url)
  }

  if (userPhoto) {
    return (
      <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-rose-500 shadow-md">
                <img src={userPhoto} alt="You" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Your photo is ready!</p>
                <p className="text-xs text-muted-foreground">Click &quot;Try On&quot; on any product to see yourself wearing it</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="text-xs"
              >
                <Camera className="h-3 w-3 mr-1" />
                Change Photo
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPhotoClear}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            See Yourself in Every Outfit
          </h2>
          <p className="text-rose-100 mb-6 max-w-md mx-auto">
            Upload your photo once and instantly try on any clothing item below
          </p>
          <Button
            onClick={() => inputRef.current?.click()}
            size="lg"
            className="bg-white text-rose-600 hover:bg-rose-50 font-semibold shadow-lg px-8"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Your Photo
          </Button>
          <p className="text-xs text-rose-200 mt-3">
            Your photo is processed securely and auto-deleted after 24 hours
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
