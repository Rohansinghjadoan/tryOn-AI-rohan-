"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Upload, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { TryOnAPIClient, SessionStatus } from "@/lib/api-client"

export function DemoSection() {
  const [userImage, setUserImage] = useState<File | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [userPreviewUrl, setUserPreviewUrl] = useState<string | null>(null)
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userInputRef = useRef<HTMLInputElement>(null)
  const garmentInputRef = useRef<HTMLInputElement>(null)

  const handleUserFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setUserImage(file)
      setUserPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setStatus(null)
      setSessionId(null)
    }
  }

  const handleGarmentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setGarmentImage(file)
      setGarmentPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setStatus(null)
      setSessionId(null)
    }
  }

  const handleTryOn = async () => {
    if (!userImage || !garmentImage) {
      setError('Please select both user photo and garment image')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Get user token
      const userToken = TryOnAPIClient.generateUserToken()

      // Create session with both images
      const response = await TryOnAPIClient.createSession(userImage, garmentImage, userToken)
      setSessionId(response.session_id)

      // Poll for status
      await TryOnAPIClient.pollSessionStatus(
        response.session_id,
        (currentStatus) => {
          setStatus(currentStatus)
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setUserImage(null)
    setGarmentImage(null)
    setUserPreviewUrl(null)
    setGarmentPreviewUrl(null)
    setSessionId(null)
    setStatus(null)
    setError(null)
    if (userInputRef.current) {
      userInputRef.current.value = ''
    }
    if (garmentInputRef.current) {
      garmentInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    if (!status) return null
    
    const normalizedStatus = status.status.toLowerCase()
    switch (normalizedStatus) {
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <section id="demo" className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Product Preview
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Prototype demo showcasing the intended experience. Final output may vary.
          </p>
        </div>

        <Card className="max-w-6xl mx-auto border-border overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Try It Now</CardTitle>
            <CardDescription className="text-base">
              Upload a user photo and garment image to see the AI try-on in action
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Photo Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-center">User Photo</h3>
                <div className="aspect-square bg-muted/50 rounded-xl flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                  {userPreviewUrl ? (
                    <img
                      src={userPreviewUrl}
                      alt="User"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        Customer photo
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={userInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUserFileSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => userInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {userPreviewUrl ? 'Change' : 'Upload'}
                </Button>
              </div>

              {/* Garment Image Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-center">Garment</h3>
                <div className="aspect-square bg-muted/50 rounded-xl flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                  {garmentPreviewUrl ? (
                    <img
                      src={garmentPreviewUrl}
                      alt="Garment"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        Product catalog
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGarmentFileSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => garmentInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {garmentPreviewUrl ? 'Change' : 'Upload'}
                </Button>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-center">Result</h3>
                <div className="aspect-square bg-muted/50 rounded-xl flex flex-col items-center justify-center p-6 border-2 border-border">
                  {status?.output_image_url ? (
                    <img
                      src={status.output_image_url}
                      alt="Output"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Play className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        {status?.progress_message || 'Try-on result'}
                      </p>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleTryOn}
                  className="w-full"
                  disabled={!userImage || !garmentImage || isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Try On
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Status Message */}
            {(status || error) && (
              <div className="mt-6 p-4 rounded-lg border border-border bg-background">
                <div className="flex items-start gap-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    {error ? (
                      <p className="text-sm text-destructive">{error}</p>
                    ) : status ? (
                      <>
                        <p className="text-sm font-medium text-foreground">
                          {status.progress_message}
                        </p>
                        {status.error_reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {status.error_reason}
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Reset Button */}
            {(userPreviewUrl || garmentPreviewUrl || status) && !isProcessing && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                >
                  Start Over
                </Button>
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground mt-6">
              This demo uses mock AI processing. Upload both images to see the realistic session flow.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
