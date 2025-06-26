-- Fix existing policies for images table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can update own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;

-- Create new policies for images table
CREATE POLICY "Users can view own images" ON public.images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON public.images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON public.images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON public.images
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on images table if not already enabled
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
