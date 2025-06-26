"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    userData?: { username?: string; full_name?: string },
  ) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await loadUserProfile(session.user.id, session.access_token)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user.id, session.access_token)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string, accessToken: string) => {
    try {
      const { data: profile, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

      if (error) {
        console.error("Profile load error:", error)
        // Get basic user info from auth
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            role: "user",
            access_token: accessToken,
          })
        }
        return
      }

      setUser({
        id: userId,
        email: profile.user_id, // This should be email from auth.users
        username: profile.username,
        full_name: profile.full_name,
        role: profile.role || "user",
        access_token: accessToken,
      })
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const signUp = async (email: string, password: string, userData?: { username?: string; full_name?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      return { error: error?.message || null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
