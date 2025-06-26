"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"
import { Lightbulb, RotateCcw, Trophy, Target } from "lucide-react"
import { toast } from "sonner"

interface Word {
  id: string
  english: string
  turkish: string
}

interface GameState {
  currentWord: Word | null
  guesses: string[]
  currentGuess: string
  gameStatus: "playing" | "won" | "lost"
  attempts: number
  showHint: boolean
}

export default function WordlePage() {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    guesses: [],
    currentGuess: "",
    gameStatus: "playing",
    attempts: 0,
    showHint: false,
  })
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadWords()
  }, [])

  const loadWords = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: wordsData, error } = await supabase
        .from("words")
        .select("id, english, turkish")
        .eq("user_id", user.id)
        .eq("length(english)", 5)

      if (error) throw error

      const fiveLetterWords =
        wordsData?.filter((word) => word.english && word.english.length === 5 && /^[A-Za-z]+$/.test(word.english)) || []

      setWords(fiveLetterWords)

      if (fiveLetterWords.length > 0) {
        startNewGame(fiveLetterWords)
      } else {
        toast.error("5 harfli kelime bulunamadı. Lütfen kelime ekleyin.")
      }
    } catch (error) {
      console.error("Error loading words:", error)
      toast.error("Kelimeler yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const startNewGame = (wordList: Word[] = words) => {
    if (wordList.length === 0) return

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)]
    setGameState({
      currentWord: randomWord,
      guesses: [],
      currentGuess: "",
      gameStatus: "playing",
      attempts: 0,
      showHint: false,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 5)
    setGameState((prev) => ({ ...prev, currentGuess: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      makeGuess()
    }
  }

  const makeGuess = () => {
    if (!gameState.currentWord || gameState.currentGuess.length !== 5) {
      toast.error("5 harfli bir kelime girin")
      return
    }

    if (gameState.guesses.includes(gameState.currentGuess)) {
      toast.error("Bu kelimeyi zaten denediniz")
      return
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess]
    const newAttempts = gameState.attempts + 1

    let newGameStatus: "playing" | "won" | "lost" = "playing"

    if (gameState.currentGuess === gameState.currentWord.english.toUpperCase()) {
      newGameStatus = "won"
      toast.success("Tebrikler! Kelimeyi buldunuz! 🎉")
    } else if (newAttempts >= 6) {
      newGameStatus = "lost"
      toast.error(`Oyun bitti! Kelime: ${gameState.currentWord.english.toUpperCase()}`)
    }

    setGameState((prev) => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: "",
      gameStatus: newGameStatus,
      attempts: newAttempts,
    }))
  }

  const getLetterStatus = (letter: string, position: number, word: string): "correct" | "present" | "absent" => {
    const targetWord = gameState.currentWord?.english.toUpperCase() || ""

    if (targetWord[position] === letter) {
      return "correct"
    } else if (targetWord.includes(letter)) {
      return "present"
    } else {
      return "absent"
    }
  }

  const toggleHint = () => {
    setGameState((prev) => ({ ...prev, showHint: !prev.showHint }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Target className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Kelime Bulunamadı</h2>
              <p className="text-gray-600 mb-6">
                Wordle oynamak için en az bir adet 5 harfli İngilizce kelime eklemeniz gerekiyor.
              </p>
              <Button
                onClick={() => (window.location.href = "/words/add")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Kelime Ekle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Wordle</h1>
          <p className="text-gray-600">Guess the 5-letter word in 6 tries</p>
        </div>

        {/* Game Stats */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  Deneme: {gameState.attempts}/6
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Kalan: {6 - gameState.attempts}
                </Badge>
                <Badge
                  variant={
                    gameState.gameStatus === "won"
                      ? "default"
                      : gameState.gameStatus === "lost"
                        ? "destructive"
                        : "secondary"
                  }
                  className="px-3 py-1"
                >
                  {gameState.gameStatus === "won"
                    ? "Kazandınız!"
                    : gameState.gameStatus === "lost"
                      ? "Kaybettiniz"
                      : "Oynuyor"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleHint} className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  İpucu
                </Button>
                <Button variant="outline" size="sm" onClick={() => startNewGame()} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Yeni Oyun
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hint */}
        {gameState.showHint && gameState.currentWord && (
          <Card className="backdrop-blur-sm bg-amber-50/80 border-amber-200 shadow-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800">İpucu:</span>
                <span className="text-amber-700">{gameState.currentWord.turkish}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Board */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="grid grid-rows-6 gap-2 mb-6">
              {Array.from({ length: 6 }, (_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, colIndex) => {
                    const guess = gameState.guesses[rowIndex]
                    const letter = guess ? guess[colIndex] : ""
                    const status = guess ? getLetterStatus(letter, colIndex, guess) : "empty"

                    return (
                      <div
                        key={colIndex}
                        className={`
                          w-14 h-14 border-2 rounded-lg flex items-center justify-center text-xl font-bold
                          ${
                            status === "correct"
                              ? "bg-green-500 text-white border-green-500"
                              : status === "present"
                                ? "bg-yellow-500 text-white border-yellow-500"
                                : status === "absent"
                                  ? "bg-gray-400 text-white border-gray-400"
                                  : "bg-white border-gray-300"
                          }
                          transition-all duration-300
                        `}
                      >
                        {letter}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Input */}
            {gameState.gameStatus === "playing" && (
              <div className="space-y-4">
                <Input
                  value={gameState.currentGuess}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="5 harfli kelime girin..."
                  className="text-center text-xl font-bold uppercase tracking-wider"
                  maxLength={5}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  onClick={makeGuess}
                  disabled={gameState.currentGuess.length !== 5}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Tahmin Et
                </Button>
              </div>
            )}

            {/* Game Over */}
            {gameState.gameStatus !== "playing" && (
              <div className="text-center space-y-4">
                {gameState.gameStatus === "won" && (
                  <div className="space-y-2">
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-green-600">Tebrikler!</h3>
                    <p className="text-gray-600">Kelimeyi {gameState.attempts} denemede buldunuz!</p>
                  </div>
                )}

                {gameState.gameStatus === "lost" && (
                  <div className="space-y-2">
                    <Target className="h-16 w-16 text-red-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-red-600">Oyun Bitti</h3>
                    <p className="text-gray-600">
                      Doğru kelime: <span className="font-bold">{gameState.currentWord?.english.toUpperCase()}</span>
                    </p>
                    <p className="text-gray-600">
                      Türkçe anlamı: <span className="font-bold">{gameState.currentWord?.turkish}</span>
                    </p>
                  </div>
                )}

                <Button onClick={() => startNewGame()} className="bg-purple-600 hover:bg-purple-700">
                  Yeni Oyun Başlat
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
