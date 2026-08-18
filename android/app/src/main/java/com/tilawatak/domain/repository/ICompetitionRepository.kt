package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Competition
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for recitation challenges and competitions.
 */
interface ICompetitionRepository {
    fun getCompetitionsStream(): Flow<List<Competition>>
    suspend fun getActiveCompetitions(): Result<List<Competition>>
    suspend fun getCompetitionById(id: String): Result<Competition?>
}
