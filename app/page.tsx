"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Target, TrendingUp, Zap, ArrowRight, CheckCircle, Sparkles, Users, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user } = useAuth()

  const features = [
    {
      icon: Brain,
      title: "Akıllı Algoritma",
      description: "6 aşamalı bilimsel tekrar sistemi",
    },
    {
      icon: Target,
      title: "Kişisel Plan",
      description: "Öğrenme hızınıza göre uyarlanır",
    },
    {
      icon: TrendingUp,
      title: "İlerleme Takibi",
      description: "Detaylı analitik raporlar",
    },
    {
      icon: Zap,
      title: "AI Destekli",
      description: "Görsel ve hikaye üretimi",
    },
  ]

  const stats = [
    { value: "6", label: "Aşamalı Sistem" },
    { value: "95%", label: "Başarı Oranı" },
    { value: "1000+", label: "Aktif Kelime" },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Destekli Öğrenme
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Kelime Öğrenme
              <span className="block text-blue-600">Yeniden Tanımlandı</span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Bilimsel aralıklı tekrar sistemi ile kelimeleri kalıcı hafızaya kaydedin. AI destekli görsel ve
              hikayelerle öğrenme deneyiminizi zenginleştirin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 py-3 text-lg">
                    Dashboard'a Git
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="px-8 py-3 text-lg">
                      Ücretsiz Başla
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                      Giriş Yap
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Neden VocabApp?</h2>
            <p className="text-lg text-slate-600">
              Modern teknoloji ile geleneksel öğrenme yöntemlerini birleştiren yenilikçi yaklaşımımız.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-lg text-slate-600">3 basit adımda etkili kelime öğrenme deneyimi.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Kelime Ekle",
                description: "Öğrenmek istediğiniz kelimeleri sisteme ekleyin",
              },
              {
                step: "02",
                title: "Akıllı Tekrar",
                description: "6 aşamalı algoritma ile kelimeleri tekrar edin",
              },
              {
                step: "03",
                title: "Kalıcı Öğren",
                description: "Kelimeleri uzun vadeli hafızanıza kaydedin",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Bilimsel Yaklaşım,
                <span className="text-blue-600"> Kanıtlanmış Sonuçlar</span>
              </h2>

              <div className="space-y-4 mb-8">
                {[
                  "Aralıklı tekrar sistemi ile %95 daha etkili öğrenme",
                  "AI destekli görsellerle görsel hafıza güçlendirme",
                  "Kişiselleştirilmiş öğrenme hızı ayarlaması",
                  "Detaylı analitik raporlar ile ilerleme takibi",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {!user && (
                <Link href="/auth/register">
                  <Button size="lg" className="px-8">
                    Hemen Başla
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 border-0 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Günlük</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">15dk</div>
                    <div className="text-xs text-slate-600">Ortalama çalışma</div>
                  </Card>

                  <Card className="p-4 border-0 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Başarı</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">95%</div>
                    <div className="text-xs text-slate-600">Öğrenme oranı</div>
                  </Card>

                  <Card className="p-4 border-0 shadow-sm col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">6 Aşamalı Sistem</span>
                    </div>
                    <div className="text-sm text-slate-600">1 gün → 1 hafta → 1 ay → 3 ay → 6 ay → 1 yıl</div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-24 bg-slate-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Kelime Öğrenme Yolculuğunuza Başlayın</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Ücretsiz hesap oluşturun ve AI destekli kelime öğrenme deneyimini keşfedin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="px-8 py-3 text-lg bg-white text-slate-900 hover:bg-slate-100">
                  Ücretsiz Hesap Oluştur
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 text-lg border-slate-600 text-white hover:bg-slate-800"
                >
                  Zaten Hesabım Var
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
