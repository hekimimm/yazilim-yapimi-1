-- Mevcut policy'leri sil
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

-- Yeni, daha basit policy'ler oluştur
-- User profiles
CREATE POLICY "Enable read access for own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Words
CREATE POLICY "Enable read access for approved words" ON public.words
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Enable insert for authenticated users" ON public.words
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable all for admins" ON public.words
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Word samples
CREATE POLICY "Enable read for approved word samples" ON public.word_samples
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.words 
            WHERE id = word_id AND is_approved = true
        )
    );

CREATE POLICY "Enable insert for word samples" ON public.word_samples
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.words 
            WHERE id = word_id AND created_by = auth.uid()
        )
    );

-- User settings
CREATE POLICY "Enable all for own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts
CREATE POLICY "Enable all for own quiz attempts" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

-- Learned words
CREATE POLICY "Enable all for own learned words" ON public.learned_words
    FOR ALL USING (auth.uid() = user_id);

-- AI stories
CREATE POLICY "Enable all for own stories" ON public.ai_stories
    FOR ALL USING (auth.uid() = user_id);

-- Wordle games
CREATE POLICY "Enable all for own wordle games" ON public.wordle_games
    FOR ALL USING (auth.uid() = user_id);

-- Admin için özel policy'ler
CREATE POLICY "Enable admin read all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );

CREATE POLICY "Enable admin manage word samples" ON public.word_samples
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
