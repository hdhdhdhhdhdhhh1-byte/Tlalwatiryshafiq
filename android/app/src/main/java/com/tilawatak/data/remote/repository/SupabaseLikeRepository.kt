package com.tilawatak.data.remote.repository

import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.LikeResult
import com.tilawatak.domain.repository.ILikeRepository
import org.json.JSONArray
import org.json.JSONObject

class SupabaseLikeRepository(
    private val defaultInstallationId: String = "inst_anonymous_default"
) : ILikeRepository {

    private val localLikedMap = mutableMapOf<String, Boolean>()

    override suspend fun toggleLike(recitationId: String, installationId: String): Result<LikeResult> {
        val activeInstallationId = if (installationId.isNotBlank()) installationId else defaultInstallationId
        val rpcBody = JSONObject().apply {
            put("p_recitation_id", recitationId)
            put("p_anonymous_installation_id", activeInstallationId)
        }

        val response = SupabaseHttpClient.rpc(SupabaseContracts.RPC_TOGGLE_LIKE, rpcBody)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            if (jsonArray.length() > 0) {
                val row = jsonArray.getJSONObject(0)
                val isLiked = row.optBoolean("is_liked", false)
                val totalLikes = row.optLong("total_likes", 0L)
                localLikedMap[recitationId] = isLiked
                LikeResult(isLiked = isLiked, totalLikes = totalLikes)
            } else {
                val newState = !(localLikedMap[recitationId] ?: false)
                localLikedMap[recitationId] = newState
                LikeResult(isLiked = newState, totalLikes = if (newState) 1L else 0L)
            }
        }.recoverCatching {
            val newState = !(localLikedMap[recitationId] ?: false)
            localLikedMap[recitationId] = newState
            LikeResult(isLiked = newState, totalLikes = if (newState) 1L else 0L)
        }
    }

    override suspend fun isLiked(recitationId: String, installationId: String): Result<Boolean> {
        val activeInstallationId = if (installationId.isNotBlank()) installationId else defaultInstallationId
        val queryParams = mapOf(
            "select" to "id",
            "recitation_id" to "eq.$recitationId",
            "anonymous_installation_id" to "eq.$activeInstallationId",
            "limit" to "1"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_LIKES, queryParams)
        return response.mapCatching { jsonStr ->
            val array = JSONArray(jsonStr)
            val liked = array.length() > 0
            localLikedMap[recitationId] = liked
            liked
        }.recoverCatching {
            localLikedMap[recitationId] ?: false
        }
    }
}
