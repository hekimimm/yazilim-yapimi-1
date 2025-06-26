"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash2, ArrowLeft, BookOpen, Volume2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AddWordPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [engWord, setEngWord] = useState("")
  const [turWord, setTurWord] = useState("")
  const [samples, setSamples] = useState([""])
  const [difficultyLevel, setDifficultyLevel] = useState("1")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const addSample = () => {
    setSamples([...samples, ""])
  }

  const removeSample = (index: number) => {
    setSamples(samples.filter((_, i) => i !== index))
  }

  const updateSample = (index: number, value: string) => {
    const newSamples = [...samples]
    newSamples[index] = value
    setSamples(newSamples)
  }

  const uploadAudio = async (file: File, wordId: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${wordId}.${fileExt}`
    const filePath = `audio/${fileName}`

    const { error: uploadError } = await supabase.storage.from("word-audio").upload(filePath, file)

    if (uploadError) {
      console.error("Ses dosyası yüklenirken hata:", uploadError)
      return null
    }

    const { data } = supabase.storage.from("word-audio").getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Giriş yapmanız gerekiyor")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Add word
      const { data: wordData, error: wordError } = await supabase
        .from("words")
        .insert({
          eng_word: engWord.trim(),
          tur_word: turWord.trim(),
          difficulty_level: Number.parseInt(difficultyLevel),
          created_by: user.id,
          is_approved: false,
        })
        .select()
        .single()

      if (wordError) throw wordError

      // Upload audio if provided
      if (audioFile) {
        const audioUrl = await uploadAudio(audioFile, wordData.id)
        if (audioUrl) {
          await supabase.from("words").update({ audio_url: audioUrl }).eq("id", wordData.id)
        }
      }

      // Add sample sentences
      const validSamples = samples.filter((sample) => sample.trim() !== "")
      if (validSamples.length > 0) {
        const sampleData = validSamples.map((sample) => ({
          word_id: wordData.id,
          sample_text: sample.trim(),
        }))

        const { error: samplesError } = await supabase.from("word_samples").insert(sampleData)
        if (samplesError) {
          console.error("Örnek cümleler eklenirken hata:", samplesError)
        }
      }

      setSuccess(true)
      toast.success("Kelime başarıyla eklendi!")
    } catch (error: any) {
      console.error("Kelime ekleme hatası:", error)
      setError(error.message || "Beklenmeyen bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "1":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "2":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "3":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "4":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "5":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const playPreview = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/60 backdrop-blur-sm border-white/20 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Kelime Eklendi!</h2>
                <p className="text-slate-600 mb-6">Kelimeniz admin onayından sonra sistemde görünecek.</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/words")}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Kelimeleri Gör
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false)
                      setEngWord("")
                      setTurWord("")
                      setSamples([""])
                      setDifficultyLevel("1")
                      setAudioFile(null)
                    }}
                    className="flex-1"
                  >
                    Yeni Kelime Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
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
            <span className="text-sm font-medium text-slate-900">Yeni Kelime</span>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Yeni Kelime Ekle</h1>
            </div>
            <p className="text-slate-600">Sisteme yeni bir İngilizce kelime ve Türkçe karşılığını ekleyin</p>
          </div>

          {/* Form */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Kelime Bilgileri</CardTitle>
              <CardDescription>Eklediğiniz kelime admin onayından sonra sistemde görünecektir</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Word Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="engWord" className="text-sm font-medium text-slate-700">
                      İngilizce Kelime *
                    </Label>
                    <div className="relative">
                      <Input
                        id="engWord"
                        value={engWord}
                        onChange={(e) => setEngWord(e.target.value)}
                        placeholder="beautiful"
                        required
                        className="bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                      />
                      {engWord && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => playPreview(engWord)}
                        >
                          <Volume2 className="h-4 w-4 text-slate-400" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="turWord" className="text-sm font-medium text-slate-700">
                      Türkçe Karşılık *
                    </Label>
                    <Input
                      id="turWord"
                      value={turWord}
                      onChange={(e) => setTurWord(e.target.value)}
                      placeholder="güzel"
                      required
                      className="bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-3">
                  <Label htmlFor="difficulty" className="text-sm font-medium text-slate-700">
                    Zorluk Seviyesi
                  </Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger className="bg-white/50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">1</Badge>
                          Başlangıç
                        </div>
                      </SelectItem>
                      <SelectItem value="2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">2</Badge>
                          Temel
                        </div>
                      </SelectItem>
                      <SelectItem value="3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">3</Badge>
                          Orta
                        </div>
                      </SelectItem>
                      <SelectItem value="4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">4</Badge>
                          İleri
                        </div>
                      </SelectItem>
                      <SelectItem value="5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-700 border-red-200">5</Badge>
                          Uzman
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Seçilen seviye:{" "}
                    <Badge className={getDifficultyColor(difficultyLevel)}>
                      {difficultyLevel === "1"
                        ? "Başlangıç"
                        : difficultyLevel === "2"
                          ? "Temel"
                          : difficultyLevel === "3"
                            ? "Orta"
                            : difficultyLevel === "4"
                              ? "İleri"
                              : "Uzman"}
                    </Badge>
                  </p>
                </div>

                {/* Audio Upload */}
                <div className="space-y-3">
                  <Label htmlFor="audio" className="text-sm font-medium text-slate-700">
                    Ses Dosyası (Opsiyonel)
                  </Label>
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-500">MP3, WAV veya M4A formatında ses dosyası yükleyebilirsiniz</p>
                </div>

                {/* Sample Sentences */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">Örnek Cümleler</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSample}>
                      <Plus className="h-4 w-4 mr-2" />
                      Örnek Ekle
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {samples.map((sample, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-1">
                          <Textarea
                            value={sample}
                            onChange={(e) => updateSample(index, e.target.value)}
                            placeholder={`Örnek cümle ${index + 1}`}
                            className="min-h-[80px] bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                        {samples.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSample(index)}
                            className="self-start mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !engWord.trim() || !turWord.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kelime ekleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Kelime Ekle
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} className="px-8">
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
