-- ============================================================================
-- Migration 009: Featured Reciters & Editorial Selections
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Supports manual admin curation for "اختيار الإدارة" and editorial spotlights.
-- ============================================================================

CREATE TABLE IF NOT EXISTS featured_reciters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reciter_id UUID NOT NULL REFERENCES reciters(id) ON DELETE CASCADE,
    badge_title TEXT DEFAULT 'اختيار الإدارة',
    display_order INTEGER NOT NULL DEFAULT 0,
    featured_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_featured_reciter UNIQUE (reciter_id)
);

CREATE TRIGGER trg_featured_reciters_updated_at
    BEFORE UPDATE ON featured_reciters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get admin curated featured reciters
CREATE OR REPLACE FUNCTION get_admin_featured_reciters(limit_count INT DEFAULT 10)
RETURNS SETOF reciter_statistics_view AS $$
    SELECT rsv.*
    FROM reciter_statistics_view rsv
    JOIN featured_reciters fr ON rsv.reciter_id = fr.reciter_id
    WHERE fr.is_active = TRUE AND rsv.is_published = TRUE
    ORDER BY fr.display_order ASC, rsv.total_listens DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;
