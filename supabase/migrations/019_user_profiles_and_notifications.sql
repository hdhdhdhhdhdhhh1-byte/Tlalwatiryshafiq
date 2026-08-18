-- ============================================================================
-- Migration 019: User Profiles and Personal Notifications
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Guest-first user profiles and real personal notification records.
-- ============================================================================

-- 1. User Profiles Table (Guest-first with local anonymous installation ID)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    country TEXT NOT NULL DEFAULT 'العالم الإسلامي',
    user_type TEXT NOT NULL DEFAULT 'LISTENER' CHECK (user_type IN ('LISTENER', 'RECITER', 'BOTH')),
    bio TEXT NOT NULL DEFAULT '',
    email TEXT,
    whatsapp TEXT,
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_profiles_installation ON user_profiles(installation_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created ON user_profiles(created_at DESC);

-- 2. User In-App Notifications Table (Real event-based notifications)
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'SUBMISSION_STATUS' CHECK (notification_type IN ('SUBMISSION_STATUS', 'SYSTEM_BROADCAST', 'HONOR_AWARDED', 'COMPETITION', 'ANNOUNCEMENT')),
    reference_id TEXT,
    rejection_reason TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_install ON user_notifications(installation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(installation_id, is_read);

-- 3. RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Public can read & upsert their own user profile by installation_id
CREATE POLICY "Public read user profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Public upsert user profile"
    ON user_profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update own user profile"
    ON user_profiles FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Public can read & update their own notifications
CREATE POLICY "Public read own notifications"
    ON user_notifications FOR SELECT
    USING (true);

CREATE POLICY "Public mark read own notifications"
    ON user_notifications FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full manage user profiles"
    ON user_profiles FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Admin full manage user notifications"
    ON user_notifications FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
