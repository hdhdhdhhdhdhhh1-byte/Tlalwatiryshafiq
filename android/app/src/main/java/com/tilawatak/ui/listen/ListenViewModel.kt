package com.tilawatak.ui.listen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ListenUiState(
    val isLoading: Boolean = true,
    val searchQuery: String = "",
    val activeTab: ListenTab = ListenTab.ALL,
    val mostListenedRecitations: List<Recitation> = emptyList(),
    val mostLikedRecitations: List<Recitation> = emptyList(),
    val newestRecitations: List<Recitation> = emptyList(),
    val featuredReciters: List<Reciter> = emptyList(),
    val newestReciters: List<Reciter> = emptyList(),
    val searchResults: List<Recitation> = emptyList(),
    val isSearching: Boolean = false,
    val errorMessage: String? = null
)

enum class ListenTab(val title: String) {
    ALL("الكل"),
    MOST_LISTENED("الأكثر استماعًا"),
    MOST_LIKED("الأكثر إعجابًا"),
    NEWEST("أحدث التلاوات"),
    RECITERS("القراء")
}

class ListenViewModel(
    private val reciterRepository: IReciterRepository,
    private val recitationRepository: IRecitationRepository,
    private val statisticsRepository: IStatisticsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ListenUiState())
    val uiState: StateFlow<ListenUiState> = _uiState.asStateFlow()

    init {
        loadDiscoveryData()
    }

    fun loadDiscoveryData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val mostListenedResult = statisticsRepository.getMostListenedRecitations(10)
                val mostLikedResult = statisticsRepository.getMostLikedRecitations(10)
                val newestRecitationsResult = statisticsRepository.getNewestRecitations(10)
                val featuredRecitersResult = reciterRepository.getFeaturedReciters()
                val newestRecitersResult = reciterRepository.getNewestReciters(10)

                if (mostListenedResult.isFailure && featuredRecitersResult.isFailure) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "تعذر الاتصال بقاعدة البيانات\nتحقق من اتصال الإنترنت وحاول مرة أخرى"
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            mostListenedRecitations = mostListenedResult.getOrDefault(emptyList()),
                            mostLikedRecitations = mostLikedResult.getOrDefault(emptyList()),
                            newestRecitations = newestRecitationsResult.getOrDefault(emptyList()),
                            featuredReciters = featuredRecitersResult.getOrDefault(emptyList()),
                            newestReciters = newestRecitersResult.getOrDefault(emptyList()),
                            errorMessage = null
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "تعذر الاتصال بقاعدة البيانات\nتحقق من اتصال الإنترنت وحاول مرة أخرى"
                    )
                }
            }
        }
    }


    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        performSearch(query)
    }

    fun selectTab(tab: ListenTab) {
        _uiState.update { it.copy(activeTab = tab) }
    }

    private fun performSearch(query: String) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) {
            _uiState.update { it.copy(isSearching = false, searchResults = emptyList()) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSearching = true) }
            val allRecitations = recitationRepository.getRecitationsStream()
            recitationRepository.getRecitationsStream().collect { list ->
                val filtered = list.filter { r ->
                    r.surahNameArabic.contains(q) ||
                            r.reciterName.lowercase().contains(q) ||
                            r.riwayah.lowercase().contains(q)
                }
                _uiState.update {
                    it.copy(isSearching = false, searchResults = filtered)
                }
            }
        }
    }

    fun toggleLike(recitationId: String, userId: String = "user_current") {
        viewModelScope.launch {
            val result = recitationRepository.toggleLike(recitationId, userId)
            result.onSuccess { likeResult ->
                _uiState.update { state ->
                    val updateItem: (Recitation) -> Recitation = { r ->
                        if (r.id == recitationId) r.copy(isLiked = likeResult.isLiked, likeCount = likeResult.totalLikes) else r
                    }
                    state.copy(
                        mostListenedRecitations = state.mostListenedRecitations.map(updateItem),
                        mostLikedRecitations = state.mostLikedRecitations.map(updateItem),
                        newestRecitations = state.newestRecitations.map(updateItem),
                        searchResults = state.searchResults.map(updateItem)
                    )
                }
            }
        }
    }
}
