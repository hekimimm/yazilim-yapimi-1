-- Eğer yukarıdaki script çalışmazsa, bu alternatif versiyonu kullanın
-- Önce mevcut kelimeleri kontrol et ve sadece yoksa ekle

DO $$
BEGIN
    -- hello kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'hello') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('hello', 'merhaba', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- world kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'world') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('world', 'dünya', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- house kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'house') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('house', 'ev', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- water kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'water') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('water', 'su', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- bread kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'bread') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('bread', 'ekmek', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- book kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'book') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('book', 'kitap', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- car kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'car') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('car', 'araba', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- tree kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'tree') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('tree', 'ağaç', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- sun kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'sun') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('sun', 'güneş', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- moon kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'moon') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('moon', 'ay', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- happy kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'happy') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('happy', 'mutlu', 2, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- beautiful kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'beautiful') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('beautiful', 'güzel', 2, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- important kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'important') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('important', 'önemli', 3, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- knowledge kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'knowledge') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('knowledge', 'bilgi', 3, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- experience kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'experience') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('experience', 'deneyim', 4, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- computer kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'computer') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('computer', 'bilgisayar', 2, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- school kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'school') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('school', 'okul', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- friend kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'friend') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('friend', 'arkadaş', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- family kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'family') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('family', 'aile', 1, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

    -- love kelimesi yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM public.words WHERE eng_word = 'love') THEN
        INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) 
        VALUES ('love', 'aşk', 2, true, (SELECT id FROM auth.users LIMIT 1));
    END IF;

END $$;
