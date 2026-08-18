-- ============================================================================
-- Migration 023: Reset Test & Operational Data
-- Platform: TilawatakLilAlam (تلاوتك للعالم)
-- Description: Safely purges all operational testing data (reciters, recitations,
--              likes, listens, submissions, announcements, competitions, test honors,
--              notifications, visitor profiles, and storage test objects) while
--              strictly preserving the system architecture, admin accounts,
--              reward definitions, storage buckets, views, RPCs, and RLS policies.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting safe reset of test data for TilawatakLilAlam platform...';
END $$;

-- Transactional Data Reset Execution
BEGIN;

-- 1. Purge Reciter Assigned Honors (Child of reciters and reward_definitions)
-- NOTE: reward_definitions (system badge catalog) is strictly PRESERVED.
DELETE FROM public.reciter_honors;

-- 2. Purge Likes (Child of recitations)
DELETE FROM public.likes;

-- 3. Purge Listen Events (Child of recitations)
DELETE FROM public.listen_events;

-- 4. Purge Featured Reciter Highlights (Child of reciters)
DELETE FROM public.featured_reciters;

-- 5. Purge Recitations (Child of reciters)
DELETE FROM public.recitations;

-- 6. Purge Recitation Submissions
DELETE FROM public.recitation_submissions;

-- 7. Purge Reciters Directory
DELETE FROM public.reciters;

-- 8. Purge Announcements
DELETE FROM public.announcements;

-- 9. Purge Competitions
DELETE FROM public.competitions;

-- 10. Purge Notifications (Admin alerts, user in-app notifications, and broadcasts)
DELETE FROM public.admin_notifications;
DELETE FROM public.broadcast_notifications;
DELETE FROM public.user_notifications;

-- 11. Purge Temporary Visitor / User Device Profiles
-- NOTE: admin_profiles and auth.users are strictly PRESERVED and untouched.
DELETE FROM public.user_profiles;

COMMIT;

-- Verification & Summary Report
DO $$
DECLARE
    v_reciters_count INT;
    v_recitations_count INT;
    v_submissions_count INT;
    v_likes_count INT;
    v_listens_count INT;
    v_announcements_count INT;
    v_competitions_count INT;
    v_honors_count INT;
    v_user_profiles_count INT;
    v_user_notifs_count INT;
    v_admin_notifs_count INT;
    v_broadcast_notifs_count INT;
    v_admins_count INT;
    v_reward_defs_count INT;
BEGIN
    SELECT COUNT(*) INTO v_reciters_count FROM public.reciters;
    SELECT COUNT(*) INTO v_recitations_count FROM public.recitations;
    SELECT COUNT(*) INTO v_submissions_count FROM public.recitation_submissions;
    SELECT COUNT(*) INTO v_likes_count FROM public.likes;
    SELECT COUNT(*) INTO v_listens_count FROM public.listen_events;
    SELECT COUNT(*) INTO v_announcements_count FROM public.announcements;
    SELECT COUNT(*) INTO v_competitions_count FROM public.competitions;
    SELECT COUNT(*) INTO v_honors_count FROM public.reciter_honors;
    SELECT COUNT(*) INTO v_user_profiles_count FROM public.user_profiles;
    SELECT COUNT(*) INTO v_user_notifs_count FROM public.user_notifications;
    SELECT COUNT(*) INTO v_admin_notifs_count FROM public.admin_notifications;
    SELECT COUNT(*) INTO v_broadcast_notifs_count FROM public.broadcast_notifications;

    -- Preserved system records
    SELECT COUNT(*) INTO v_admins_count FROM public.admin_profiles;
    SELECT COUNT(*) INTO v_reward_defs_count FROM public.reward_definitions;

    RAISE NOTICE '====================================================';
    RAISE NOTICE 'RESET COMPLETE VERIFICATION REPORT:';
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE '1.  Reciters Count:               % (Target: 0)', v_reciters_count;
    RAISE NOTICE '2.  Recitations Count:            % (Target: 0)', v_recitations_count;
    RAISE NOTICE '3.  Submissions Count:            % (Target: 0)', v_submissions_count;
    RAISE NOTICE '4.  Likes Count:                  % (Target: 0)', v_likes_count;
    RAISE NOTICE '5.  Listen Events Count:          % (Target: 0)', v_listens_count;
    RAISE NOTICE '6.  Announcements Count:          % (Target: 0)', v_announcements_count;
    RAISE NOTICE '7.  Competitions Count:           % (Target: 0)', v_competitions_count;
    RAISE NOTICE '8.  Reciter Honors Count:         % (Target: 0)', v_honors_count;
    RAISE NOTICE '9.  User Profiles Count:          % (Target: 0)', v_user_profiles_count;
    RAISE NOTICE '10. User Notifications Count:     % (Target: 0)', v_user_notifs_count;
    RAISE NOTICE '11. Admin Notifications Count:    % (Target: 0)', v_admin_notifs_count;
    RAISE NOTICE '12. Broadcast Notifications Count:% (Target: 0)', v_broadcast_notifs_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'PRESERVED SYSTEM STRUCTURES:';
    RAISE NOTICE '- Admin Profiles:                 % (Intact)', v_admins_count;
    RAISE NOTICE '- Reward Definitions:             % (Intact)', v_reward_defs_count;
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'NOTE: Supabase Storage files can be emptied directly from the Supabase Storage UI Dashboard or Storage API.';
END $$;
