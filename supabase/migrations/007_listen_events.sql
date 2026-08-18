-- ============================================================================
-- Migration 007: Listen Events Table
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Records verified listening sessions.
-- Note: Listens are only recorded after a meaningful duration threshold.
-- ============================================================================

CREATE TABLE IF NOT EXISTS listen_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recitation_id UUID NOT NULL REFERENCES recitations(id) ON DELETE CASCADE,
    anonymous_installation_id TEXT NOT NULL,
    listened_seconds INTEGER NOT NULL DEFAULT 0 CHECK (listened_seconds >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listen_events_recitation_id ON listen_events (recitation_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_installation ON listen_events (anonymous_installation_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_created_at ON listen_events (created_at DESC);

-- RPC function to record a valid listening event
CREATE OR REPLACE FUNCTION record_listen_event(
    p_recitation_id UUID,
    p_anonymous_installation_id TEXT,
    p_listened_seconds INTEGER,
    p_completed BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    -- Validate parameters
    IF p_recitation_id IS NULL OR p_anonymous_installation_id IS NULL OR TRIM(p_anonymous_installation_id) = '' THEN
        RETURN;
    END IF;

    -- Only persist meaningful listening durations (e.g., at least 5 seconds or completion)
    IF p_listened_seconds >= 5 OR p_completed = TRUE THEN
        INSERT INTO listen_events (
            recitation_id,
            anonymous_installation_id,
            listened_seconds,
            completed
        ) VALUES (
            p_recitation_id,
            p_anonymous_installation_id,
            GREATEST(COALESCE(p_listened_seconds, 0), 0),
            COALESCE(p_completed, FALSE)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
