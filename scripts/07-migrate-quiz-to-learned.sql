-- Mevcut quiz'lerde doğru cevaplanan kelimeleri learned_words tablosuna aktar
INSERT INTO public.learned_words (user_id, word_id, mastered_at)
SELECT DISTINCT 
    qa.user_id,
    qa.word_id,
    MIN(qa.created_at) as mastered_at
FROM public.quiz_attempts qa
WHERE qa.result = 'correct'
AND NOT EXISTS (
    SELECT 1 FROM public.learned_words lw 
    WHERE lw.user_id = qa.user_id AND lw.word_id = qa.word_id
)
GROUP BY qa.user_id, qa.word_id;

-- Kontrol için: kaç kelime eklendi?
SELECT 
    COUNT(*) as total_learned_words,
    COUNT(DISTINCT user_id) as users_with_learned_words
FROM public.learned_words;
