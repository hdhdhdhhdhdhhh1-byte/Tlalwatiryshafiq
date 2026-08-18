package com.tilawatak.audio

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.repository.IRecitationRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Production Android Media3 / ExoPlayer Audio Engine for Tilawatak.
 * Plays authentic Quranic audio, integrates with device offline storage,
 * and publishes real-time reactive playback states.
 */
class Media3AudioPlayerService(
    private val context: Context,
    private val recitationRepository: IRecitationRepository,
    val offlineManager: OfflineAudioStorageManager = OfflineAudioStorageManager(context),
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main)
) : IAudioPlayerService {

    private val exoPlayer: ExoPlayer by lazy {
        ExoPlayer.Builder(context).build().apply {
            addListener(playerListener)
        }
    }

    private val _playbackState = MutableStateFlow(AudioPlaybackState())
    override val playbackState: StateFlow<AudioPlaybackState> = _playbackState.asStateFlow()

    private var progressTrackingJob: Job? = null
    private var hasDispatchedListenEvent: Boolean = false

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(state: Int) {
            when (state) {
                Player.STATE_BUFFERING -> {
                    _playbackState.value = _playbackState.value.copy(isBuffering = true)
                }
                Player.STATE_READY -> {
                    val duration = (exoPlayer.duration.coerceAtLeast(0) / 1000)
                    _playbackState.value = _playbackState.value.copy(
                        isBuffering = false,
                        totalDurationSeconds = if (duration > 0) duration else _playbackState.value.totalDurationSeconds
                    )
                }
                Player.STATE_ENDED -> {
                    _playbackState.value = _playbackState.value.copy(
                        isPlaying = false,
                        currentPositionSeconds = _playbackState.value.totalDurationSeconds
                    )
                    dispatchListenEvent(isCompleted = true)
                }
                Player.STATE_IDLE -> {
                    _playbackState.value = _playbackState.value.copy(
                        isPlaying = false,
                        isBuffering = false
                    )
                }
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _playbackState.value = _playbackState.value.copy(isPlaying = isPlaying)
            if (isPlaying) {
                startProgressTracker()
            } else {
                stopProgressTracker()
            }
        }
    }

    override fun playRecitation(recitation: Recitation) {
        hasDispatchedListenEvent = false
        val uri: Uri = offlineManager.getPlayableUri(recitation)

        val metadata = MediaMetadata.Builder()
            .setTitle(recitation.surahNameArabic)
            .setArtist(recitation.reciterName)
            .setDisplayTitle("${recitation.surahNameArabic} - ${recitation.riwayah}")
            .build()

        val mediaItem = MediaItem.Builder()
            .setUri(uri)
            .setMediaId(recitation.id)
            .setMediaMetadata(metadata)
            .build()

        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.playbackParameters = PlaybackParameters(_playbackState.value.playbackSpeed)
        exoPlayer.prepare()
        exoPlayer.play()

        val estimatedDuration = if (recitation.durationSeconds > 0) recitation.durationSeconds else 180L
        _playbackState.value = AudioPlaybackState(
            currentRecitation = recitation,
            isPlaying = true,
            currentPositionSeconds = 0,
            totalDurationSeconds = estimatedDuration,
            playbackSpeed = _playbackState.value.playbackSpeed,
            isBuffering = true
        )
    }

    override fun togglePlayPause() {
        if (exoPlayer.isPlaying) {
            pause()
        } else {
            resume()
        }
    }

    override fun pause() {
        exoPlayer.pause()
        _playbackState.value = _playbackState.value.copy(isPlaying = false)
    }

    override fun resume() {
        if (_playbackState.value.currentRecitation == null) return
        exoPlayer.play()
        _playbackState.value = _playbackState.value.copy(isPlaying = true)
    }

    override fun seekTo(seconds: Long) {
        val ms = seconds * 1000
        exoPlayer.seekTo(ms)
        _playbackState.value = _playbackState.value.copy(currentPositionSeconds = seconds)
    }

    override fun setPlaybackSpeed(speed: Float) {
        exoPlayer.playbackParameters = PlaybackParameters(speed)
        _playbackState.value = _playbackState.value.copy(playbackSpeed = speed)
    }

    override fun release() {
        stopProgressTracker()
        exoPlayer.removeListener(playerListener)
        exoPlayer.release()
        _playbackState.value = AudioPlaybackState()
    }

    private fun startProgressTracker() {
        progressTrackingJob?.cancel()
        progressTrackingJob = coroutineScope.launch {
            while (isActive) {
                if (exoPlayer.isPlaying) {
                    val currentPos = (exoPlayer.currentPosition.coerceAtLeast(0) / 1000)
                    val duration = (exoPlayer.duration.coerceAtLeast(0) / 1000)
                    _playbackState.value = _playbackState.value.copy(
                        currentPositionSeconds = currentPos,
                        totalDurationSeconds = if (duration > 0) duration else _playbackState.value.totalDurationSeconds
                    )

                    // Record listen event after listening for at least 15 seconds
                    if (currentPos >= 15 && !hasDispatchedListenEvent) {
                        hasDispatchedListenEvent = true
                        dispatchListenEvent(isCompleted = false)
                    }
                }
                delay(500)
            }
        }
    }

    private fun stopProgressTracker() {
        progressTrackingJob?.cancel()
        progressTrackingJob = null
    }

    private fun dispatchListenEvent(isCompleted: Boolean) {
        val current = _playbackState.value.currentRecitation ?: return
        coroutineScope.launch(Dispatchers.IO) {
            try {
                recitationRepository.recordListenEvent(
                    ListenEvent(
                        recitationId = current.id,
                        durationSeconds = _playbackState.value.currentPositionSeconds,
                        isCompleted = isCompleted,
                        timestamp = System.currentTimeMillis()
                    )
                )
            } catch (_: Exception) {}
        }
    }
}
