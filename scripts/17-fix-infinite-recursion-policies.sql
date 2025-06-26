-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for own data" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for own data" ON user_profiles;

-- Drop and recreate user_profiles table to ensure clean state
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    role user_role DEFAULT 'user',
    daily_word_count INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Fix other table policies that might cause issues
DROP POLICY IF EXISTS "Users can view own words" ON words;
DROP POLICY IF EXISTS "Users can insert words" ON words;
DROP POLICY IF EXISTS "Users can update own words" ON words;

-- Simple policies for words table
CREATE POLICY "words_select_policy" ON words
    FOR SELECT USING (true); -- All users can view approved words

CREATE POLICY "words_insert_policy" ON words
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "words_update_policy" ON words
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix learned_words policies
DROP POLICY IF EXISTS "Users can view own learned words" ON learned_words;
DROP POLICY IF EXISTS "Users can insert own learned words" ON learned_words;
DROP POLICY IF EXISTS "Users can update own learned words" ON learned_words;

CREATE POLICY "learned_words_select_policy" ON learned_words
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "learned_words_insert_policy" ON learned_words
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "learned_words_update_policy" ON learned_words
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix word_images policies
DROP POLICY IF EXISTS "Users can view own word images" ON word_images;
DROP POLICY IF EXISTS "Users can insert own word images" ON word_images;

CREATE POLICY "word_images_select_policy" ON word_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "word_images_insert_policy" ON word_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix word_samples policies
DROP POLICY IF EXISTS "Users can view word samples" ON word_samples;
DROP POLICY IF EXISTS "Users can insert word samples" ON word_samples;

CREATE POLICY "word_samples_select_policy" ON word_samples
    FOR SELECT USING (true); -- All users can view samples

CREATE POLICY "word_samples_insert_policy" ON word_samples
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM words 
            WHERE words.id = word_samples.word_id 
            AND words.user_id = auth.uid()
        )
    );

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some sample data for testing
INSERT INTO words (eng_word, tur_word, difficulty_level, is_approved, user_id) VALUES
('hello', 'merhaba', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('world', 'dünya', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('computer', 'bilgisayar', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('beautiful', 'güzel', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('knowledge', 'bilgi', 3, true, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample word samples
INSERT INTO word_samples (word_id, sample_text) VALUES
((SELECT id FROM words WHERE eng_word = 'hello' LIMIT 1), 'Hello, how are you today?'),
((SELECT id FROM words WHERE eng_word = 'hello' LIMIT 1), 'She said hello to everyone in the room.'),
((SELECT id FROM words WHERE eng_word = 'world' LIMIT 1), 'The world is full of amazing places.'),
((SELECT id FROM words WHERE eng_word = 'computer' LIMIT 1), 'I use my computer for work every day.'),
((SELECT id FROM words WHERE eng_word = 'beautiful' LIMIT 1), 'The sunset was absolutely beautiful.')
ON CONFLICT DO NOTHING;
