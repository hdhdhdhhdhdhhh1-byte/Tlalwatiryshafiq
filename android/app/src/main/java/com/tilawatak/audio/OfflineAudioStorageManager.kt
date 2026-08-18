package com.tilawatak.audio

import android.content.Context
import android.net.Uri
import com.tilawatak.domain.model.Recitation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Offline Audio Storage Manager for Tilawatak
 * Safely downloads, caches, and verifies real Quranic audio MP3 files on Android storage.
 * Seamlessly resolves playable URIs (local file URI when offline/downloaded, remote URL otherwise).
 */
class OfflineAudioStorageManager(private val context: Context) {

    private val storageDir: File by lazy {
        File(context.filesDir, "tilawatak_offline_audio").apply {
            if (!exists()) {
                mkdirs()
            }
        }
    }

    private val _downloadedIds = MutableStateFlow<Set<String>>(emptySet())
    val downloadedIds: StateFlow<Set<String>> = _downloadedIds.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO)

    init {
        refreshDownloadedIds()
    }

    fun refreshDownloadedIds() {
        scope.launch {
            val files = storageDir.listFiles() ?: emptyArray()
            val ids = files.filter { it.isFile && it.length() > 0 }
                .map { it.nameWithoutExtension }
                .toSet()
            _downloadedIds.value = ids
        }
    }

    fun isDownloaded(recitationId: String): Boolean {
        val file = getAudioFile(recitationId)
        return file.exists() && file.length() > 0
    }

    fun getAudioFile(recitationId: String): File {
        return File(storageDir, "${recitationId}.mp3")
    }

    fun getPlayableUri(recitation: Recitation): Uri {
        val file = getAudioFile(recitation.id)
        return if (file.exists() && file.length() > 0) {
            Uri.fromFile(file)
        } else {
            Uri.parse(recitation.audioUrl)
        }
    }

    suspend fun downloadRecitation(
        recitation: Recitation,
        onProgress: (Float) -> Unit = {}
    ): Result<File> = withContext(Dispatchers.IO) {
        val destinationFile = getAudioFile(recitation.id)
        val tempFile = File(storageDir, "${recitation.id}.tmp")

        try {
            val url = URL(recitation.audioUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 30000
            connection.instanceFollowRedirects = true
            connection.connect()

            if (connection.responseCode !in 200..299) {
                return@withContext Result.failure(Exception("HTTP Error: ${connection.responseCode}"))
            }

            val totalLength = connection.contentLength
            var inputStream: InputStream? = null
            var outputStream: FileOutputStream? = null

            try {
                inputStream = connection.inputStream
                outputStream = FileOutputStream(tempFile)

                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalBytesRead: Long = 0

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    totalBytesRead += bytesRead
                    if (totalLength > 0) {
                        val progress = totalBytesRead.toFloat() / totalLength.toFloat()
                        withContext(Dispatchers.Main) {
                            onProgress(progress)
                        }
                    }
                }

                outputStream.flush()
            } finally {
                outputStream?.close()
                inputStream?.close()
                connection.disconnect()
            }

            if (tempFile.exists() && tempFile.length() > 0) {
                if (destinationFile.exists()) {
                    destinationFile.delete()
                }
                tempFile.renameTo(destinationFile)
                refreshDownloadedIds()
                Result.success(destinationFile)
            } else {
                tempFile.delete()
                Result.failure(Exception("Downloaded file was empty"))
            }
        } catch (e: Exception) {
            if (tempFile.exists()) {
                tempFile.delete()
            }
            Result.failure(e)
        }
    }

    fun deleteDownloaded(recitationId: String): Boolean {
        val file = getAudioFile(recitationId)
        val deleted = if (file.exists()) file.delete() else false
        refreshDownloadedIds()
        return deleted
    }
}
