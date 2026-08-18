-- ============================================================================
-- Migration 017: Comprehensive Production-Grade RLS & Granular Permissions
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Standardizes granular Row-Level Security (RLS) across all tables.
--              Replaces monolithic FOR ALL policies with explicit SELECT, INSERT, 
--              UPDATE, and DELETE policies per role (anon, authenticated).
-- ============================================================================

-- 1. Ensure RLS is active on all core tables
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

-- 2. Drop any existing legacy or conflicting policies safely
DO $$
BEGIN
    -- Reciters
    DROP POLICY IF EXISTS "Public read for published reciters" ON public.reciters;
    DROP POLICY IF EXISTS "Admin full access to reciters" ON public.reciters;
    DROP POLICY IF EXISTS "Admins can create reciters" ON public.reciters;
    DROP POLICY IF EXISTS "Admins can update reciters" ON public.reciters;
    DROP POLICY IF EXISTS "Admins can delete reciters" ON public.reciters;

    -- Recitations
    DROP POLICY IF EXISTS "Public read for approved recitations" ON public.recitations;
    DROP POLICY IF EXISTS "Admin full access to recitations" ON public.recitations;
    DROP POLICY IF EXISTS "Admins can insert recitations" ON public.recitations;
    DROP POLICY IF EXISTS "Admins can update recitations" ON public.recitations;
    DROP POLICY IF EXISTS "Admins can delete recitations" ON public.recitations;

    -- Announcements
    DROP POLICY IF EXISTS "Public read for published announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admin full access to announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

    -- Competitions
    DROP POLICY IF EXISTS "Public read for published competitions" ON public.competitions;
    DROP POLICY IF EXISTS "Admin full access to competitions" ON public.competitions;
    DROP POLICY IF EXISTS "Admins can insert competitions" ON public.competitions;
    DROP POLICY IF EXISTS "Admins can update competitions" ON public.competitions;
    DROP POLICY IF EXISTS "Admins can delete competitions" ON public.competitions;

    -- Reward Definitions
    DROP POLICY IF EXISTS "Public read for active rewards" ON public.reward_definitions;
    DROP POLICY IF EXISTS "Admin full access to reward definitions" ON public.reward_definitions;
    DROP POLICY IF EXISTS "Admins can insert reward definitions" ON public.reward_definitions;
    DROP POLICY IF EXISTS "Admins can update reward definitions" ON public.reward_definitions;
    DROP POLICY IF EXISTS "Admins can delete reward definitions" ON public.reward_definitions;

    -- Reciter Honors
    DROP POLICY IF EXISTS "Public read for reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "Admin full access to reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "Admins can insert reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "Admins can update reciter honors" ON public.reciter_honors;
    DROP POLICY IF EXISTS "Admins can delete reciter honors" ON public.reciter_honors;

    -- Featured Reciters
    DROP POLICY IF EXISTS "Public read for active featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "Admin full access to featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "Admins can insert featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "Admins can update featured reciters" ON public.featured_reciters;
    DROP POLICY IF EXISTS "Admins can delete featured reciters" ON public.featured_reciters;

    -- Submissions
    DROP POLICY IF EXISTS "Public anonymous insert for submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can view and manage all submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can select submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can update submissions" ON public.recitation_submissions;
    DROP POLICY IF EXISTS "Admins can delete submissions" ON public.recitation_submissions;

    -- Admin profiles
    DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;
    DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
END $$;

-- ============================================================================
-- 3. RECITERS POLICIES (Granular)
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
-- 4. RECITATIONS POLICIES (Granular)
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
-- 5. ANNOUNCEMENTS POLICIES (Granular)
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
-- 6. COMPETITIONS POLICIES (Granular)
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
-- 7. REWARD DEFINITIONS POLICIES (Granular)
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
-- 8. RECITER HONORS POLICIES (Granular)
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
-- 9. FEATURED RECITERS POLICIES (Granular)
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
-- 10. RECITATION SUBMISSIONS POLICIES (Granular)
-- ============================================================================
CREATE POLICY "submissions_insert_policy"
    ON public.recitation_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'PENDING');

CREATE POLICY "submissions_select_policy"
    ON public.recitation_submissions FOR SELECT
    TO authenticated
    USING (is_admin() OR (auth.uid() IS NOT NULL AND auth.uid() = submitter_user_id));

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
-- 11. ADMIN PROFILES POLICIES (Granular)
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
-- 12. EXPLICIT GRANTS FOR ROLES
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

GRANT INSERT, DELETE ON public.likes TO anon, authenticated;
GRANT INSERT ON public.listen_events TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
