import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  role: "user" | "admin"
  access_token?: string
}

export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return { user: null, error: sessionError.message }
    }

    if (!session?.user) {
      return { user: null, error: null }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      // Return basic user info if profile doesn't exist
      return {
        user: {
          id: session.user.id,
          email: session.user.email || "",
          role: "user",
          access_token: session.access_token,
        },
        error: null,
      }
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email || "",
        username: profile.username,
        full_name: profile.full_name,
        role: profile.role || "user",
        access_token: session.access_token,
      },
      error: null,
    }
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function signUp(email: string, password: string, userData?: { username?: string; full_name?: string }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error?.message || null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function resetPassword(email: string) {
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
