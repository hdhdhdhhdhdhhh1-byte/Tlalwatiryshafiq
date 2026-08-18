package com.tilawatak.data.remote.http

import com.tilawatak.data.remote.SupabaseConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Native, resilient HTTP Client for Supabase PostgREST, Storage, and RPC.
 * Runs on standard Android networking without requiring heavy third-party runtime frameworks.
 */
object SupabaseHttpClient {

    private const val CONNECT_TIMEOUT_MS = 15000
    private const val READ_TIMEOUT_MS = 20000

    suspend fun get(
        endpoint: String,
        queryParams: Map<String, String> = emptyMap()
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val queryString = if (queryParams.isNotEmpty()) {
                "?" + queryParams.entries.joinToString("&") { (k, v) ->
                    "${URLEncoder.encode(k, "UTF-8")}=${URLEncoder.encode(v, "UTF-8")}"
                }
            } else ""

            val fullUrl = "${SupabaseConfig.restBaseUrl}/$endpoint$queryString"
            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                setRequestProperty("apikey", SupabaseConfig.supabaseAnonKey)
                setRequestProperty("Authorization", "Bearer ${SupabaseConfig.supabaseAnonKey}")
                setRequestProperty("Accept", "application/json")
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                val response = BufferedReader(InputStreamReader(connection.inputStream)).use { it.readText() }
                Result.success(response)
            } else {
                val errorResponse = connection.errorStream?.let {
                    BufferedReader(InputStreamReader(it)).use { r -> r.readText() }
                } ?: "HTTP Error: $responseCode"
                Result.failure(Exception(errorResponse))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun post(
        endpoint: String,
        jsonBody: String,
        preferReturnRepresentation: Boolean = false
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val fullUrl = "${SupabaseConfig.restBaseUrl}/$endpoint"
            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("apikey", SupabaseConfig.supabaseAnonKey)
                setRequestProperty("Authorization", "Bearer ${SupabaseConfig.supabaseAnonKey}")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                if (preferReturnRepresentation) {
                    setRequestProperty("Prefer", "return=representation")
                }
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(jsonBody)
                writer.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                val response = BufferedReader(InputStreamReader(connection.inputStream)).use { it.readText() }
                Result.success(response)
            } else {
                val errorResponse = connection.errorStream?.let {
                    BufferedReader(InputStreamReader(it)).use { r -> r.readText() }
                } ?: "HTTP Error: $responseCode"
                Result.failure(Exception(errorResponse))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun rpc(
        rpcFunction: String,
        jsonBody: JSONObject
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val fullUrl = "${SupabaseConfig.restBaseUrl}/rpc/$rpcFunction"
            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("apikey", SupabaseConfig.supabaseAnonKey)
                setRequestProperty("Authorization", "Bearer ${SupabaseConfig.supabaseAnonKey}")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(jsonBody.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                val response = BufferedReader(InputStreamReader(connection.inputStream)).use { it.readText() }
                Result.success(response)
            } else {
                val errorResponse = connection.errorStream?.let {
                    BufferedReader(InputStreamReader(it)).use { r -> r.readText() }
                } ?: "HTTP RPC Error: $responseCode"
                Result.failure(Exception(errorResponse))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadFile(
        bucketName: String,
        filePath: String,
        fileBytes: ByteArray,
        mimeType: String = "audio/mpeg"
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val fullUrl = "${SupabaseConfig.storageBaseUrl}/object/$bucketName/$filePath"
            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 30000
                readTimeout = 60000
                doOutput = true
                setRequestProperty("apikey", SupabaseConfig.supabaseAnonKey)
                setRequestProperty("Authorization", "Bearer ${SupabaseConfig.supabaseAnonKey}")
                setRequestProperty("Content-Type", mimeType)
            }

            connection.outputStream.use { os ->
                os.write(fileBytes)
                os.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                Result.success(filePath)
            } else {
                val errorResponse = connection.errorStream?.let {
                    BufferedReader(InputStreamReader(it)).use { r -> r.readText() }
                } ?: "Storage Upload Error: $responseCode"
                Result.failure(Exception(errorResponse))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
