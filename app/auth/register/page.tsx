"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { Loader2, Eye, EyeOff, ArrowLeft, BookOpen, Check, X } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach((check) => {
      if (check) strength += 20
    })

    return { strength, checks }
  }

  const { strength, checks } = getPasswordStrength(password)

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-red-500"
    if (strength < 60) return "bg-yellow-500"
    if (strength < 80) return "bg-blue-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength < 40) return "Zayıf"
    if (strength < 60) return "Orta"
    if (strength < 80) return "İyi"
    return "Güçlü"
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor")
      setLoading(false)
      return
    }

    if (strength < 60) {
      setError("Lütfen daha güçlü bir şifre seçin")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "Kayıt olurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Kayıt Başarılı!</h2>
            <p className="text-slate-600 mb-6">
              E-posta adresinize doğrulama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.
            </p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfa
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">VocabLearn</h1>
          </div>
          <p className="text-slate-600">Yeni hesap oluşturun</p>
        </div>

        {/* Register Form */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-center">Kayıt Ol</CardTitle>
            <CardDescription className="text-center text-slate-600">Hesap bilgilerinizi girin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>

                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Şifre gücü:</span>
                      <span
                        className={`text-xs font-medium ${
                          strength < 40
                            ? "text-red-600"
                            : strength < 60
                              ? "text-yellow-600"
                              : strength < 80
                                ? "text-blue-600"
                                : "text-green-600"
                        }`}
                      >
                        {getStrengthText(strength)}
                      </span>
                    </div>
                    <Progress value={strength} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-1 ${checks.length ? "text-green-600" : "text-slate-400"}`}>
                        {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        8+ karakter
                      </div>
                      <div
                        className={`flex items-center gap-1 ${checks.uppercase ? "text-green-600" : "text-slate-400"}`}
                      >
                        {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Büyük harf
                      </div>
                      <div
                        className={`flex items-center gap-1 ${checks.lowercase ? "text-green-600" : "text-slate-400"}`}
                      >
                        {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Küçük harf
                      </div>
                      <div className={`flex items-center gap-1 ${checks.number ? "text-green-600" : "text-slate-400"}`}>
                        {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        Rakam
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Şifre Tekrar
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">Şifreler eşleşmiyor</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || strength < 60 || password !== confirmPassword}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt oluşturuluyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Zaten hesabınız var mı?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Giriş yap
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
