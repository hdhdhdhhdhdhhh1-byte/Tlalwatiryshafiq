package com.tilawatak.data.remote.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.dto.SupabaseDtoMappers
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.repository.IAnnouncementRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray

class SupabaseAnnouncementRepository : IAnnouncementRepository {

    private val _announcementsFlow = MutableStateFlow<List<Announcement>>(MockData.ANNOUNCEMENTS)

    override fun getAnnouncementsStream(): Flow<List<Announcement>> {
        return _announcementsFlow.asStateFlow()
    }

    override suspend fun getPublishedAnnouncements(): Result<List<Announcement>> {
        val queryParams = mapOf(
            "select" to "*",
            "is_published" to "eq.true",
            "order" to "published_at.desc"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_ANNOUNCEMENTS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            val list = mutableListOf<Announcement>()
            for (i in 0 until jsonArray.length()) {
                list.add(SupabaseDtoMappers.mapJsonToAnnouncement(jsonArray.getJSONObject(i)))
            }
            if (list.isNotEmpty()) {
                _announcementsFlow.value = list
                list
            } else {
                MockData.ANNOUNCEMENTS
            }
        }.recoverCatching {
            MockData.ANNOUNCEMENTS
        }
    }

    override suspend fun getAnnouncementById(id: String): Result<Announcement?> {
        val queryParams = mapOf(
            "select" to "*",
            "id" to "eq.$id",
            "limit" to "1"
        )
        val response = SupabaseHttpClient.get(SupabaseContracts.TABLE_ANNOUNCEMENTS, queryParams)
        return response.mapCatching { jsonStr ->
            val jsonArray = JSONArray(jsonStr)
            if (jsonArray.length() > 0) {
                SupabaseDtoMappers.mapJsonToAnnouncement(jsonArray.getJSONObject(0))
            } else {
                MockData.ANNOUNCEMENTS.find { it.id == id }
            }
        }.recoverCatching {
            MockData.ANNOUNCEMENTS.find { it.id == id }
        }
    }
}
