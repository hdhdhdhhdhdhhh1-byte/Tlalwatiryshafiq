-- ============================================================================
-- Migration 016: Performance Indexes & Trigram Search Optimization
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Indexes for optimal query speed across lists, feeds, and Arabic search.
-- ============================================================================

-- Indexes on reciters
CREATE INDEX IF NOT EXISTS idx_reciters_published ON reciters (is_published);
CREATE INDEX IF NOT EXISTS idx_reciters_featured ON reciters (is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_reciters_created_at ON reciters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reciters_country ON reciters (country);
CREATE INDEX IF NOT EXISTS idx_reciters_name_trgm ON reciters USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_reciters_pseudonym_trgm ON reciters USING gin (pseudonym gin_trgm_ops);

-- Indexes on recitations
CREATE INDEX IF NOT EXISTS idx_recitations_reciter_id ON recitations (reciter_id);
CREATE INDEX IF NOT EXISTS idx_recitations_status_published ON recitations (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_recitations_surah_number ON recitations (surah_number);
CREATE INDEX IF NOT EXISTS idx_recitations_riwayah ON recitations (riwayah);
CREATE INDEX IF NOT EXISTS idx_recitations_staff_pick ON recitations (is_staff_pick) WHERE is_staff_pick = TRUE;

-- Indexes on submissions
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON recitation_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_surah ON recitation_submissions (surah_number);

-- Indexes on featured_reciters
CREATE INDEX IF NOT EXISTS idx_featured_reciters_active_order ON featured_reciters (is_active, display_order ASC);

-- Full-text / Trigram search function for fast Arabic searching
CREATE OR REPLACE FUNCTION search_public_reciters(search_term TEXT)
RETURNS SETOF reciter_statistics_view AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM reciter_statistics_view
    WHERE search_term IS NULL
       OR search_term = ''
       OR public_name ILIKE '%' || search_term || '%'
       OR country ILIKE '%' || search_term || '%'
       OR bio ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public, pg_temp;
