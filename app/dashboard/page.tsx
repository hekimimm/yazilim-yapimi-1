"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { BookOpen, Brain, Target, TrendingUp, Play, Plus, Calendar, Award, Zap, Clock } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalWords: number
  learnedWords: number
  todayQuizzes: number
  weeklyAccuracy: number
  currentStreak: number
  totalStudyTime: number
}

interface RecentActivity {
  id: string
  type: "quiz" | "word_added" | "achievement"
  description: string
  timestamp: string
  score?: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalWords: 0,
    learnedWords: 0,
    todayQuizzes: 0,
    weeklyAccuracy: 0,
    currentStreak: 0,
    totalStudyTime: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [wordsResult, learnedResult, quizResult] = await Promise.all([
        supabase.from("words").select("*", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("learned_words").select("*", { count: "exact", head: true }).eq("user_id", user?.id),
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user?.id)
          .gte("created_at", new Date().toISOString().split("T")[0]),
      ])

      const todayQuizzes = quizResult.data?.length || 0
      const correctToday = quizResult.data?.filter((q) => q.result === "correct").length || 0
      const weeklyAccuracy = todayQuizzes > 0 ? Math.round((correctToday / todayQuizzes) * 100) : 0

      setStats({
        totalWords: wordsResult.count || 0,
        learnedWords: learnedResult.count || 0,
        todayQuizzes,
        weeklyAccuracy,
        currentStreak: 7, // Mock data
        totalStudyTime: 145, // Mock data in minutes
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "quiz",
          description: "Quiz tamamlandı",
          timestamp: "2 saat önce",
          score: 85,
        },
        {
          id: "2",
          type: "word_added",
          description: 'Yeni kelime eklendi: "beautiful"',
          timestamp: "5 saat önce",
        },
        {
          id: "3",
          type: "achievement",
          description: "7 günlük seri tamamlandı!",
          timestamp: "1 gün önce",
        },
      ])
    } catch (error) {
      console.error("Dashboard data loading error:", error)
    } finally {
      setLoading(false)
    }
  }

  const learningProgress = stats.totalWords > 0 ? (stats.learnedWords / stats.totalWords) * 100 : 0

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hoş geldin! 👋</h1>
            <p className="text-slate-600 mt-1">Öğrenme yolculuğuna devam et</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
              <Zap className="h-3 w-3 mr-1" />
              {stats.currentStreak} gün seri
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalWords}</p>
                  <p className="text-xs text-slate-600">Toplam Kelime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.learnedWords}</p>
                  <p className="text-xs text-slate-600">Öğrenilen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.todayQuizzes}</p>
                  <p className="text-xs text-slate-600">Bugünkü Quiz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">%{stats.weeklyAccuracy}</p>
                  <p className="text-xs text-slate-600">Başarı Oranı</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Progress */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Öğrenme İlerlemen
                </CardTitle>
                <CardDescription>Genel kelime öğrenme durumun</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">İlerleme</span>
                    <span className="font-medium text-slate-900">
                      {stats.learnedWords}/{stats.totalWords}
                    </span>
                  </div>
                  <Progress value={learningProgress} className="h-3" />
                  <p className="text-sm text-slate-600">%{learningProgress.toFixed(1)} tamamlandı</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
                    </div>
                    <div className="text-sm text-slate-600">Toplam Çalışma</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.currentStreak}</div>
                    <div className="text-sm text-slate-600">Günlük Seri</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Hızlı Eylemler</CardTitle>
                <CardDescription>Öğrenme aktivitelerine başla</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/quiz">
                    <Button className="w-full h-20 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <Play className="h-6 w-6" />
                      Quiz Başlat
                    </Button>
                  </Link>
                  <Link href="/words/add">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
                      <Plus className="h-6 w-6" />
                      Kelime Ekle
                    </Button>
                  </Link>
                  <Link href="/learn">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
                      <BookOpen className="h-6 w-6" />
                      Öğren
                    </Button>
                  </Link>
                  <Link href="/wordle">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
                      <Target className="h-6 w-6" />
                      Wordle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  Son Aktiviteler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                    <div
                      className={`p-1.5 rounded-full ${
                        activity.type === "quiz"
                          ? "bg-blue-100"
                          : activity.type === "word_added"
                            ? "bg-green-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {activity.type === "quiz" && <Brain className="h-3 w-3 text-blue-600" />}
                      {activity.type === "word_added" && <Plus className="h-3 w-3 text-green-600" />}
                      {activity.type === "achievement" && <Award className="h-3 w-3 text-yellow-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.timestamp}</p>
                      {activity.score && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          %{activity.score}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Goal */}
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Günlük Hedef
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Quiz Hedefi</span>
                    <span className="font-medium">{stats.todayQuizzes}/10</span>
                  </div>
                  <Progress value={(stats.todayQuizzes / 10) * 100} className="bg-blue-400/30" />
                  <p className="text-sm text-blue-100">
                    {10 - stats.todayQuizzes > 0
                      ? `${10 - stats.todayQuizzes} quiz daha!`
                      : "Günlük hedef tamamlandı! 🎉"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
