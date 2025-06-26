"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Loader2, BookOpen, Sparkles, Trash2, AlertCircle, ImageIcon, Palette, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Story {
  id: string
  content: string
  word_list: string[]
  created_at: string
  image_url?: string
}

// Kelime highlight component'i
function HighlightedText({ text, wordsToHighlight }: { text: string; wordsToHighlight: string[] }) {
  if (!wordsToHighlight || wordsToHighlight.length === 0) {
    return <span>{text}</span>
  }

  // Tüm kelimeleri ve varyasyonlarını içeren regex oluştur
  const allWords = wordsToHighlight.flatMap((word) => [
    word,
    word.toLowerCase(),
    word.toUpperCase(),
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  ])

  const regex = new RegExp(`\\b(${allWords.join("|")})\\b`, "gi")

  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => {
        const isHighlighted = allWords.some((word) => part.toLowerCase() === word.toLowerCase())

        return isHighlighted ? (
          <mark
            key={index}
            className="bg-gradient-to-r from-yellow-200 to-amber-200 px-2 py-1 rounded-md font-medium text-amber-900 shadow-sm"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    const loadStories = async () => {
      const { user } = await getCurrentUser()
      if (!user) return

      setUser(user)

      const { data: stories, error } = await supabase
        .from("ai_stories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Hikayeler yüklenirken hata:", error)
        setError("Error loading stories")
      } else {
        setStories(stories || [])
      }

      setLoading(false)
    }

    loadStories()
  }, [])

  const generateNewStory = async () => {
    if (!user) return

    setGenerating(true)
    setError("")

    try {
      // Öğrenilen kelimelerden rastgele seç
      const { data: learnedWords, error: learnedError } = await supabase
        .from("learned_words")
        .select(`
          words (
            eng_word
          )
        `)
        .eq("user_id", user.id)
        .limit(20)

      if (learnedError) {
        console.error("Learned words fetch error:", learnedError)
        setError("Error fetching learned words")
        return
      }

      let selectedWords: string[] = []

      if (!learnedWords || learnedWords.length === 0) {
        // Eğer learned_words'de kelime yoksa, quiz'den doğru cevaplananları al
        const { data: quizWords, error: quizError } = await supabase
          .from("quiz_attempts")
          .select(`
            words (
              eng_word
            )
          `)
          .eq("user_id", user.id)
          .eq("result", "correct")
          .limit(20)

        if (quizError) {
          console.error("Quiz words fetch error:", quizError)
          setError("Error fetching quiz words")
          return
        }

        if (!quizWords || quizWords.length < 5) {
          setError("At least 5 learned words required to create a story. Please take some quizzes first.")
          return
        }

        // Unique kelimeler al
        const uniqueWords = Array.from(new Set(quizWords.map((qw) => qw.words?.eng_word).filter(Boolean)))

        if (uniqueWords.length < 5) {
          setError("At least 5 different learned words required.")
          return
        }

        // Rastgele 5 kelime seç
        const shuffled = uniqueWords.sort(() => 0.5 - Math.random())
        selectedWords = shuffled.slice(0, 5)
      } else {
        // learned_words'den kelimeler al
        const availableWords = learnedWords.map((lw) => lw.words?.eng_word).filter(Boolean) as string[]

        if (availableWords.length < 5) {
          setError("At least 5 learned words required.")
          return
        }

        // Rastgele 5 kelime seç
        const shuffled = availableWords.sort(() => 0.5 - Math.random())
        selectedWords = shuffled.slice(0, 5)
      }

      console.log("Selected words for story:", selectedWords)

      // API route ile hikaye oluştur
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words: selectedWords }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "API call failed")
      }

      const { story: storyContent } = await response.json()

      // Hikayeyi veritabanına kaydet
      const { data: newStory, error: saveError } = await supabase
        .from("ai_stories")
        .insert({
          user_id: user.id,
          content: storyContent,
          word_list: selectedWords,
        })
        .select()
        .single()

      if (saveError) {
        console.error("Story save error:", saveError)
        setError("Error saving story")
        return
      }

      setStories([newStory, ...stories])
      toast({
        title: "Success! 🎉",
        description: "New bilingual story created.",
      })
    } catch (error: any) {
      console.error("Story generation error:", error)
      setError(error.message || "Error creating story")
    } finally {
      setGenerating(false)
    }
  }

  const generateImageForStory = async (storyId: string, words: string[]) => {
    setGeneratingImage(storyId)

    try {
      // Görsel için prompt oluştur
      const imagePrompt = `A beautiful, artistic illustration depicting a story with these elements: ${words.join(", ")}. Style: digital art, colorful, fantasy, high quality`

      console.log("Generating image with prompt:", imagePrompt)

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Image API call failed")
      }

      const { imageUrl } = await response.json()

      // Hikayeyi görsel URL'si ile güncelle
      const { error: updateError } = await supabase.from("ai_stories").update({ image_url: imageUrl }).eq("id", storyId)

      if (updateError) {
        console.error("Story update error:", updateError)
        throw new Error("Error saving image")
      }

      // Local state'i güncelle
      setStories(stories.map((story) => (story.id === storyId ? { ...story, image_url: imageUrl } : story)))

      toast({
        title: "Image Created! 🎨",
        description: "AI generated a custom illustration for your story.",
      })
    } catch (error: any) {
      console.error("Image generation error:", error)
      toast({
        title: "Image Generation Failed",
        description: error.message || "Error creating image",
        variant: "destructive",
      })
    } finally {
      setGeneratingImage(null)
    }
  }

  const deleteStory = async (storyId: string) => {
    const { error } = await supabase.from("ai_stories").delete().eq("id", storyId).eq("user_id", user.id)

    if (error) {
      console.error("Story delete error:", error)
      toast({
        title: "Error",
        description: "Error deleting story.",
        variant: "destructive",
      })
    } else {
      setStories(stories.filter((story) => story.id !== storyId))
      toast({
        title: "Success",
        description: "Story deleted.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-violet-500 to-purple-600 rounded-full animate-pulse"></div>
              <p className="text-slate-600 font-medium">Loading stories...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">AI Stories</h1>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Bilingual stories and illustrations created from your learned vocabulary
            </p>
            <Button
              onClick={generateNewStory}
              disabled={generating}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-8 py-3 h-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Story...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Create New Story
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-red-600 hover:text-red-700"
                  onClick={() => setError("")}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No Stories Yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create AI-powered bilingual stories using your learned vocabulary
              </p>
              <Button
                onClick={generateNewStory}
                disabled={generating}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create First Story
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {stories.map((story) => (
                <Card key={story.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          Bilingual AI Story
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          Created on{" "}
                          {new Date(story.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {!story.image_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateImageForStory(story.id, story.word_list)}
                            disabled={generatingImage === story.id}
                            className="border-violet-200 text-violet-700 hover:bg-violet-50"
                          >
                            {generatingImage === story.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Palette className="h-4 w-4 mr-2" />
                            )}
                            Generate Image
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStory(story.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* AI Generated Image */}
                    {story.image_url && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-5 w-5 text-violet-600" />
                          <h4 className="font-medium text-slate-900">AI Generated Illustration</h4>
                        </div>
                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={story.image_url || "/placeholder.svg"}
                            alt="AI Generated Story Illustration"
                            className="w-full h-80 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      </div>
                    )}

                    {/* Vocabulary Words */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        <h4 className="font-medium text-slate-900">Featured Vocabulary</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {story.word_list.map((word, index) => (
                          <Badge
                            key={index}
                            className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border-violet-200 px-3 py-1 text-sm font-medium"
                          >
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Story Content */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-violet-600" />
                        <h4 className="font-medium text-slate-900">Story</h4>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-slate-50 to-violet-50 p-6 rounded-xl border border-violet-100">
                          <HighlightedText text={story.content} wordsToHighlight={story.word_list} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .highlight-word {
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-radius: 6px;
        }
        
        .highlight-word:hover {
          background: linear-gradient(120deg, #fde68a 0%, #fcd34d 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .story-content {
          line-height: 1.8;
          font-size: 17px;
        }

        .story-content mark {
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
