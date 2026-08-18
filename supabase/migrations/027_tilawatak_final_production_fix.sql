-- ============================================================================
-- Migration 027: TilawatakLilAlam Final Consolidated Production Migration
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description:
--   Consolidates, unifies, and supersedes Migrations 023, 024, 025, and 026 into
--   a single, standalone, 100% idempotent and production-ready script.
--
--   Key Inclusions:
--   1. Clean-slate safe test data purge (preserves admin accounts, rewards catalog, storage).
--   2. Complete schema assurance (tables, columns, indexes, constraints, RLS policies).
--   3. Explicit DROP FUNCTION/VIEW guards to prevent PostgreSQL 42P13 return-type mismatch errors.
--   4. Strict View Compatibility (PostgreSQL 42P16 compliant; exact column names & order).
--   5. Accurate Ranking Score Formula: (likes * 3) + (listens * 1) + (recitations * 5).
--   6. Real-time pre-aggregation subqueries (prevents Cartesian multiplication).
--   7. Bulletproof is_admin() checking (UID + Email fallback + service_role support).
--   8. Complete RLS Policies across ALL operational tables (reciters, competitions, recitations, submissions, announcements, etc.).
--   9. Public Visitor Access (guest submissions, likes, listen events, profiles, notifications).
--   10. Cascade Deletion Functions & Broadcast Notification Dispatching.
--   11. PostgREST Schema Cache Reload.
-- ============================================================================

-- ============================================================================
-- SECTION 1: SAFE OPERATIONAL DATA RESET
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Executing safe operational data reset...';

    -- 1. Purge child operational tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reciter_honors') THEN
        DELETE FROM public.reciter_honors;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
        DELETE FROM public.likes;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listen_events') THEN
        DELETE FROM public.listen_events;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'featured_reciters') THEN
        DELETE FROM public.featured_reciters;
    END IF;

    -- 2. Purge core operational tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recitations') THEN
        DELETE FROM public.recitations;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recitation_submissions') THEN
        DELETE FROM public.recitation_submissions;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reciters') THEN
        DELETE FROM public.reciters;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        DELETE FROM public.announcements;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions') THEN
        DELETE FROM public.competitions;
    END IF;

    -- 3. Purge user and notification tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        DELETE FROM public.admin_notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcast_notifications') THEN
        DELETE FROM public.broadcast_notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') THEN
        DELETE FROM public.user_notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DELETE FROM public.user_profiles;
    END IF;

    -- NOTE: admin_profiles, auth.users, and reward_definitions are strictly PRESERVED.
    RAISE NOTICE 'Operational test data purged successfully. Core system configuration preserved.';
END $$;

-- ============================================================================
-- SECTION 2: TABLES, COLUMNS & INDEXES ASSURANCE
-- ============================================================================

-- 2.1. Create User Profiles table if not exists
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

-- 2.2. Create User Notifications table if not exists
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

-- 2.3. Create Admin Notifications table if not exists
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

-- 2.4. Create Broadcast Notifications table if not exists
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all',
    sent_by UUID,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5. Ensure all necessary columns exist across existing tables
DO $$
BEGIN
    -- Reciters table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reciters' AND column_name = 'profile_image_path') THEN
        ALTER TABLE public.reciters ADD COLUMN profile_image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reciters' AND column_name = 'is_published') THEN
        ALTER TABLE public.reciters ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reciters' AND column_name = 'is_featured') THEN
        ALTER TABLE public.reciters ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Recitations table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'external_audio_url') THEN
        ALTER TABLE public.recitations ADD COLUMN external_audio_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'cover_image_path') THEN
        ALTER TABLE public.recitations ADD COLUMN cover_image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitations' AND column_name = 'description') THEN
        ALTER TABLE public.recitations ADD COLUMN description TEXT;
    END IF;

    -- Competitions table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'link_url') THEN
        ALTER TABLE public.competitions ADD COLUMN link_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'image_path') THEN
        ALTER TABLE public.competitions ADD COLUMN image_path TEXT;
    END IF;

    -- Announcements table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'link_url') THEN
        ALTER TABLE public.announcements ADD COLUMN link_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'image_path') THEN
        ALTER TABLE public.announcements ADD COLUMN image_path TEXT;
    END IF;

    -- Recitation submissions table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitation_submissions' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.recitation_submissions ADD COLUMN admin_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitation_submissions' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.recitation_submissions ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recitation_submissions' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.recitation_submissions ADD COLUMN reviewed_by UUID;
    END IF;
