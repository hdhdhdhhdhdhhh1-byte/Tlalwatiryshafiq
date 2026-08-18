package com.tilawatak.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.audio.AudioPlaybackState
import com.tilawatak.audio.IAudioPlayerService
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.repository.IRecitationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PlayerUiState(
    val isLoading: Boolean = true,
    val recitation: Recitation? = null,
    val playbackState: AudioPlaybackState = AudioPlaybackState(),
    val errorMessage: String? = null
)

class PlayerViewModel(
    private val targetRecitationId: String,
    private val recitationRepository: IRecitationRepository,
    private val audioPlayerService: IAudioPlayerService
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    init {
        observeAudioPlayback()
        loadRecitation()
    }

    private fun observeAudioPlayback() {
        viewModelScope.launch {
            audioPlayerService.playbackState.collect { playbackState ->
                _uiState.update { it.copy(playbackState = playbackState) }
            }
        }
    }

    fun loadRecitation() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            recitationRepository.getRecitationsStream().collect { list ->
                val recitation = list.find { it.id == targetRecitationId }
                if (recitation != null) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            recitation = recitation
                        )
                    }
                    // Auto-start playback if it's a newly loaded recitation
                    if (audioPlayerService.playbackState.value.currentRecitation?.id != targetRecitationId) {
                        audioPlayerService.playRecitation(recitation)
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "تعذر العثور على التلاوة المطلوبة"
                        )
                    }
                }
            }
        }
    }

    fun togglePlayPause() {
        audioPlayerService.togglePlayPause()
    }

    fun seekTo(seconds: Long) {
        audioPlayerService.seekTo(seconds)
    }

    fun setPlaybackSpeed(speed: Float) {
        audioPlayerService.setPlaybackSpeed(speed)
    }

    fun toggleLike(userId: String = "user_current") {
        val currentRec = _uiState.value.recitation ?: return
        viewModelScope.launch {
            val result = recitationRepository.toggleLike(currentRec.id, userId)
            result.onSuccess { likeResult ->
                _uiState.update { state ->
                    state.copy(
                        recitation = state.recitation?.copy(
                            isLiked = likeResult.isLiked,
                            likeCount = likeResult.totalLikes
                        )
                    )
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        // Audio playback lifecycle cleanup
    }
}
