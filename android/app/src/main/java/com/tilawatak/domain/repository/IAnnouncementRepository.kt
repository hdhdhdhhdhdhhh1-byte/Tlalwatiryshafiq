package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Announcement
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for platform announcements and news.
 */
interface IAnnouncementRepository {
    fun getAnnouncementsStream(): Flow<List<Announcement>>
    suspend fun getPublishedAnnouncements(): Result<List<Announcement>>
    suspend fun getAnnouncementById(id: String): Result<Announcement?>
}
