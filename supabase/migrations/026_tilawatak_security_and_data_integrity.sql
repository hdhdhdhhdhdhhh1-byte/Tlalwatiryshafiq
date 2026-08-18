-- ============================================================================
-- Migration 026: Production Security Hardening, Strict View Compatibility & Data Integrity
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description:
--   1. Fully preserves legacy view column names, exact column order, and PostgreSQL 42P16 compatibility.
--   2. Calculates reciter ranking score strictly: (total_likes * 3) + (total_listens * 1) + (total_recitations * 5).
--   3. Eliminates Cartesian multiplication between likes and listen_events via isolated pre-aggregation subqueries.
--   4. Protects all sensitive administrative RPCs with internal is_admin() checks and revokes anon access.
--   5. Retains public guest access to visitor RPCs (submit_recitation_public, toggle_recitation_like, record_listen_event).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure Role Validation Functions Exist (Idempotent)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Enhanced Views Preserving 100% Column Order, Names & Types Compatibility
-- ----------------------------------------------------------------------------

-- 2.1. Reciter Statistics View
-- Exact legacy column order from Migration 008 + extensions from Migration 024:
-- 1. reciter_id, 2. public_name, 3. gender, 4. country, 5. bio, 6. profile_image_path,
-- 7. is_verified, 8. is_featured, 9. is_published, 10. created_at, 11. total_recitations,
-- 12. total_likes, 13. total_listens, 14. ranking_score, 15. id, 16. display_name,
-- 17. pseudonym, 18. use_pseudonym, 19. avatar_url.
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

-- 2.2. Recitation Statistics View
-- Exact legacy column order from Migration 008 + extensions from Migration 024:
-- 1. recitation_id, 2. reciter_id, 3. surah_name, 4. surah_number, 5. ayah_start,
-- 6. ayah_end, 7. riwayah, 8. duration_seconds, 9. audio_storage_path, 10. external_audio_url,
-- 11. cover_image_path, 12. status, 13. is_staff_pick, 14. published_at, 15. total_likes,
-- 16. total_listens, 17. id, 18. reciter_name, 19. reciter_avatar, 20. reciter_country,
-- 21. ayah_range, 22. description, 23. created_at.
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

GRANT SELECT ON public.reciter_statistics_view TO anon, authenticated;
GRANT SELECT ON public.recitation_statistics_view TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Secure Administrative Metrics RPC
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. Secure Cascade Deletion & Broadcast RPCs with Internal is_admin() Checks
-- ----------------------------------------------------------------------------

-- 4.1. Delete Reciter (Cascade cleanup)
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

-- 4.2. Delete Recitation (Cascade cleanup)
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

-- 4.3. Delete Competition
CREATE OR REPLACE FUNCTION public.admin_delete_competition(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.competitions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.4. Delete Announcement
CREATE OR REPLACE FUNCTION public.admin_delete_announcement(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.announcements WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.5. Delete Submission
CREATE OR REPLACE FUNCTION public.admin_delete_submission(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.recitation_submissions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.6. Delete User Profile and Associated Notifications
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

-- 4.7. Delete Admin In-App Notification
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privilege required.';
    END IF;

    DELETE FROM public.admin_notifications WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.8. Send Broadcast Notification to Users
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

    -- Also record in broadcast history if table exists
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

-- ----------------------------------------------------------------------------
-- 5. Revocation of Public Admin Execution & Strict Role Grants
-- ----------------------------------------------------------------------------

-- Revoke all permissions on admin functions from PUBLIC and anon
REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_reciter(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_recitation(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_competition(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_announcement(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_submission(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_notification(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

-- Grant EXECUTE on admin functions strictly to authenticated
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_reciter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_recitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_competition(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_announcement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_submission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_broadcast(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Public Visitor Functions: Ensure proper execution grants with verified signatures
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_recitation_public(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_recitation_like(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_listen_event(UUID, TEXT, INTEGER, BOOLEAN) TO anon, authenticated;
