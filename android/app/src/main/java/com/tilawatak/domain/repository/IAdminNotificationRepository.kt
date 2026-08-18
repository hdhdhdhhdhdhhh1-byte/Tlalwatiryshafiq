package com.tilawatak.domain.repository

import com.tilawatak.domain.model.AdminNotification
import com.tilawatak.domain.model.RecitationSubmission
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for admin alerts when new submissions arrive.
 * Dispatches alert triggers for transactional email / dashboard notifications.
 */
interface IAdminNotificationRepository {
    suspend fun notifySubmissionReceived(submission: RecitationSubmission): Result<Unit>
    fun getAdminNotificationsStream(): Flow<List<AdminNotification>>
    suspend fun markAsRead(notificationId: String): Result<Unit>
}
