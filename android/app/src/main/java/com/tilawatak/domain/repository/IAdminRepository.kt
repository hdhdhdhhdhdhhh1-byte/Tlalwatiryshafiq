package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.SubmissionStatus
import kotlinx.coroutines.flow.Flow

/**
 * Backend-ready repository for future Web Admin Dashboard operations:
 * - Content approval/rejection
 * - Reciter creation, editing, featuring, publishing
 * - Recitation publishing, editing, deleting
 * - Announcements and competitions management
 */
interface IAdminRepository {
    // Submissions Review
    fun getAllSubmissionsStream(status: SubmissionStatus? = null): Flow<List<RecitationSubmission>>
    suspend fun reviewSubmission(
        submissionId: String,
        status: SubmissionStatus,
        adminNotes: String?
    ): Result<RecitationSubmission>

    // Reciter Management
    suspend fun createReciter(reciter: Reciter): Result<Reciter>
    suspend fun updateReciter(reciter: Reciter): Result<Reciter>
    suspend fun setReciterPublished(reciterId: String, isPublished: Boolean): Result<Unit>
    suspend fun setReciterFeatured(reciterId: String, isFeatured: Boolean): Result<Unit>

    // Recitation Management
    suspend fun createRecitation(recitation: Recitation): Result<Recitation>
    suspend fun updateRecitation(recitation: Recitation): Result<Recitation>
    suspend fun setRecitationStatus(recitationId: String, status: SubmissionStatus): Result<Unit>
    suspend fun deleteRecitation(recitationId: String): Result<Unit>

    // Announcements Management
    suspend fun createAnnouncement(announcement: Announcement): Result<Announcement>
    suspend fun updateAnnouncement(announcement: Announcement): Result<Announcement>
    suspend fun deleteAnnouncement(announcementId: String): Result<Unit>

    // Competitions Management
    suspend fun createCompetition(competition: Competition): Result<Competition>
    suspend fun updateCompetition(competition: Competition): Result<Competition>
    suspend fun setCompetitionPublished(competitionId: String, isPublished: Boolean): Result<Unit>
}
