-- ============================================================================
-- Migration 025: TilawatakLilAlam Production-Ready Refactor
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description:
--   1. Ensures all tables, columns, and foreign key cascades exist.
--   2. Ensures RPC cascade deletion functions for reciters, recitations, competitions, announcements, submissions, users, and notifications.
--   3. RPC for sending broadcast & targeted user notifications.
--   4. Grants permissions to views and procedures for anon & authenticated roles.
--   5. Reloads PostgREST schema cache.
-- ============================================================================

-- 1. Ensure user_profiles and user_notifications tables exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'زائر المنصة',
    avatar_url TEXT,
    country TEXT NOT NULL DEFAULT 'العالم الإسلامي',
    user_type TEXT NOT NULL DEFAULT 'LISTENER' CHECK (user_type IN ('LISTENER', 'RECITER', 'BOTH')),
    bio TEXT DEFAULT '',
    email TEXT,
    whatsapp TEXT,
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspended_reason TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'SUBMISSION_STATUS',
    reference_id TEXT,
    rejection_reason TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL DEFAULT 'SYSTEM_HEALTH',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reference_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_email BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist
DO $$
BEGIN
    -- Reciters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reciters' AND column_name = 'profile_image_path') THEN
        ALTER TABLE public.reciters ADD COLUMN profile_image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reciters' AND column_name = 'is_published') THEN
        ALTER TABLE public.reciters ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- Recitations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'external_audio_url') THEN
        ALTER TABLE public.recitations ADD COLUMN external_audio_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'cover_image_path') THEN
        ALTER TABLE public.recitations ADD COLUMN cover_image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'description') THEN
        ALTER TABLE public.recitations ADD COLUMN description TEXT;
    END IF;

    -- Competitions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'link_url') THEN
        ALTER TABLE public.competitions ADD COLUMN link_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'image_path') THEN
        ALTER TABLE public.competitions ADD COLUMN image_path TEXT;
    END IF;

    -- Announcements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'link_url') THEN
        ALTER TABLE public.announcements ADD COLUMN link_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'image_path') THEN
        ALTER TABLE public.announcements ADD COLUMN image_path TEXT;
    END IF;
END $$;

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_install ON public.user_notifications(installation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_profiles_install ON public.user_profiles(installation_id);
CREATE INDEX IF NOT EXISTS idx_recitations_reciter ON public.recitations(reciter_id, status);
CREATE INDEX IF NOT EXISTS idx_likes_recitation ON public.likes(recitation_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_recitation ON public.listen_events(recitation_id);

-- 3. Cascade Deletion Stored Procedures (RPCs)
CREATE OR REPLACE FUNCTION public.admin_delete_reciter(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.likes WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);
    DELETE FROM public.listen_events WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);
    DELETE FROM public.recitations WHERE reciter_id = p_id;
    DELETE FROM public.reciter_honors WHERE reciter_id = p_id;
    DELETE FROM public.reciters WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_recitation(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.likes WHERE recitation_id = p_id;
    DELETE FROM public.listen_events WHERE recitation_id = p_id;
    DELETE FROM public.recitations WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_competition(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.competitions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.announcements WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_submission(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.recitation_submissions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.user_notifications WHERE installation_id IN (SELECT installation_id FROM public.user_profiles WHERE id = p_id);
    DELETE FROM public.user_profiles WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.admin_notifications WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Send Broadcast / Targeted Notification RPC
CREATE OR REPLACE FUNCTION public.admin_send_broadcast(
    p_title TEXT,
    p_body TEXT,
    p_notification_type TEXT DEFAULT 'ADMIN_ANNOUNCEMENT',
    p_target_type TEXT DEFAULT 'all',
    p_target_value TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_count INT := 0;
    r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT installation_id FROM public.user_profiles
        WHERE
            (p_target_type = 'all') OR
            (p_target_type = 'country' AND country = p_target_value) OR
            (p_target_type = 'user_type' AND user_type = p_target_value) OR
            (p_target_type = 'incomplete_profile' AND is_profile_completed = FALSE) OR
            (p_target_type = 'specific_user' AND (id::text = p_target_value OR installation_id = p_target_value))
    LOOP
        INSERT INTO public.user_notifications (
            installation_id,
            title,
            body,
            notification_type,
            is_read
        ) VALUES (
            r.installation_id,
            p_title,
            p_body,
            COALESCE(p_notification_type, 'ADMIN_ANNOUNCEMENT'),
            FALSE
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN json_build_object('success', true, 'dispatched_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. Grant permissions to anon & authenticated
GRANT EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_competition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_submission(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Enable RLS and setup open/guest policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can manage user profiles" ON public.user_profiles;
    CREATE POLICY "Public can manage user profiles" ON public.user_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public can read user notifications" ON public.user_notifications;
    CREATE POLICY "Public can read user notifications" ON public.user_notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Admin notifications open" ON public.admin_notifications;
    CREATE POLICY "Admin notifications open" ON public.admin_notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

NOTIFY pgrst, 'reload schema';
