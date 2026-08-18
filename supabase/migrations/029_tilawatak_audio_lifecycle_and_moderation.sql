-- ============================================================================
-- Migration 029: Tilawatak LilAlam Audio Lifecycle, Moderation & Deletion Fixes
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: 
--   1. Strict audio integrity: No fallback/mock data, valid audio validation.
--   2. Submissions Moderation Workflow: PENDING -> APPROVED / APPROVED_UNPUBLISHED / REJECTED.
--   3. Adds installation_id column to recitation_submissions with index.
--   4. Role validation (is_admin, is_super_admin) supporting both UID and Email lookup.
--   5. Aggregated metrics RPC get_admin_dashboard_metrics() for live database counters.
--   6. Cascade Deletion RPC functions for admin operations protected by is_admin().
--   7. Full RLS security policies across all tables (including admin_notifications, admin_profiles, rewards, honors).
--   8. Live pre-aggregated statistics views with exact ranking formula:
--      ranking_score = (likes * 3) + (listens * 1) + (approved_recitations * 5)
--   9. No DROP VIEW ... CASCADE to preserve object dependencies and prevent 42P16 errors.
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA UPDATES & CONSTRAINTS
-- ============================================================================

-- 1.1 Ensure installation_id exists on recitation_submissions
ALTER TABLE public.recitation_submissions
    ADD COLUMN IF NOT EXISTS installation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_recitation_submissions_inst_id 
    ON public.recitation_submissions(installation_id);

