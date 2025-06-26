"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ImageIcon, Download, Eye, Sparkles, Palette, Wand2, Camera } from "lucide-react"
import Link from "next/link"

interface Word {
  id: string
  eng_word: string
  tur_word: string
  difficulty_level: number
}

interface WordImage {
  id: string
  word_id: string
  prompt: string
  image_url: string
  created_at: string
  words?: Word
}

export default function ImageGenerationPage() {
  const { user } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [images, setImages] = useState<WordImage[]>([])
  const [selectedWordId, setSelectedWordId] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [quality, setQuality] = useState("standard")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch approved words
      const { data: wordsData, error: wordsError } = await supabase
        .from("words")
        .select("*")
        .eq("is_approved", true)
        .order("eng_word")

      if (wordsError) throw wordsError
      setWords(wordsData || [])

      // Fetch user's generated images
      if (user) {
        const { data: imagesData, error: imagesError } = await supabase
          .from("word_images")
          .select(`
            *,
            words (
              id,
              eng_word,
              tur_word,
              difficulty_level
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (imagesError) throw imagesError
        setImages(imagesData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error loading data")
    } finally {
      setLoading(false)
    }
  }

  const generateImage = async () => {
    if (!user) {
      toast.error("Please log in first")
      return
    }

    if (!selectedWordId) {
      toast.error("Please select a word")
      return
    }

    if (!customPrompt.trim()) {
      toast.error("Please enter an image description")
      return
    }

    try {
      setGenerating(true)

      const response = await fetch("/api/generate-word-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          wordId: selectedWordId,
          prompt: customPrompt,
          quality: quality,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed")
      }

      toast.success("Image generated successfully!")
      setCustomPrompt("")
      setSelectedWordId("")
      fetchData() // Refresh images
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error(error instanceof Error ? error.message : "Image generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Image downloaded")
    } catch (error) {
      toast.error("Failed to download image")
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case 2:
        return "bg-blue-50 text-blue-700 border-blue-200"
      case 3:
        return "bg-amber-50 text-amber-700 border-amber-200"
      case 4:
        return "bg-orange-50 text-orange-700 border-orange-200"
      case 5:
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1:
        return "Beginner"
      case 2:
        return "Basic"
      case 3:
        return "Intermediate"
      case 4:
        return "Advanced"
      case 5:
        return "Expert"
      default:
        return "Unknown"
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Login Required</h2>
              <p className="text-slate-600 mb-6">Please log in to generate images.</p>
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                  Log In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse"></div>
              <p className="text-slate-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">AI Image Generator</h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">Create custom AI images for your vocabulary words</p>
        </div>

        {/* Image Generation Form */}
        <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-cyan-600" />
              <span>Create New Image</span>
            </CardTitle>
            <CardDescription>Select a word and describe the image you want to create</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="word" className="text-sm font-medium text-slate-900">
                Select Word
              </Label>
              <Select value={selectedWordId} onValueChange={setSelectedWordId}>
                <SelectTrigger className="h-12 border-slate-300 focus:border-cyan-500 focus:ring-cyan-500">
                  <SelectValue placeholder="Choose a word..." />
                </SelectTrigger>
                <SelectContent>
                  {words.map((word) => (
                    <SelectItem key={word.id} value={word.id}>
                      <div className="flex items-center gap-3 py-1">
                        <span className="font-medium text-slate-900">{word.eng_word}</span>
                        <span className="text-slate-500">({word.tur_word})</span>
                        <Badge className={`text-xs ${getDifficultyColor(word.difficulty_level)}`}>
                          {getDifficultyText(word.difficulty_level)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-sm font-medium text-slate-900">
                Image Description
              </Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image you want to create. Example: A colorful cartoon illustration of a happy cat playing in a garden"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="quality" className="text-sm font-medium text-slate-900">
                Quality Level
              </Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="h-12 border-slate-300 focus:border-cyan-500 focus:ring-cyan-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    <div className="space-y-1 py-1">
                      <div className="font-medium">Simple</div>
                      <div className="text-sm text-slate-500">Fast generation (3-4 minutes)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="space-y-1 py-1">
                      <div className="font-medium">Standard</div>
                      <div className="text-sm text-slate-500">Balanced quality (5-6 minutes)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="space-y-1 py-1">
                      <div className="font-medium">Advanced</div>
                      <div className="text-sm text-slate-500">High quality (8-10 minutes)</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateImage}
              disabled={generating || !selectedWordId || !customPrompt.trim()}
              className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-base font-medium"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Images Gallery */}
        {images.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-cyan-600" />
                <span>Your Generated Images</span>
              </CardTitle>
              <CardDescription>Previously created AI images</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image) => (
                  <div key={image.id} className="space-y-4 group">
                    <div className="relative overflow-hidden rounded-xl shadow-lg">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={`AI generated image for ${image.words?.eng_word}`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              downloadImage(image.image_url, `${image.words?.eng_word || "image"}-${image.id}.jpg`)
                            }
                            className="bg-white/90 hover:bg-white text-slate-900"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Link href={`/words/${image.word_id}`}>
                            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-slate-900">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{image.words?.eng_word}</span>
                        <span className="text-sm text-slate-500">({image.words?.tur_word})</span>
                        {image.words && (
                          <Badge className={`text-xs ${getDifficultyColor(image.words.difficulty_level)}`}>
                            {getDifficultyText(image.words.difficulty_level)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{image.prompt}</p>

                      <p className="text-xs text-slate-400">
                        {new Date(image.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {images.length === 0 && !loading && (
          <Card className="max-w-md mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">No Images Yet</h3>
              <p className="text-slate-600">Use the form above to create your first AI image</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
