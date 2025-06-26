-- Tüm mevcut policy'leri sil
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for approved words" ON public.words;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.words;
DROP POLICY IF EXISTS "Enable all for admins" ON public.words;
DROP POLICY IF EXISTS "Enable read for approved word samples" ON public.word_samples;
DROP POLICY IF EXISTS "Enable insert for word samples" ON public.word_samples;
DROP POLICY IF EXISTS "Enable all for own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Enable all for own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Enable all for own learned words" ON public.learned_words;
DROP POLICY IF EXISTS "Enable all for own stories" ON public.ai_stories;
DROP POLICY IF EXISTS "Enable all for own wordle games" ON public.wordle_games;
DROP POLICY IF EXISTS "Enable admin read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable admin manage word samples" ON public.word_samples;

-- User profiles - basit policy'ler (admin kontrolü olmadan)
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Words - basit policy'ler
CREATE POLICY "words_select_approved" ON public.words
    FOR SELECT USING (is_approved = true);

CREATE POLICY "words_insert_authenticated" ON public.words
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "words_update_own" ON public.words
    FOR UPDATE USING (auth.uid() = created_by);

-- Word samples
CREATE POLICY "word_samples_select_approved" ON public.word_samples
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.words 
            WHERE id = word_id AND is_approved = true
        )
    );

CREATE POLICY "word_samples_insert_own_words" ON public.word_samples
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.words 
            WHERE id = word_id AND created_by = auth.uid()
        )
    );

-- User settings
CREATE POLICY "user_settings_all_own" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts
CREATE POLICY "quiz_attempts_all_own" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

-- Learned words
CREATE POLICY "learned_words_all_own" ON public.learned_words
    FOR ALL USING (auth.uid() = user_id);

-- AI stories
CREATE POLICY "ai_stories_all_own" ON public.ai_stories
    FOR ALL USING (auth.uid() = user_id);

-- Wordle games
CREATE POLICY "wordle_games_all_own" ON public.wordle_games
    FOR ALL USING (auth.uid() = user_id);

-- Admin işlemleri için ayrı bir yaklaşım - service role kullanacağız
-- Bu policy'ler sadece authenticated kullanıcılar için geçerli
-- Admin işlemleri backend'de service role ile yapılacak

-- Geçici olarak tüm authenticated kullanıcıların user_profiles'ı görmesine izin ver
-- (Admin paneli için gerekli)
CREATE POLICY "user_profiles_select_authenticated" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Words tablosu için admin işlemleri
CREATE POLICY "words_admin_operations" ON public.words
    FOR ALL USING (auth.role() = 'authenticated');

-- Word samples için admin işlemleri  
CREATE POLICY "word_samples_admin_operations" ON public.word_samples
    FOR ALL USING (auth.role() = 'authenticated');
