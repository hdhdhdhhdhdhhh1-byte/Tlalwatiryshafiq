package com.tilawatak.data.repository

import com.tilawatak.data.mock.MockData
import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.repository.IAnnouncementRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MockAnnouncementRepository : IAnnouncementRepository {

    private val _announcementsFlow = MutableStateFlow<List<Announcement>>(MockData.ANNOUNCEMENTS)

    override fun getAnnouncementsStream(): Flow<List<Announcement>> {
        return _announcementsFlow.asStateFlow()
    }

    override suspend fun getPublishedAnnouncements(): Result<List<Announcement>> {
        val published = _announcementsFlow.value.filter { it.isPublished }
        return Result.success(published)
    }

    override suspend fun getAnnouncementById(id: String): Result<Announcement?> {
        val announcement = _announcementsFlow.value.find { it.id == id }
        return Result.success(announcement)
    }
}
