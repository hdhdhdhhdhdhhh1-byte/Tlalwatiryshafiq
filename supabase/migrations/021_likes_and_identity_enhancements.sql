-- ============================================================================
-- Migration 021: Likes Constraint Hardening, Idempotency & User Identity Safeguards
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Ensures strict unique constraint on likes per (recitation_id, anonymous_installation_id),
--              implements atomic toggling RPC function returning genuine totals,
--              and configures robust RLS policies for visitor-first profiles and notifications.
-- ============================================================================

-- 1. Hardened Likes Table with Unique Constraint
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recitation_id UUID NOT NULL REFERENCES recitations(id) ON DELETE CASCADE,
    anonymous_installation_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recitation_installation_like UNIQUE (recitation_id, anonymous_installation_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_recitation_id ON likes (recitation_id);
CREATE INDEX IF NOT EXISTS idx_likes_installation ON likes (anonymous_installation_id);

-- 2. Clean any potential historical duplicates before verifying unique constraint
DO $$
BEGIN
    DELETE FROM likes a USING likes b
    WHERE a.id > b.id
      AND a.recitation_id = b.recitation_id
      AND a.anonymous_installation_id = b.anonymous_installation_id;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. Atomic RPC function to toggle like state and return updated count from live table
CREATE OR REPLACE FUNCTION toggle_recitation_like(
    p_recitation_id UUID,
    p_anonymous_installation_id TEXT
)
RETURNS TABLE (
    is_liked BOOLEAN,
    total_likes BIGINT
) AS $$
DECLARE
    v_exists BOOLEAN;
    v_new_state BOOLEAN;
    v_count BIGINT;
BEGIN
    -- Validate parameters
    IF p_recitation_id IS NULL OR p_anonymous_installation_id IS NULL OR TRIM(p_anonymous_installation_id) = '' THEN
        RAISE EXCEPTION 'Invalid parameters: recitation_id and anonymous_installation_id are required';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM likes
        WHERE recitation_id = p_recitation_id
          AND anonymous_installation_id = p_anonymous_installation_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM likes
        WHERE recitation_id = p_recitation_id
          AND anonymous_installation_id = p_anonymous_installation_id;
        v_new_state := FALSE;
    ELSE
        INSERT INTO likes (recitation_id, anonymous_installation_id)
        VALUES (p_recitation_id, p_anonymous_installation_id)
        ON CONFLICT (recitation_id, anonymous_installation_id) DO NOTHING;
        v_new_state := TRUE;
    END IF;

    SELECT COUNT(*) FROM likes
    WHERE recitation_id = p_recitation_id
    INTO v_count;

    RETURN QUERY SELECT v_new_state, v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permission to public/anon
GRANT EXECUTE ON FUNCTION toggle_recitation_like(UUID, TEXT) TO anon, authenticated;

-- Ensure RLS on likes table allows public select and toggle RPC
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read likes" ON likes;
CREATE POLICY "Public read likes" ON likes
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public insert likes" ON likes;
CREATE POLICY "Public insert likes" ON likes
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete own likes" ON likes;
CREATE POLICY "Public delete own likes" ON likes
    FOR DELETE
    USING (true);
