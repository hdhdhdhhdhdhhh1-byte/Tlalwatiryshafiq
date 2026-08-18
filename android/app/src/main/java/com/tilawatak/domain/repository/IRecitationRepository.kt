package com.tilawatak.domain.repository

import com.tilawatak.domain.model.LikeResult
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.model.Recitation
import kotlinx.coroutines.flow.Flow

/**
 * Backend-agnostic repository interface for accessing recitations,
 * toggling user likes, and dispatching listen events.
 */
interface IRecitationRepository {
    /**
     * Observes a continuous stream of recitations.
     */
    fun getRecitationsStream(): Flow<List<Recitation>>

    /**
     * Retrieves all approved recitations for a specific reciter.
     */
    suspend fun getRecitationsByReciter(reciterId: String): Result<List<Recitation>>

    /**
     * Conceptually toggles like state for a specific user to prevent duplicate/unlimited likes.
     * The UI never directly manipulates like counts.
     */
    suspend fun toggleLike(recitationId: String, userId: String): Result<LikeResult>

    /**
     * Ingests a listen event. Listen events are queued and later aggregated by the backend.
     */
    suspend fun recordListenEvent(event: ListenEvent): Result<Unit>
}
