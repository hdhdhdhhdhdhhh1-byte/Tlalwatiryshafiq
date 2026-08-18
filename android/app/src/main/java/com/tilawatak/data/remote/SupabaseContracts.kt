package com.tilawatak.data.remote

/**
 * Future Supabase Data Transfer Objects (DTOs) and RPC contracts.
 * Prepared for future live connection in Phase 5.
 */
object SupabaseContracts {
    const val TABLE_ADMIN_PROFILES = "admin_profiles"
    const val TABLE_RECITERS = "reciters"
    const val TABLE_RECITATIONS = "recitations"
    const val TABLE_SUBMISSIONS = "recitation_submissions"
    const val TABLE_LIKES = "likes"
    const val TABLE_LISTEN_EVENTS = "listen_events"
    const val TABLE_ANNOUNCEMENTS = "announcements"
    const val TABLE_COMPETITIONS = "competitions"
    const val TABLE_REWARD_DEFINITIONS = "reward_definitions"
    const val TABLE_RECITER_HONORS = "reciter_honors"

    const val VIEW_PUBLIC_RECITERS = "public_reciters_view"
    const val VIEW_PUBLIC_RECITATIONS = "public_recitations_view"
    const val VIEW_RECITATION_STATS = "recitation_statistics_view"
    const val VIEW_RECITER_STATS = "reciter_statistics_view"

    const val RPC_TOGGLE_LIKE = "toggle_recitation_like"
    const val RPC_RECORD_LISTEN = "record_listen_event"
    const val RPC_SEARCH_RECITERS = "search_public_reciters"

    const val BUCKET_PROFILE_IMAGES = "profile-images"
    const val BUCKET_RECITATION_AUDIO = "recitation-audio"
    const val BUCKET_RECITATION_COVERS = "recitation-covers"
    const val BUCKET_SUBMISSION_AUDIO = "submission-audio"
    const val BUCKET_SUBMISSION_IMAGES = "submission-images"
}
