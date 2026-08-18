package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IReciterRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MockReciterRepository : IReciterRepository {

    private val _recitersFlow = MutableStateFlow<List<Reciter>>(MockData.RECITERS)

    override fun getRecitersStream(): Flow<List<Reciter>> {
        return _recitersFlow.asStateFlow()
    }

    override suspend fun getReciterById(id: String): Result<Reciter?> {
        val reciter = _recitersFlow.value.find { it.id == id && it.isPublished }
        return Result.success(reciter)
    }

    override suspend fun getFeaturedReciters(): Result<List<Reciter>> {
        val featured = _recitersFlow.value.filter { it.isPublished && (it.isStaffPick || it.verified) }
        return Result.success(featured)
    }

    override suspend fun searchReciters(query: String): Result<List<Reciter>> {
        val q = query.trim().lowercase()
        val published = _recitersFlow.value.filter { it.isPublished }
        if (q.isEmpty()) return Result.success(published)
        val filtered = published.filter {
            it.displayName.lowercase().contains(q) ||
                    (it.pseudonym?.lowercase()?.contains(q) == true) ||
                    it.country.lowercase().contains(q)
        }
        return Result.success(filtered)
    }

    override suspend fun getNewestReciters(limit: Int): Result<List<Reciter>> {
        val sorted = _recitersFlow.value
            .filter { it.isPublished }
            .sortedByDescending { it.createdAtEpochMs }
            .take(limit)
        return Result.success(sorted)
    }
}
