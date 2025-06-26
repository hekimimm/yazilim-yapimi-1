"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Volume2, Download, ImageIcon, Sparkles, ArrowLeft, BookOpen, Clock, User } from "lucide-react"
import Link from "next/link"

interface Word {
  id: string
  eng_word: string
  tur_word: string
  difficulty_level: number
  audio_url?: string
  created_at: string
  created_by?: string
}

interface WordSample {
  id: string
  sample_text: string
}

interface WordImage {
  id: string
  prompt: string
  image_url: string
  created_at: string
}

export default function WordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [word, setWord] = useState<Word | null>(null)
  const [samples, setSamples] = useState<WordSample[]>([])
  const [images, setImages] = useState<WordImage[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const [imageQuality, setImageQuality] = useState("standard")

  useEffect(() => {
    if (params.id) {
      fetchWordDetails()
    }
  }, [params.id])

  const fetchWordDetails = async () => {
    try {
      setLoading(true)

      // Fetch word details
      const { data: wordData, error: wordError } = await supabase.from("words").select("*").eq("id", params.id).single()

      if (wordError) throw wordError

      setWord(wordData)
      setImagePrompt(`A beautiful illustration of ${wordData.eng_word}`)

      // Fetch word samples
      const { data: samplesData, error: samplesError } = await supabase
        .from("word_samples")
        .select("*")
        .eq("word_id", params.id)

      if (samplesError) throw samplesError

      setSamples(samplesData || [])

      // Fetch word images
      const { data: imagesData, error: imagesError } = await supabase
        .from("word_images")
        .select("*")
        .eq("word_id", params.id)
        .order("created_at", { ascending: false })

      if (imagesError) throw imagesError

      setImages(imagesData || [])
    } catch (error) {
      console.error("Error fetching word details:", error)
      toast.error("Kelime detayları yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const generateImage = async () => {
    if (!user || !word) {
      toast.error("Giriş yapmanız gerekiyor")
      return
    }

    if (!imagePrompt.trim()) {
      toast.error("Lütfen bir görsel açıklaması girin")
      return
    }

    try {
      setGenerating(true)

      const response = await fetch("/api/generate-word-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wordId: word.id,
          prompt: imagePrompt,
          quality: imageQuality,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Görsel oluşturma başarısız")
      }

      toast.success("Görsel başarıyla oluşturuldu!")
      setImagePrompt(`A beautiful illustration of ${word.eng_word}`)
      fetchWordDetails() // Refresh images
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error(error instanceof Error ? error.message : "Görsel oluşturma başarısız")
    } finally {
      setGenerating(false)
    }
  }

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    } else {
      toast.error("Ses özelliği bu tarayıcıda desteklenmiyor")
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
      toast.success("Görsel indirildi")
    } catch (error) {
      toast.error("Görsel indirilemedi")
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case 2:
        return "bg-blue-100 text-blue-700 border-blue-200"
      case 3:
        return "bg-amber-100 text-amber-700 border-amber-200"
      case 4:
        return "bg-orange-100 text-orange-700 border-orange-200"
      case 5:
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1:
        return "Başlangıç"
      case 2:
        return "Temel"
      case 3:
        return "Orta"
      case 4:
        return "İleri"
      case 5:
        return "Uzman"
      default:
        return "Bilinmiyor"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!word) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Kelime Bulunamadı</h2>
              <p className="text-slate-600 mb-6">Aradığınız kelime mevcut değil.</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div className="h-4 w-px bg-slate-300" />
          <Link href="/words" className="text-sm text-slate-600 hover:text-slate-900">
            Kelimeler
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-900">{word.eng_word}</span>
        </div>

        {/* Word Header */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-4xl font-bold text-slate-900">{word.eng_word}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playAudio(word.eng_word)}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-2xl font-semibold text-blue-600 mb-4">{word.tur_word}</CardDescription>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(word.created_at).toLocaleDateString("tr-TR")}
                  </div>
                  {word.created_by && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Kullanıcı tarafından eklendi
                    </div>
                  )}
                </div>
              </div>
              <Badge className={getDifficultyColor(word.difficulty_level)}>
                {getDifficultyText(word.difficulty_level)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Example Sentences */}
        {samples.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                Örnek Cümleler
              </CardTitle>
              <CardDescription>Bu kelimenin kullanım örnekleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {samples.map((sample, index) => (
                <div
                  key={sample.id}
                  className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200/50"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 leading-relaxed">{sample.sample_text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAudio(sample.sample_text)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Volume2 className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Image Generation */}
        {user && (
          <Card id="generate-image" className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Görsel Oluştur
              </CardTitle>
              <CardDescription>Bu kelime için özel eğitim görseli oluşturun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-sm font-medium text-slate-700">
                  Görsel Açıklaması
                </Label>
                <Textarea
                  id="prompt"
                  placeholder={`"${word.eng_word}" kelimesi için nasıl bir görsel istiyorsunuz?`}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <p className="text-xs text-slate-500">
                  Örnek: "A colorful illustration of a {word.eng_word} in a modern style"
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="quality" className="text-sm font-medium text-slate-700">
                  Görsel Kalitesi
                </Label>
                <Select value={imageQuality} onValueChange={setImageQuality}>
                  <SelectTrigger className="bg-white/50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">
                      <div className="flex flex-col items-start">
                        <span>Basit</span>
                        <span className="text-xs text-slate-500">512x512, Hızlı</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="standard">
                      <div className="flex flex-col items-start">
                        <span>Standart</span>
                        <span className="text-xs text-slate-500">1024x1024, Dengeli</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex flex-col items-start">
                        <span>Gelişmiş</span>
                        <span className="text-xs text-slate-500">1024x1024 HD, Yüksek Kalite</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateImage}
                disabled={generating || !imagePrompt.trim()}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Görsel oluşturuluyor...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Görsel Oluştur
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Images */}
        {images.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-slate-600" />
                Oluşturulan Görseller
              </CardTitle>
              <CardDescription>Bu kelime için oluşturulan AI görselleri ({images.length} adet)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <div key={image.id} className="group space-y-3">
                    <div className="relative overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={`${word.eng_word} illustration`}
                        className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => downloadImage(image.image_url, `${word.eng_word}-${image.id}.jpg`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          İndir
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{image.prompt}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {new Date(image.created_at).toLocaleDateString("tr-TR")}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          AI Generated
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