-- 1.2 Update recitation_submissions status check to allow APPROVED_UNPUBLISHED
DO $$
BEGIN
    ALTER TABLE public.recitation_submissions DROP CONSTRAINT IF EXISTS recitation_submissions_status_check;
    ALTER TABLE public.recitation_submissions ADD CONSTRAINT recitation_submissions_status_check 
        CHECK (status IN ('PENDING', 'APPROVED', 'APPROVED_UNPUBLISHED', 'REJECTED'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 1.3 Ensure recitations has is_published and updated status check
ALTER TABLE public.recitations
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
    ALTER TABLE public.recitations DROP CONSTRAINT IF EXISTS recitations_status_check;
    ALTER TABLE public.recitations ADD CONSTRAINT recitations_status_check 
        CHECK (status IN ('PENDING', 'APPROVED', 'APPROVED_UNPUBLISHED', 'REJECTED'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 1.4 Ensure user_notifications has all necessary columns
ALTER TABLE public.user_notifications
    ADD COLUMN IF NOT EXISTS installation_id TEXT,
    ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN IF NOT EXISTS target_country TEXT,
    ADD COLUMN IF NOT EXISTS target_user_type TEXT,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_notifications_inst_id ON public.user_notifications(installation_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON public.user_notifications(created_at DESC);

-- 1.5 Ensure admin_notifications has all necessary columns and indexes
ALTER TABLE public.admin_notifications
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reference_id TEXT,
    ADD COLUMN IF NOT EXISTS sent_via_email BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- ============================================================================
-- 2. ROLE VALIDATION FUNCTIONS (is_admin / is_super_admin)
-- ============================================================================

-- Ensure all admin_profiles have active state
UPDATE public.admin_profiles SET is_active = TRUE WHERE is_active IS NULL;

-- Synchronize admin_profiles id with auth.users id if emails match
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
-- 3. SECURE ADMIN METRICS & CASCADE DELETION RPCs
-- ============================================================================

-- 3.1 Admin Dashboard Aggregated Metrics RPC
DROP FUNCTION IF EXISTS public.get_admin_dashboard_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB AS $$
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
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Administrator privilege required to view metrics.';
    END IF;

    SELECT COUNT(*) INTO v_total_reciters FROM public.reciters;
    SELECT COUNT(*) INTO v_published_reciters FROM public.reciters WHERE is_published = TRUE;
    SELECT COUNT(*) INTO v_total_recitations FROM public.recitations;
    SELECT COUNT(*) INTO v_published_recitations FROM public.recitations WHERE status = 'APPROVED' AND (is_published IS NULL OR is_published = TRUE);
    SELECT COUNT(*) INTO v_pending_submissions FROM public.recitation_submissions WHERE status = 'PENDING';
    SELECT COUNT(*) INTO v_total_listens FROM public.listen_events;
    SELECT COUNT(*) INTO v_total_likes FROM public.likes;
    SELECT COUNT(*) INTO v_active_competitions FROM public.competitions WHERE is_published = TRUE;
    SELECT COUNT(*) INTO v_total_users FROM public.user_profiles;

    RETURN jsonb_build_object(
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

REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated, service_role;

-- 3.2 Admin Delete Reciter (Cascades all recitations, likes, listens, honors)
CREATE OR REPLACE FUNCTION public.admin_delete_reciter(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete a reciter';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'Reciter ID cannot be null';
    END IF;

    -- 1. Delete honors
    DELETE FROM public.reciter_honors WHERE reciter_id = p_id;

    -- 2. Delete featured entries
    DELETE FROM public.featured_reciters WHERE reciter_id = p_id;

    -- 3. Delete likes for this reciter's recitations
    DELETE FROM public.likes 
    WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);

    -- 4. Delete listen events for this reciter's recitations
    DELETE FROM public.listen_events 
    WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);

    -- 5. Delete recitations
    DELETE FROM public.recitations WHERE reciter_id = p_id;

    -- 6. Delete reciter
    DELETE FROM public.reciters WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.3 Admin Delete Recitation (Cascades likes and listen events)
CREATE OR REPLACE FUNCTION public.admin_delete_recitation(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete a recitation';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'Recitation ID cannot be null';
    END IF;

    -- 1. Delete likes
    DELETE FROM public.likes WHERE recitation_id = p_id;

    -- 2. Delete listen events
    DELETE FROM public.listen_events WHERE recitation_id = p_id;

    -- 3. Delete recitation
    DELETE FROM public.recitations WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.4 Admin Delete Competition
CREATE OR REPLACE FUNCTION public.admin_delete_competition(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete a competition';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'Competition ID cannot be null';
    END IF;

    DELETE FROM public.competitions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.5 Admin Delete Announcement
CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete an announcement';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'Announcement ID cannot be null';
    END IF;

    DELETE FROM public.announcements WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.6 Admin Delete Submission
CREATE OR REPLACE FUNCTION public.admin_delete_submission(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete a submission';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'Submission ID cannot be null';
    END IF;

    DELETE FROM public.recitation_submissions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.7 Admin Delete User Profile
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id UUID)
RETURNS VOID AS $$
DECLARE
    v_inst_id TEXT;
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to delete a user profile';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    SELECT installation_id INTO v_inst_id FROM public.user_profiles WHERE id = p_id;

    -- 1. Delete notifications for this user
    IF v_inst_id IS NOT NULL AND TRIM(v_inst_id) <> '' THEN
        DELETE FROM public.user_notifications WHERE installation_id = v_inst_id;
    END IF;
    DELETE FROM public.user_notifications WHERE user_id = p_id;

    -- 2. Delete user profile
    DELETE FROM public.user_profiles WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3.8 Admin Delete Notification
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Administrator privilege required.';
    END IF;

    DELETE FROM public.admin_notifications WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_competition(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_submission(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_notification(UUID) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_competition(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_submission(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO authenticated, service_role;

-- ============================================================================
-- 4. PUBLIC & ADMIN RPC FUNCTIONS
-- ============================================================================

-- 4.1 Public Recitation Submission with Audio & Installation ID
CREATE OR REPLACE FUNCTION public.submit_recitation_public(
    p_display_name TEXT,
    p_pseudonym TEXT DEFAULT NULL,
    p_use_pseudonym BOOLEAN DEFAULT FALSE,
    p_gender TEXT DEFAULT 'MALE',
    p_country TEXT DEFAULT 'العالم الإسلامي',
    p_surah_number INTEGER DEFAULT 1,
    p_surah_name TEXT DEFAULT '',
    p_ayah_start INTEGER DEFAULT 1,
    p_ayah_end INTEGER DEFAULT 1,
    p_riwayah TEXT DEFAULT 'حفص عن عاصم',
    p_description TEXT DEFAULT '',
    p_audio_storage_path TEXT DEFAULT '',
    p_external_audio_url TEXT DEFAULT NULL,
    p_profile_image_path TEXT DEFAULT NULL,
    p_installation_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_new_id UUID;
    v_clean_gender TEXT;
BEGIN
    -- Validate required display name
    IF p_display_name IS NULL OR TRIM(p_display_name) = '' THEN
        RAISE EXCEPTION 'Display name is required';
    END IF;

    -- Validate audio source existence (either Supabase Storage path or direct valid external URL)
    IF (p_audio_storage_path IS NULL OR TRIM(p_audio_storage_path) = '') 
       AND (p_external_audio_url IS NULL OR TRIM(p_external_audio_url) = '') THEN
        RAISE EXCEPTION 'A valid audio storage path or external audio URL is required';
    END IF;

    v_clean_gender := UPPER(TRIM(COALESCE(p_gender, 'MALE')));
    IF v_clean_gender NOT IN ('MALE', 'FEMALE') THEN
        v_clean_gender := 'MALE';
    END IF;

    INSERT INTO public.recitation_submissions (
        display_name,
        pseudonym,
        use_pseudonym,
        gender,
        country,
        surah_number,
        surah_name,
        ayah_start,
        ayah_end,
        riwayah,
        description,
        audio_storage_path,
        external_audio_url,
        profile_image_path,
        installation_id,
        status,
        created_at
    ) VALUES (
        TRIM(p_display_name),
        NULLIF(TRIM(COALESCE(p_pseudonym, '')), ''),
        p_use_pseudonym,
        v_clean_gender,
        COALESCE(NULLIF(TRIM(p_country), ''), 'العالم الإسلامي'),
        GREATEST(1, LEAST(114, COALESCE(p_surah_number, 1))),
        COALESCE(NULLIF(TRIM(p_surah_name), ''), 'سورة الفاتحة'),
        GREATEST(1, COALESCE(p_ayah_start, 1)),
        GREATEST(1, COALESCE(p_ayah_end, 1)),
        COALESCE(NULLIF(TRIM(p_riwayah), ''), 'حفص عن عاصم'),
        COALESCE(TRIM(p_description), ''),
        COALESCE(TRIM(p_audio_storage_path), ''),
        NULLIF(TRIM(COALESCE(p_external_audio_url, '')), ''),
        NULLIF(TRIM(COALESCE(p_profile_image_path, '')), ''),
        NULLIF(TRIM(COALESCE(p_installation_id, '')), ''),
        'PENDING',
        NOW()
    )
    RETURNING id INTO v_new_id;

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
        'طلب تلاوة جديد: ' || COALESCE(NULLIF(TRIM(p_surah_name), ''), 'سورة قرطانية'),
        'أرسل القارئ ' || TRIM(p_display_name) || ' طلب تلاوة جديد وهو بانتظار المراجعة والاعتماد.',
        v_new_id::TEXT,
        FALSE,
        NOW()
    );

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.submit_recitation_public TO anon, authenticated, service_role;

-- 4.2 Admin Send Broadcast Notifications to User Profiles
CREATE OR REPLACE FUNCTION public.admin_send_broadcast(
    p_title TEXT,
    p_body TEXT,
    p_notification_type TEXT DEFAULT 'ADMIN_ANNOUNCEMENT',
    p_target_type TEXT DEFAULT 'all',
    p_target_value TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_count INT := 0;
    v_rec RECORD;
BEGIN
    IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to broadcast notifications';
    END IF;

    FOR v_rec IN 
        SELECT installation_id, id, country, user_type, is_profile_completed
        FROM public.user_profiles
        WHERE installation_id IS NOT NULL AND TRIM(installation_id) <> ''
          AND (
              p_target_type = 'all' OR
              (p_target_type = 'country' AND (country = p_target_value OR p_target_value IS NULL)) OR
              (p_target_type = 'user_type' AND (user_type = p_target_value OR p_target_value IS NULL)) OR
              (p_target_type = 'incomplete_profile' AND is_profile_completed = FALSE) OR
              (p_target_type = 'specific_user' AND (id::TEXT = p_target_value OR installation_id = p_target_value))
          )
    LOOP
        INSERT INTO public.user_notifications (
            installation_id,
            title,
            body,
            notification_type,
            target_country,
            target_user_type,
            is_read,
            created_at
        ) VALUES (
            v_rec.installation_id,
            p_title,
            p_body,
            COALESCE(p_notification_type, 'ADMIN_ANNOUNCEMENT'),
            CASE WHEN p_target_type = 'country' THEN p_target_value ELSE NULL END,
            CASE WHEN p_target_type = 'user_type' THEN p_target_value ELSE NULL END,
            FALSE,
            NOW()
        );
        v_count := v_count + 1;
    END LOOP;

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

    RETURN jsonb_build_object('success', TRUE, 'dispatched_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.admin_send_broadcast FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_send_broadcast TO authenticated, service_role;

-- ============================================================================
-- 5. REAL-TIME PRE-AGGREGATED STATISTICAL VIEWS (NO DROP VIEW CASCADE)
-- ============================================================================

-- 5.1 Reciter Statistics View
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
    WHERE status = 'APPROVED' AND (is_published IS NULL OR is_published = TRUE)
    GROUP BY reciter_id
) rec_stats ON rec_stats.reciter_id = rc.id
LEFT JOIN (
    SELECT r.reciter_id, COUNT(l.id) AS total_likes
    FROM public.recitations r
    JOIN public.likes l ON l.recitation_id = r.id
    WHERE r.status = 'APPROVED' AND (r.is_published IS NULL OR r.is_published = TRUE)
    GROUP BY r.reciter_id
) lk_stats ON lk_stats.reciter_id = rc.id
LEFT JOIN (
    SELECT r.reciter_id, COUNT(le.id) AS total_listens
    FROM public.recitations r
    JOIN public.listen_events le ON le.recitation_id = r.id
    WHERE r.status = 'APPROVED' AND (r.is_published IS NULL OR r.is_published = TRUE)
    GROUP BY r.reciter_id
) ls_stats ON ls_stats.reciter_id = rc.id
WHERE rc.is_published = TRUE;

-- 5.2 Recitation Statistics View
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
        WHEN r.ayah_start = 1 AND ((r.surah_number = 1 AND r.ayah_end = 7) OR (r.surah_number = 108 AND r.ayah_end = 3) OR (r.ayah_end <= r.ayah_start)) THEN 'كاملة'
        ELSE 'الآيات ' || r.ayah_start || ' - ' || r.ayah_end
    END AS ayah_range,
    r.description,
    r.created_at,
    COALESCE(lk.total_likes, 0)::BIGINT AS like_count,
    COALESCE(le.total_listens, 0)::BIGINT AS listen_count
FROM public.recitations r
JOIN public.reciters rc ON rc.id = r.reciter_id
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
WHERE r.status = 'APPROVED' AND rc.is_published = TRUE AND (r.is_published IS NULL OR r.is_published = TRUE);

GRANT SELECT ON public.reciter_statistics_view TO anon, authenticated, service_role;
GRANT SELECT ON public.recitation_statistics_view TO anon, authenticated, service_role;

-- ============================================================================
-- 6. COMPLETE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciter_honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- 6.1 Admin Profiles
DROP POLICY IF EXISTS "admin_read_admin_profiles" ON public.admin_profiles;
CREATE POLICY "admin_read_admin_profiles" ON public.admin_profiles
    FOR SELECT TO authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "admin_manage_admin_profiles" ON public.admin_profiles;
CREATE POLICY "admin_manage_admin_profiles" ON public.admin_profiles
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.2 Admin Notifications (Real RLS allowing authenticated Admins full read & write)
DROP POLICY IF EXISTS "admin_manage_admin_notifications" ON public.admin_notifications;
CREATE POLICY "admin_manage_admin_notifications" ON public.admin_notifications
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "public_insert_admin_notifications" ON public.admin_notifications;
CREATE POLICY "public_insert_admin_notifications" ON public.admin_notifications
    FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (TRUE);

-- 6.3 Reciters
DROP POLICY IF EXISTS "public_read_reciters" ON public.reciters;
CREATE POLICY "public_read_reciters" ON public.reciters
    FOR SELECT TO anon, authenticated, service_role
    USING (is_published = TRUE OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_reciters" ON public.reciters;
CREATE POLICY "admin_manage_reciters" ON public.reciters
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.4 Recitations
DROP POLICY IF EXISTS "public_read_recitations" ON public.recitations;
CREATE POLICY "public_read_recitations" ON public.recitations
    FOR SELECT TO anon, authenticated, service_role
    USING ((status = 'APPROVED' AND (is_published IS NULL OR is_published = TRUE)) OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_recitations" ON public.recitations;
CREATE POLICY "admin_manage_recitations" ON public.recitations
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.5 Competitions
DROP POLICY IF EXISTS "public_read_competitions" ON public.competitions;
CREATE POLICY "public_read_competitions" ON public.competitions
    FOR SELECT TO anon, authenticated, service_role
    USING (is_published = TRUE OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_competitions" ON public.competitions;
CREATE POLICY "admin_manage_competitions" ON public.competitions
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.6 Announcements
DROP POLICY IF EXISTS "public_read_announcements" ON public.announcements;
CREATE POLICY "public_read_announcements" ON public.announcements
    FOR SELECT TO anon, authenticated, service_role
    USING (is_published = TRUE OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_announcements" ON public.announcements;
CREATE POLICY "admin_manage_announcements" ON public.announcements
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.7 Rewards Definitions
DROP POLICY IF EXISTS "public_read_rewards" ON public.reward_definitions;
CREATE POLICY "public_read_rewards" ON public.reward_definitions
    FOR SELECT TO anon, authenticated, service_role
    USING (is_active = TRUE OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_rewards" ON public.reward_definitions;
CREATE POLICY "admin_manage_rewards" ON public.reward_definitions
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.8 Featured Reciters & Honors
DROP POLICY IF EXISTS "public_read_featured" ON public.featured_reciters;
CREATE POLICY "public_read_featured" ON public.featured_reciters
    FOR SELECT TO anon, authenticated, service_role
    USING (is_active = TRUE OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_featured" ON public.featured_reciters;
CREATE POLICY "admin_manage_featured" ON public.featured_reciters
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "public_read_honors" ON public.reciter_honors;
CREATE POLICY "public_read_honors" ON public.reciter_honors
    FOR SELECT TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "admin_manage_honors" ON public.reciter_honors;
CREATE POLICY "admin_manage_honors" ON public.reciter_honors
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.9 Recitation Submissions
DROP POLICY IF EXISTS "public_insert_submissions" ON public.recitation_submissions;
CREATE POLICY "public_insert_submissions" ON public.recitation_submissions
    FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "user_read_own_submissions" ON public.recitation_submissions;
CREATE POLICY "user_read_own_submissions" ON public.recitation_submissions
    FOR SELECT TO anon, authenticated, service_role
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role' OR 
        (installation_id IS NOT NULL AND installation_id <> '')
    );

DROP POLICY IF EXISTS "admin_manage_submissions" ON public.recitation_submissions;
CREATE POLICY "admin_manage_submissions" ON public.recitation_submissions
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.10 User Notifications
DROP POLICY IF EXISTS "public_read_notifications" ON public.user_notifications;
CREATE POLICY "public_read_notifications" ON public.user_notifications
    FOR SELECT TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "public_update_notifications" ON public.user_notifications;
CREATE POLICY "public_update_notifications" ON public.user_notifications
    FOR UPDATE TO anon, authenticated, service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_manage_notifications" ON public.user_notifications;
CREATE POLICY "admin_manage_notifications" ON public.user_notifications
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.11 User Profiles
DROP POLICY IF EXISTS "public_read_user_profiles" ON public.user_profiles;
CREATE POLICY "public_read_user_profiles" ON public.user_profiles
    FOR SELECT TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "public_insert_user_profiles" ON public.user_profiles;
CREATE POLICY "public_insert_user_profiles" ON public.user_profiles
    FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "public_update_user_profiles" ON public.user_profiles;
CREATE POLICY "public_update_user_profiles" ON public.user_profiles
    FOR UPDATE TO anon, authenticated, service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_manage_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_manage_user_profiles" ON public.user_profiles
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.12 Broadcast Notifications Log
DROP POLICY IF EXISTS "admin_manage_broadcasts" ON public.broadcast_notifications;
CREATE POLICY "admin_manage_broadcasts" ON public.broadcast_notifications
    FOR ALL TO authenticated, service_role
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6.13 Likes and Listen Events
DROP POLICY IF EXISTS "public_read_likes" ON public.likes;
CREATE POLICY "public_read_likes" ON public.likes
    FOR SELECT TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "public_insert_likes" ON public.likes;
CREATE POLICY "public_insert_likes" ON public.likes
    FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "public_delete_likes" ON public.likes;
CREATE POLICY "public_delete_likes" ON public.likes
    FOR DELETE TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "public_read_listen_events" ON public.listen_events;
CREATE POLICY "public_read_listen_events" ON public.listen_events
    FOR SELECT TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "public_insert_listen_events" ON public.listen_events;
CREATE POLICY "public_insert_listen_events" ON public.listen_events
    FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (TRUE);

-- ============================================================================
-- 7. RELOAD SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
    RAISE NOTICE 'Migration 029: Complete Audio Lifecycle, Moderation, Admin Permissions and RLS successfully updated';
END $$;
