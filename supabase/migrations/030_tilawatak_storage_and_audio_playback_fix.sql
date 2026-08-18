-- ============================================================================
-- Migration 030: Storage RLS Policies & Private Submissions Audio Security Fix
-- Platform: Tilawatak LilAlam (تلاوتك للعالم)
-- Description:
--   1. Enforces strict privacy on submission-audio & submission-images (public = false).
--   2. Ensures public buckets (recitation-audio, profile-images, recitation-covers,
--      announcement-images, competition-images) are public (public = true).
--   3. Public SELECT policy ONLY allows reading from public buckets.
--   4. submission-audio is strictly excluded from public SELECT.
--   5. Admin & Service Role have full access to storage.objects via public.is_admin(),
--      allowing admins to generate signed URLs and stream pending submissions securely.
--   6. Public users have INSERT permissions only to upload new submissions.
-- ============================================================================

-- ============================================================================
-- 1. STORAGE BUCKETS CONFIGURATION (STRICT PRIVATE VS PUBLIC SEPARATION)
-- ============================================================================

-- 1.1 Public Buckets (Published and approved content)
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

-- 1.2 Private Buckets (Pending submissions under review - Strictly Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('submission-audio', 'submission-audio', false, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('submission-images', 'submission-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE.OBJECTS ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.1 Drop legacy policies
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

-- 2.2 Public SELECT Policy: ONLY for Public Buckets (submission-audio is NOT included)
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

-- 2.3 Public INSERT Policy: Allows anonymous users to upload submission audio & images
CREATE POLICY "Public upload access for submissions"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('submission-audio', 'submission-images')
    );

-- 2.4 Admin Full Management & Signed URL Generation Policy:
-- Grants active admins & service_role complete SELECT, INSERT, UPDATE, DELETE access on all buckets (including private submission-audio)
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
    RAISE NOTICE 'Migration 030: Storage RLS Policies & Private Submissions Security successfully configured';
END $$;
