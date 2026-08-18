package com.tilawatak.data.remote.repository

import com.tilawatak.data.remote.SupabaseContracts
import com.tilawatak.data.remote.http.SupabaseHttpClient
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.repository.IListenEventRepository
import org.json.JSONObject

class SupabaseListenEventRepository(
    private val defaultInstallationId: String = "inst_anonymous_default"
) : IListenEventRepository {

    override suspend fun recordListen(event: ListenEvent): Result<Unit> {
        val installationId = if (event.anonymousInstallationId.isNotBlank()) {
            event.anonymousInstallationId
        } else defaultInstallationId

        val rpcBody = JSONObject().apply {
            put("p_recitation_id", event.recitationId)
            put("p_anonymous_installation_id", installationId)
            put("p_listened_seconds", event.durationSeconds)
            put("p_completed", event.completed)
        }

        val response = SupabaseHttpClient.rpc(SupabaseContracts.RPC_RECORD_LISTEN, rpcBody)
        return response.mapCatching {
            Unit
        }.recoverCatching {
            Unit
        }
    }
}
