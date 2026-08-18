-- ============================================================================
-- Migration 031: Admin Preview Audio Playback & Private Submissions Access Fix
-- Platform: Tilawatak LilAlam (تلاوتك للعالم)
-- Description:
--   1. Ensures submission-audio and submission-images buckets are strictly PRIVATE (public = false).
--   2. Grants SELECT permissions on submission-audio and submission-images to authenticated users and admins
--      so that Admin Preview can generate valid Signed URLs and stream pending audio.
--   3. Keeps the general public (anon) strictly blocked from SELECT on submission-audio.
--   4. Anonymous users retain INSERT permission only to upload new recitations.
--   5. Uses ONLY supported CREATE/DROP POLICY syntax without table alterations or ownership changes.
-- ============================================================================

-- 1. Ensure Buckets Configuration (Strict Private vs Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('submission-audio', 'submission-audio', false, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm', 'audio/flac', 'audio/opus']),
    ('submission-images', 'submission-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies on storage.objects before re-applying clean versions
DROP POLICY IF EXISTS "Admin full access on all storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read on submission buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read for submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on published storage buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for submissions" ON storage.objects;

-- 3. Public Read Policy: ONLY for Public Published Buckets (submission-audio is EXCLUDED)
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

-- 4. Authenticated & Admin Read Policy for Submissions (Allows Admin Preview & Signed URLs)
CREATE POLICY "Allow authenticated read on submission buckets"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id IN ('submission-audio', 'submission-images')
    );

-- 5. Public Upload Policy: Allows users to upload submission audio & images
CREATE POLICY "Public upload access for submissions"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('submission-audio', 'submission-images')
    );

-- 6. Admin Full Management Policy: Full access on all buckets for admins and service_role
CREATE POLICY "Admin full access on all storage objects"
    ON storage.objects FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin() OR auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR auth.role() = 'service_role'
    );
