package com.tilawatak.data.repository

import com.tilawatak.domain.model.LikeResult
import com.tilawatak.domain.repository.ILikeRepository
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class MockLikeRepository(
    private val initialLikes: Map<String, Set<String>> = mapOf(
        "inst_sample_1" to setOf("rec-2", "rec-3", "rec-8")
    )
) : ILikeRepository {

    private val mutex = Mutex()
    // Map: installationId -> Set of recitationIds
    private val userLikesMap = mutableMapOf<String, MutableSet<String>>().apply {
        initialLikes.forEach { (k, v) -> put(k, v.toMutableSet()) }
    }

    // Map: recitationId -> total like count
    private val totalLikesMap = mutableMapOf<String, Long>(
        "rec-1" to 1450L,
        "rec-2" to 1120L,
        "rec-3" to 840L,
        "rec-4" to 2390L,
        "rec-5" to 1680L,
        "rec-6" to 850L,
        "rec-7" to 1240L,
        "rec-8" to 910L,
        "rec-9" to 1040L,
        "rec-10" to 850L,
        "rec-11" to 560L,
        "rec-12" to 420L,
        "rec-13" to 980L,
        "rec-14" to 660L,
        "rec-15" to 810L,
        "rec-16" to 610L,
        "rec-17" to 1130L,
        "rec-18" to 970L
    )

    override suspend fun toggleLike(recitationId: String, installationId: String): Result<LikeResult> = mutex.withLock {
        val installationLikes = userLikesMap.getOrPut(installationId) { mutableSetOf() }
        val currentCount = totalLikesMap.getOrDefault(recitationId, 0L)

        val isNowLiked: Boolean
        val newCount: Long

        if (installationLikes.contains(recitationId)) {
            installationLikes.remove(recitationId)
            newCount = (currentCount - 1).coerceAtLeast(0)
            isNowLiked = false
        } else {
            installationLikes.add(recitationId)
            newCount = currentCount + 1
            isNowLiked = true
        }

        totalLikesMap[recitationId] = newCount
        Result.success(LikeResult(isLiked = isNowLiked, totalLikes = newCount))
    }

    override suspend fun isLiked(recitationId: String, installationId: String): Result<Boolean> = mutex.withLock {
        val liked = userLikesMap[installationId]?.contains(recitationId) == true
        Result.success(liked)
    }
}
