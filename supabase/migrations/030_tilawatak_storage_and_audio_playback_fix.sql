-- ============================================================================
-- Migration 030: Storage RLS Policies & Private Submissions Audio Security Fix
-- Platform: Tilawatak LilAlam (تلاوتك للعالم)
-- ============================================================================

-- 1. Storage Buckets Configuration (Public vs Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('recitation-audio', 'recitation-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('recitation-covers', 'recitation-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('announcement-images', 'announcement-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('competition-images', 'competition-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('submission-audio', 'submission-audio', false, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('submission-images', 'submission-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop legacy policies on storage.objects
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
DROP POLICY IF EXISTS "Public read access on published storage buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for submissions" ON storage.objects;

-- 3. Public Read Policy: ONLY for Public Buckets
CREATE POLICY "Public read access on published storage buckets"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN (
            'profile-images',
            'recitation-audio',
            'recitation-covers',
            'announcement-images',
            'competition-images'
        )
    );

-- 4. Public Upload Policy: Allows users to upload submission audio & images
CREATE POLICY "Public upload access for submissions"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('submission-audio', 'submission-images')
    );

-- 5. Admin Management Policy: Full access including signed URL generation on private buckets
CREATE POLICY "Admin full access on all storage objects"
    ON storage.objects FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin() OR auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR auth.role() = 'service_role'
    );
