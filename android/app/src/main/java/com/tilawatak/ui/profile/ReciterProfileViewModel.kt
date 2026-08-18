package com.tilawatak.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ReciterProfileUiState(
    val isLoading: Boolean = true,
    val reciter: Reciter? = null,
    val recitations: List<Recitation> = emptyList(),
    val errorMessage: String? = null
)

/**
 * Dynamic ViewModel powering the single ReciterProfileScreen(reciterId).
 * Dynamically loads any reciter profile and displays approved recitations ordered newest published first.
 */
class ReciterProfileViewModel(
    private val reciterId: String,
    private val reciterRepository: IReciterRepository,
    private val recitationRepository: IRecitationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReciterProfileUiState())
    val uiState: StateFlow<ReciterProfileUiState> = _uiState.asStateFlow()

    init {
        loadReciterProfile()
    }

    fun loadReciterProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val reciterResult = reciterRepository.getReciterById(reciterId)
                val reciter = reciterResult.getOrNull()

                if (reciter == null) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "لم يتم العثور على القارئ المطلوب"
                        )
                    }
                    return@launch
                }

                val recitationsResult = recitationRepository.getRecitationsByReciter(reciterId)
                val recitations = recitationsResult.getOrDefault(emptyList())
                    .sortedByDescending { it.publishedAtEpochMs }

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        reciter = reciter,
                        recitations = recitations
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.localizedMessage ?: "تعذر تحميل بيانات القارئ"
                    )
                }
            }
        }
    }

    fun toggleLike(recitationId: String, installationId: String = "inst_anonymous_default") {
        viewModelScope.launch {
            val result = recitationRepository.toggleLike(recitationId, installationId)
            result.onSuccess { likeResult ->
                _uiState.update { state ->
                    state.copy(
                        recitations = state.recitations.map { r ->
                            if (r.id == recitationId) r.copy(isLiked = likeResult.isLiked, likeCount = likeResult.totalLikes) else r
                        }
                    )
                }
            }
        }
    }
}
