-- ============================================================================
-- Migration 018: Final Production-Ready RLS, Security Definer Functions & Grants
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Complete, granular, and idempotent security rules for all tables.
-- ============================================================================

-- 1. Helper Functions with Security Definer & Clean Search Path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE id = auth.uid()
          AND role = 'SUPER_ADMIN'
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Ensure RLS is Enabled
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

-- 3. Safely Drop All Old/Conflicting Policies
DO $$
BEGIN
    -- Reciters
    DROP POLICY IF EXISTS "Public read for published reciters" ON public.reciters;
    DROP POLICY IF EXISTS "Admin full access to reciters" ON public.reciters;
    DROP POLICY IF EXISTS "reciters_select_policy" ON public.reciters;
    DROP POLICY IF EXISTS "reciters_insert_policy" ON public.reciters;
    DROP POLICY IF EXISTS "reciters_update_policy" ON public.reciters;
    DROP POLICY IF EXISTS "reciters_delete_policy" ON public.reciters;

    -- Recitations
    DROP POLICY IF EXISTS "Public read for approved recitations" ON public.recitations;
    DROP POLICY IF EXISTS "Admin full access to recitations" ON public.recitations;
    DROP POLICY IF EXISTS "recitations_select_policy" ON public.recitations;
    DROP POLICY IF EXISTS "recitations_insert_policy" ON public.recitations;
    DROP POLICY IF EXISTS "recitations_update_policy" ON public.recitations;
    DROP POLICY IF EXISTS "recitations_delete_policy" ON public.recitations;

    -- Submissions
    DROP POLICY IF EXISTS "Public anonymous insert for submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can view and manage all submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "submissions_insert_policy" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "submissions_select_policy" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "submissions_update_policy" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "submissions_delete_policy" ON public.recitation_submissions;

    -- Announcements
    DROP POLICY IF EXISTS "Public read for published announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admin full access to announcements" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_insert_policy" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_update_policy" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_delete_policy" ON public.announcements;

    -- Competitions
    DROP POLICY IF EXISTS "Public read for published competitions" ON public.competitions;
    DROP POLICY IF EXISTS "Admin full access to competitions" ON public.competitions;
    DROP POLICY IF EXISTS "competitions_select_policy" ON public.competitions;
    DROP POLICY IF EXISTS "competitions_insert_policy" ON public.competitions;
    DROP POLICY IF EXISTS "competitions_update_policy" ON public.competitions;
    DROP POLICY IF EXISTS "competitions_delete_policy" ON public.competitions;

    -- Reward Definitions
    DROP POLICY IF EXISTS "Public read for active rewards" ON public.reward_definitions;
    DROP POLICY IF EXISTS "Admin full access to reward definitions" ON public.reward_definitions;
    DROP POLICY IF EXISTS "reward_definitions_select_policy" ON public.reward_definitions;
    DROP POLICY IF EXISTS "reward_definitions_insert_policy" ON public.reward_definitions;
    DROP POLICY IF EXISTS "reward_definitions_update_policy" ON public.reward_definitions;
    DROP POLICY IF EXISTS "reward_definitions_delete_policy" ON public.reward_definitions;

    -- Reciter Honors
    DROP POLICY IF EXISTS "Public read for reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "Admin full access to reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "reciter_honors_select_policy" ON public.reciter_honors;
    DROP POLICY IF EXISTS "reciter_honors_insert_policy" ON public.reciter_honors;
    DROP POLICY IF EXISTS "reciter_honors_update_policy" ON public.reciter_honors;
    DROP POLICY IF EXISTS "reciter_honors_delete_policy" ON public.reciter_honors;

    -- Featured Reciters
    DROP POLICY IF EXISTS "Public read for active featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "Admin full access to featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "featured_reciters_select_policy" ON public.featured_reciters;
    DROP POLICY IF EXISTS "featured_reciters_insert_policy" ON public.featured_reciters;
    DROP POLICY IF EXISTS "featured_reciters_update_policy" ON public.featured_reciters;
    DROP POLICY IF EXISTS "featured_reciters_delete_policy" ON public.featured_reciters;

    -- Likes & Listen Events
    DROP POLICY IF EXISTS "Public read for likes" ON public.likes;
    DROP POLICY IF EXISTS "Public anonymous insert for likes" ON public.likes;
    DROP POLICY IF EXISTS "Public anonymous delete own likes" ON public.likes;
    DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
    DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
    DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;

    DROP POLICY IF EXISTS "Public anonymous insert for listen events" ON public.listen_events;
    DROP POLICY IF EXISTS "Admins can view raw listen events" ON public.listen_events;
    DROP POLICY IF EXISTS "listen_events_insert_policy" ON public.listen_events;
    DROP POLICY IF EXISTS "listen_events_select_policy" ON public.listen_events;

    -- Admin profiles
    DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;
    DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
    DROP POLICY IF EXISTS "admin_profiles_select_policy" ON public.admin_profiles;
    DROP POLICY IF EXISTS "admin_profiles_manage_policy" ON public.admin_profiles;
END $$;

-- ============================================================================
-- 4. RECITERS POLICIES
-- ============================================================================
CREATE POLICY "reciters_select_policy"
    ON public.reciters FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "reciters_insert_policy"
    ON public.reciters FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "reciters_update_policy"
    ON public.reciters FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "reciters_delete_policy"
    ON public.reciters FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 5. RECITATIONS POLICIES
