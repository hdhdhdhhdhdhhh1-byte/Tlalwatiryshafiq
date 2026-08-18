-- ============================================================================
-- Migration 006: Likes Table & Anonymous Interaction Function
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Records unique likes per anonymous installation.
-- Constraint: Unique index on (recitation_id, anonymous_installation_id) prevents duplicates.
-- ============================================================================

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recitation_id UUID NOT NULL REFERENCES recitations(id) ON DELETE CASCADE,
    anonymous_installation_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_recitation_installation_like UNIQUE (recitation_id, anonymous_installation_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_recitation_id ON likes (recitation_id);
CREATE INDEX IF NOT EXISTS idx_likes_installation ON likes (anonymous_installation_id);

-- Atomic RPC function to toggle like state and return updated count
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
