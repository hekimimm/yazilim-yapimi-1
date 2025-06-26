"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, Mail, Check } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError("E-posta gönderilirken bir hata oluştu")
      } else {
        setSuccess(true)
      }
    } catch (error) {
      setError("Bir hata oluştu, lütfen tekrar deneyin")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        <div className="p-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Giriş Sayfası
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">E-posta Gönderildi</h1>
              <p className="text-slate-600">Şifre sıfırlama bağlantısını kontrol edin</p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-slate-600">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                </p>
                <p className="text-sm text-slate-500">E-postayı görmüyorsanız spam klasörünüzü kontrol edin.</p>
                <Button
                  asChild
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Link href="/auth/login">Giriş Sayfasına Dön</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Giriş Sayfası
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Şifremi Unuttum</h1>
            <p className="text-slate-600">E-posta adresinizi girin</p>
          </div>

          {/* Forgot Password Form */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardDescription className="text-center text-slate-600">
                Şifre sıfırlama bağlantısını e-posta adresinize göndereceğiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
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
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Sıfırlama Bağlantısı Gönder"
                  )}
                </Button>
              </form>

              {/* Links */}
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">veya</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div>
                    <Link
                      href="/auth/login"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Giriş sayfasına dön
                    </Link>
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">Hesabınız yok mu? </span>
                    <Link
                      href="/auth/register"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Kayıt olun
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
