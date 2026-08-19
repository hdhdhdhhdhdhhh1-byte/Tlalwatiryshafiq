package com.tilawatak.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.repository.IAnnouncementRepository
import com.tilawatak.domain.repository.ICompetitionRepository
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IRewardRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val announcements: List<Announcement> = emptyList(),
    val competitions: List<Competition> = emptyList(),
    val featuredReciters: List<Reciter> = emptyList(),
    val topRecitations: List<Recitation> = emptyList(),
    val newestRecitations: List<Recitation> = emptyList(),
    val honors: List<ReciterHonor> = emptyList(),
    val errorMessage: String? = null
)

class HomeViewModel(
    private val reciterRepository: IReciterRepository,
    private val recitationRepository: IRecitationRepository,
    private val statisticsRepository: IStatisticsRepository,
    private val announcementRepository: IAnnouncementRepository? = null,
    private val competitionRepository: ICompetitionRepository? = null,
    private val rewardRepository: IRewardRepository? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val featuredResult = reciterRepository.getFeaturedReciters()
                val topRecitationsResult = statisticsRepository.getMostListenedRecitations(6)
                val newestRecitationsResult = statisticsRepository.getNewestRecitations(6)
                val announcements = announcementRepository?.getPublishedAnnouncements()?.getOrDefault(emptyList()) ?: emptyList()
                val competitions = competitionRepository?.getActiveCompetitions()?.getOrDefault(emptyList()) ?: emptyList()
                val honorsResult = rewardRepository?.getHonorsByReciter("")
                val honors = honorsResult?.getOrDefault(emptyList()) ?: emptyList()

                val featured = featuredResult.getOrDefault(emptyList())
                val topRecitations = topRecitationsResult.getOrDefault(emptyList())
                val newest = newestRecitationsResult.getOrDefault(emptyList())

                _uiState.value = HomeUiState(
                    isLoading = false,
                    announcements = announcements,
                    competitions = competitions,
                    featuredReciters = featured,
                    topRecitations = topRecitations,
                    newestRecitations = newest,
                    honors = honors
                )
            } catch (e: Exception) {
                _uiState.value = HomeUiState(
                    isLoading = false,
                    errorMessage = e.localizedMessage ?: "حدث خطأ أثناء تحميل الصفحة الرئيسية"
                )
            }
        }
    }

    fun toggleLike(recitationId: String, userId: String = "user_current") {
        viewModelScope.launch {
            val result = recitationRepository.toggleLike(recitationId, userId)
            result.onSuccess { likeResult ->
                _uiState.value = _uiState.value.copy(
                    topRecitations = _uiState.value.topRecitations.map {
                        if (it.id == recitationId) it.copy(isLiked = likeResult.isLiked, likeCount = likeResult.totalLikes) else it
                    },
                    newestRecitations = _uiState.value.newestRecitations.map {
                        if (it.id == recitationId) it.copy(isLiked = likeResult.isLiked, likeCount = likeResult.totalLikes) else it
                    }
                )
            }
        }
    }
}

