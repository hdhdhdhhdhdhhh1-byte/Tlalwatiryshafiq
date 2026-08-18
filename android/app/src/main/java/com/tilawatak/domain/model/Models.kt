package com.tilawatak.domain.model

/**
 * Domain entity representing a Quranic reciter.
 * Privacy rule: If usePseudonym is true, the public display uses pseudonym.
 */
data class Reciter(
    val id: String,
    val displayName: String,
    val pseudonym: String? = null,
    val usePseudonym: Boolean = false,
    val gender: Gender = Gender.MALE,
    val country: String,
    val bio: String,
    val avatarUrl: String,
    val verified: Boolean = false,
    val isStaffPick: Boolean = false,
    val isPublished: Boolean = true,
    val createdAtEpochMs: Long = System.currentTimeMillis(),
    val stats: ReciterStats = ReciterStats()
) {
    /**
     * The public-facing name for this reciter respecting pseudonym choices.
     */
    val publicName: String
        get() = if (usePseudonym && !pseudonym.isNullOrBlank()) pseudonym else displayName
}

data class ReciterStats(
    val totalRecitations: Int = 0,
    val totalListens: Long = 0,
    val totalLikes: Long = 0
)

/**
 * Domain entity representing an approved audio recitation.
 */
data class Recitation(
    val id: String,
    val reciterId: String,
    val reciterName: String,
    val reciterAvatar: String,
    val reciterCountry: String,
    val surahNumber: Int,
    val surahNameArabic: String,
    val ayahRange: String = "كاملة",
    val ayahStart: Int = 1,
    val ayahEnd: Int = 1,
    val riwayah: String = "حفص عن عاصم",
    val durationSeconds: Long,
    val audioUrl: String,
    val audioStoragePath: String = "",
    val externalAudioUrl: String? = null,
    val coverUrl: String? = null,
    val description: String = "",
    val status: SubmissionStatus = SubmissionStatus.APPROVED,
    val publishedAtEpochMs: Long = System.currentTimeMillis(),
    val listenCount: Long = 0,
    val likeCount: Long = 0,
    val isLiked: Boolean = false,
    val isStaffPick: Boolean = false
)

/**
 * A verified listening event dispatched after meaningful listen duration.
 */
data class ListenEvent(
    val recitationId: String,
    val anonymousInstallationId: String = "",
    val reciterId: String? = null,
    val durationSeconds: Long = 0,
    val timestampEpochMs: Long = System.currentTimeMillis(),
    val completed: Boolean = false
)

data class LikeResult(
    val isLiked: Boolean,
    val totalLikes: Long
)

enum class Gender {
    MALE,
    FEMALE
}

enum class SubmissionStatus {
    PENDING,
    APPROVED,
    REJECTED
}

/**
 * Public recitation submission by an applicant.
 * Default status is always PENDING until reviewed by the administrator.
 */
data class RecitationSubmission(
    val id: String,
    val displayName: String,
    val pseudonym: String? = null,
    val usePseudonym: Boolean = false,
    val gender: Gender = Gender.MALE,
    val country: String,
    val surahNumber: Int,
    val surahName: String,
    val ayahRange: String,
    val ayahStart: Int = 1,
    val ayahEnd: Int = 1,
    val riwayah: String,
    val description: String,
    val audioUri: String,
    val audioStoragePath: String = "",
    val externalAudioUrl: String? = null,
    val audioDurationSeconds: Long,
    val status: SubmissionStatus = SubmissionStatus.PENDING,
    val adminNotes: String? = null,
    val submittedAtEpochMs: Long = System.currentTimeMillis(),
    val reviewedAtEpochMs: Long? = null,
    val reviewedBy: String? = null
)

/**
 * Official platform announcement.
 */
data class Announcement(
    val id: String,
    val title: String,
    val body: String,
    val imagePath: String? = null,
    val isPublished: Boolean = true,
    val publishedAtEpochMs: Long = System.currentTimeMillis()
)

/**
 * Quranic recitation competition or challenge.
 */
data class Competition(
    val id: String,
    val title: String,
    val description: String,
    val imagePath: String? = null,
    val startAtEpochMs: Long,
    val endAtEpochMs: Long,
    val isPublished: Boolean = true
)

/**
 * Conceptual non-financial reward/badge/achievement definition.
 */
data class RewardDefinition(
    val id: String,
    val code: String,
    val title: String,
    val description: String,
    val iconPath: String? = null,
    val category: String = "EDITORIAL_HONOR"
)

data class ReciterHonor(
    val id: String,
    val reciterId: String,
    val reward: RewardDefinition,
    val awardedAtEpochMs: Long = System.currentTimeMillis(),
    val citationNote: String? = null
)

/**
 * Administrator models for future web admin management.
 */
enum class AdminRole {
    SUPER_ADMIN,
    CONTENT_REVIEWER,
    AUDITOR
}

data class AdminProfile(
    val id: String,
    val email: String,
    val fullName: String,
    val role: AdminRole = AdminRole.CONTENT_REVIEWER,
    val isActive: Boolean = true
)

data class AdminNotification(
    val id: String,
    val type: String,
    val title: String,
    val content: String,
    val referenceId: String? = null,
    val isRead: Boolean = false,
    val createdAtEpochMs: Long = System.currentTimeMillis()
)