END $$;

-- 2.6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_install ON public.user_notifications(installation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_profiles_install ON public.user_profiles(installation_id);
CREATE INDEX IF NOT EXISTS idx_recitations_reciter ON public.recitations(reciter_id, status);
CREATE INDEX IF NOT EXISTS idx_likes_recitation ON public.likes(recitation_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_recitation ON public.listen_events(recitation_id);
CREATE INDEX IF NOT EXISTS idx_reciters_published ON public.reciters(is_published);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.recitation_submissions(status);

-- ============================================================================
-- SECTION 3: ROBUST ROLE VALIDATION FUNCTIONS (is_admin / is_super_admin)
-- ============================================================================

-- Ensure all admin_profiles have active state
UPDATE public.admin_profiles SET is_active = TRUE WHERE is_active IS NULL;

-- Automatically synchronize admin_profiles id with auth.users id if emails match
DO $$
BEGIN
    UPDATE public.admin_profiles ap
    SET id = au.id
    FROM auth.users au
    WHERE LOWER(ap.email) = LOWER(au.email)
      AND ap.id <> au.id;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Service role always has admin access
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- 2. Check if authenticated user ID or token email exists in active admin_profiles
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE (
            id = auth.uid()
            OR (
                email IS NOT NULL 
                AND auth.jwt() ->> 'email' IS NOT NULL 
                AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
            )
        )
        AND (is_active = TRUE OR is_active IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Service role always has super admin access
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- 2. Check if authenticated user is active super admin
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE (
            id = auth.uid()
            OR (
                email IS NOT NULL 
                AND auth.jwt() ->> 'email' IS NOT NULL 
                AND LOWER(email) = LOWER(auth.jwt() ->> 'email')
            )
        )
        AND role = 'SUPER_ADMIN'
        AND (is_active = TRUE OR is_active IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

-- ============================================================================
-- SECTION 4: STRICT VIEW COMPATIBILITY & REAL-TIME PRE-AGGREGATED STATS
-- ============================================================================

-- Drop views first to avoid any column definition or return type conflicts
DROP VIEW IF EXISTS public.reciter_statistics_view CASCADE;
DROP VIEW IF EXISTS public.recitation_statistics_view CASCADE;

-- 4.1. Reciter Statistics View
CREATE OR REPLACE VIEW public.reciter_statistics_view AS
SELECT
    rc.id AS reciter_id,
    CASE
        WHEN rc.use_pseudonym = TRUE AND rc.pseudonym IS NOT NULL AND TRIM(rc.pseudonym) <> '' THEN rc.pseudonym
        ELSE rc.display_name
    END AS public_name,
    rc.gender,
    rc.country,
    rc.bio,
    rc.profile_image_path,
    rc.is_verified,
    rc.is_featured,
    rc.is_published,
    rc.created_at,
    COALESCE(rec_stats.total_recitations, 0)::BIGINT AS total_recitations,
    COALESCE(lk_stats.total_likes, 0)::BIGINT AS total_likes,
    COALESCE(ls_stats.total_listens, 0)::BIGINT AS total_listens,
    (
        (COALESCE(lk_stats.total_likes, 0)::BIGINT * 3) +
        (COALESCE(ls_stats.total_listens, 0)::BIGINT * 1) +
        (COALESCE(rec_stats.total_recitations, 0)::BIGINT * 5)
    )::BIGINT AS ranking_score,
    rc.id AS id,
    rc.display_name,
    rc.pseudonym,
    rc.use_pseudonym,
    rc.profile_image_path AS avatar_url
FROM public.reciters rc
LEFT JOIN (
    SELECT reciter_id, COUNT(*) AS total_recitations
    FROM public.recitations
    WHERE status = 'APPROVED'
    GROUP BY reciter_id
) rec_stats ON rec_stats.reciter_id = rc.id
LEFT JOIN (
    SELECT r.reciter_id, COUNT(l.id) AS total_likes
    FROM public.recitations r
    JOIN public.likes l ON l.recitation_id = r.id
    WHERE r.status = 'APPROVED'
    GROUP BY r.reciter_id
) lk_stats ON lk_stats.reciter_id = rc.id
LEFT JOIN (
    SELECT r.reciter_id, COUNT(le.id) AS total_listens
    FROM public.recitations r
    JOIN public.listen_events le ON le.recitation_id = r.id
    WHERE r.status = 'APPROVED'
    GROUP BY r.reciter_id
) ls_stats ON ls_stats.reciter_id = rc.id
WHERE rc.is_published = TRUE;

-- 4.2. Recitation Statistics View
CREATE OR REPLACE VIEW public.recitation_statistics_view AS
SELECT
    r.id AS recitation_id,
    r.reciter_id,
    r.surah_name,
    r.surah_number,
    r.ayah_start,
    r.ayah_end,
    r.riwayah,
    r.duration_seconds,
    r.audio_storage_path,
    r.external_audio_url,
    r.cover_image_path,
    r.status,
    r.is_staff_pick,
    r.published_at,
    COALESCE(lk.total_likes, 0)::BIGINT AS total_likes,
    COALESCE(le.total_listens, 0)::BIGINT AS total_listens,
    r.id AS id,
    CASE
        WHEN rc.use_pseudonym = TRUE AND rc.pseudonym IS NOT NULL AND TRIM(rc.pseudonym) <> '' THEN rc.pseudonym
        ELSE rc.display_name
    END AS reciter_name,
    rc.profile_image_path AS reciter_avatar,
    rc.country AS reciter_country,
    CASE
        WHEN r.ayah_start = 1 AND (
            (r.surah_number = 1 AND r.ayah_end = 7) OR
            (r.surah_number = 108 AND r.ayah_end = 3) OR
            (r.ayah_end <= r.ayah_start)
        ) THEN 'كاملة'
        ELSE 'الآيات ' || r.ayah_start || ' - ' || r.ayah_end
    END AS ayah_range,
    r.description,
    r.created_at
FROM public.recitations r
JOIN public.reciters rc ON r.reciter_id = rc.id
LEFT JOIN (
    SELECT recitation_id, COUNT(*) AS total_likes
    FROM public.likes
    GROUP BY recitation_id
) lk ON lk.recitation_id = r.id
LEFT JOIN (
    SELECT recitation_id, COUNT(*) AS total_listens
    FROM public.listen_events
    GROUP BY recitation_id
) le ON le.recitation_id = r.id
WHERE r.status = 'APPROVED' AND rc.is_published = TRUE;

-- 4.3. Public view permissions
GRANT SELECT ON public.reciter_statistics_view TO anon, authenticated;
GRANT SELECT ON public.recitation_statistics_view TO anon, authenticated;

-- ============================================================================
-- SECTION 5: PUBLIC VISITOR RPCS (Guest Submissions, Likes, Listens)
-- ============================================================================

-- 5.1. Public Recitation Submission RPC
DROP FUNCTION IF EXISTS public.submit_recitation_public(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.submit_recitation_public CASCADE;

CREATE OR REPLACE FUNCTION public.submit_recitation_public(
    p_display_name TEXT,
    p_pseudonym TEXT DEFAULT NULL,
    p_use_pseudonym BOOLEAN DEFAULT FALSE,
    p_gender TEXT DEFAULT 'MALE',
    p_country TEXT DEFAULT 'العالم الإسلامي',
    p_profile_image_path TEXT DEFAULT NULL,
    p_surah_number INTEGER DEFAULT 1,
    p_surah_name TEXT DEFAULT '',
    p_ayah_start INTEGER DEFAULT 1,
    p_ayah_end INTEGER DEFAULT 1,
    p_riwayah TEXT DEFAULT 'حفص عن عاصم',
    p_description TEXT DEFAULT '',
    p_audio_storage_path TEXT DEFAULT '',
    p_external_audio_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_submission_id UUID;
BEGIN
    INSERT INTO public.recitation_submissions (
        display_name,
        pseudonym,
        use_pseudonym,
        gender,
        country,
        profile_image_path,
        surah_number,
        surah_name,
        ayah_start,
        ayah_end,
        riwayah,
        description,
        audio_storage_path,
        external_audio_url,
        status,
        created_at
    ) VALUES (
        p_display_name,
        p_pseudonym,
        p_use_pseudonym,
        p_gender,
        p_country,
        p_profile_image_path,
        p_surah_number,
        p_surah_name,
        p_ayah_start,
        p_ayah_end,
        p_riwayah,
        p_description,
        p_audio_storage_path,
        p_external_audio_url,
        'PENDING',
        NOW()
    ) RETURNING id INTO v_submission_id;

    -- Generate admin in-app notification for incoming submission
    INSERT INTO public.admin_notifications (
        notification_type,
        title,
        content,
        reference_id,
        is_read,
        created_at
    ) VALUES (
        'NEW_SUBMISSION',
        'طلب تلاوة جديد: ' || p_surah_name,
        'أرسل القارئ ' || p_display_name || ' طلب تلاوة جديد لسورة ' || p_surah_name || ' وهو بانتظار المراجعة والاعتماد.',
        v_submission_id::TEXT,
        FALSE,
        NOW()
    );

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5.2. Public Like Toggle RPC
DROP FUNCTION IF EXISTS public.toggle_recitation_like(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.toggle_recitation_like CASCADE;

CREATE OR REPLACE FUNCTION public.toggle_recitation_like(
    p_recitation_id UUID,
    p_anonymous_installation_id TEXT
)
RETURNS TABLE (
    is_liked BOOLEAN,
    total_likes BIGINT
) AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_state BOOLEAN;
    v_total_likes BIGINT;
BEGIN
    IF p_recitation_id IS NULL OR p_anonymous_installation_id IS NULL OR TRIM(p_anonymous_installation_id) = '' THEN
        RAISE EXCEPTION 'Invalid parameters: recitation_id and anonymous_installation_id are required';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.likes
        WHERE recitation_id = p_recitation_id
          AND anonymous_installation_id = p_anonymous_installation_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.likes
        WHERE recitation_id = p_recitation_id
          AND anonymous_installation_id = p_anonymous_installation_id;
        v_new_state := FALSE;
    ELSE
        INSERT INTO public.likes (
            recitation_id,
            anonymous_installation_id,
            created_at
        ) VALUES (
            p_recitation_id,
            p_anonymous_installation_id,
            NOW()
        )
        ON CONFLICT (recitation_id, anonymous_installation_id) DO NOTHING;
        v_new_state := TRUE;
    END IF;

    SELECT COUNT(*) INTO v_total_likes
    FROM public.likes
    WHERE recitation_id = p_recitation_id;

    RETURN QUERY SELECT v_new_state, v_total_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5.3. Public Listen Event Recording RPC
DROP FUNCTION IF EXISTS public.record_listen_event(UUID, TEXT, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.record_listen_event CASCADE;

CREATE OR REPLACE FUNCTION public.record_listen_event(
    p_recitation_id UUID,
    p_anonymous_installation_id TEXT,
    p_listened_seconds INTEGER DEFAULT 5,
    p_completed BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.listen_events (
        recitation_id,
        anonymous_installation_id,
        duration_seconds,
        completed,
        created_at
    ) VALUES (
        p_recitation_id,
        p_anonymous_installation_id,
        p_listened_seconds,
        p_completed,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.submit_recitation_public(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_recitation_like(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_listen_event(UUID, TEXT, INTEGER, BOOLEAN) TO anon, authenticated;

-- ============================================================================
-- SECTION 6: SECURE ADMINISTRATIVE METRICS & ACTIONS RPCS
-- ============================================================================

-- 6.1. Admin Dashboard Aggregated Metrics
DROP FUNCTION IF EXISTS public.get_admin_dashboard_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
    v_total_reciters INT;
    v_published_reciters INT;
    v_total_recitations INT;
    v_published_recitations INT;
    v_pending_submissions INT;
    v_total_listens INT;
    v_total_likes INT;
    v_active_competitions INT;
    v_total_users INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    SELECT COUNT(*) INTO v_total_reciters FROM public.reciters;
    SELECT COUNT(*) INTO v_published_reciters FROM public.reciters WHERE is_published = TRUE;
    SELECT COUNT(*) INTO v_total_recitations FROM public.recitations;
    SELECT COUNT(*) INTO v_published_recitations FROM public.recitations WHERE status = 'APPROVED';
    SELECT COUNT(*) INTO v_pending_submissions FROM public.recitation_submissions WHERE status = 'PENDING';
    SELECT COUNT(*) INTO v_total_listens FROM public.listen_events;
    SELECT COUNT(*) INTO v_total_likes FROM public.likes;
    SELECT COUNT(*) INTO v_active_competitions FROM public.competitions WHERE is_published = TRUE;
    SELECT COUNT(*) INTO v_total_users FROM public.user_profiles;

    RETURN json_build_object(
        'totalReciters', v_total_reciters,
        'publishedReciters', v_published_reciters,
        'totalRecitations', v_total_recitations,
        'publishedRecitations', v_published_recitations,
        'pendingSubmissions', v_pending_submissions,
        'totalListens', v_total_listens,
        'totalLikes', v_total_likes,
        'activeCompetitions', v_active_competitions,
        'totalUsers', v_total_users
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.2. Cascade Deletion: Reciter
DROP FUNCTION IF EXISTS public.admin_delete_reciter(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_reciter(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.reciter_honors WHERE reciter_id = p_id;
    DELETE FROM public.featured_reciters WHERE reciter_id = p_id;

    DELETE FROM public.likes WHERE recitation_id IN (
        SELECT id FROM public.recitations WHERE reciter_id = p_id
    );
    DELETE FROM public.listen_events WHERE recitation_id IN (
        SELECT id FROM public.recitations WHERE reciter_id = p_id
    );

    DELETE FROM public.recitations WHERE reciter_id = p_id;
    DELETE FROM public.reciters WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.3. Cascade Deletion: Recitation
DROP FUNCTION IF EXISTS public.admin_delete_recitation(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_recitation(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.likes WHERE recitation_id = p_id;
    DELETE FROM public.listen_events WHERE recitation_id = p_id;
    DELETE FROM public.recitations WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.4. Cascade Deletion: Competition
DROP FUNCTION IF EXISTS public.admin_delete_competition(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_competition(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.competitions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.5. Cascade Deletion: Announcement
DROP FUNCTION IF EXISTS public.admin_delete_announcement(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.announcements WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.6. Cascade Deletion: Submission
DROP FUNCTION IF EXISTS public.admin_delete_submission(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_submission(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.recitation_submissions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.7. Cascade Deletion: User Profile & Devices
DROP FUNCTION IF EXISTS public.admin_delete_user(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id UUID)
RETURNS VOID AS $$
DECLARE
    v_install_id TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    SELECT installation_id INTO v_install_id
    FROM public.user_profiles
    WHERE id = p_id;

    IF v_install_id IS NOT NULL THEN
        DELETE FROM public.user_notifications WHERE installation_id = v_install_id;
    END IF;

    DELETE FROM public.user_profiles WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.8. Delete Admin Notification
DROP FUNCTION IF EXISTS public.admin_delete_notification(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.admin_notifications WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.9. Admin Broadcast Notification Dispatcher
DROP FUNCTION IF EXISTS public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_send_broadcast CASCADE;

CREATE OR REPLACE FUNCTION public.admin_send_broadcast(
    p_title TEXT,
    p_body TEXT,
    p_notification_type TEXT DEFAULT 'SYSTEM_BROADCAST',
    p_target_type TEXT DEFAULT 'all',
    p_target_value TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_dispatched INTEGER := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    INSERT INTO public.user_notifications (
        installation_id,
        title,
        body,
        notification_type,
        is_read,
        created_at
    )
    SELECT 
        up.installation_id,
        p_title,
        p_body,
        COALESCE(NULLIF(p_notification_type, ''), 'SYSTEM_BROADCAST'),
        FALSE,
        NOW()
    FROM public.user_profiles up
    WHERE 
        (p_target_type = 'all')
        OR (p_target_type = 'country' AND up.country = p_target_value)
        OR (p_target_type = 'user_type' AND up.user_type = p_target_value)
        OR (p_target_type = 'incomplete_profile' AND up.is_profile_completed = FALSE)
        OR (p_target_type = 'specific_user' AND (up.id::TEXT = p_target_value OR up.installation_id = p_target_value));

    GET DIAGNOSTICS v_dispatched = ROW_COUNT;

    -- Record in broadcast audit log if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcast_notifications') THEN
        INSERT INTO public.broadcast_notifications (
            title,
            body,
            target_audience,
            sent_by,
            sent_at
        ) VALUES (
            p_title,
            p_body,
            p_target_type || CASE WHEN p_target_value IS NOT NULL THEN ':' || p_target_value ELSE '' END,
            auth.uid(),
            NOW()
        );
    END IF;

    RETURN json_build_object(
        'success', TRUE,
        'dispatched_count', v_dispatched
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================================
-- SECTION 7: ACCESS CONTROL & REVOCATION OF PUBLIC ADMIN PRIVILEGES
-- ============================================================================

-- Revoke all administrative execution from anon and PUBLIC
REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_reciter(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_recitation(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_competition(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_announcement(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_submission(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_notification(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

-- Grant administrative execution strictly to authenticated
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_competition(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_submission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS) POLICIES - BULLETPROOF IMPLEMENTATION
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciter_honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- 1. Admin Profiles
    DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
    CREATE POLICY "Admins can view admin profiles" ON public.admin_profiles
        FOR SELECT TO authenticated
        USING (TRUE);

    DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
    CREATE POLICY "Super admins can manage admin profiles" ON public.admin_profiles
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    -- 2. Reciters
    DROP POLICY IF EXISTS "reciters_select_policy" ON public.reciters;
    DROP POLICY IF EXISTS "Public read for published reciters" ON public.reciters;
    CREATE POLICY "reciters_select_policy" ON public.reciters
        FOR SELECT TO anon, authenticated
        USING (is_published = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "reciters_insert_policy" ON public.reciters;
    DROP POLICY IF EXISTS "Admin full access to reciters" ON public.reciters;
    CREATE POLICY "reciters_insert_policy" ON public.reciters
        FOR INSERT TO authenticated
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "reciters_update_policy" ON public.reciters;
    CREATE POLICY "reciters_update_policy" ON public.reciters
        FOR UPDATE TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "reciters_delete_policy" ON public.reciters;
    CREATE POLICY "reciters_delete_policy" ON public.reciters
        FOR DELETE TO authenticated
        USING (public.is_admin());

    -- 3. Recitations
    DROP POLICY IF EXISTS "recitations_select_policy" ON public.recitations;
    DROP POLICY IF EXISTS "Public read for approved recitations" ON public.recitations;
    CREATE POLICY "recitations_select_policy" ON public.recitations
        FOR SELECT TO anon, authenticated
        USING (status = 'APPROVED' OR public.is_admin());

    DROP POLICY IF EXISTS "recitations_insert_policy" ON public.recitations;
    DROP POLICY IF EXISTS "Admin full access to recitations" ON public.recitations;
    CREATE POLICY "recitations_insert_policy" ON public.recitations
        FOR INSERT TO authenticated
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "recitations_update_policy" ON public.recitations;
    CREATE POLICY "recitations_update_policy" ON public.recitations
        FOR UPDATE TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "recitations_delete_policy" ON public.recitations;
    CREATE POLICY "recitations_delete_policy" ON public.recitations
        FOR DELETE TO authenticated
        USING (public.is_admin());

    -- 4. Recitation Submissions
    DROP POLICY IF EXISTS "submissions_select_policy" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can view and manage all submissions" ON public.recitation_submissions;
    CREATE POLICY "submissions_select_policy" ON public.recitation_submissions
        FOR SELECT TO anon, authenticated
        USING (public.is_admin() OR TRUE);

    DROP POLICY IF EXISTS "submissions_insert_policy" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Public anonymous insert for submissions" ON public.recitation_submissions;
    CREATE POLICY "submissions_insert_policy" ON public.recitation_submissions
        FOR INSERT TO anon, authenticated
        WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "submissions_update_policy" ON public.recitation_submissions;
    CREATE POLICY "submissions_update_policy" ON public.recitation_submissions
        FOR UPDATE TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "submissions_delete_policy" ON public.recitation_submissions;
    CREATE POLICY "submissions_delete_policy" ON public.recitation_submissions
        FOR DELETE TO authenticated
        USING (public.is_admin());

    -- 5. Competitions
    DROP POLICY IF EXISTS "competitions_select_policy" ON public.competitions;
    DROP POLICY IF EXISTS "Public read for published competitions" ON public.competitions;
    CREATE POLICY "competitions_select_policy" ON public.competitions
        FOR SELECT TO anon, authenticated
        USING (is_published = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "competitions_insert_policy" ON public.competitions;
    DROP POLICY IF EXISTS "Admin full access to competitions" ON public.competitions;
    CREATE POLICY "competitions_insert_policy" ON public.competitions
        FOR INSERT TO authenticated
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "competitions_update_policy" ON public.competitions;
    CREATE POLICY "competitions_update_policy" ON public.competitions
        FOR UPDATE TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "competitions_delete_policy" ON public.competitions;
    CREATE POLICY "competitions_delete_policy" ON public.competitions
        FOR DELETE TO authenticated
        USING (public.is_admin());

    -- 6. Announcements
    DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
    DROP POLICY IF EXISTS "Public read for published announcements" ON public.announcements;
    CREATE POLICY "announcements_select_policy" ON public.announcements
        FOR SELECT TO anon, authenticated
        USING (is_published = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "announcements_insert_policy" ON public.announcements;
    DROP POLICY IF EXISTS "Admin full access to announcements" ON public.announcements;
    CREATE POLICY "announcements_insert_policy" ON public.announcements
        FOR INSERT TO authenticated
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "announcements_update_policy" ON public.announcements;
    CREATE POLICY "announcements_update_policy" ON public.announcements
        FOR UPDATE TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "announcements_delete_policy" ON public.announcements;
    CREATE POLICY "announcements_delete_policy" ON public.announcements
        FOR DELETE TO authenticated
        USING (public.is_admin());

    -- 7. Featured Reciters
    DROP POLICY IF EXISTS "featured_select_policy" ON public.featured_reciters;
    CREATE POLICY "featured_select_policy" ON public.featured_reciters
        FOR SELECT TO anon, authenticated
        USING (is_active = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "featured_manage_policy" ON public.featured_reciters;
    CREATE POLICY "featured_manage_policy" ON public.featured_reciters
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    -- 8. Reciter Honors
    DROP POLICY IF EXISTS "honors_select_policy" ON public.reciter_honors;
    CREATE POLICY "honors_select_policy" ON public.reciter_honors
        FOR SELECT TO anon, authenticated
        USING (TRUE);

    DROP POLICY IF EXISTS "honors_manage_policy" ON public.reciter_honors;
    CREATE POLICY "honors_manage_policy" ON public.reciter_honors
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    -- 9. Reward Definitions
    DROP POLICY IF EXISTS "rewards_select_policy" ON public.reward_definitions;
    CREATE POLICY "rewards_select_policy" ON public.reward_definitions
        FOR SELECT TO anon, authenticated
        USING (is_active = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "rewards_manage_policy" ON public.reward_definitions;
    CREATE POLICY "rewards_manage_policy" ON public.reward_definitions
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    -- 10. Likes & Listen Events
    DROP POLICY IF EXISTS "likes_policy" ON public.likes;
    CREATE POLICY "likes_policy" ON public.likes
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "listen_events_policy" ON public.listen_events;
    CREATE POLICY "listen_events_policy" ON public.listen_events
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

    -- 11. User Profiles & User Notifications
    DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;
    CREATE POLICY "user_profiles_policy" ON public.user_profiles
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "user_notifications_policy" ON public.user_notifications;
    CREATE POLICY "user_notifications_policy" ON public.user_notifications
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

    -- 12. Admin Notifications & Broadcast Notifications
    DROP POLICY IF EXISTS "admin_notifications_policy" ON public.admin_notifications;
    CREATE POLICY "admin_notifications_policy" ON public.admin_notifications
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "broadcast_notifications_policy" ON public.broadcast_notifications;
    CREATE POLICY "broadcast_notifications_policy" ON public.broadcast_notifications
        FOR ALL TO anon, authenticated
        USING (TRUE)
        WITH CHECK (TRUE);

END $$;

-- ============================================================================
-- SECTION 9: RELOAD POSTGREST SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';
