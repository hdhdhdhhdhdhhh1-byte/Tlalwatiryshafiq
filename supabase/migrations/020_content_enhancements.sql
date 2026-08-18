-- ============================================================================
-- Migration 020: Announcements and Competitions Display Enhancements
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Adds display_order, is_featured, and custom link fields.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'display_order') THEN
        ALTER TABLE announcements ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_featured') THEN
        ALTER TABLE announcements ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'link_url') THEN
        ALTER TABLE announcements ADD COLUMN link_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'display_order') THEN
        ALTER TABLE competitions ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'is_featured') THEN
        ALTER TABLE competitions ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'rules') THEN
        ALTER TABLE competitions ADD COLUMN rules TEXT NOT NULL DEFAULT '';
    END IF;
END $$;
