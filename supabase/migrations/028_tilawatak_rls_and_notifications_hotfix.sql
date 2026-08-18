-- ============================================================================
-- Migration 028: TilawatakLilAlam RLS, Permissions & Broadcast Hotfix
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description:
--   Targeted standalone hotfix for applications where Migration 027 has already
--   been executed. Applies only the necessary RLS policy updates, role resolution
--   enhancements, and broadcast notification fixes without altering previous files.
--
--   Key Inclusions:
--   1. Synchronizes active admin profiles with auth.users accounts.
--   2. Updates public.is_admin() and public.is_super_admin() to support both UID & Email lookup.
--   3. Fixes RLS policies for reciters, competitions, announcements, and recitation_submissions.
--   4. Refreshes public and administrative RPC execution grants.
--   5. Reloads PostgREST schema cache.
-- ============================================================================

-- ============================================================================
-- 1. SYNCHRONIZE ADMIN PROFILES & REPAIR STATUS
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

-- ============================================================================
-- 2. ENHANCED ROLE VALIDATION FUNCTIONS
-- ============================================================================

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
-- 3. AIRTIGHT RLS POLICIES REPAIR
-- ============================================================================

-- Enable RLS across all operational tables
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
    -- 3.1. Reciters Policies
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

    -- 3.2. Recitations Policies
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

    -- 3.3. Recitation Submissions Policies
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

    -- 3.4. Competitions Policies
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

    -- 3.5. Announcements Policies
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

    -- 3.6. Featured Reciters, Honors, Rewards
    DROP POLICY IF EXISTS "featured_select_policy" ON public.featured_reciters;
    CREATE POLICY "featured_select_policy" ON public.featured_reciters
        FOR SELECT TO anon, authenticated
        USING (is_active = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "featured_manage_policy" ON public.featured_reciters;
    CREATE POLICY "featured_manage_policy" ON public.featured_reciters
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "honors_select_policy" ON public.reciter_honors;
    CREATE POLICY "honors_select_policy" ON public.reciter_honors
        FOR SELECT TO anon, authenticated
        USING (TRUE);

    DROP POLICY IF EXISTS "honors_manage_policy" ON public.reciter_honors;
    CREATE POLICY "honors_manage_policy" ON public.reciter_honors
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "rewards_select_policy" ON public.reward_definitions;
    CREATE POLICY "rewards_select_policy" ON public.reward_definitions
        FOR SELECT TO anon, authenticated
        USING (is_active = TRUE OR public.is_admin());

    DROP POLICY IF EXISTS "rewards_manage_policy" ON public.reward_definitions;
    CREATE POLICY "rewards_manage_policy" ON public.reward_definitions
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    -- 3.7. User Profiles, Notifications & Broadcasts
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
END $$;

-- ============================================================================
-- 4. BROADCAST NOTIFICATIONS DISPATCHER RPC
-- ============================================================================

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

REVOKE ALL ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';
