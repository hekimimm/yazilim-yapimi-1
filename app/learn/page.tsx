"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { RotateCcw, Volume2, Eye, CheckCircle, XCircle, BookOpen, Brain, Target, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LearnWord {
  id: string
  eng_word: string
  tur_word: string
  audio_url: string | null
  difficulty_level: number
  word_samples: { sample_text: string }[]
}

export default function LearnPage() {
  const { user } = useAuth()
  const [words, setWords] = useState<LearnWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionStats, setSessionStats] = useState({
    known: 0,
    learning: 0,
    total: 0,
  })

  const { toast } = useToast()

  useEffect(() => {
    const loadLearningWords = async () => {
      if (!user) return

      try {
        // Öğrenilmemiş veya az tekrar edilmiş kelimeleri al
        const { data: reviewWords } = await supabase
          .from("quiz_attempts")
          .select(`
            word_id,
            repetition_count,
            words (
              id,
              eng_word,
              tur_word,
              audio_url,
              difficulty_level
            )
          `)
          .eq("user_id", user.id)
          .lt("repetition_count", 3)
          .limit(20)

        // Hiç quiz'e girmemiş yeni kelimeler
        const { data: newWords } = await supabase
          .from("words")
          .select(`
            id,
            eng_word,
            tur_word,
            audio_url,
            difficulty_level
          `)
          .eq("is_approved", true)
          .not("id", "in", `(${reviewWords?.map((rw) => rw.word_id).join(",") || "null"})`)
          .limit(10)

        // Word samples'ı al
        const allWordIds = [...(reviewWords?.map((rw) => rw.words.id) || []), ...(newWords?.map((w) => w.id) || [])]

        const { data: samples } = await supabase
          .from("word_samples")
          .select("word_id, sample_text")
          .in("word_id", allWordIds)

        // Verileri birleştir
        const combinedWords = [
          ...(reviewWords?.map((rw) => ({
            ...rw.words,
            word_samples: samples?.filter((s) => s.word_id === rw.words.id) || [],
          })) || []),
          ...(newWords?.map((w) => ({
            ...w,
            word_samples: samples?.filter((s) => s.word_id === w.id) || [],
          })) || []),
        ]

        setWords(combinedWords)
        setSessionStats((prev) => ({ ...prev, total: combinedWords.length }))
      } catch (error) {
        console.error("Learning words loading error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLearningWords()
  }, [user])

  const currentWord = words[currentIndex]

  const playAudio = () => {
    if (currentWord?.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audio.play().catch((error) => {
        console.error("Ses çalınamadı:", error)
      })
    }
  }

  const handleKnown = async () => {
    if (!currentWord || !user) return

    // Quiz attempt olarak kaydet
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      word_id: currentWord.id,
      result: "correct",
      repetition_count: 1,
      next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    setSessionStats((prev) => ({ ...prev, known: prev.known + 1 }))
    nextWord()
  }

  const handleLearning = async () => {
    if (!currentWord || !user) return

    // Quiz attempt olarak kaydet
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      word_id: currentWord.id,
      result: "incorrect",
      repetition_count: 0,
      next_review_date: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 dakika sonra
    })

    setSessionStats((prev) => ({ ...prev, learning: prev.learning + 1 }))
    nextWord()
  }

  const nextWord = () => {
    setShowTranslation(false)
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Session tamamlandı
      toast({
        title: "Session Complete",
        description: `${sessionStats.known + 1} known, ${sessionStats.learning} learning words.`,
      })
    }
  }

  const restartSession = () => {
    setCurrentIndex(0)
    setShowTranslation(false)
    setSessionStats({ known: 0, learning: 0, total: words.length })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
              <p className="text-slate-600 font-medium">Preparing learning materials...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Ready to Learn</h3>
                <p className="text-slate-600 mb-6">All words mastered or no words available for learning.</p>
                <Button
                  onClick={() => (window.location.href = "/words/add")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Add New Words
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (currentIndex >= words.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Session Complete</CardTitle>
                <CardDescription className="text-slate-600">Excellent progress today!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{sessionStats.known}</div>
                    <div className="text-sm text-green-600 font-medium">Known</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{sessionStats.learning}</div>
                    <div className="text-sm text-blue-600 font-medium">Learning</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={restartSession}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New Session
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/quiz")}
                    className="w-full border-slate-200 hover:bg-slate-50"
                  >
                    Take Quiz
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-0 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Learning Session</h2>
                  <p className="text-sm text-slate-600">
                    Word {currentIndex + 1} of {words.length}
                  </p>
                </div>
              </div>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">{sessionStats.known}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">{sessionStats.learning}</span>
                </div>
              </div>
            </div>
            <Progress value={((currentIndex + 1) / words.length) * 100} className="h-2 bg-slate-200" />
          </div>

          {/* Flashcard */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge className={`${getDifficultyColor(currentWord.difficulty_level)} border font-medium`}>
                  Level {currentWord.difficulty_level}
                </Badge>
                {currentWord.audio_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={playAudio}
                    className="hover:bg-slate-100 rounded-full w-10 h-10 p-0"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-8 pb-8">
              {/* English Word */}
              <div className="py-8">
                <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">{currentWord.eng_word}</h1>

                {/* Translation Area */}
                <div className="min-h-[100px] flex items-center justify-center">
                  {showTranslation ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <h2 className="text-3xl font-semibold text-blue-700">{currentWord.tur_word}</h2>
                      {currentWord.word_samples.length > 0 && (
                        <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-sm text-slate-600 italic leading-relaxed">
                            "{currentWord.word_samples[0].sample_text}"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowTranslation(true)}
                      className="border-slate-300 hover:bg-slate-50 px-8 py-3 rounded-xl"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show Translation
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {showTranslation && (
                <div className="flex space-x-4 animate-in slide-in-from-bottom duration-300">
                  <Button
                    onClick={handleLearning}
                    variant="outline"
                    className="flex-1 h-14 border-orange-200 hover:bg-orange-50 text-orange-700 rounded-xl"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Still Learning
                  </Button>
                  <Button
                    onClick={handleKnown}
                    className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />I Know This
                  </Button>
                </div>
              )}

              {!showTranslation && (
                <p className="text-sm text-slate-500">Do you know this word? Check the translation first.</p>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">How It Works</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>
                      <strong>I Know This:</strong> Word will be reviewed in 1 day
                    </p>
                    <p>
                      <strong>Still Learning:</strong> Word will be reviewed in 10 minutes
                    </p>
                    <p>Correct answers add words to spaced repetition system</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
