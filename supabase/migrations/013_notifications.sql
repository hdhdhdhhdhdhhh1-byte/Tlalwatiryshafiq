-- ============================================================================
-- Migration 013: Notifications Architecture
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Supports admin submission alerts and future broadcast notifications.
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
    'NEW_SUBMISSION_RECEIVED',
    'SUBMISSION_APPROVED',
    'SUBMISSION_REJECTED',
    'FEATURED_RECITER_SPOTLIGHT',
    'NEW_ANNOUNCEMENT',
    'COMPETITION_ANNOUNCEMENT'
);

-- Admin email/in-app alert queue (processed by Edge Functions/webhook)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_email BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Broadcast notification events for public users
CREATE TABLE IF NOT EXISTS broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_route TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically enqueue an admin alert whenever a new submission is inserted
CREATE OR REPLACE FUNCTION notify_admin_on_new_submission()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_notifications (
        notification_type,
        title,
        content,
        reference_id
    ) VALUES (
        'NEW_SUBMISSION_RECEIVED',
        'تلاوة جديدة قيد المراجعة: سورة ' || NEW.surah_name,
        'قام القارئ (' || COALESCE(NEW.pseudonym, NEW.display_name) || ') بتقديم تلاوة جديدة من ' || NEW.country || ' برواية ' || NEW.riwayah,
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER trg_submission_admin_notify
    AFTER INSERT ON recitation_submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_submission();
