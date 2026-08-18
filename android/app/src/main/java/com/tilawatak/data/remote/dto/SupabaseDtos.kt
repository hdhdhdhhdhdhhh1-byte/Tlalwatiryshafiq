package com.tilawatak.data.remote.dto

import com.tilawatak.data.remote.SupabaseConfig
import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Gender
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.model.ReciterStats
import com.tilawatak.domain.model.RewardDefinition
import com.tilawatak.domain.model.SubmissionStatus
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Clean parser and serialization helpers for Supabase PostgREST responses.
 */
object SupabaseDtoMappers {

    private fun parseIsoTimestamp(isoString: String?): Long {
        if (isoString.isNullOrBlank()) return System.currentTimeMillis()
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            format.parse(isoString)?.time ?: System.currentTimeMillis()
        } catch (e: Exception) {
            try {
                val fallbackFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                fallbackFormat.parse(isoString)?.time ?: System.currentTimeMillis()
            } catch (e2: Exception) {
                System.currentTimeMillis()
            }
        }
    }

    fun mapJsonToReciter(obj: JSONObject): Reciter {
        val id = obj.optString("id", "")
        val displayName = obj.optString("display_name", "")
        val pseudonym = if (obj.isNull("pseudonym")) null else obj.optString("pseudonym")
        val usePseudonym = obj.optBoolean("use_pseudonym", false)
        val genderStr = obj.optString("gender", "MALE")
        val gender = if (genderStr.equals("FEMALE", ignoreCase = true)) Gender.FEMALE else Gender.MALE
        val country = obj.optString("country", "")
        val bio = obj.optString("bio", "")
        val avatarPath = obj.optString("avatar_url", obj.optString("profile_image_path", ""))
        val avatarUrl = SupabaseConfig.getPublicAvatarUrl(avatarPath)
        val verified = obj.optBoolean("is_verified", false)
        val isStaffPick = obj.optBoolean("is_staff_pick", false)
        val isPublished = obj.optBoolean("is_published", true)
        val createdAt = parseIsoTimestamp(obj.optString("created_at", null))

        val totalRecitations = obj.optInt("total_recitations", 0)
        val totalListens = obj.optLong("total_listens", 0L)
        val totalLikes = obj.optLong("total_likes", 0L)

        return Reciter(
            id = id,
            displayName = displayName,
            pseudonym = pseudonym,
            usePseudonym = usePseudonym,
            gender = gender,
            country = country,
            bio = bio,
            avatarUrl = avatarUrl,
            verified = verified,
            isStaffPick = isStaffPick,
            isPublished = isPublished,
            createdAtEpochMs = createdAt,
            stats = ReciterStats(
                totalRecitations = totalRecitations,
                totalListens = totalListens,
                totalLikes = totalLikes
            )
        )
    }

    fun mapJsonToRecitation(obj: JSONObject, isLiked: Boolean = false): Recitation {
        val id = obj.optString("id", "")
        val reciterId = obj.optString("reciter_id", "")
        val reciterName = obj.optString("reciter_name", "")
        val reciterAvatarRaw = obj.optString("reciter_avatar", "")
        val reciterAvatar = SupabaseConfig.getPublicAvatarUrl(reciterAvatarRaw)
        val reciterCountry = obj.optString("reciter_country", "")
        val surahNumber = obj.optInt("surah_number", 1)
        val surahNameArabic = obj.optString("surah_name_arabic", "")
        val ayahRange = obj.optString("ayah_range", "كاملة")
        val ayahStart = obj.optInt("ayah_start", 1)
        val ayahEnd = obj.optInt("ayah_end", 1)
        val riwayah = obj.optString("riwayah", "حفص عن عاصم")
        val durationSeconds = obj.optLong("duration_seconds", 0L)
        val rawAudioUrl = obj.optString("audio_url", "")
        val audioStoragePath = obj.optString("audio_storage_path", "")
        val audioUrl = if (rawAudioUrl.isNotBlank()) rawAudioUrl else SupabaseConfig.getPublicAudioUrl(audioStoragePath)
        val externalAudioUrl = if (obj.isNull("external_audio_url")) null else obj.optString("external_audio_url")
        val coverPath = if (obj.isNull("cover_image_path")) null else obj.optString("cover_image_path")
        val coverUrl = SupabaseConfig.getPublicCoverUrl(coverPath)
        val description = obj.optString("description", "")
        val statusStr = obj.optString("status", "APPROVED")
        val status = try { SubmissionStatus.valueOf(statusStr) } catch (e: Exception) { SubmissionStatus.APPROVED }
        val publishedAt = parseIsoTimestamp(obj.optString("published_at", null))
        val listenCount = obj.optLong("listen_count", 0L)
        val likeCount = obj.optLong("like_count", 0L)
        val isStaffPick = obj.optBoolean("is_staff_pick", false)

        return Recitation(
            id = id,
            reciterId = reciterId,
            reciterName = reciterName,
            reciterAvatar = reciterAvatar,
            reciterCountry = reciterCountry,
            surahNumber = surahNumber,
            surahNameArabic = surahNameArabic,
            ayahRange = ayahRange,
            ayahStart = ayahStart,
            ayahEnd = ayahEnd,
            riwayah = riwayah,
            durationSeconds = durationSeconds,
            audioUrl = audioUrl,
            audioStoragePath = audioStoragePath,
            externalAudioUrl = externalAudioUrl,
            coverUrl = coverUrl,
            description = description,
            status = status,
            publishedAtEpochMs = publishedAt,
            listenCount = listenCount,
            likeCount = likeCount,
            isLiked = isLiked,
            isStaffPick = isStaffPick
        )
    }

    fun mapJsonToAnnouncement(obj: JSONObject): Announcement {
        return Announcement(
            id = obj.optString("id", ""),
            title = obj.optString("title", ""),
            body = obj.optString("body", ""),
            imagePath = if (obj.isNull("image_path")) null else obj.optString("image_path"),
            isPublished = obj.optBoolean("is_published", true),
            publishedAtEpochMs = parseIsoTimestamp(obj.optString("published_at", null))
        )
    }

    fun mapJsonToCompetition(obj: JSONObject): Competition {
        return Competition(
            id = obj.optString("id", ""),
            title = obj.optString("title", ""),
            description = obj.optString("description", ""),
            imagePath = if (obj.isNull("image_path")) null else obj.optString("image_path"),
            startAtEpochMs = parseIsoTimestamp(obj.optString("start_at", null)),
            endAtEpochMs = parseIsoTimestamp(obj.optString("end_at", null)),
            isPublished = obj.optBoolean("is_published", true)
        )
    }

    fun mapJsonToReward(obj: JSONObject): RewardDefinition {
        return RewardDefinition(
            id = obj.optString("id", ""),
            code = obj.optString("code", ""),
            title = obj.optString("title", ""),
            description = obj.optString("description", ""),
            iconPath = if (obj.isNull("icon_path")) null else obj.optString("icon_path"),
            category = obj.optString("category", "EDITORIAL_HONOR")
        )
    }

    fun mapJsonToHonor(obj: JSONObject, reward: RewardDefinition): ReciterHonor {
        return ReciterHonor(
            id = obj.optString("id", ""),
            reciterId = obj.optString("reciter_id", ""),
            reward = reward,
            awardedAtEpochMs = parseIsoTimestamp(obj.optString("awarded_at", null)),
            citationNote = if (obj.isNull("citation_note")) null else obj.optString("citation_note")
        )
    }

    fun mapSubmissionToJson(submission: RecitationSubmission): JSONObject {
        return JSONObject().apply {
            put("display_name", submission.displayName)
            if (submission.pseudonym != null) {
                put("pseudonym", submission.pseudonym)
            }
            put("use_pseudonym", submission.usePseudonym)
            put("gender", submission.gender.name)
            put("country", submission.country)
            put("surah_number", submission.surahNumber)
            put("surah_name", submission.surahName)
            put("ayah_range", submission.ayahRange)
            put("ayah_start", submission.ayahStart)
            put("ayah_end", submission.ayahEnd)
            put("riwayah", submission.riwayah)
            put("description", submission.description)
            put("audio_storage_path", submission.audioStoragePath)
            if (submission.externalAudioUrl != null) {
                put("external_audio_url", submission.externalAudioUrl)
            }
            put("audio_duration_seconds", submission.audioDurationSeconds)
            // Database trigger enforces PENDING, but DTO explicitly sends PENDING
            put("status", "PENDING")
        }
    }
}
