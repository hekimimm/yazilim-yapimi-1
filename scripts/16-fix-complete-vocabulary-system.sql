-- Fix complete vocabulary system schema
-- This script handles existing objects gracefully

-- Create user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
END $$;

-- Create quiz_result enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_result') THEN
        CREATE TYPE quiz_result AS ENUM ('correct', 'incorrect', 'skipped');
    END IF;
END $$;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create words table with proper structure
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eng_word VARCHAR(255) NOT NULL,
    tur_word VARCHAR(255) NOT NULL,
    audio_url TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create word_samples table
CREATE TABLE IF NOT EXISTS word_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    sample_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_new_words INTEGER DEFAULT 10,
    allow_skip BOOLEAN DEFAULT true,
    preferred_difficulty INTEGER DEFAULT 1 CHECK (preferred_difficulty BETWEEN 1 AND 5),
    enable_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table for 6 Sefer algorithm
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    result quiz_result NOT NULL,
    repetition_count INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Create learned_words table for mastered words
CREATE TABLE IF NOT EXISTS learned_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    mastered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Create ai_stories table for LLM generated stories
CREATE TABLE IF NOT EXISTS ai_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_list TEXT[] NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wordle_games table
CREATE TABLE IF NOT EXISTS wordle_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id),
    guesses TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    is_won BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create word_images table for AI generated word images
CREATE TABLE IF NOT EXISTS word_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_eng_word ON words(eng_word);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_words_approved ON words(is_approved);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_word ON quiz_attempts(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_next_review ON quiz_attempts(next_review_date);
CREATE INDEX IF NOT EXISTS idx_learned_words_user ON learned_words(user_id);
CREATE INDEX IF NOT EXISTS idx_word_images_word ON word_images(word_id);
CREATE INDEX IF NOT EXISTS idx_wordle_games_user ON wordle_games(user_id);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordle_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Words policies
DROP POLICY IF EXISTS "Anyone can view approved words" ON words;
CREATE POLICY "Anyone can view approved words" ON words FOR SELECT USING (is_approved = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert words" ON words;
CREATE POLICY "Users can insert words" ON words FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update words" ON words;
CREATE POLICY "Admins can update words" ON words FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
);

-- Word samples policies
DROP POLICY IF EXISTS "Anyone can view word samples" ON word_samples;
CREATE POLICY "Anyone can view word samples" ON word_samples FOR SELECT USING (
    EXISTS (SELECT 1 FROM words WHERE id = word_samples.word_id AND (is_approved = true OR created_by = auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert word samples" ON word_samples;
CREATE POLICY "Users can insert word samples" ON word_samples FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM words WHERE id = word_samples.word_id AND created_by = auth.uid())
);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts policies
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- Learned words policies
DROP POLICY IF EXISTS "Users can manage own learned words" ON learned_words;
CREATE POLICY "Users can manage own learned words" ON learned_words FOR ALL USING (auth.uid() = user_id);

-- AI stories policies
DROP POLICY IF EXISTS "Users can manage own stories" ON ai_stories;
CREATE POLICY "Users can manage own stories" ON ai_stories FOR ALL USING (auth.uid() = user_id);

-- Wordle games policies
DROP POLICY IF EXISTS "Users can manage own wordle games" ON wordle_games;
CREATE POLICY "Users can manage own wordle games" ON wordle_games FOR ALL USING (auth.uid() = user_id);

-- Word images policies
DROP POLICY IF EXISTS "Users can view word images" ON word_images;
CREATE POLICY "Users can view word images" ON word_images FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM words WHERE id = word_images.word_id AND is_approved = true)
);

DROP POLICY IF EXISTS "Users can insert word images" ON word_images;
CREATE POLICY "Users can insert word images" ON word_images FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample data
INSERT INTO words (eng_word, tur_word, difficulty_level, is_approved) VALUES
('hello', 'merhaba', 1, true),
('world', 'dünya', 1, true),
('computer', 'bilgisayar', 2, true),
('programming', 'programlama', 3, true),
('artificial', 'yapay', 3, true),
('intelligence', 'zeka', 3, true),
('learning', 'öğrenme', 2, true),
('vocabulary', 'kelime hazinesi', 4, true),
('education', 'eğitim', 2, true),
('technology', 'teknoloji', 3, true),
('brain', 'beyin', 2, true),
('night', 'gece', 1, true),
('tiger', 'kaplan', 2, true),
('robin', 'narbülbülü', 3, true),
('noble', 'asil', 4, true)
ON CONFLICT (eng_word) DO NOTHING;

-- Insert sample word samples
INSERT INTO word_samples (word_id, sample_text) 
SELECT w.id, 'Hello, how are you today?' FROM words w WHERE w.eng_word = 'hello'
ON CONFLICT DO NOTHING;

INSERT INTO word_samples (word_id, sample_text) 
SELECT w.id, 'The world is a beautiful place.' FROM words w WHERE w.eng_word = 'world'
ON CONFLICT DO NOTHING;

