"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/layout/navbar"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  daily_new_words: number
  allow_skip: boolean
  preferred_difficulty: number
  enable_notifications: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    daily_new_words: 10,
    allow_skip: true,
    preferred_difficulty: 1,
    enable_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    const loadSettings = async () => {
      const { user } = await getCurrentUser()
      if (!user) return

      setUser(user)

      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

      if (error) {
        console.error("Ayarlar yüklenirken hata:", error)
      } else if (data) {
        setSettings({
          daily_new_words: data.daily_new_words,
          allow_skip: data.allow_skip,
          preferred_difficulty: data.preferred_difficulty,
          enable_notifications: data.enable_notifications,
        })
      }

      setLoading(false)
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setError("")

    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          daily_new_words: settings.daily_new_words,
          allow_skip: settings.allow_skip,
          preferred_difficulty: settings.preferred_difficulty,
          enable_notifications: settings.enable_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) {
        setError("Ayarlar kaydedilirken hata oluştu")
      } else {
        toast({
          title: "Başarılı!",
          description: "Ayarlarınız kaydedildi.",
        })
      }
    } catch (error) {
      console.error("Ayar kaydetme hatası:", error)
      setError("Beklenmeyen bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Ayarlar yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
            <p className="text-gray-600">Öğrenme deneyiminizi kişiselleştirin</p>
          </div>

          <div className="space-y-6">
            {/* Quiz Ayarları */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Ayarları</CardTitle>
                <CardDescription>Quiz deneyiminizi özelleştirin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dailyWords">Günlük Yeni Kelime Sayısı</Label>
                  <Input
                    id="dailyWords"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.daily_new_words}
                    onChange={(e) => updateSetting("daily_new_words", Number.parseInt(e.target.value) || 10)}
                  />
                  <p className="text-sm text-gray-500">
                    Her gün kaç yeni kelime ile karşılaşmak istiyorsunuz? (1-50 arası)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Tercih Edilen Zorluk Seviyesi</Label>
                  <Select
                    value={settings.preferred_difficulty.toString()}
                    onValueChange={(value) => updateSetting("preferred_difficulty", Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Başlangıç</SelectItem>
                      <SelectItem value="2">2 - Temel</SelectItem>
                      <SelectItem value="3">3 - Orta</SelectItem>
                      <SelectItem value="4">4 - İleri</SelectItem>
                      <SelectItem value="5">5 - Uzman</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Bu seviye ve altındaki kelimeler quiz'lerde görünecek</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowSkip">Soru Atlama</Label>
                    <p className="text-sm text-gray-500">Quiz sırasında soruları atlayabilme</p>
                  </div>
                  <Switch
                    id="allowSkip"
                    checked={settings.allow_skip}
                    onCheckedChange={(checked) => updateSetting("allow_skip", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Bildirimler</Label>
                    <p className="text-sm text-gray-500">Öğrenme hatırlatıcıları ve bildirimler</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.enable_notifications}
                    onCheckedChange={(checked) => updateSetting("enable_notifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hesap Ayarları */}
            <Card>
              <CardHeader>
                <CardTitle>Hesap Bilgileri</CardTitle>
                <CardDescription>Hesap ayarlarınızı yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>E-posta Adresi</Label>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-sm text-gray-500">
                    E-posta adresinizi değiştirmek için destek ile iletişime geçin
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kaydet Butonu */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Ayarları Kaydet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
