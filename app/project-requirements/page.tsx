"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/navbar"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Requirement {
  id: string
  title: string
  description: string
  points: number
  status: "completed" | "partial" | "missing"
  details: string[]
}

export default function ProjectRequirementsPage() {
  const requirements: Requirement[] = [
    {
      id: "story1",
      title: "Story 1: Kullanıcı Kayıt ve Giriş",
      description: "Kullanıcı kayıt, şifremi unuttum ve giriş bölümü",
      points: 5,
      status: "completed",
      details: [
        "✅ Kullanıcı kayıt sistemi",
        "✅ Giriş sistemi",
        "✅ Şifremi unuttum özelliği",
        "✅ Supabase Auth entegrasyonu",
        "✅ Session yönetimi",
      ],
    },
    {
      id: "story2",
      title: "Story 2: Kelime Ekleme Modülü",
      description: "Kelimeler text ve resim içerebilecek",
      points: 5,
      status: "completed",
      details: [
        "✅ İngilizce kelime ekleme",
        "✅ Türkçe karşılık ekleme",
        "✅ Örnek cümleler ekleme",
        "✅ Ses dosyası yükleme",
        "✅ Zorluk seviyesi belirleme",
        "✅ Admin onay sistemi",
      ],
    },
    {
      id: "story3",
      title: "Story 3: 6 Sefer Quiz Algoritması",
      description: "Aralıklı tekrar sistemi ile quiz modülü",
      points: 10,
      status: "completed",
      details: [
        "✅ 6 aşamalı öğrenme algoritması",
        "✅ Zaman aralıkları: 1 gün, 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl",
        "✅ Doğru/yanlış cevap takibi",
        "✅ Tekrar programlama",
        "✅ Learned words sistemi",
        "✅ Quiz geçmişi kaydetme",
      ],
    },
    {
      id: "story4",
      title: "Story 4: Kullanıcı Ayarları",
      description: "Günlük yeni kelime sayısını değiştirme",
      points: 5,
      status: "completed",
      details: [
        "✅ Günlük kelime sayısı ayarı",
        "✅ Zorluk seviyesi tercihi",
        "✅ Soru atlama ayarı",
        "✅ Bildirim ayarları",
        "✅ Kullanıcı profil yönetimi",
      ],
    },
    {
      id: "story5",
      title: "Story 5: Analiz Raporu ve PDF",
      description: "Başarı analizi ve PDF çıktısı",
      points: 5,
      status: "completed",
      details: [
        "✅ Zorluk seviyelerine göre başarı analizi",
        "✅ Kategori bazlı performans raporları",
        "✅ Günlük/haftalık aktivite grafikleri",
        "✅ PDF rapor oluşturma",
        "✅ Yazdırma özelliği",
      ],
    },
    {
      id: "story6",
      title: "Story 6: Bulmaca (Wordle)",
      description: "Öğrenilen kelimelerden oluşan Wordle oyunu",
      points: 15,
      status: "completed",
      details: [
        "✅ 5 harfli kelime bulmaca oyunu",
        "✅ Öğrenilen kelimelerden seçim",
        "✅ Renk kodlu geri bildirim",
        "✅ 6 deneme hakkı",
        "✅ Oyun geçmişi kaydetme",
      ],
    },
    {
      id: "story7",
      title: "Story 7: LLM Hikaye ve Görsel",
      description: "AI ile hikaye ve görsel oluşturma",
      points: 5,
      status: "completed",
      details: [
        "✅ Gemini AI ile çift dilli hikaye oluşturma",
        "✅ Fal AI ile görsel oluşturma",
        "✅ Kelime highlight özelliği",
        "✅ Görsel kaydetme",
        "✅ Hikaye arşivleme",
      ],
    },
  ]

  const optionalFeatures = [
    "✅ Anlık Doğru ve Hatalı Soruları Görme",
    "✅ Soruların Şıkları Rastgele Değişsin",
    "✅ Soruları Boş Bırakma (Skip)",
    "✅ Soruların zorluk seviyesi (1-5)",
    "✅ Admin onay sistemi",
    "✅ Responsive tasarım",
    "✅ Modern UI/UX",
    "✅ Real-time güncellemeler",
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "missing":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "missing":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalPoints = requirements.reduce((sum, req) => sum + req.points, 0)
  const completedPoints = requirements
    .filter((req) => req.status === "completed")
    .reduce((sum, req) => sum + req.points, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proje Gereksinimleri Kontrolü</h1>
          <p className="text-gray-600">6 Sefer Kelime Ezberleme Sistemi - Tüm Story'ler</p>
        </div>

        {/* Özet */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Proje Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{completedPoints}</div>
                <div className="text-sm text-gray-600">Tamamlanan Puan</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
                <div className="text-sm text-gray-600">Toplam Puan</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  %{Math.round((completedPoints / totalPoints) * 100)}
                </div>
                <div className="text-sm text-gray-600">Tamamlanma Oranı</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story'ler */}
        <div className="grid gap-6 mb-8">
          {requirements.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(req.status)}
                    <div>
                      <CardTitle className="text-lg">{req.title}</CardTitle>
                      <CardDescription>{req.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(req.status)}>
                      {req.status === "completed" ? "Tamamlandı" : req.status === "partial" ? "Kısmi" : "Eksik"}
                    </Badge>
                    <Badge variant="outline">{req.points} Puan</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {req.details.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {detail}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Opsiyonel Özellikler */}
        <Card>
          <CardHeader>
            <CardTitle>Opsiyonel Özellikler (Bonus)</CardTitle>
            <CardDescription>PDF'de belirtilen ek özellikler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {optionalFeatures.map((feature, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Öğrenci Beyanı */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Öğrenci Beyanı</CardTitle>
            <CardDescription>PDF'de istenen beyan formu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Kullanıcı Kayıt Modülü hazırladığınız yazılımda var mı?</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kelime ekleme modülü yazılımda var mı?</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kelime sorgulama modülü (test modülü) hazırladığınız yazılımda var mı?</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kelime sıklığı değiştirme Modülü hazırladığınız yazılımda var mı?</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>Analiz Rapor Modülü hazırladığınız yazılımda var mı?</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>Bulmaca Modülü</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
              <div className="flex justify-between">
                <span>LLM Modülü</span>
                <Badge className="bg-green-100 text-green-800">Evet</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
