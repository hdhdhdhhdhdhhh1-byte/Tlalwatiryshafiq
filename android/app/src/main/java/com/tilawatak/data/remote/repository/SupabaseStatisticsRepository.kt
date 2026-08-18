package com.tilawatak.data.remote.repository

import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IStatisticsRepository
import org.json.JSONArray

class SupabaseStatisticsRepository : IStatisticsRepository {

    override suspend fun getMostListenedRecitations(limit: Int): Result<List<Recitation>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "listen_count.desc",
            "limit" to limit.toString()
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITATIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Recitation>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToRecitation(jsonArray.getJSONObject(i)))
            }
            list
        }
    }

    override suspend fun getMostLikedRecitations(limit: Int): Result<List<Recitation>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "like_count.desc",
            "limit" to limit.toString()
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITATIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Recitation>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToRecitation(jsonArray.getJSONObject(i)))
            }
            list
        }
    }

    override suspend fun getMostListenedReciters(limit: Int): Result<List<Reciter>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "total_listens.desc",
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

    override suspend fun getMostLikedReciters(limit: Int): Result<List<Reciter>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "total_likes.desc",
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

    override suspend fun getNewestRecitations(limit: Int): Result<List<Recitation>> {
        val queryParams = mapOf(
            "select" to "*",
            "order" to "published_at.desc",
            "limit" to limit.toString()
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.VIEW_PUBLIC_RECITATIONS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Recitation>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToRecitation(jsonArray.getJSONObject(i)))
            }
            list
        }
    }
}

