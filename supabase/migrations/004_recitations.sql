-- ============================================================================
-- Migration 004: Recitations Table
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Stores audio recordings of Quranic recitations.
-- Relationship: Reciters (1) -> Recitations (N)
-- Note: Only APPROVED recitations are publicly visible to users.
-- ============================================================================

CREATE TABLE IF NOT EXISTS recitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reciter_id UUID NOT NULL REFERENCES reciters(id) ON DELETE CASCADE,
    surah_name TEXT NOT NULL,
    surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
    ayah_start INTEGER NOT NULL DEFAULT 1,
    ayah_end INTEGER NOT NULL DEFAULT 1,
    riwayah TEXT NOT NULL DEFAULT 'حفص عن عاصم',
    duration_seconds BIGINT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    audio_storage_path TEXT NOT NULL,
    external_audio_url TEXT,
    cover_image_path TEXT,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    is_staff_pick BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain updated_at
CREATE TRIGGER trg_recitations_updated_at
    BEFORE UPDATE ON recitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for publicly approved recitations joined with reciter public details
CREATE OR REPLACE VIEW public_recitations_view AS
SELECT
    r.id,
    r.reciter_id,
    CASE
        WHEN rc.use_pseudonym = TRUE AND rc.pseudonym IS NOT NULL AND TRIM(rc.pseudonym) <> '' THEN rc.pseudonym
        ELSE rc.display_name
    END AS reciter_name,
    rc.profile_image_path AS reciter_avatar,
    rc.country AS reciter_country,
    r.surah_name,
    r.surah_number,
    r.ayah_start,
    r.ayah_end,
    CASE
        WHEN r.ayah_start = 1 AND (
            (r.surah_number = 1 AND r.ayah_end = 7) OR
            (r.surah_number = 108 AND r.ayah_end = 3) OR
            (r.ayah_end <= r.ayah_start)
        ) THEN 'كاملة'
        ELSE 'الآيات ' || r.ayah_start || ' - ' || r.ayah_end
    END AS ayah_range,
    r.riwayah,
    r.duration_seconds,
    r.audio_storage_path,
    r.external_audio_url,
    r.cover_image_path,
    r.description,
    r.status,
    r.is_staff_pick,
    r.published_at,
    r.created_at
FROM recitations r
JOIN reciters rc ON r.reciter_id = rc.id
WHERE r.status = 'APPROVED' AND rc.is_published = TRUE;
