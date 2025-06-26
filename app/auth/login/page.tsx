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
import { supabase } from "@/lib/supabase"
import { Loader2, Eye, EyeOff, ArrowLeft, BookOpen } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Giriş yapılırken bir hata oluştu")
    } finally {
      setLoading(false)
    }
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
          <p className="text-slate-600">Hesabınıza giriş yapın</p>
        </div>

        {/* Login Form */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center text-slate-600">E-posta ve şifrenizi girin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              </div>

              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Şifremi unuttum
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Hesabınız yok mu?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Kayıt ol
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
