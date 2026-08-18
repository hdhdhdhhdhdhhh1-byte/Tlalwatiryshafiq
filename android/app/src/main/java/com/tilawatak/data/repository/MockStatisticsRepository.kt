package com.tilawatak.data.repository

import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import kotlinx.coroutines.flow.first

class MockStatisticsRepository(
    private val recitationRepository: IRecitationRepository,
    private val reciterRepository: IReciterRepository
) : IStatisticsRepository {

    override suspend fun getMostListenedRecitations(limit: Int): Result<List<Recitation>> {
        val recitations = recitationRepository.getRecitationsStream().first()
        val sorted = recitations.sortedByDescending { it.listenCount }.take(limit)
        return Result.success(sorted)
    }

    override suspend fun getMostLikedRecitations(limit: Int): Result<List<Recitation>> {
        val recitations = recitationRepository.getRecitationsStream().first()
        val sorted = recitations.sortedByDescending { it.likeCount }.take(limit)
        return Result.success(sorted)
    }

    override suspend fun getMostListenedReciters(limit: Int): Result<List<Reciter>> {
        val reciters = reciterRepository.getRecitersStream().first()
        val sorted = reciters.sortedByDescending { it.stats.totalListens }.take(limit)
        return Result.success(sorted)
    }

    override suspend fun getMostLikedReciters(limit: Int): Result<List<Reciter>> {
        val reciters = reciterRepository.getRecitersStream().first()
        val sorted = reciters.sortedByDescending { it.stats.totalLikes }.take(limit)
        return Result.success(sorted)
    }

    override suspend fun getNewestRecitations(limit: Int): Result<List<Recitation>> {
        val recitations = recitationRepository.getRecitationsStream().first()
        val latest = recitations.sortedByDescending { it.publishedAtEpochMs }.take(limit)
        return Result.success(latest)
    }
}
