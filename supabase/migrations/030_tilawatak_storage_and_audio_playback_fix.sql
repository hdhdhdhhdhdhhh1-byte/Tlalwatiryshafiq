-- ============================================================================
-- Migration 030: Storage RLS Policies & Audio Playback Infrastructure Fix
-- Platform: Tilawatak LilAlam (تلاوتك للعالم)
-- Description:
--   1. Fixes missing SELECT policies on storage.objects for submission-audio & submission-images
--   2. Enables public read / signed URL generation for user uploaded submission audios
--   3. Sets storage.buckets public = true for submission-audio and submission-images to allow instant preview streaming
--   4. Grants comprehensive admin / reviewer management rights over storage objects
--   5. Fixes copy and promotion permissions between submission-audio and recitation-audio
-- ============================================================================

-- ============================================================================
-- 1. ENSURE STORAGE BUCKETS EXIST AND ARE PUBLICLY ACCESSIBLE FOR STREAMING
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('recitation-audio', 'recitation-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('recitation-covers', 'recitation-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('submission-audio', 'submission-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('submission-images', 'submission-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('announcement-images', 'announcement-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('competition-images', 'competition-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE.OBJECTS ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.1 Clean up legacy policies
DROP POLICY IF EXISTS "Public read for profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for recitation-audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read for recitation-covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read for announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for competition-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for submission-audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read for submission-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow select for submission-audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow select for submission-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public submission audio uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public submission image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access on all storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on all tilawatak storage buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for submissions" ON storage.objects;

-- 2.2 Global Public Read / Stream Policy for all Tilawatak storage buckets
-- Allows browser <audio> and <img> elements, as well as signed URL generators, to read storage objects
CREATE POLICY "Public read access on all tilawatak storage buckets"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN (
            'profile-images',
            'recitation-audio',
            'recitation-covers',
            'submission-audio',
            'submission-images',
            'announcement-images',
            'competition-images'
        )
    );

-- 2.3 Public Insert Policy for Submissions (Upload audio & images from phone/browser)
CREATE POLICY "Public upload access for submissions"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('submission-audio', 'submission-images')
    );

-- 2.4 Admin Full Management Policy across all storage buckets
CREATE POLICY "Admin full access on all storage objects"
    ON storage.objects FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin() OR auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR auth.role() = 'service_role'
    );

-- ============================================================================
-- 3. PERMISSIONS GRANT ON STORAGE SCHEMA
-- ============================================================================

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO anon, authenticated, service_role;

-- ============================================================================
-- 4. VERIFICATION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 030: Storage RLS Policies, Public Streaming & Audio Playback Infrastructure successfully updated';
END $$;
