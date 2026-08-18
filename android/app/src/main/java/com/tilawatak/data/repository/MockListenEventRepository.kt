package com.tilawatak.data.repository

import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.repository.IListenEventRepository
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class MockListenEventRepository : IListenEventRepository {

    private val mutex = Mutex()
    private val recordedEvents = mutableListOf<ListenEvent>()

    override suspend fun recordListen(event: ListenEvent): Result<Unit> = mutex.withLock {
        // Enforce threshold: at least 5 seconds of active playback or track completed
        if (event.durationSeconds >= 5 || event.completed) {
            recordedEvents.add(event)
        }
        Result.success(Unit)
    }

    fun getRecordedEventsCount(): Int = recordedEvents.size
}
