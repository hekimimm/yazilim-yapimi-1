-- Önce unique constraint ekleyelim
ALTER TABLE public.words ADD CONSTRAINT words_eng_word_unique UNIQUE (eng_word);

-- Şimdi test için basit kelimeler ekleyelim
INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) VALUES
('hello', 'merhaba', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('world', 'dünya', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('house', 'ev', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('water', 'su', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('bread', 'ekmek', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('book', 'kitap', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('car', 'araba', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('tree', 'ağaç', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('sun', 'güneş', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('moon', 'ay', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('happy', 'mutlu', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('beautiful', 'güzel', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('important', 'önemli', 3, true, (SELECT id FROM auth.users LIMIT 1)),
('knowledge', 'bilgi', 3, true, (SELECT id FROM auth.users LIMIT 1)),
('experience', 'deneyim', 4, true, (SELECT id FROM auth.users LIMIT 1)),
('computer', 'bilgisayar', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('school', 'okul', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('friend', 'arkadaş', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('family', 'aile', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('love', 'aşk', 2, true, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (eng_word) DO NOTHING;
