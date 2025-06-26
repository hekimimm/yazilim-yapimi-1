"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  TrendingUp,
  Target,
  Calendar,
  Award,
  FileText,
  BarChart3,
  PieChartIcon,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  totalWords: number
  learnedWords: number
  totalQuizzes: number
  averageAccuracy: number
  dailyActivity: Array<{ date: string; quizzes: number; accuracy: number }>
  difficultyBreakdown: Array<{ level: string; learned: number; total: number; percentage: number }>
  weeklyProgress: Array<{ week: string; learned: number }>
  categoryAnalysis: Array<{ category: string; correct: number; total: number; percentage: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalWords: 0,
    learnedWords: 0,
    totalQuizzes: 0,
    averageAccuracy: 0,
    dailyActivity: [],
    difficultyBreakdown: [],
    weeklyProgress: [],
    categoryAnalysis: [],
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    const loadAnalytics = async () => {
      const { user } = await getCurrentUser()
      if (!user) return

      setUser(user)

      try {
        // Temel istatistikler
        const [
          { count: totalWords },
          { count: learnedWords },
          { count: totalQuizzes },
          { data: quizAttempts },
          { data: dailyData },
          { data: difficultyData },
          { data: weeklyData },
        ] = await Promise.all([
          supabase.from("words").select("*", { count: "exact", head: true }).eq("is_approved", true),
          supabase.from("learned_words").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("quiz_attempts").select("result").eq("user_id", user.id),
          supabase
            .from("quiz_attempts")
            .select("created_at, result")
            .eq("user_id", user.id)
            .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order("created_at"),
          supabase
            .from("words")
            .select(`
              difficulty_level,
              learned_words!inner(user_id)
            `)
            .eq("learned_words.user_id", user.id),
          supabase
            .from("learned_words")
            .select("mastered_at")
            .eq("user_id", user.id)
            .gte("mastered_at", new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString())
            .order("mastered_at"),
        ])

        // Ortalama doğruluk hesapla
        const correctAnswers = quizAttempts?.filter((q) => q.result === "correct").length || 0
        const averageAccuracy = totalQuizzes ? Math.round((correctAnswers / totalQuizzes) * 100) : 0

        // Günlük aktivite verisi hazırla
        const dailyActivity = processDailyActivity(dailyData || [])

        // Zorluk seviyesi dağılımı
        const difficultyBreakdown = processDifficultyBreakdown(difficultyData || [], totalWords || 0)

        // Haftalık ilerleme
        const weeklyProgress = processWeeklyProgress(weeklyData || [])

        // Kategori analizi (zorluk seviyelerine göre)
        const categoryAnalysis = await processCategoryAnalysis(user.id)

        setAnalytics({
          totalWords: totalWords || 0,
          learnedWords: learnedWords || 0,
          totalQuizzes: totalQuizzes || 0,
          averageAccuracy,
          dailyActivity,
          difficultyBreakdown,
          weeklyProgress,
          categoryAnalysis,
        })
      } catch (error) {
        console.error("Analytics loading error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const processDailyActivity = (data: any[]) => {
    const dailyMap = new Map()

    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, quizzes: 0, correct: 0 })
      }
      const dayData = dailyMap.get(date)
      dayData.quizzes++
      if (item.result === "correct") dayData.correct++
    })

    return Array.from(dailyMap.values())
      .map((day) => ({
        date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        quizzes: day.quizzes,
        accuracy: day.quizzes > 0 ? Math.round((day.correct / day.quizzes) * 100) : 0,
      }))
      .slice(-14) // Son 14 gün
  }

  const processDifficultyBreakdown = (data: any[], totalWords: number) => {
    const levels = [1, 2, 3, 4, 5]
    return levels.map((level) => {
      const levelWords = data.filter((w) => w.difficulty_level === level)
      const learned = levelWords.length
      const total = Math.max(1, Math.floor(totalWords / 5)) // Eşit dağılım varsayımı
      const percentage = total > 0 ? Math.round((learned / total) * 100) : 0

      return {
        level: `Level ${level}`,
        learned,
        total,
        percentage,
      }
    })
  }

  const processWeeklyProgress = (data: any[]) => {
    const weeklyMap = new Map()

    data.forEach((item) => {
      const date = new Date(item.mastered_at)
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { week: weekKey, learned: 0 })
      }
      weeklyMap.get(weekKey).learned++
    })

    return Array.from(weeklyMap.values())
      .map((week) => ({
        week: new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        learned: week.learned,
      }))
      .slice(-12) // Son 12 hafta
  }

  const processCategoryAnalysis = async (userId: string) => {
    try {
      const { data: quizData } = await supabase
        .from("quiz_attempts")
        .select(`
          result,
          words!inner(difficulty_level)
        `)
        .eq("user_id", userId)

      if (!quizData) return []

      const categoryMap = new Map()

      quizData.forEach((item) => {
        const level = item.words.difficulty_level
        const category = `Level ${level}`

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { correct: 0, total: 0 })
        }

        const categoryData = categoryMap.get(category)
        categoryData.total++
        if (item.result === "correct") {
          categoryData.correct++
        }
      })

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        correct: data.correct,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
    } catch (error) {
      console.error("Category analysis error:", error)
      return []
    }
  }

  const generatePDFReport = async () => {
    try {
      // PDF oluşturma için HTML içeriği hazırla
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Vocabulary Learning Analytics Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 40px; }
            .stat-card { text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .stat-card h3 { margin: 0 0 8px 0; font-size: 14px; color: #64748b; font-weight: 500; }
            .stat-card .value { font-size: 32px; font-weight: 700; color: #1e293b; margin: 0; }
            .section { padding: 0 40px 40px 40px; }
            .section h2 { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .table th { background: #f8fafc; font-weight: 600; color: #475569; }
            .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 4px; }
            .footer { text-align: center; padding: 40px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Vocabulary Learning Analytics</h1>
              <p>User: ${user?.email}</p>
              <p>Report Date: ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
            </div>

            <div class="stats">
              <div class="stat-card">
                <h3>Total Words</h3>
                <p class="value">${analytics.totalWords}</p>
              </div>
              <div class="stat-card">
                <h3>Learned Words</h3>
                <p class="value">${analytics.learnedWords}</p>
              </div>
              <div class="stat-card">
                <h3>Total Quizzes</h3>
                <p class="value">${analytics.totalQuizzes}</p>
              </div>
              <div class="stat-card">
                <h3>Average Accuracy</h3>
                <p class="value">${analytics.averageAccuracy}%</p>
              </div>
            </div>

            <div class="section">
              <h2>Difficulty Level Progress</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Difficulty Level</th>
                    <th>Learned Words</th>
                    <th>Total Words</th>
                    <th>Success Rate</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.difficultyBreakdown
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.level}</td>
                      <td>${item.learned}</td>
                      <td>${item.total}</td>
                      <td>${item.percentage}%</td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${item.percentage}%"></div>
                        </div>
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Category Performance Analysis</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Correct Answers</th>
                    <th>Total Questions</th>
                    <th>Success Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.categoryAnalysis
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.category}</td>
                      <td>${item.correct}</td>
                      <td>${item.total}</td>
                      <td>${item.percentage}%</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>This report was automatically generated by the 6 Sefer Vocabulary Learning System.</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Yeni pencerede PDF önizlemesi aç
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(reportContent)
        printWindow.document.close()

        // Yazdırma dialog'unu aç
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      toast({
        title: "PDF Report Ready! 📄",
        description: "Report opened in new window. You can save as PDF from the print dialog.",
      })
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "Error",
        description: "Error generating PDF report.",
        variant: "destructive",
      })
    }
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
              <p className="text-slate-600 font-medium">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              </div>
              <p className="text-slate-600">Detailed insights into your learning progress</p>
            </div>
            <div className="space-x-3">
              <Button onClick={generatePDFReport} variant="outline" className="border-slate-300 hover:bg-slate-50">
                <FileText className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
              <Button
                onClick={generatePDFReport}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Words</CardTitle>
                <Target className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.totalWords}</div>
                <p className="text-xs text-slate-500 mt-1">Available in system</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Learned</CardTitle>
                <Award className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.learnedWords}</div>
                <p className="text-xs text-slate-500 mt-1">Mastered vocabulary</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Quizzes</CardTitle>
                <Calendar className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.totalQuizzes}</div>
                <p className="text-xs text-slate-500 mt-1">Questions answered</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Accuracy</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.averageAccuracy}%</div>
                <p className="text-xs text-slate-500 mt-1">Overall success rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Difficulty */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Performance by Difficulty Level</span>
              </CardTitle>
              <CardDescription>Your success rate across different difficulty levels</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {analytics.categoryAnalysis.map((category, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900">{category.category}</span>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold">{category.percentage}%</span>
                        <span className="text-slate-400 ml-2">
                          ({category.correct}/{category.total})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Activity */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>Daily Activity</span>
                </CardTitle>
                <CardDescription>Quiz activity over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="quizzes" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <span>Weekly Progress</span>
                </CardTitle>
                <CardDescription>Words learned per week</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="learned"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Difficulty Distribution */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5 text-indigo-600" />
                <span>Difficulty Level Distribution</span>
              </CardTitle>
              <CardDescription>Distribution of learned words by difficulty level</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analytics.difficultyBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {analytics.difficultyBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
