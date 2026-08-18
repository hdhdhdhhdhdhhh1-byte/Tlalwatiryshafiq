package com.tilawatak.data.local

import com.tilawatak.domain.provider.AnonymousInstallationIdProvider
import java.util.UUID

/**
 * Concrete implementation of AnonymousInstallationIdProvider.
 * In a fully deployed Android app, this persists in EncryptedSharedPreferences/DataStore.
 * Here it generates and caches an anonymous random UUID in memory/local store.
 */
class DefaultAnonymousInstallationIdProvider(
    initialId: String? = null
) : AnonymousInstallationIdProvider {

    private val cachedId: String = initialId ?: "inst_${UUID.randomUUID().toString().replace("-", "").take(16)}"

    override fun getInstallationId(): String {
        return cachedId
    }
}
