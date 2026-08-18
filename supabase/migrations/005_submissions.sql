-- ============================================================================
-- Migration 005: Recitation Submissions Table
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Ingests public recitation proposals from users for editorial review.
-- Rule: Submissions start in PENDING state; public users can NEVER self-approve.
-- ============================================================================

CREATE TABLE IF NOT EXISTS recitation_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    pseudonym TEXT,
    use_pseudonym BOOLEAN NOT NULL DEFAULT FALSE,
    gender TEXT NOT NULL DEFAULT 'MALE' CHECK (gender IN ('MALE', 'FEMALE')),
    country TEXT NOT NULL,
    profile_image_path TEXT,
    surah_name TEXT NOT NULL,
    surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
    ayah_start INTEGER NOT NULL DEFAULT 1,
    ayah_end INTEGER NOT NULL DEFAULT 1,
    riwayah TEXT NOT NULL DEFAULT 'حفص عن عاصم',
    description TEXT NOT NULL DEFAULT '',
    audio_storage_path TEXT NOT NULL,
    external_audio_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL
);

-- Protect against non-admin status changes
CREATE OR REPLACE FUNCTION enforce_submission_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Public users can only insert with status 'PENDING'
    IF auth.uid() IS NULL OR NOT is_admin() THEN
        NEW.status := 'PENDING';
        NEW.reviewed_at := NULL;
        NEW.reviewed_by := NULL;
        NEW.admin_notes := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER trg_submissions_enforce_pending
    BEFORE INSERT ON recitation_submissions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_submission_pending_on_insert();
