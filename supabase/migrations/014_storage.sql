-- ============================================================================
-- Migration 014: Supabase Storage Buckets & Storage Policies
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Provisioning dedicated buckets for approved media and submission uploads.
-- ============================================================================

-- Create dedicated storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('recitation-audio', 'recitation-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg']),
    ('recitation-covers', 'recitation-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('submission-audio', 'submission-audio', false, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg']),
    ('submission-images', 'submission-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('announcement-images', 'announcement-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('competition-images', 'competition-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public Access Policies for published audio and images
DROP POLICY IF EXISTS "Public read for profile-images" ON storage.objects;
CREATE POLICY "Public read for profile-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Public read for recitation-audio" ON storage.objects;
CREATE POLICY "Public read for recitation-audio"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'recitation-audio');

DROP POLICY IF EXISTS "Public read for recitation-covers" ON storage.objects;
CREATE POLICY "Public read for recitation-covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'recitation-covers');

DROP POLICY IF EXISTS "Public read for announcement-images" ON storage.objects;
CREATE POLICY "Public read for announcement-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'announcement-images');

DROP POLICY IF EXISTS "Public read for competition-images" ON storage.objects;
CREATE POLICY "Public read for competition-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'competition-images');

-- Anonymous upload policies for user submissions
DROP POLICY IF EXISTS "Allow public submission audio uploads" ON storage.objects;
CREATE POLICY "Allow public submission audio uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'submission-audio');

DROP POLICY IF EXISTS "Allow public submission image uploads" ON storage.objects;
CREATE POLICY "Allow public submission image uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'submission-images');

-- Admin full management policies across all buckets
DROP POLICY IF EXISTS "Admin full access on all storage objects" ON storage.objects;
CREATE POLICY "Admin full access on all storage objects"
    ON storage.objects FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
