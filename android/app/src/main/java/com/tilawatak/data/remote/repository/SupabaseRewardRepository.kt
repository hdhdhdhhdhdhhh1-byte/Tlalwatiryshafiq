package com.tilawatak.data.remote.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.model.RewardDefinition
import com.tilawatak.domain.repository.IRewardRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray

class SupabaseRewardRepository : IRewardRepository {

    private val _honorsCache = mutableMapOf<String, List<ReciterHonor>>()

    override suspend fun getAllRewards(): Result<List<RewardDefinition>> {
        val queryParams = mapOf(
            "select" to "*"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_REWARD_DEFINITIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<RewardDefinition>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToReward(jsonArray.getJSONObject(i)))
            }
            if (list.isNotEmpty()) list else MockData.REWARDS
        }.recoverCatching {
            MockData.REWARDS
        }
    }

    override suspend fun getHonorsByReciter(reciterId: String): Result<List<ReciterHonor>> {
        val queryParams = if (reciterId.isNotBlank()) {
            mapOf(
                "select" to "*,reward_definitions(*)",
                "reciter_id" to "eq.$reciterId",
                "order" to "awarded_at.desc"
            )
        } else {
            mapOf(
                "select" to "*,reward_definitions(*)",
                "order" to "awarded_at.desc"
            )
        }
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_RECITER_HONORS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<ReciterHonor>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val rewardObj = obj.optJSONObject("reward_definitions")
                val reward = if (rewardObj != null) {
                    SupabaseDtoMappers.mapJsonToReward(rewardObj)
                } else {
                    MockData.REWARDS.first()
                }
                list.add(SupabaseDtoMappers.mapJsonToHonor(obj, reward))
            }
            if (reciterId.isNotBlank()) {
                _honorsCache[reciterId] = list
            }
            if (list.isNotEmpty()) list else {
                if (reciterId.isNotBlank()) MockData.RECITER_HONORS.filter { it.reciterId == reciterId } else MockData.RECITER_HONORS
            }
        }.recoverCatching {
            if (reciterId.isNotBlank()) MockData.RECITER_HONORS.filter { it.reciterId == reciterId } else MockData.RECITER_HONORS
        }
    }

    override fun getReciterHonorsStream(reciterId: String): Flow<List<ReciterHonor>> {
        val list = _honorsCache[reciterId] ?: MockData.RECITER_HONORS.filter { it.reciterId == reciterId }
        return MutableStateFlow(list).asStateFlow()
    }
}
