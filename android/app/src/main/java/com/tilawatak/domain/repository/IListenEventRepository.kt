package com.tilawatak.domain.repository

import com.tilawatak.domain.model.ListenEvent

/**
 * Repository interface for capturing meaningful listening events.
 */
interface IListenEventRepository {
    /**
     * Records a valid listening event after threshold duration.
     */
    suspend fun recordListen(event: ListenEvent): Result<Unit>
}
