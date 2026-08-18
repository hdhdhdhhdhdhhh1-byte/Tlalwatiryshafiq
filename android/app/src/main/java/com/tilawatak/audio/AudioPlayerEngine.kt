package com.tilawatak.audio

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

data class AudioPlaybackState(
    val currentRecitation: Recitation? = null,
    val isPlaying: Boolean = false,
    val currentPositionSeconds: Long = 0,
    val totalDurationSeconds: Long = 0,
    val playbackSpeed: Float = 1.0f,
    val isBuffering: Boolean = false
)

interface IAudioPlayerService {
    val playbackState: StateFlow<AudioPlaybackState>
    fun playRecitation(recitation: Recitation)
    fun togglePlayPause()
    fun pause()
    fun resume()
    fun seekTo(seconds: Long)
    fun setPlaybackSpeed(speed: Float)
    fun release()
}

/**
 * Clean audio playback engine abstraction.
 * Simulates real audio playback timing with Coroutines, supports speed changes,
 * and records domain ListenEvents upon meaningful playback threshold.
 */
class MockAudioPlayerService(
    private val recitationRepository: IRecitationRepository,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main)
) : IAudioPlayerService {

    private val _playbackState = MutableStateFlow(AudioPlaybackState())
    override val playbackState: StateFlow<AudioPlaybackState> = _playbackState.asStateFlow()

    private var playbackJob: Job? = null
    private var hasDispatchedListenEvent: Boolean = false

    override fun playRecitation(recitation: Recitation) {
        playbackJob?.cancel()
        hasDispatchedListenEvent = false

        val duration = if (recitation.durationSeconds > 0) recitation.durationSeconds else 180L
        _playbackState.value = AudioPlaybackState(
            currentRecitation = recitation,
            isPlaying = true,
            currentPositionSeconds = 0,
            totalDurationSeconds = duration,
            playbackSpeed = _playbackState.value.playbackSpeed,
            isBuffering = false
        )

        startPlaybackLoop()
    }

    override fun togglePlayPause() {
        if (_playbackState.value.isPlaying) {
            pause()
        } else {
            resume()
        }
    }

    override fun pause() {
        playbackJob?.cancel()
        _playbackState.value = _playbackState.value.copy(isPlaying = false)
    }

    override fun resume() {
        if (_playbackState.value.currentRecitation == null) return
        _playbackState.value = _playbackState.value.copy(isPlaying = true)
        startPlaybackLoop()
    }

    override fun seekTo(seconds: Long) {
        val clamped = seconds.coerceIn(0, _playbackState.value.totalDurationSeconds)
        _playbackState.value = _playbackState.value.copy(currentPositionSeconds = clamped)
    }

    override fun setPlaybackSpeed(speed: Float) {
        _playbackState.value = _playbackState.value.copy(playbackSpeed = speed)
    }

    override fun release() {
        playbackJob?.cancel()
        _playbackState.value = AudioPlaybackState()
    }

    private fun startPlaybackLoop() {
        playbackJob?.cancel()
        playbackJob = coroutineScope.launch {
            while (isActive && _playbackState.value.isPlaying) {
                val speed = _playbackState.value.playbackSpeed
                val stepDelay = (1000L / speed).toLong().coerceAtLeast(200L)
                delay(stepDelay)

                val currentState = _playbackState.value
                val nextPos = currentState.currentPositionSeconds + 1

                // Threshold check: when user listens for at least 5 seconds, dispatch domain ListenEvent
                if (nextPos >= 5 && !hasDispatchedListenEvent && currentState.currentRecitation != null) {
                    hasDispatchedListenEvent = true
                    val rec = currentState.currentRecitation
                    recitationRepository.recordListenEvent(
                        ListenEvent(
                            recitationId = rec.id,
                            reciterId = rec.reciterId,
                            durationSeconds = nextPos,
                            completed = false
                        )
                    )
                }

                if (nextPos >= currentState.totalDurationSeconds) {
                    _playbackState.value = currentState.copy(
                        currentPositionSeconds = currentState.totalDurationSeconds,
                        isPlaying = false
                    )
                    break
                } else {
                    _playbackState.value = currentState.copy(currentPositionSeconds = nextPos)
                }
            }
        }
    }
}
