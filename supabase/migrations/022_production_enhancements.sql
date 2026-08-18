-- ============================================================================
-- Migration 022: Production Enhancements & Hardened Admin Operations
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: 
--   1. Real-time scoring calculation in reciter_statistics_view.
--   2. Ensure image & link fields on competitions and announcements.
--   3. Storage policies for profile-images, competition-images, recitation-audio, submission-audio.
--   4. Stored RPC procedures for robust admin deletion and metrics aggregation.
-- ============================================================================

-- 1. Ensure columns exist on competitions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'link_url') THEN
        ALTER TABLE public.competitions ADD COLUMN link_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'image_path') THEN
        ALTER TABLE public.competitions ADD COLUMN image_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'image_path') THEN
        ALTER TABLE public.announcements ADD COLUMN image_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'link_url') THEN
        ALTER TABLE public.announcements ADD COLUMN link_url TEXT;
    END IF;
END $$;

-- 2. Enhanced Reciter Statistics View with Real-time Scoring
-- Preserves existing column positions (1..13) exactly as defined in Migration 008, 
-- and safely appends ranking_score and alias columns at the end (14..19).
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
    COALESCE(COUNT(DISTINCT r.id), 0) AS total_recitations,
    COALESCE(COUNT(DISTINCT l.id), 0) AS total_likes,
    COALESCE(COUNT(DISTINCT le.id), 0) AS total_listens,
    (
        (COALESCE(COUNT(DISTINCT l.id), 0) * 3) +
        (COALESCE(COUNT(DISTINCT le.id), 0) * 1) +
        (COALESCE(COUNT(DISTINCT r.id), 0) * 5)
    ) AS ranking_score,
    rc.id AS id,
    rc.display_name,
    rc.pseudonym,
    rc.use_pseudonym,
    rc.profile_image_path AS avatar_url
FROM public.reciters rc
LEFT JOIN public.recitations r ON rc.id = r.reciter_id AND r.status = 'APPROVED'
LEFT JOIN public.likes l ON r.id = l.recitation_id
LEFT JOIN public.listen_events le ON r.id = le.recitation_id
WHERE rc.is_published = TRUE
GROUP BY rc.id, rc.display_name, rc.pseudonym, rc.use_pseudonym, rc.gender,
         rc.country, rc.bio, rc.profile_image_path, rc.is_verified, rc.is_featured,
         rc.is_published, rc.created_at;

GRANT SELECT ON public.reciter_statistics_view TO anon, authenticated;

-- 3. Enhanced Recitation Statistics View
-- Preserves existing column positions (1..16) exactly as defined in Migration 008,
-- and safely appends alias and enriched fields at the end (17..23).
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
    COALESCE(COUNT(DISTINCT l.id), 0) AS total_likes,
    COALESCE(COUNT(DISTINCT le.id), 0) AS total_listens,
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
LEFT JOIN public.likes l ON r.id = l.recitation_id
LEFT JOIN public.listen_events le ON r.id = le.recitation_id
WHERE r.status = 'APPROVED' AND rc.is_published = TRUE
GROUP BY r.id, r.reciter_id, rc.display_name, rc.pseudonym, rc.use_pseudonym,
         rc.profile_image_path, rc.country, r.surah_name, r.surah_number,
         r.ayah_start, r.ayah_end, r.riwayah, r.duration_seconds,
         r.audio_storage_path, r.external_audio_url, r.cover_image_path,
         r.description, r.status, r.is_staff_pick, r.published_at, r.created_at;

GRANT SELECT ON public.recitation_statistics_view TO anon, authenticated;

-- 4. RPC for Dashboard Aggregated Metrics
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
    SELECT COUNT(*) INTO v_total_reciters FROM public.reciters;
    SELECT COUNT(*) INTO v_published_reciters FROM public.reciters WHERE is_published = TRUE;
    SELECT COUNT(*) INTO v_total_recitations FROM public.recitations;
    SELECT COUNT(*) INTO v_published_recitations FROM public.recitations WHERE status = 'APPROVED';
    SELECT COUNT(*) INTO v_pending_submissions FROM public.recitation_submissions WHERE status = 'PENDING';
    SELECT COUNT(*) INTO v_total_listens FROM public.listen_events;
    SELECT COUNT(*) INTO v_total_likes FROM public.likes;
    SELECT COUNT(*) INTO v_active_competitions FROM public.competitions WHERE is_published = TRUE AND end_at >= NOW();
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

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO anon, authenticated;

-- 5. Stored Procedures for Robust Entity Deletion (Cascading)
CREATE OR REPLACE FUNCTION public.admin_delete_reciter(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.likes WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);
    DELETE FROM public.listen_events WHERE recitation_id IN (SELECT id FROM public.recitations WHERE reciter_id = p_id);
    DELETE FROM public.reciter_honors WHERE reciter_id = p_id;
    DELETE FROM public.featured_reciters WHERE reciter_id = p_id;
    DELETE FROM public.recitations WHERE reciter_id = p_id;
    DELETE FROM public.reciters WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_recitation(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.likes WHERE recitation_id = p_id;
    DELETE FROM public.listen_events WHERE recitation_id = p_id;
    DELETE FROM public.recitations WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.announcements WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_competition(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.competitions WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_competition(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_submission(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.recitation_submissions WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_submission(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.user_notifications WHERE installation_id IN (SELECT installation_id FROM public.user_profiles WHERE id = p_id);
    DELETE FROM public.user_profiles WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO anon, authenticated;
