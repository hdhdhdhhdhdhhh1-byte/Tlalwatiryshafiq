package com.tilawatak.data.repository

import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.domain.repository.IAdminRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update

class MockAdminRepository(
    private val reciterRepository: MockReciterRepository,
    private val recitationRepository: MockRecitationRepository,
    private val submissionRepository: MockSubmissionRepository,
    private val announcementRepository: MockAnnouncementRepository,
    private val competitionRepository: MockCompetitionRepository
) : IAdminRepository {

    override fun getAllSubmissionsStream(status: SubmissionStatus?): Flow<List<RecitationSubmission>> {
        return submissionRepository.getUserSubmissions().map { list ->
            if (status != null) list.filter { it.status == status } else list
        }
    }

    override suspend fun reviewSubmission(
        submissionId: String,
        status: SubmissionStatus,
        adminNotes: String?
    ): Result<RecitationSubmission> {
        val submissions = submissionRepository.getUserSubmissions()
        // Mock state transition
        val current = submissionRepository.getUserSubmissions()
        // Return dummy success
        val updated = RecitationSubmission(
            id = submissionId,
            displayName = "مُراجع",
            country = "العالم الإسلامي",
            surahNumber = 1,
            surahName = "الفاتحة",
            ayahRange = "كاملة",
            riwayah = "حفص عن عاصم",
            description = "",
            audioUri = "",
            audioDurationSeconds = 60,
            status = status,
            adminNotes = adminNotes,
            reviewedAtEpochMs = System.currentTimeMillis()
        )
        return Result.success(updated)
    }

    override suspend fun createReciter(reciter: Reciter): Result<Reciter> {
        return Result.success(reciter)
    }

    override suspend fun updateReciter(reciter: Reciter): Result<Reciter> {
        return Result.success(reciter)
    }

    override suspend fun setReciterPublished(reciterId: String, isPublished: Boolean): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun setReciterFeatured(reciterId: String, isFeatured: Boolean): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun createRecitation(recitation: Recitation): Result<Recitation> {
        return Result.success(recitation)
    }

    override suspend fun updateRecitation(recitation: Recitation): Result<Recitation> {
        return Result.success(recitation)
    }

    override suspend fun setRecitationStatus(recitationId: String, status: SubmissionStatus): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun deleteRecitation(recitationId: String): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun createAnnouncement(announcement: Announcement): Result<Announcement> {
        return Result.success(announcement)
    }

    override suspend fun updateAnnouncement(announcement: Announcement): Result<Announcement> {
        return Result.success(announcement)
    }

    override suspend fun deleteAnnouncement(announcementId: String): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun createCompetition(competition: Competition): Result<Competition> {
        return Result.success(competition)
    }

    override suspend fun updateCompetition(competition: Competition): Result<Competition> {
        return Result.success(competition)
    }

    override suspend fun setCompetitionPublished(competitionId: String, isPublished: Boolean): Result<Unit> {
        return Result.success(Unit)
    }
}
