package com.tilawatak.data.remote.repository

import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IReciterRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class SupabaseReciterRepository(
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) : IReciterRepository {

    private val _recitersFlow = MutableStateFlow<List<Reciter>>(emptyList())

    init {
        refreshReciters()
    }

    fun refreshReciters() {
        scope.launch {
            val result = fetchPublicReciters()
            result.onSuccess { list ->
                _recitersFlow.value = list
            }
        }
    }

    override fun getRecitersStream(): Flow<List<Reciter>> {
        return _recitersFlow.asStateFlow()
    }

    suspend fun testConnection(): Result<List<Reciter>> {
        return fetchPublicReciters(mapOf("limit" to "5"))
    }

    private suspend fun fetchPublicReciters(params: Map<String, String> = emptyMap()): Result<List<Reciter>> {
        val queryParams = mutableMapOf(
            "select" to "*",
            "order" to "created_at.desc"
        ).apply { putAll(params) }

        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITERS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Reciter>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(SupabaseDtoMappers.mapJsonToReciter(obj))
            }
            list
        }
    }

    override suspend fun getReciterById(id: String): Result<Reciter?> {
        val queryParams = mapOf(
            "select" to "*",
            "id" to "eq.$id",
            "limit" to "1"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITERS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            if (jsonArray.length() > 0) {
                SupabaseDtoMappers.mapJsonToReciter(jsonArray.getJSONObject(0))
            } else {
                null
            }
        }
    }

    override suspend fun getFeaturedReciters(): Result<List<Reciter>> {
        val queryParams = mapOf(
            "select" to "*",
            "or" to "(is_staff_pick.eq.true,is_verified.eq.true)",
            "limit" to "10"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITERS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Reciter>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToReciter(jsonArray.getJSONObject(i)))
            }
            list
        }
    }

    override suspend fun searchReciters(query: String): Result<List<Reciter>> {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return fetchPublicReciters()

        val rpcBody = JSONObject().apply {
            put("search_term", trimmed)
        }
        val response = SupabaseHttpClient.rpc(SupabaseContracts.RPC_SEARCH_RECITERS, rpcBody)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Reciter>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToReciter(jsonArray.getJSONObject(i)))
            }
            list
        }
    }

    override suspend fun getNewestReciters(limit: Int): Result<List<Reciter>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "created_at.desc",
            "limit" to limit.toString()
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITERS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Reciter>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToReciter(jsonArray.getJSONObject(i)))
            }
            list
        }
    }
}

