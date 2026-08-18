-- ============================================================================
-- Migration 012: Badges, Milestones & Non-Monetary Honors
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Non-financial achievements, Quranic milestones, and honorary badges.
-- STRICT RULE: No monetary balances, financial rewards, or payment constructs.
-- ============================================================================

CREATE TYPE honor_category AS ENUM ('TAJWEED_EXCELLENCE', 'COMMUNITY_FAVORITE', 'MILESTONE_COMPLETION', 'EDITORIAL_HONOR');

CREATE TABLE IF NOT EXISTS reward_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category honor_category NOT NULL DEFAULT 'EDITORIAL_HONOR',
    badge_icon_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reciter assigned honors and badges
CREATE TABLE IF NOT EXISTS reciter_honors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reciter_id UUID NOT NULL REFERENCES reciters(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES reward_definitions(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    awarded_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
    citation_note TEXT,
    CONSTRAINT uq_reciter_reward UNIQUE (reciter_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_reciter_honors_reciter ON reciter_honors(reciter_id);
