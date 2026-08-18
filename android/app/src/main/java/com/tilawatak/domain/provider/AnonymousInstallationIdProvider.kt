package com.tilawatak.domain.provider

/**
 * Privacy-conscious anonymous installation identifier provider.
 * Strictly does NOT collect IMEI, phone numbers, ad IDs, or personal telemetry.
 * Used solely for reducing duplicate likes and aggregating meaningful listens.
 */
interface AnonymousInstallationIdProvider {
    fun getInstallationId(): String
}
