package com.tilawatak.data.remote.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.LikeResult
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.SubmissionStatus
import com.tilawatak.domain.repository.IRecitationRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class SupabaseRecitationRepository(
    private val defaultInstallationId: String = "inst_anonymous_default",
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) : IRecitationRepository {

    private val userLikedIds = mutableSetOf<String>()
    private val _recitationsFlow = MutableStateFlow<List<Recitation>>(emptyList())

    init {
        refreshRecitations()
    }

    fun refreshRecitations() {
        scope.launch {
            val result = fetchPublicRecitations()
            result.onSuccess { list ->
                _recitationsFlow.value = list
            }
        }
    }

    override fun getRecitationsStream(): Flow<List<Recitation>> {
        return _recitationsFlow.asStateFlow()
    }

    private suspend fun fetchPublicRecitations(params: Map<String, String> = emptyMap()): Result<List<Recitation>> {
        val queryParams = mutableMapOf(
            "select" to "*",
            "order" to "published_at.desc"
        ).apply { putAll(params) }

        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITATIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Recitation>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val id = obj.optString("id")
                val isLiked = userLikedIds.contains(id)
                list.add(SupabaseDtoMappers.mapJsonToRecitation(obj, isLiked))
            }
            list
        }
    }

    /**
     * Loads approved recitations for a specific reciter,
     * ordered strictly by newest published first (published_at DESC).
     */
    override suspend fun getRecitationsByReciter(reciterId: String): Result<List<Recitation>> {
        val queryParams = mapOf(
            "select" to "*",
            "reciter_id" to "eq.$reciterId",
            "order" to "published_at.desc"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITATIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Recitation>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val id = obj.optString("id")
                val isLiked = userLikedIds.contains(id)
                list.add(SupabaseDtoMappers.mapJsonToRecitation(obj, isLiked))
            }
            list
        }
    }

    /**
     * Toggles recitation like using Supabase RPC toggle_recitation_like.
     * Prevents duplicates via (recitation_id, anonymous_installation_id) unique constraint.
     */
    override suspend fun toggleLike(recitationId: String, userId: String): Result<LikeResult> {
        val installationId = if (userId.isNotBlank()) userId else defaultInstallationId
        val rpcBody = JSONObject().apply {
            put("p_recitation_id", recitationId)
            put("p_anonymous_installation_id", installationId)
        }

        val response = SupabaseHttpClient.rpc(SupabaseContracts.RPC_TOGGLE_LIKE, rpcBody)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            if (jsonArray.length() > 0) {
                val row = jsonArray.getJSONObject(0)
                val isLiked = row.optBoolean("is_liked", false)
                val totalLikes = row.optLong("total_likes", 0L)

                if (isLiked) {
                    userLikedIds.add(recitationId)
                } else {
                    userLikedIds.remove(recitationId)
                }

                _recitationsFlow.update { currentList ->
                    currentList.map { item ->
                        if (item.id == recitationId) {
                            item.copy(isLiked = isLiked, likeCount = totalLikes)
                        } else item
                    }
                }
                LikeResult(isLiked = isLiked, totalLikes = totalLikes)
            } else {
                toggleLikeLocalFallback(recitationId)
            }
        }.recoverCatching {
            toggleLikeLocalFallback(recitationId)
        }
    }

    private fun toggleLikeLocalFallback(recitationId: String): LikeResult {
        var isNowLiked = false
        var newCount = 0L

        if (userLikedIds.contains(recitationId)) {
            userLikedIds.remove(recitationId)
            isNowLiked = false
        } else {
            userLikedIds.add(recitationId)
            isNowLiked = true
        }

        _recitationsFlow.update { currentList ->
            currentList.map { item ->
                if (item.id == recitationId) {
                    newCount = if (isNowLiked) item.likeCount + 1 else (item.likeCount - 1).coerceAtLeast(0)
                    item.copy(isLiked = isNowLiked, likeCount = newCount)
                } else item
            }
        }
        return LikeResult(isLiked = isNowLiked, totalLikes = newCount)
    }

    /**
     * Records a meaningful listen event using Supabase RPC record_listen_event.
     * Enforces the minimum duration threshold (>= 5s or completed) at the database layer.
     */
    override suspend fun recordListenEvent(event: ListenEvent): Result<Unit> {
        val installationId = if (event.anonymousInstallationId.isNotBlank()) {
            event.anonymousInstallationId
        } else defaultInstallationId

        val rpcBody = JSONObject().apply {
            put("p_recitation_id", event.recitationId)
            put("p_anonymous_installation_id", installationId)
            put("p_listened_seconds", event.durationSeconds)
            put("p_completed", event.completed)
        }

        val response = SupabaseHttpClient.rpc(SupabaseContracts.RPC_RECORD_LISTEN, rpcBody)
        return response.mapCatching {
            _recitationsFlow.update { currentList ->
                currentList.map { item ->
                    if (item.id == event.recitationId && (event.durationSeconds >= 5 || event.completed)) {
                        item.copy(listenCount = item.listenCount + 1)
                    } else item
                }
            }
            Unit
        }.recoverCatching {
            // Local fallback
            if (event.durationSeconds >= 5 || event.completed) {
                _recitationsFlow.update { currentList ->
                    currentList.map { item ->
                        if (item.id == event.recitationId) item.copy(listenCount = item.listenCount + 1) else item
                    }
                }
            }
            Unit
        }
    }
}
