-- Sample admin user (you'll need to create this user through the UI first, then update their role)
-- UPDATE user_profiles SET role = 'admin' WHERE username = 'admin@example.com';

-- Sample approved words for testing
INSERT INTO public.words (eng_word, tur_word, difficulty_level, is_approved, created_by) VALUES
('hello', 'merhaba', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('world', 'dünya', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('house', 'ev', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('water', 'su', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('bread', 'ekmek', 1, true, (SELECT id FROM auth.users LIMIT 1)),
('happy', 'mutlu', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('beautiful', 'güzel', 2, true, (SELECT id FROM auth.users LIMIT 1)),
('important', 'önemli', 3, true, (SELECT id FROM auth.users LIMIT 1)),
('knowledge', 'bilgi', 3, true, (SELECT id FROM auth.users LIMIT 1)),
('experience', 'deneyim', 4, true, (SELECT id FROM auth.users LIMIT 1));

-- Sample word samples
INSERT INTO public.word_samples (word_id, sample_text) VALUES
((SELECT id FROM public.words WHERE eng_word = 'hello' LIMIT 1), 'Hello, how are you today?'),
((SELECT id FROM public.words WHERE eng_word = 'hello' LIMIT 1), 'She said hello to everyone in the room.'),
((SELECT id FROM public.words WHERE eng_word = 'world' LIMIT 1), 'The world is full of amazing places.'),
((SELECT id FROM public.words WHERE eng_word = 'world' LIMIT 1), 'World peace is what we all hope for.'),
((SELECT id FROM public.words WHERE eng_word = 'house' LIMIT 1), 'My house has a beautiful garden.'),
((SELECT id FROM public.words WHERE eng_word = 'house' LIMIT 1), 'The house was built in 1950.'),
((SELECT id FROM public.words WHERE eng_word = 'water' LIMIT 1), 'Please drink more water every day.'),
((SELECT id FROM public.words WHERE eng_word = 'water' LIMIT 1), 'The water in this lake is very clean.'),
((SELECT id FROM public.words WHERE eng_word = 'beautiful' LIMIT 1), 'What a beautiful sunset!'),
((SELECT id FROM public.words WHERE eng_word = 'beautiful' LIMIT 1), 'She has a beautiful voice.');
