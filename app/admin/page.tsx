"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Users, BookOpen, CheckCircle, XCircle, BarChart3, Download, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  totalUsers: number
  totalWords: number
  pendingWords: number
  totalQuizzes: number
  totalImages: number
}

interface PendingWord {
  id: string
  eng_word: string
  tur_word: string
  difficulty_level: number
  created_by: string
  user_profiles: {
    username: string
  }
  word_samples: Array<{
    sample_text: string
  }>
}

interface User {
  id: string
  username: string
  role: string
  created_at: string
  _count?: {
    learned_words: number
    quiz_attempts: number
  }
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalWords: 0,
    pendingWords: 0,
    totalQuizzes: 0,
    totalImages: 0,
  })
  const [pendingWords, setPendingWords] = useState<PendingWord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    const loadAdminData = async () => {
      const { user } = await getCurrentUser()
      if (!user) return

      setUser(user)

      try {
        // İstatistikleri yükle
        const [
          { count: totalUsers },
          { count: totalWords },
          { count: pendingWords },
          { count: totalQuizzes },
          { count: totalImages },
        ] = await Promise.all([
          supabase.from("user_profiles").select("*", { count: "exact", head: true }),
          supabase.from("words").select("*", { count: "exact", head: true }),
          supabase.from("words").select("*", { count: "exact", head: true }).eq("is_approved", false),
          supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
          supabase.from("images").select("*", { count: "exact", head: true }),
        ])

        setStats({
          totalUsers: totalUsers || 0,
          totalWords: totalWords || 0,
          pendingWords: pendingWords || 0,
          totalQuizzes: totalQuizzes || 0,
          totalImages: totalImages || 0,
        })

        // Onay bekleyen kelimeleri yükle
        const { data: pendingWordsData } = await supabase
          .from("words")
          .select(`
            *,
            user_profiles (username),
            word_samples (sample_text)
          `)
          .eq("is_approved", false)
          .order("created_at", { ascending: false })

        setPendingWords(pendingWordsData || [])

        // Kullanıcıları yükle
        const { data: usersData } = await supabase
          .from("user_profiles")
          .select("*")
          .order("created_at", { ascending: false })

        setUsers(usersData || [])
      } catch (error) {
        console.error("Admin verileri yüklenirken hata:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const approveWord = async (wordId: string) => {
    const { error } = await supabase.from("words").update({ is_approved: true }).eq("id", wordId)

    if (error) {
      console.error("Kelime onaylanırken hata:", error)
      toast({
        title: "Hata",
        description: "Kelime onaylanırken bir hata oluştu.",
        variant: "destructive",
      })
    } else {
      setPendingWords(pendingWords.filter((word) => word.id !== wordId))
      setStats((prev) => ({
        ...prev,
        pendingWords: prev.pendingWords - 1,
        totalWords: prev.totalWords + 1,
      }))
      toast({
        title: "Başarılı",
        description: "Kelime onaylandı.",
      })
    }
  }

  const rejectWord = async (wordId: string) => {
    const { error } = await supabase.from("words").delete().eq("id", wordId)

    if (error) {
      console.error("Kelime reddedilirken hata:", error)
      toast({
        title: "Hata",
        description: "Kelime reddedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } else {
      setPendingWords(pendingWords.filter((word) => word.id !== wordId))
      setStats((prev) => ({
        ...prev,
        pendingWords: prev.pendingWords - 1,
      }))
      toast({
        title: "Başarılı",
        description: "Kelime reddedildi.",
      })
    }
  }

  const exportData = async () => {
    try {
      // CSV export işlemi
      toast({
        title: "Export",
        description: "Veri export özelliği yakında eklenecek.",
      })
    } catch (error) {
      console.error("Export hatası:", error)
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

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800"
      case 2:
        return "bg-blue-100 text-blue-800"
      case 3:
        return "bg-yellow-100 text-yellow-800"
      case 4:
        return "bg-orange-100 text-orange-800"
      case 5:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Admin paneli yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yönetim Paneli</h1>
            <p className="text-gray-600">Sistem yönetimi ve içerik moderasyonu</p>
          </div>
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Veri Export
          </Button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kelime</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingWords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Quiz</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Görsel</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalImages}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending-words" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending-words">Onay Bekleyen Kelimeler</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="images">Görseller</TabsTrigger>
          </TabsList>

          <TabsContent value="pending-words" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Onay Bekleyen Kelimeler</CardTitle>
                <CardDescription>Kullanıcılar tarafından eklenen kelimeleri onaylayın veya reddedin</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingWords.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Onay bekleyen kelime yok</h3>
                    <p className="text-gray-600">Tüm kelimeler onaylanmış durumda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingWords.map((word) => (
                      <Card key={word.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center space-x-4">
                                <h3 className="text-lg font-semibold">{word.eng_word}</h3>
                                <span className="text-blue-600 font-medium">{word.tur_word}</span>
                                <Badge className={getDifficultyColor(word.difficulty_level)}>
                                  {getDifficultyText(word.difficulty_level)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Ekleyen: <strong>{word.user_profiles?.username}</strong>
                              </p>
                              {word.word_samples && word.word_samples.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium text-gray-700">Örnek Cümleler:</h4>
                                  {word.word_samples.map((sample, index) => (
                                    <p key={index} className="text-sm text-gray-600 italic">
                                      "{sample.sample_text}"
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button size="sm" onClick={() => approveWord(word.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Onayla
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectWord(word.id)}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reddet
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcılar</CardTitle>
                <CardDescription>Sistemdeki tüm kullanıcıları görüntüleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{user.username}</h3>
                            <p className="text-sm text-gray-600">
                              Kayıt: {new Date(user.created_at).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="images" className="space-y-6">
            <ImagesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ImagesTab() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      const { data: images, error } = await supabase
        .from("images")
        .select(`
          *,
          user_profiles (username)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!error) {
        setImages(images || [])
      }
      setLoading(false)
    }

    loadImages()
  }, [])

  if (loading) {
    return <div>Görseller yükleniyor...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oluşturulan Görseller</CardTitle>
        <CardDescription>Kullanıcılar tarafından oluşturulan AI görselleri</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{image.prompt}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{image.user_profiles?.username}</span>
                  <span>{new Date(image.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
