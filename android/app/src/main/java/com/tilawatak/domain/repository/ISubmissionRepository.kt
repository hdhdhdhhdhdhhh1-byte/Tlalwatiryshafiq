package com.tilawatak.domain.repository

import com.tilawatak.domain.model.RecitationSubmission
import kotlinx.coroutines.flow.Flow

/**
 * Backend-agnostic repository interface for handling recitation submissions and review tracking.
 */
interface ISubmissionRepository {
    /**
     * Submits a user recitation for verification and audio review.
     */
    suspend fun submitRecitation(submission: RecitationSubmission): Result<RecitationSubmission>

    /**
     * Observes the user's submitted recitations and review status.
     */
    fun getUserSubmissions(): Flow<List<RecitationSubmission>>
}
