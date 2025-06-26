"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Menu,
  LogOut,
  BookOpen,
  Plus,
  GraduationCap,
  FileText,
  Gamepad2,
  ImageIcon,
  BarChart3,
  Home,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  username?: string
  role: "user" | "admin"
}

export function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await checkUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Get user profile
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          username: profile?.username,
          role: profile?.role || "user",
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error checking user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      toast.success("Başarıyla çıkış yapıldı")
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Çıkış yapılırken hata oluştu")
    }
  }

  const publicNavItems = [{ href: "/", label: "Ana Sayfa", icon: Home }]

  const authNavItems = [
    { href: "/words", label: "Kelimeler", icon: BookOpen },
    { href: "/words/add", label: "Kelime Ekle", icon: Plus },
    { href: "/learn", label: "Öğren", icon: GraduationCap },
    { href: "/quiz", label: "Sınav", icon: FileText },
    { href: "/wordle", label: "Wordle", icon: Gamepad2 },
    { href: "/stories", label: "Hikayeler", icon: BookOpen },
    { href: "/gorsel-uret", label: "Görsel Üret", icon: ImageIcon },
    { href: "/analytics", label: "Analiz", icon: BarChart3 },
  ]

  const navItems = user ? authNavItems : publicNavItems

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">VocabLearn</span>
            </Link>
          </div>
          <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              VocabLearn
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {/* Separate Sign Out Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username || "Kullanıcı"}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Avatar className="mr-2 h-4 w-4" />
                      Ayarlar
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menüyü aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-4">
                {/* User Info */}
                {user && (
                  <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-medium">{user.username || "Kullanıcı"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="flex flex-col space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                {/* Mobile Auth Buttons */}
                <div className="pt-4 border-t">
                  {user ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-muted-foreground"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/settings">
                          <Avatar className="mr-2 h-4 w-4" />
                          Ayarlar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          handleSignOut()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                          Giriş Yap
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                          Kayıt Ol
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
