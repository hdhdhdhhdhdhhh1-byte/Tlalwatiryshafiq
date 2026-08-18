-- ============================================================================
-- Migration 015: Row Level Security (RLS) Policies
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Enforces strict data access rules.
-- Rule: Public users can read approved/published data and insert submissions/likes.
--       Admins maintain full control over verification, editing, and publishing.
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE listen_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reciter_honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Admin Profiles Policies
CREATE POLICY "Admins can view all admin profiles"
    ON admin_profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Super admins can manage admin profiles"
    ON admin_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN' AND is_active = TRUE
        )
    );

-- 3. Reciters Policies
CREATE POLICY "Public read for published reciters"
    ON reciters FOR SELECT
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "Admin full access to reciters"
    ON reciters FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 4. Recitations Policies
CREATE POLICY "Public read for approved recitations"
    ON recitations FOR SELECT
    USING (status = 'APPROVED' OR is_admin());

CREATE POLICY "Admin full access to recitations"
    ON recitations FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 5. Submissions Policies
CREATE POLICY "Public anonymous insert for submissions"
    ON recitation_submissions FOR INSERT
    WITH CHECK (status = 'PENDING');

CREATE POLICY "Admins can view and manage all submissions"
    ON recitation_submissions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 6. Likes Policies
CREATE POLICY "Public read for likes"
    ON likes FOR SELECT
    USING (TRUE);

CREATE POLICY "Public anonymous insert for likes"
    ON likes FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public anonymous delete own likes"
    ON likes FOR DELETE
    USING (TRUE);

-- 7. Listen Events Policies
CREATE POLICY "Public anonymous insert for listen events"
    ON listen_events FOR INSERT
    WITH CHECK (listened_seconds >= 0);

CREATE POLICY "Admins can view raw listen events"
    ON listen_events FOR SELECT
    USING (is_admin());

-- 8. Featured Reciters Policies
CREATE POLICY "Public read for active featured reciters"
    ON featured_reciters FOR SELECT
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin full access to featured reciters"
    ON featured_reciters FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 9. Announcements Policies
CREATE POLICY "Public read for published announcements"
    ON announcements FOR SELECT
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "Admin full access to announcements"
    ON announcements FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 10. Competitions Policies
CREATE POLICY "Public read for published competitions"
    ON competitions FOR SELECT
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "Admin full access to competitions"
    ON competitions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 11. Rewards & Honors Policies
CREATE POLICY "Public read for active rewards"
    ON reward_definitions FOR SELECT
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin full access to reward definitions"
    ON reward_definitions FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Public read for reciter honors"
    ON reciter_honors FOR SELECT
    USING (TRUE);

CREATE POLICY "Admin full access to reciter honors"
    ON reciter_honors FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 12. Admin Notifications Policies
CREATE POLICY "Admins can view and update admin alerts"
    ON admin_notifications FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 13. Broadcast Notifications Policies
CREATE POLICY "Public read for broadcast notifications"
    ON broadcast_notifications FOR SELECT
    USING (TRUE);

CREATE POLICY "Admin full access to broadcast notifications"
    ON broadcast_notifications FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
