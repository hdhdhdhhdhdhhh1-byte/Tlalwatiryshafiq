package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter

/**
 * Backend-agnostic repository interface for fetching ranked, featured, and statistical metrics.
 * Ensures the UI never performs hardcoded ranking/sorting logic.
 */
interface IStatisticsRepository {
    /**
     * Retrieves top recitations ordered by total verified listens.
     */
    suspend fun getMostListenedRecitations(limit: Int = 10): Result<List<Recitation>>

    /**
     * Retrieves top recitations ordered by total unique user likes.
     */
    suspend fun getMostLikedRecitations(limit: Int = 10): Result<List<Recitation>>

    /**
     * Retrieves top reciters ordered by aggregated listen volume.
     */
    suspend fun getMostListenedReciters(limit: Int = 10): Result<List<Reciter>>

    /**
     * Retrieves top reciters ordered by aggregated like count.
     */
    suspend fun getMostLikedReciters(limit: Int = 10): Result<List<Reciter>>

    /**
     * Retrieves the latest approved recitations.
     */
    suspend fun getNewestRecitations(limit: Int = 10): Result<List<Recitation>>
}
