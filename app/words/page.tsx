"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Volume2, Plus, Eye, Filter, BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"

interface Word {
  id: string
  eng_word: string
  tur_word: string
  difficulty_level: number
  audio_url?: string
  picture_url?: string
  is_approved: boolean
  created_at: string
  word_samples?: { sample_text: string }[]
}

export default function WordsPage() {
  const { user } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchWords()
  }, [])

  useEffect(() => {
    filterWords()
  }, [words, searchTerm, difficultyFilter])

  const fetchWords = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("words")
        .select(`
          *,
          word_samples (sample_text)
        `)
        .eq("is_approved", true)
        .order("eng_word")

      if (error) throw error

      setWords(data || [])
    } catch (error) {
      console.error("Error fetching words:", error)
      toast.error("Kelimeler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const filterWords = () => {
    let filtered = words

    if (searchTerm) {
      filtered = filtered.filter(
        (word) =>
          word.eng_word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.tur_word.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((word) => word.difficulty_level === Number.parseInt(difficultyFilter))
    }

    setFilteredWords(filtered)
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
              <p className="text-slate-600">Kelimeler yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kelime Sözlüğü</h1>
            <p className="text-slate-600 mt-1">{filteredWords.length} kelime bulundu</p>
          </div>
          {user && (
            <Link href="/words/add">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Kelime Ekle
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Kelime ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtreler
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                  <div className="w-full md:w-48">
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger className="bg-white/50 border-slate-200">
                        <SelectValue placeholder="Zorluk seviyesi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm seviyeler</SelectItem>
                        <SelectItem value="1">Başlangıç</SelectItem>
                        <SelectItem value="2">Temel</SelectItem>
                        <SelectItem value="3">Orta</SelectItem>
                        <SelectItem value="4">İleri</SelectItem>
                        <SelectItem value="5">Uzman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Words Grid */}
        {filteredWords.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm ? "Kelime bulunamadı" : "Henüz kelime yok"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? "Arama kriterlerinizi değiştirmeyi deneyin" : "Henüz onaylanmış kelime bulunmuyor"}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Aramayı Temizle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWords.map((word) => (
              <Card
                key={word.id}
                className="group bg-white/60 backdrop-blur-sm border-white/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl font-bold text-slate-900">{word.eng_word}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playAudio(word.eng_word)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Volume2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                      <CardDescription className="text-lg font-medium text-blue-600">{word.tur_word}</CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(word.difficulty_level)}>
                      {getDifficultyText(word.difficulty_level)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {word.picture_url && (
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={word.picture_url || "/placeholder.svg"}
                        alt={word.eng_word}
                        className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}

                  {word.word_samples && word.word_samples.length > 0 && (
                    <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
                      <p className="text-xs font-medium text-slate-600 mb-1">Örnek Kullanım:</p>
                      <p className="text-sm text-slate-700 italic">"{word.word_samples[0].sample_text}"</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/words/${word.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-slate-200 hover:bg-slate-50">
                        <Eye className="h-4 w-4 mr-2" />
                        Detay
                      </Button>
                    </Link>
                    {user && (
                      <Link href={`/words/${word.id}#generate-image`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-200 hover:bg-blue-50 text-blue-600"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Görsel
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>İstatistikler</CardTitle>
            <CardDescription>Kelime dağılımı ve zorluk seviyeleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-slate-50/50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{words.length}</div>
                <div className="text-sm text-slate-600">Toplam</div>
              </div>
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="text-center p-4 bg-slate-50/50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">
                    {words.filter((w) => w.difficulty_level === level).length}
                  </div>
                  <div className="text-sm text-slate-600">{getDifficultyText(level)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
