package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.domain.repository.IAdminNotificationRepository
import com.tilawatak.domain.repository.ISubmissionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.UUID

class MockSubmissionRepository(
    private val adminNotificationRepository: IAdminNotificationRepository? = null
) : ISubmissionRepository {

    private val _submissionsFlow = MutableStateFlow<List<RecitationSubmission>>(MockData.INITIAL_SUBMISSIONS)

    override fun getUserSubmissions(): Flow<List<RecitationSubmission>> {
        return _submissionsFlow.asStateFlow()
    }

    /**
     * Submits a recitation.
     * STRICT SECURITY RULE: Public users can never self-approve.
     * The submission is saved as PENDING for admin review.
     */
    override suspend fun submitRecitation(submission: RecitationSubmission): Result<RecitationSubmission> {
        val created = submission.copy(
            id = if (submission.id.isBlank()) "sub-${UUID.randomUUID().toString().take(8)}" else submission.id,
            status = SubmissionStatus.PENDING,
            submittedAtEpochMs = System.currentTimeMillis(),
            adminNotes = "تم استلام التلاوة بنجاح، وهي قيد المراجعة والتدقيق الصوتي من قبل المشرفين."
        )

        _submissionsFlow.update { currentList ->
            listOf(created) + currentList
        }

        // Notify admin queue
        adminNotificationRepository?.notifySubmissionReceived(created)

        return Result.success(created)
    }
}
