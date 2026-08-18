-- ============================================================================
-- Migration 003: Reciters Table
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Core table for Quranic reciters.
-- Note: Real/private details are kept safe; public profiles use display_name/pseudonym.
-- ============================================================================

CREATE TABLE IF NOT EXISTS reciters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    pseudonym TEXT,
    use_pseudonym BOOLEAN NOT NULL DEFAULT FALSE,
    gender TEXT NOT NULL DEFAULT 'MALE' CHECK (gender IN ('MALE', 'FEMALE')),
    country TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    profile_image_path TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to maintain updated_at on record modifications
CREATE TRIGGER trg_reciters_updated_at
    BEFORE UPDATE ON reciters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Public Reciter View ensuring privacy rule: public name is pseudonym when use_pseudonym = true
CREATE OR REPLACE VIEW public_reciters_view AS
SELECT
    id,
    CASE
        WHEN use_pseudonym = TRUE AND pseudonym IS NOT NULL AND TRIM(pseudonym) <> '' THEN pseudonym
        ELSE display_name
    END AS public_name,
    gender,
    country,
    bio,
    profile_image_path,
    is_verified,
    is_featured,
    is_published,
    created_at,
    updated_at
FROM reciters
WHERE is_published = TRUE;
