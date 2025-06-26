"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, XCircle, SkipForward, Volume2, RefreshCw, Target, Trophy, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QuizWord {
  id: string
  eng_word: string
  tur_word: string
  audio_url: string | null
  difficulty_level: number
}

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export default function QuizPage() {
  const { user } = useAuth()
  const [currentWord, setCurrentWord] = useState<QuizWord | null>(null)
  const [options, setOptions] = useState<QuizOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [availableWords, setAvailableWords] = useState<QuizWord[]>([])

  const { toast } = useToast()

  // Quiz'i başlat
  const initializeQuiz = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")

      console.log("Initializing quiz...")

      // Basit kelime listesi al
      const { data: words, error } = await supabase
        .from("words")
        .select("id, eng_word, tur_word, audio_url, difficulty_level")
        .eq("is_approved", true)
        .limit(20)

      if (error) {
        console.error("Words fetch error:", error)
        setError(`Error loading words: ${error.message}`)
        return
      }

      if (!words || words.length === 0) {
        setError("No approved words found. Please add words first.")
        return
      }

      console.log("Words loaded:", words.length)
      setAvailableWords(words)
      setTotalQuestions(Math.min(10, words.length))

      // İlk soruyu yükle
      await loadQuestion(words, 0)
    } catch (error: any) {
      console.error("Quiz initialization error:", error)
      setError(`Quiz initialization error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Soru yükle
  const loadQuestion = async (words: QuizWord[], index: number) => {
    if (index >= Math.min(totalQuestions, words.length)) {
      setQuizCompleted(true)
      return
    }

    try {
      const word = words[index]
      setCurrentWord(word)
      setCurrentIndex(index)

      // Yanlış seçenekler için rastgele kelimeler al
      const wrongOptions = words
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.tur_word)

      // Seçenekleri oluştur
      const allOptions: QuizOption[] = [
        { id: "correct", text: word.tur_word, isCorrect: true },
        ...wrongOptions.map((text, i) => ({
          id: `wrong_${i}`,
          text,
          isCorrect: false,
        })),
      ]

      // Seçenekleri karıştır
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)
      setOptions(shuffledOptions)
      setSelectedOption(null)
      setShowResult(false)
      setIsCorrect(false)

      console.log("Question loaded:", word.eng_word)
    } catch (error) {
      console.error("Question loading error:", error)
      setError("Error loading question")
    }
  }

  // Cevap ver
  const handleAnswer = async (optionId: string) => {
    if (!currentWord || !user || showResult) return

    setSelectedOption(optionId)
    const correctOption = options.find((opt) => opt.isCorrect)
    const selectedCorrect = optionId === correctOption?.id

    setIsCorrect(selectedCorrect)
    setShowResult(true)

    if (selectedCorrect) {
      setScore(score + 1)
    }

    // Quiz sonucunu kaydet ve öğrenilen kelimeleri işaretle
    try {
      // Quiz attempt'i kaydet
      const { data: quizAttempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          word_id: currentWord.id,
          result: selectedCorrect ? "correct" : "incorrect",
          repetition_count: selectedCorrect ? 1 : 0,
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (attemptError) {
        console.error("Quiz attempt save error:", attemptError)
      }

      // Eğer doğru cevap verildiyse ve bu kelime daha önce öğrenilmemişse, learned_words'e ekle
      if (selectedCorrect) {
        const { data: existingLearned } = await supabase
          .from("learned_words")
          .select("id")
          .eq("user_id", user.id)
          .eq("word_id", currentWord.id)
          .single()

        if (!existingLearned) {
          const { error: learnedError } = await supabase.from("learned_words").insert({
            user_id: user.id,
            word_id: currentWord.id,
            mastered_at: new Date().toISOString(),
          })

          if (learnedError) {
            console.error("Learned word save error:", learnedError)
          } else {
            console.log("Word marked as learned:", currentWord.eng_word)
          }
        }
      }
    } catch (error) {
      console.error("Quiz result save error:", error)
      // Hata olsa bile devam et
    }
  }

  // Sonraki soru
  const handleNext = () => {
    loadQuestion(availableWords, currentIndex + 1)
  }

  // Soruyu atla
  const handleSkip = () => {
    if (currentWord && user) {
      // Skip'i kaydet
      supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          word_id: currentWord.id,
          result: "skipped",
          repetition_count: 0,
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .catch(console.error)
    }
    loadQuestion(availableWords, currentIndex + 1)
  }

  // Ses çal
  const playAudio = () => {
    if (currentWord?.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audio.play().catch(console.error)
    }
  }

  // Quiz'i yeniden başlat
  const restartQuiz = () => {
    setCurrentIndex(0)
    setScore(0)
    setQuizCompleted(false)
    setError("")
    initializeQuiz()
  }

  // Component mount
  useEffect(() => {
    if (user) {
      initializeQuiz()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
              <p className="text-slate-600 font-medium">Preparing quiz...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
                <div className="mt-4 space-x-2">
                  <Button onClick={restartQuiz} size="sm" className="bg-red-600 hover:bg-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => (window.location.href = "/words/add")}>
                    Add Words
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const accuracy = Math.round((score / totalQuestions) * 100)
    const getScoreColor = () => {
      if (accuracy >= 80) return "from-green-500 to-emerald-600"
      if (accuracy >= 60) return "from-blue-500 to-cyan-600"
      return "from-orange-500 to-red-600"
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-r ${getScoreColor()} rounded-full flex items-center justify-center`}
                >
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Quiz Complete</CardTitle>
                <CardDescription className="text-slate-600">Great job on your progress!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-2">
                    {score}/{totalQuestions}
                  </div>
                  <div className="text-lg text-slate-600 mb-4">Accuracy: {accuracy}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-6">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getScoreColor()} transition-all duration-1000`}
                      style={{ width: `${accuracy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={restartQuiz}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Quiz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/dashboard")}
                    className="w-full border-slate-200 hover:bg-slate-50"
                  >
                    Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading question...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-0 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Quiz Challenge</h2>
                  <p className="text-sm text-slate-600">
                    Question {currentIndex + 1} of {totalQuestions}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{score}</div>
                <div className="text-sm text-slate-600">Score</div>
              </div>
            </div>
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2 bg-slate-200" />
          </div>

          {/* Question Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-slate-900">{currentWord.eng_word}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
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
              </div>
              <CardDescription className="text-slate-600">Select the Turkish translation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showResult ? (
                <>
                  <div className="grid gap-3">
                    {options.map((option) => (
                      <Button
                        key={option.id}
                        variant={selectedOption === option.id ? "default" : "outline"}
                        className={`h-14 text-left justify-start text-base font-medium rounded-xl transition-all duration-200 ${
                          selectedOption === option.id
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                        onClick={() => handleAnswer(option.id)}
                        disabled={showResult}
                      >
                        {option.text}
                      </Button>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip Question
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div
                    className={`p-6 rounded-xl ${isCorrect ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200" : "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200"}`}
                  >
                    <div className="flex items-center space-x-3">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <span className={`font-semibold text-lg ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </span>
                        {!isCorrect && (
                          <p className="text-sm text-slate-600 mt-1">
                            Correct answer: <strong>{currentWord.tur_word}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-base font-medium"
                  >
                    {currentIndex + 1 >= totalQuestions ? "Complete Quiz" : "Next Question"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Quiz Tips</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>• Read the English word and select its Turkish translation</p>
                    <p>• Correct answers increase your score</p>
                    <p>• Skip questions you're unsure about</p>
                    <p>• View your total score at the end</p>
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