INSERT INTO word_samples (word_id, sample_text) 
SELECT w.id, 'I use my computer every day.' FROM words w WHERE w.eng_word = 'computer'
ON CONFLICT DO NOTHING;

INSERT INTO word_samples (word_id, sample_text) 
SELECT w.id, 'Programming is a valuable skill.' FROM words w WHERE w.eng_word = 'programming'
ON CONFLICT DO NOTHING;

INSERT INTO word_samples (word_id, sample_text) 
SELECT w.id, 'Artificial intelligence is advancing rapidly.' FROM words w WHERE w.eng_word = 'artificial'
ON CONFLICT DO NOTHING;

-- Create function to calculate next review date for 6 Sefer algorithm
CREATE OR REPLACE FUNCTION calculate_next_review_date(repetition_count INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE repetition_count
        WHEN 1 THEN RETURN NOW() + INTERVAL '1 day';
        WHEN 2 THEN RETURN NOW() + INTERVAL '1 week';
        WHEN 3 THEN RETURN NOW() + INTERVAL '1 month';
        WHEN 4 THEN RETURN NOW() + INTERVAL '3 months';
        WHEN 5 THEN RETURN NOW() + INTERVAL '6 months';
        WHEN 6 THEN RETURN NOW() + INTERVAL '1 year';
        ELSE RETURN NOW() + INTERVAL '1 day';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle quiz results
CREATE OR REPLACE FUNCTION handle_quiz_result(
    p_user_id UUID,
    p_word_id UUID,
    p_result quiz_result
) RETURNS VOID AS $$
DECLARE
    current_count INTEGER := 0;
    next_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current repetition count
    SELECT repetition_count INTO current_count
    FROM quiz_attempts
    WHERE user_id = p_user_id AND word_id = p_word_id;
    
    IF p_result = 'correct' THEN
        current_count := COALESCE(current_count, 0) + 1;
        
        -- If reached 6 correct answers, move to learned_words
        IF current_count >= 6 THEN
            INSERT INTO learned_words (user_id, word_id)
            VALUES (p_user_id, p_word_id)
            ON CONFLICT (user_id, word_id) DO NOTHING;
            
            -- Remove from quiz_attempts
            DELETE FROM quiz_attempts 
            WHERE user_id = p_user_id AND word_id = p_word_id;
        ELSE
            -- Calculate next review date
            next_date := calculate_next_review_date(current_count);
            
            -- Update or insert quiz attempt
            INSERT INTO quiz_attempts (user_id, word_id, result, repetition_count, next_review_date)
            VALUES (p_user_id, p_word_id, p_result, current_count, next_date)
            ON CONFLICT (user_id, word_id) 
            DO UPDATE SET 
                result = p_result,
                repetition_count = current_count,
                next_review_date = next_date,
                created_at = NOW();
        END IF;
    ELSE
        -- Wrong answer or skipped - reset count
        INSERT INTO quiz_attempts (user_id, word_id, result, repetition_count, next_review_date)
        VALUES (p_user_id, p_word_id, p_result, 0, NOW() + INTERVAL '1 day')
        ON CONFLICT (user_id, word_id) 
        DO UPDATE SET 
            result = p_result,
            repetition_count = 0,
            next_review_date = NOW() + INTERVAL '1 day',
            created_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get quiz words for user
CREATE OR REPLACE FUNCTION get_quiz_words(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    word_id UUID,
    eng_word VARCHAR,
    tur_word VARCHAR,
    difficulty_level INTEGER,
    is_review BOOLEAN
) AS $$
DECLARE
    review_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Get review words (due for review)
    review_count := 0;
    FOR word_id, eng_word, tur_word, difficulty_level, is_review IN
        SELECT w.id, w.eng_word, w.tur_word, w.difficulty_level, true
        FROM words w
        JOIN quiz_attempts qa ON w.id = qa.word_id
        WHERE qa.user_id = p_user_id 
        AND qa.next_review_date <= NOW()
        AND w.is_approved = true
        ORDER BY qa.next_review_date
        LIMIT p_limit
    LOOP
        review_count := review_count + 1;
        RETURN NEXT;
    END LOOP;
    
    -- Fill remaining slots with new words
    new_count := p_limit - review_count;
    IF new_count > 0 THEN
        FOR word_id, eng_word, tur_word, difficulty_level, is_review IN
            SELECT w.id, w.eng_word, w.tur_word, w.difficulty_level, false
            FROM words w
            WHERE w.is_approved = true
            AND w.id NOT IN (
                SELECT qa.word_id FROM quiz_attempts qa WHERE qa.user_id = p_user_id
                UNION
                SELECT lw.word_id FROM learned_words lw WHERE lw.user_id = p_user_id
            )
            ORDER BY RANDOM()
            LIMIT new_count
        LOOP
            RETURN NEXT;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
