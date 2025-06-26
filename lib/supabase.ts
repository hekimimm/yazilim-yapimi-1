import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Server-side client for admin operations
export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          role: "user" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      words: {
        Row: {
          id: string
          eng_word: string
          tur_word: string
          audio_url: string | null
          difficulty_level: number
          created_by: string | null
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          eng_word: string
          tur_word: string
          audio_url?: string | null
          difficulty_level?: number
          created_by?: string | null
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          eng_word?: string
          tur_word?: string
          audio_url?: string | null
          difficulty_level?: number
          created_by?: string | null
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      word_samples: {
        Row: {
          id: string
          word_id: string
          sample_text: string
          created_at: string
        }
        Insert: {
          id?: string
          word_id: string
          sample_text: string
          created_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          sample_text?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          daily_new_words: number
          allow_skip: boolean
          preferred_difficulty: number
          enable_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_new_words?: number
          allow_skip?: boolean
          preferred_difficulty?: number
          enable_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_new_words?: number
          allow_skip?: boolean
          preferred_difficulty?: number
          enable_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          word_id: string
          result: "correct" | "incorrect" | "skipped"
          repetition_count: number
          next_review_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          result: "correct" | "incorrect" | "skipped"
          repetition_count?: number
          next_review_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          result?: "correct" | "incorrect" | "skipped"
          repetition_count?: number
          next_review_date?: string | null
          created_at?: string
        }
      }
      learned_words: {
        Row: {
          id: string
          user_id: string
          word_id: string
          mastered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          mastered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          mastered_at?: string
        }
      }
      ai_stories: {
        Row: {
          id: string
          user_id: string
          content: string
          word_list: string[]
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          word_list: string[]
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          word_list?: string[]
          image_url?: string | null
          created_at?: string
        }
      }
      wordle_games: {
        Row: {
          id: string
          user_id: string
          word_id: string | null
          guesses: string[]
          is_completed: boolean
          is_won: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id?: string | null
          guesses?: string[]
          is_completed?: boolean
          is_won?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string | null
          guesses?: string[]
          is_completed?: boolean
          is_won?: boolean
          created_at?: string
        }
      }
      word_images: {
        Row: {
          id: string
          word_id: string
          user_id: string
          prompt: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          word_id: string
          user_id: string
          prompt: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          user_id?: string
          prompt?: string
          image_url?: string
          created_at?: string
        }
      }
    }
  }
}
