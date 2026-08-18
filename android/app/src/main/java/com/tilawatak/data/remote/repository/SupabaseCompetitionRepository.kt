package com.tilawatak.data.remote.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.repository.ICompetitionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray

class SupabaseCompetitionRepository : ICompetitionRepository {

    private val _competitionsFlow = MutableStateFlow<List<Competition>>(MockData.COMPETITIONS)

    override fun getCompetitionsStream(): Flow<List<Competition>> {
        return _competitionsFlow.asStateFlow()
    }

    override suspend fun getActiveCompetitions(): Result<List<Competition>> {
        val queryParams = mapOf(
            "select" to "*",
            "is_published" to "eq.true",
            "order" to "start_at.desc"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_COMPETITIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Competition>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToCompetition(jsonArray.getJSONObject(i)))
            }
            if (list.isNotEmpty()) {
                _competitionsFlow.value = list
                list
            } else {
                MockData.COMPETITIONS
            }
        }.recoverCatching {
            MockData.COMPETITIONS
        }
    }

    override suspend fun getCompetitionById(id: String): Result<Competition?> {
        val queryParams = mapOf(
            "select" to "*",
            "id" to "eq.$id",
            "limit" to "1"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_COMPETITIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            if (jsonArray.length() > 0) {
                SupabaseDtoMappers.mapJsonToCompetition(jsonArray.getJSONObject(0))
            } else {
                MockData.COMPETITIONS.find { it.id == id }
            }
        }.recoverCatching {
            MockData.COMPETITIONS.find { it.id == id }
        }
    }
}
