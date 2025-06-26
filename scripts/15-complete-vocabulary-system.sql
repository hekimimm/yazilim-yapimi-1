-- 6 Sefer Kelime Ezberleme Sistemi - Tam Veritabanı Yapısı

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE quiz_result AS ENUM ('correct', 'incorrect', 'skipped');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Words table - Kelime Ekleme Modülü için
CREATE TABLE IF NOT EXISTS public.words (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    eng_word VARCHAR(255) NOT NULL,
    tur_word VARCHAR(255) NOT NULL,
    audio_url TEXT,
    picture_url TEXT, -- Kelime ile ilgili resim
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_by UUID REFERENCES public.user_profiles(id),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word samples table - Cümle örnekleri
CREATE TABLE IF NOT EXISTS public.word_samples (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
    sample_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table - Ayarlar modülü
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE,
    daily_new_words INTEGER DEFAULT 10, -- Günlük yeni kelime sayısı
    allow_skip BOOLEAN DEFAULT TRUE,
    preferred_difficulty INTEGER DEFAULT 1 CHECK (preferred_difficulty BETWEEN 1 AND 5),
    enable_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table - 6 Sefer Algoritması için
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
    result quiz_result NOT NULL,
    repetition_count INTEGER DEFAULT 0, -- Kaç kez doğru cevaplandı (max 6)
    next_review_date TIMESTAMP WITH TIME ZONE, -- Bir sonraki tekrar tarihi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned words table - 6 kez doğru cevaplanan kelimeler
CREATE TABLE IF NOT EXISTS public.learned_words (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
    mastered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- AI Stories table - LLM Hikaye modülü
CREATE TABLE IF NOT EXISTS public.ai_stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_list TEXT[] NOT NULL,
    image_url TEXT, -- AI ile oluşturulan görsel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wordle games table - Bulmaca modülü
CREATE TABLE IF NOT EXISTS public.wordle_games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    word_id UUID REFERENCES public.words(id),
    guesses TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    is_won BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word images table - Kelime bazlı AI görseller
CREATE TABLE IF NOT EXISTS public.word_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_approved ON public.words(is_approved);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON public.words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_word ON public.quiz_attempts(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_next_review ON public.quiz_attempts(next_review_date);
CREATE INDEX IF NOT EXISTS idx_learned_words_user ON public.learned_words(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordle_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view approved words" ON public.words;
DROP POLICY IF EXISTS "Users can insert words" ON public.words;
DROP POLICY IF EXISTS "Admins can manage all words" ON public.words;
DROP POLICY IF EXISTS "Users can view samples of approved words" ON public.word_samples;
DROP POLICY IF EXISTS "Admins can manage all samples" ON public.word_samples;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can manage own learned words" ON public.learned_words;
DROP POLICY IF EXISTS "Users can manage own stories" ON public.ai_stories;
DROP POLICY IF EXISTS "Users can manage own wordle games" ON public.wordle_games;
DROP POLICY IF EXISTS "Users can manage own word images" ON public.word_images;

-- RLS Policies
-- User profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Words
CREATE POLICY "Users can view approved words" ON public.words
    FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users can insert words" ON public.words
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all words" ON public.words
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Word samples
CREATE POLICY "Users can view samples of approved words" ON public.word_samples
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.words 
            WHERE id = word_id AND is_approved = TRUE
        )
    );

CREATE POLICY "Admins can manage all samples" ON public.word_samples
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User settings
CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts
CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

-- Learned words
CREATE POLICY "Users can manage own learned words" ON public.learned_words
    FOR ALL USING (auth.uid() = user_id);

-- AI stories
CREATE POLICY "Users can manage own stories" ON public.ai_stories
    FOR ALL USING (auth.uid() = user_id);

-- Wordle games
CREATE POLICY "Users can manage own wordle games" ON public.wordle_games
    FOR ALL USING (auth.uid() = user_id);

-- Word images
CREATE POLICY "Users can manage own word images" ON public.word_images
    FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, role)
    VALUES (NEW.id, NEW.email, 'user');
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate next review date (6 Sefer Algoritması)
CREATE OR REPLACE FUNCTION public.calculate_next_review_date(repetition_count INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE repetition_count
        WHEN 1 THEN RETURN NOW() + INTERVAL '1 day';      -- 1 gün sonra
        WHEN 2 THEN RETURN NOW() + INTERVAL '1 week';     -- 1 hafta sonra
        WHEN 3 THEN RETURN NOW() + INTERVAL '1 month';    -- 1 ay sonra
        WHEN 4 THEN RETURN NOW() + INTERVAL '3 months';   -- 3 ay sonra
        WHEN 5 THEN RETURN NOW() + INTERVAL '6 months';   -- 6 ay sonra
        WHEN 6 THEN RETURN NOW() + INTERVAL '1 year';     -- 1 yıl sonra
        ELSE RETURN NOW() + INTERVAL '1 day';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved) VALUES
('brain', 'beyin', 2, true),
('night', 'gece', 1, true),
('tiger', 'kaplan', 2, true),
('robin', 'kızılgerdan', 3, true),
('noble', 'asil', 4, true),
('house', 'ev', 1, true),
('water', 'su', 1, true),
('book', 'kitap', 1, true),
('computer', 'bilgisayar', 2, true),
('beautiful', 'güzel', 2, true)
ON CONFLICT DO NOTHING;

-- Sample word samples
INSERT INTO public.word_samples (word_id, sample_text) 
SELECT w.id, 'The human brain is very complex.' 
FROM public.words w WHERE w.eng_word = 'brain'
ON CONFLICT DO NOTHING;

INSERT INTO public.word_samples (word_id, sample_text) 
SELECT w.id, 'It was a dark night.' 
FROM public.words w WHERE w.eng_word = 'night'
ON CONFLICT DO NOTHING;

INSERT INTO public.word_samples (word_id, sample_text) 
SELECT w.id, 'The tiger is a powerful animal.' 
FROM public.words w WHERE w.eng_word = 'tiger'
ON CONFLICT DO NOTHING;
