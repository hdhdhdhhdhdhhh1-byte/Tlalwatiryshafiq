package com.tilawatak.data.repository

import com.tilawatak.domain.model.AdminNotification
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.repository.IAdminNotificationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.UUID

class MockAdminNotificationRepository : IAdminNotificationRepository {

    private val _notificationsFlow = MutableStateFlow<List<AdminNotification>>(
        listOf(
            AdminNotification(
                id = "notif-1",
                type = "NEW_SUBMISSION_RECEIVED",
                title = "تلاوة جديدة قيد المراجعة: سورة الرحمن",
                content = "قام القارئ أحمد بن عبد الله السلمي بتقديم تلاوة جديدة برواية حفص عن عاصم.",
                referenceId = "sub-101",
                isRead = false
            )
        )
    )

    override suspend fun notifySubmissionReceived(submission: RecitationSubmission): Result<Unit> {
        val notification = AdminNotification(
            id = "notif-${UUID.randomUUID().toString().take(8)}",
            type = "NEW_SUBMISSION_RECEIVED",
            title = "تلاوة جديدة قيد المراجعة: سورة ${submission.surahName}",
            content = "قام القارئ ${submission.pseudonym ?: submission.displayName} بتقديم تلاوة من ${submission.country}.",
            referenceId = submission.id
        )
        _notificationsFlow.update { listOf(notification) + it }
        return Result.success(Unit)
    }

    override fun getAdminNotificationsStream(): Flow<List<AdminNotification>> {
        return _notificationsFlow.asStateFlow()
    }

    override suspend fun markAsRead(notificationId: String): Result<Unit> {
        _notificationsFlow.update { list ->
            list.map { if (it.id == notificationId) it.copy(isRead = true) else it }
        }
        return Result.success(Unit)
    }
}
