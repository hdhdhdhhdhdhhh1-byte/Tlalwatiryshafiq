package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Reciter
import kotlinx.coroutines.flow.Flow

/**
 * Backend-agnostic repository interface for accessing and observing Reciters.
 */
interface IReciterRepository {
    /**
     * Observes a continuous stream of reciters (e.g. from local Room DB or Flow cache).
     */
    fun getRecitersStream(): Flow<List<Reciter>>

    /**
     * Retrieves a single reciter profile by ID.
     */
    suspend fun getReciterById(id: String): Result<Reciter?>

    /**
     * Retrieves featured/verified reciters.
     */
    suspend fun getFeaturedReciters(): Result<List<Reciter>>

    /**
     * Searches reciters by name, pseudonym, or country.
     */
    suspend fun searchReciters(query: String): Result<List<Reciter>>

    /**
     * Retrieves newly joined reciters.
     */
    suspend fun getNewestReciters(limit: Int = 10): Result<List<Reciter>>
}
