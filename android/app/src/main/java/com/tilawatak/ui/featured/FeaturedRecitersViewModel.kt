package com.tilawatak.ui.featured

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FeaturedUiState(
    val isLoading: Boolean = true,
    val activeCategory: FeaturedCategory = FeaturedCategory.MOST_LISTENED,
    val reciters: List<Reciter> = emptyList(),
    val errorMessage: String? = null
)

enum class FeaturedCategory(val title: String) {
    MOST_LISTENED("🔥 الأكثر استماعًا"),
    MOST_LIKED("❤️ الأكثر إعجابًا"),
    STAFF_PICKS("⭐ اختيار الإدارة"),
    NEWEST("🆕 القراء الجدد")
}

class FeaturedRecitersViewModel(
    private val reciterRepository: IReciterRepository,
    private val statisticsRepository: IStatisticsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeaturedUiState())
    val uiState: StateFlow<FeaturedUiState> = _uiState.asStateFlow()

    init {
        loadReciters(FeaturedCategory.MOST_LISTENED)
    }

    fun selectCategory(category: FeaturedCategory) {
        _uiState.update { it.copy(activeCategory = category) }
        loadReciters(category)
    }

    fun loadReciters(category: FeaturedCategory) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val result: Result<List<Reciter>> = when (category) {
                    FeaturedCategory.MOST_LISTENED -> statisticsRepository.getMostListenedReciters(20)
                    FeaturedCategory.MOST_LIKED -> statisticsRepository.getMostLikedReciters(20)
                    FeaturedCategory.STAFF_PICKS -> reciterRepository.getFeaturedReciters()
                    FeaturedCategory.NEWEST -> reciterRepository.getNewestReciters(20)
                }

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        reciters = result.getOrDefault(emptyList())
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.localizedMessage ?: "حدث خطأ أثناء تحميل القراء"
                    )
                }
            }
        }
    }
}