-- ============================================================================
CREATE POLICY "recitations_select_policy"
    ON public.recitations FOR SELECT
    TO anon, authenticated
    USING (status = 'APPROVED' OR is_admin());

CREATE POLICY "recitations_insert_policy"
    ON public.recitations FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "recitations_update_policy"
    ON public.recitations FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "recitations_delete_policy"
    ON public.recitations FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 6. RECITATION SUBMISSIONS POLICIES (Public Anonymous Ingestion)
-- ============================================================================
CREATE POLICY "submissions_insert_policy"
    ON public.recitation_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

CREATE POLICY "submissions_select_policy"
    ON public.recitation_submissions FOR SELECT
    TO anon, authenticated
    USING (is_admin());

CREATE POLICY "submissions_update_policy"
    ON public.recitation_submissions FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "submissions_delete_policy"
    ON public.recitation_submissions FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 7. ANNOUNCEMENTS POLICIES
-- ============================================================================
CREATE POLICY "announcements_select_policy"
    ON public.announcements FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "announcements_insert_policy"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "announcements_update_policy"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "announcements_delete_policy"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 8. COMPETITIONS POLICIES
-- ============================================================================
CREATE POLICY "competitions_select_policy"
    ON public.competitions FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "competitions_insert_policy"
    ON public.competitions FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "competitions_update_policy"
    ON public.competitions FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "competitions_delete_policy"
    ON public.competitions FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 9. REWARD DEFINITIONS POLICIES
-- ============================================================================
CREATE POLICY "reward_definitions_select_policy"
    ON public.reward_definitions FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "reward_definitions_insert_policy"
    ON public.reward_definitions FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "reward_definitions_update_policy"
    ON public.reward_definitions FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "reward_definitions_delete_policy"
    ON public.reward_definitions FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 10. RECITER HONORS POLICIES
-- ============================================================================
CREATE POLICY "reciter_honors_select_policy"
    ON public.reciter_honors FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "reciter_honors_insert_policy"
    ON public.reciter_honors FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "reciter_honors_update_policy"
    ON public.reciter_honors FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "reciter_honors_delete_policy"
    ON public.reciter_honors FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 11. FEATURED RECITERS POLICIES
-- ============================================================================
CREATE POLICY "featured_reciters_select_policy"
    ON public.featured_reciters FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "featured_reciters_insert_policy"
    ON public.featured_reciters FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "featured_reciters_update_policy"
    ON public.featured_reciters FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "featured_reciters_delete_policy"
    ON public.featured_reciters FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 12. LIKES & LISTEN EVENTS POLICIES
-- ============================================================================
CREATE POLICY "likes_select_policy"
    ON public.likes FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "likes_insert_policy"
    ON public.likes FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

CREATE POLICY "likes_delete_policy"
    ON public.likes FOR DELETE
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "listen_events_select_policy"
    ON public.listen_events FOR SELECT
    TO anon, authenticated
    USING (is_admin());

CREATE POLICY "listen_events_insert_policy"
    ON public.listen_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (listened_seconds >= 0);

-- ============================================================================
-- 13. ADMIN PROFILES POLICIES
-- ============================================================================
CREATE POLICY "admin_profiles_select_policy"
    ON public.admin_profiles FOR SELECT
    TO authenticated
    USING (is_admin() OR auth.uid() = id);

CREATE POLICY "admin_profiles_manage_policy"
    ON public.admin_profiles FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ============================================================================
-- 14. EXPLICIT GRANTS FOR ROLES
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON 
    public.reciters,
    public.recitations,
    public.announcements,
    public.competitions,
    public.reward_definitions,
    public.reciter_honors,
    public.featured_reciters,
    public.admin_notifications,
    public.broadcast_notifications,
    public.recitation_submissions
TO authenticated;

GRANT INSERT ON public.recitation_submissions TO anon;
GRANT INSERT, DELETE ON public.likes TO anon, authenticated;
GRANT INSERT ON public.listen_events TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

-- ============================================================================
-- 15. PUBLIC SUBMISSION SECURITY DEFINER RPC (Guaranteed Ingestion)
-- ============================================================================
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
    v_id UUID;
    v_gender TEXT;
BEGIN
    v_gender := CASE WHEN UPPER(TRIM(p_gender)) = 'FEMALE' THEN 'FEMALE' ELSE 'MALE' END;
    
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
        COALESCE(NULLIF(TRIM(p_display_name), ''), 'قارئ'),
        p_pseudonym,
        COALESCE(p_use_pseudonym, FALSE),
        v_gender,
        COALESCE(NULLIF(TRIM(p_country), ''), 'العالم الإسلامي'),
        p_profile_image_path,
        GREATEST(1, LEAST(114, COALESCE(p_surah_number, 1))),
        COALESCE(NULLIF(TRIM(p_surah_name), ''), 'سورة'),
        GREATEST(1, COALESCE(p_ayah_start, 1)),
        GREATEST(1, COALESCE(p_ayah_end, 1)),
        COALESCE(NULLIF(TRIM(p_riwayah), ''), 'حفص عن عاصم'),
        COALESCE(p_description, ''),
        COALESCE(p_audio_storage_path, ''),
        p_external_audio_url,
        'PENDING',
        NOW()
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.submit_recitation_public TO anon, authenticated;

