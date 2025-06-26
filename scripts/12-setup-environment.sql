-- Environment setup verification
-- This script helps verify that all necessary tables and configurations are in place

-- Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'user_profiles', 'words', 'word_samples', 'user_settings', 
      'quiz_attempts', 'learned_words', 'ai_stories', 'wordle_games', 'images'
    ) THEN '✅ Required'
    ELSE '❓ Optional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if storage bucket exists
SELECT 
  name,
  created_at,
  public
FROM storage.buckets 
WHERE name = 'generated-images';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Sample data check
SELECT 
  'words' as table_name,
  count(*) as record_count
FROM words
UNION ALL
SELECT 
  'user_profiles' as table_name,
  count(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
  'images' as table_name,
  count(*) as record_count
FROM images;
