-- Bu script sadece debug amaçlı - environment variables'ı kontrol etmek için
-- Gerçek production'da çalıştırmayın

-- Basit bir test sorgusu
SELECT 
    COUNT(*) as total_words,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_words
FROM public.words;

-- Learned words kontrolü
SELECT 
    COUNT(*) as total_learned_words,
    COUNT(DISTINCT user_id) as users_with_learned_words
FROM public.learned_words;

-- Quiz attempts kontrolü
SELECT 
    result,
    COUNT(*) as count
FROM public.quiz_attempts
GROUP BY result;
