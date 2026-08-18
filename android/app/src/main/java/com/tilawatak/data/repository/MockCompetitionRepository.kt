package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.repository.ICompetitionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MockCompetitionRepository : ICompetitionRepository {

    private val _competitionsFlow = MutableStateFlow<List<Competition>>(MockData.COMPETITIONS)

    override fun getCompetitionsStream(): Flow<List<Competition>> {
        return _competitionsFlow.asStateFlow()
    }

    override suspend fun getActiveCompetitions(): Result<List<Competition>> {
        val active = _competitionsFlow.value.filter { it.isPublished }
        return Result.success(active)
    }

    override suspend fun getCompetitionById(id: String): Result<Competition?> {
        val comp = _competitionsFlow.value.find { it.id == id }
        return Result.success(comp)
    }
}
