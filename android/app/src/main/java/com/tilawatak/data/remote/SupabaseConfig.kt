package com.tilawatak.data.remote

import com.tilawatak.lilalam.BuildConfig

enum class DataSourceMode {
    MOCK,
    SUPABASE
}

/**
 * Replaceable Supabase Configuration Abstraction.
 * NEVER hardcodes private secret keys or service role keys.
 * Only uses the public Supabase URL and anonymous public API key.
 */
object SupabaseConfig {

    const val DEFAULT_SUPABASE_URL = "https://ixkganrxtkywypvqkqkn.supabase.co"
    // Public anonymous key (read-only for published content + public submission insertion)
    const val DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2dhbnJ4dGt5d3lwdnFrcWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MjAyNTY0MzIwMH0.placeholder"

    @Volatile
    var currentMode: DataSourceMode = DataSourceMode.SUPABASE

    @Volatile
    var supabaseUrl: String = try {
        BuildConfig.SUPABASE_URL.ifBlank { DEFAULT_SUPABASE_URL }
    } catch (e: Throwable) {
        DEFAULT_SUPABASE_URL
    }

    @Volatile
    var supabaseAnonKey: String = try {
        BuildConfig.SUPABASE_ANON_KEY.ifBlank { DEFAULT_ANON_KEY }
    } catch (e: Throwable) {
        DEFAULT_ANON_KEY
    }

    val restBaseUrl: String
        get() = "$supabaseUrl/rest/v1"

    val storageBaseUrl: String
        get() = "$supabaseUrl/storage/v1"

    fun getPublicAudioUrl(storagePath: String): String {
        if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
            return storagePath
        }
        return "$storageBaseUrl/object/public/${SupabaseContracts.BUCKET_RECITATION_AUDIO}/$storagePath"
    }

    fun getPublicCoverUrl(coverPath: String?): String? {
        if (coverPath.isNullOrBlank()) return null
        if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
            return coverPath
        }
        return "$storageBaseUrl/object/public/${SupabaseContracts.BUCKET_RECITATION_COVERS}/$coverPath"
    }

    fun getPublicAvatarUrl(avatarPath: String?): String {
        if (avatarPath.isNullOrBlank()) return ""
        if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
            return avatarPath
        }
        return "$storageBaseUrl/object/public/${SupabaseContracts.BUCKET_PROFILE_IMAGES}/$avatarPath"
    }
}

