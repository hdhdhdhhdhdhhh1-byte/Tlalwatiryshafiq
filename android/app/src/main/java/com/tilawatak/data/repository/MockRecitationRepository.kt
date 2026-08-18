package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.LikeResult
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.domain.repository.IRecitationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class MockRecitationRepository : IRecitationRepository {

    // Default anonymous installation ID for testing
    private val defaultInstallationId = "inst_anonymous_default"
    private val userLikesMap = mutableMapOf<String, MutableSet<String>>()
    private val recordedEvents = mutableListOf<ListenEvent>()

    private val _recitationsFlow: MutableStateFlow<List<Recitation>>

    init {
        // Seed initial likes for the sample installation
        val initialUserLikes = mutableSetOf("rec-2", "rec-3", "rec-8")
        userLikesMap[defaultInstallationId] = initialUserLikes

        val seededList = MockData.RECITATIONS.map { r ->
            r.copy(isLiked = initialUserLikes.contains(r.id))
        }
        _recitationsFlow = MutableStateFlow(seededList)
    }

    override fun getRecitationsStream(): Flow<List<Recitation>> {
        return _recitationsFlow.asStateFlow()
    }

    /**
     * Retrieves all approved recitations for a specific reciter,
     * ordered by publication date (newest published first).
     */
    override suspend fun getRecitationsByReciter(reciterId: String): Result<List<Recitation>> {
        val recitations = _recitationsFlow.value
            .filter { it.reciterId == reciterId && it.status == SubmissionStatus.APPROVED }
            .sortedByDescending { it.publishedAtEpochMs }
        return Result.success(recitations)
    }

    override suspend fun toggleLike(recitationId: String, userId: String): Result<LikeResult> {
        val targetInstallation = if (userId.isBlank()) defaultInstallationId else userId
        val userLikes = userLikesMap.getOrPut(targetInstallation) { mutableSetOf() }

        var resultLikeState = false
        var resultTotalLikes = 0L

        _recitationsFlow.update { list ->
            list.map { item ->
                if (item.id == recitationId) {
                    val currentlyLiked = userLikes.contains(recitationId)
                    if (currentlyLiked) {
                        userLikes.remove(recitationId)
                        val newCount = (item.likeCount - 1).coerceAtLeast(0)
                        resultLikeState = false
                        resultTotalLikes = newCount
                        item.copy(isLiked = false, likeCount = newCount)
                    } else {
                        userLikes.add(recitationId)
                        val newCount = item.likeCount + 1
                        resultLikeState = true
                        resultTotalLikes = newCount
                        item.copy(isLiked = true, likeCount = newCount)
                    }
                } else {
                    item
                }
            }
        }

        return Result.success(LikeResult(isLiked = resultLikeState, totalLikes = resultTotalLikes))
    }

    override suspend fun recordListenEvent(event: ListenEvent): Result<Unit> {
        // Enforce meaningful listening threshold: at least 5 seconds or completion
        if (event.durationSeconds >= 5 || event.completed) {
            recordedEvents.add(event)
            _recitationsFlow.update { list ->
                list.map { item ->
                    if (item.id == event.recitationId) {
                        item.copy(listenCount = item.listenCount + 1)
                    } else {
                        item
                    }
                }
            }
        }
        return Result.success(Unit)
    }
}
