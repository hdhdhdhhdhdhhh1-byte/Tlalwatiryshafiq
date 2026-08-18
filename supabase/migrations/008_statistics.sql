-- ============================================================================
-- Migration 008: Statistics Views & Ranking Queries
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Provides aggregated metrics and pre-sorted views.
-- Rule: The mobile UI requests rankings from these views/functions without
--       hardcoding ranking logic inside client Compose code.
-- ============================================================================

-- Materialized or standard aggregated view for recitation metrics
CREATE OR REPLACE VIEW recitation_statistics_view AS
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
    COALESCE(COUNT(DISTINCT le.id), 0) AS total_listens
FROM recitations r
LEFT JOIN likes l ON r.id = l.recitation_id
LEFT JOIN listen_events le ON r.id = le.recitation_id
WHERE r.status = 'APPROVED'
GROUP BY r.id, r.reciter_id, r.surah_name, r.surah_number, r.ayah_start, r.ayah_end,
         r.riwayah, r.duration_seconds, r.audio_storage_path, r.external_audio_url,
         r.cover_image_path, r.status, r.is_staff_pick, r.published_at;

-- Reciter aggregate stats view
CREATE OR REPLACE VIEW reciter_statistics_view AS
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
    COALESCE(COUNT(DISTINCT le.id), 0) AS total_listens
FROM reciters rc
LEFT JOIN recitations r ON rc.id = r.reciter_id AND r.status = 'APPROVED'
LEFT JOIN likes l ON r.id = l.recitation_id
LEFT JOIN listen_events le ON r.id = le.recitation_id
WHERE rc.is_published = TRUE
GROUP BY rc.id, rc.display_name, rc.pseudonym, rc.use_pseudonym, rc.gender,
         rc.country, rc.bio, rc.profile_image_path, rc.is_verified, rc.is_featured,
         rc.is_published, rc.created_at;

-- Stored functions for ranked feeds
CREATE OR REPLACE FUNCTION get_most_listened_recitations(limit_count INT DEFAULT 10)
RETURNS SETOF recitation_statistics_view AS $$
    SELECT *
    FROM recitation_statistics_view
    ORDER BY total_listens DESC, published_at DESC NULLS LAST
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_most_liked_recitations(limit_count INT DEFAULT 10)
RETURNS SETOF recitation_statistics_view AS $$
    SELECT *
    FROM recitation_statistics_view
    ORDER BY total_likes DESC, published_at DESC NULLS LAST
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_most_listened_reciters(limit_count INT DEFAULT 10)
RETURNS SETOF reciter_statistics_view AS $$
    SELECT *
    FROM reciter_statistics_view
    ORDER BY total_listens DESC, total_recitations DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_most_liked_reciters(limit_count INT DEFAULT 10)
RETURNS SETOF reciter_statistics_view AS $$
    SELECT *
    FROM reciter_statistics_view
    ORDER BY total_likes DESC, total_recitations DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_newest_recitations(limit_count INT DEFAULT 10)
RETURNS SETOF recitation_statistics_view AS $$
    SELECT *
    FROM recitation_statistics_view
    ORDER BY published_at DESC NULLS LAST, recitation_id DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_newest_reciters(limit_count INT DEFAULT 10)
RETURNS SETOF reciter_statistics_view AS $$
    SELECT *
    FROM reciter_statistics_view
    ORDER BY created_at DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;
