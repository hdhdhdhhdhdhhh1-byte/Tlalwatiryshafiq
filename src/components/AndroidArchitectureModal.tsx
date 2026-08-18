import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, Layers, FileCode, Cpu, ShieldCheck } from 'lucide-react';

interface AndroidArchitectureModalProps {
  onClose: () => void;
}

export const AndroidArchitectureModal: React.FC<AndroidArchitectureModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'kotlin_models' | 'repository' | 'compose_ui' | 'audio_engine'>('architecture');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    architecture: `// Project Structure: Clean Architecture + MVVM (TilawatakLilAlam)
//
// 📁 app/
//   ├── 📁 core/
//   │     ├── 📄 Result.kt
//   │     └── 📄 DispatcherProvider.kt
//   ├── 📁 domain/
//   │     ├── 📁 model/
//   │     │     ├── 📄 Reciter.kt
//   │     │     ├── 📄 Recitation.kt
//   │     │     └── 📄 RecitationSubmission.kt
//   │     └── 📁 repository/
//   │           ├── 📄 IReciterRepository.kt
//   │           ├── 📄 IRecitationRepository.kt
//   │           └── 📄 ISubmissionRepository.kt
//   ├── 📁 data/
//   │     ├── 📁 local/ (Room / DataStore)
//   │     ├── 📁 remote/ (Retrofit / Ktor / Firestore)
//   │     └── 📁 repository/
//   │           ├── 📄 ReciterRepositoryImpl.kt
//   │           └── 📄 RecitationRepositoryImpl.kt
//   ├── 📁 audio/
//   │     ├── 📄 TilawatakAudioPlayer.kt (Media3 / ExoPlayer Service)
//   │     └── 📄 PlayerNotificationManager.kt
//   ├── 📁 presentation/
//   │     ├── 📁 navigation/
//   │     │     └── 📄 TilawatakNavHost.kt
//   │     ├── 📁 home/
//   │     │     ├── 📄 HomeScreen.kt
//   │     │     └── 📄 HomeViewModel.kt
//   │     ├── 📁 listen/
//   │     │     ├── 📄 ListenScreen.kt
//   │     │     └── 📄 ListenViewModel.kt
//   │     ├── 📁 player/
//   │     │     ├── 📄 AudioPlayerBottomSheet.kt
//   │     │     └── 📄 PlayerViewModel.kt
//   │     └── 📁 submit/
//   │           ├── 📄 SubmitRecitationScreen.kt
//   │           └── 📄 SubmissionViewModel.kt
//   └── 📁 ui/
//         └── 📁 theme/
//               ├── 📄 Color.kt (PrimaryGreen #315F4A, DeepGreen #102A20, Gold #C9A961)
//               ├── 📄 Type.kt (Arabic Tajawal / Amiri)
//               └── 📄 Theme.kt (Material 3 Theme)`,

    kotlin_models: `package com.tilawatak.domain.model

data class Reciter(
    val id: String,
    val displayName: String,
    val pseudonym: String? = null,
    val isAnonymous: Boolean = false,
    val gender: Gender = Gender.MALE,
    val country: String,
    val bio: String,
    val avatarUrl: String,
    val verified: Boolean = false,
    val isStaffPick: Boolean = false,
    val stats: ReciterStats = ReciterStats()
)

data class ReciterStats(
    val totalRecitations: Int = 0,
    val totalListens: Long = 0,
    val totalLikes: Long = 0
)

data class Recitation(
    val id: String,
    val reciterId: String,
    val reciterName: String,
    val reciterAvatar: String,
    val reciterCountry: String,
    val surahNumber: Int,
    val surahNameArabic: String,
    val ayahRange: String = "كاملة",
    val riwayah: String = "حفص عن عاصم",
    val durationSeconds: Long,
    val audioUrl: String,
    val coverUrl: String? = null,
    val listenCount: Long = 0,
    val likeCount: Long = 0,
    val isLiked: Boolean = false,
    val isStaffPick: Boolean = false
)

data class ListenEvent(
    val recitationId: String,
    val reciterId: String? = null,
    val durationSeconds: Long = 0,
    val timestampEpochMs: Long = System.currentTimeMillis(),
    val completed: Boolean = false
)

data class LikeResult(
    val isLiked: Boolean,
    val totalLikes: Long
)

enum class SubmissionStatus {
    PENDING,
    APPROVED,
    REJECTED
}

data class RecitationSubmission(
    val id: String,
    val displayName: String,
    val pseudonym: String? = null,
    val usePseudonym: Boolean = false,
    val country: String,
    val surahName: String,
    val ayahRange: String,
    val riwayah: String,
    val audioUri: String,
    val status: SubmissionStatus = SubmissionStatus.PENDING,
    val adminNotes: String? = null
)`,

    repository: `package com.tilawatak.domain.repository

import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.ListenEvent
import com.tilawatak.domain.model.LikeResult
import kotlinx.coroutines.flow.Flow

/**
 * Reciters domain repository
 */
interface IReciterRepository {
    fun getRecitersStream(): Flow<List<Reciter>>
    suspend fun getReciterById(id: String): Result<Reciter?>
    suspend fun getFeaturedReciters(): Result<List<Reciter>>
    suspend fun searchReciters(query: String): Result<List<Reciter>>
    suspend fun getNewestReciters(limit: Int = 10): Result<List<Reciter>>
}

/**
 * Recitations domain repository
 */
interface IRecitationRepository {
    fun getRecitationsStream(): Flow<List<Recitation>>
    suspend fun getRecitationsByReciter(reciterId: String): Result<List<Recitation>>
    suspend fun toggleLike(recitationId: String, userId: String): Result<LikeResult>
    suspend fun recordListenEvent(event: ListenEvent): Result<Unit>
}

/**
 * Statistics and rankings domain repository
 */
interface IStatisticsRepository {
    suspend fun getMostListenedRecitations(limit: Int = 10): Result<List<Recitation>>
    suspend fun getMostLikedRecitations(limit: Int = 10): Result<List<Recitation>>
    suspend fun getMostListenedReciters(limit: Int = 10): Result<List<Reciter>>
    suspend fun getMostLikedReciters(limit: Int = 10): Result<List<Reciter>>
    suspend fun getNewestRecitations(limit: Int = 10): Result<List<Recitation>>
}

/**
 * Submissions domain repository
 */
interface ISubmissionRepository {
    suspend fun submitRecitation(submission: RecitationSubmission): Result<RecitationSubmission>
    fun getUserSubmissions(): Flow<List<RecitationSubmission>>
}`,

    compose_ui: `package com.tilawatak.presentation.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tilawatak.presentation.components.HomeHeroSection
import com.tilawatak.presentation.components.HomeActionCards
import com.tilawatak.presentation.components.RecitationRow

@Composable
fun HomeScreen(
    onNavigateToListen: () -> Unit,
    onNavigateToSubmit: () -> Unit,
    onNavigateToFeatured: () -> Unit,
    onRecitationClick: (String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TilawatakTopAppBar(title = "تلاوتك للعالم") }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                HomeHeroSection(
                    title = "تلاوتك للعالم",
                    slogan = "انشر تلاوتك... واكتشف أصوات القرآن من حول العالم",
                    onExplore = onNavigateToListen
                )
            }
            item {
                HomeActionCards(
                    onListen = onNavigateToListen,
                    onSubmit = onNavigateToSubmit,
                    onFeatured = onNavigateToFeatured
                )
            }
        }
    }
}`,

    audio_engine: `package com.tilawatak.audio

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.tilawatak.domain.model.Recitation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TilawatakAudioEngine @Inject constructor(
    private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    private val _currentRecitation = MutableStateFlow<Recitation?>(null)
    val currentRecitation: StateFlow<Recitation?> = _currentRecitation

    fun initialize() {
        exoPlayer = ExoPlayer.Builder(context).build().apply {
            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(playing: Boolean) {
                    _isPlaying.value = playing
                }
            })
        }
    }

    fun play(recitation: Recitation) {
        _currentRecitation.value = recitation
        val mediaItem = MediaItem.fromUri(recitation.audioUrl)
        exoPlayer?.apply {
            setMediaItem(mediaItem)
            prepare()
            play()
        }
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
    }

    fun setSpeed(speed: Float) {
        exoPlayer?.setPlaybackSpeed(speed)
    }
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#102A20] text-[#FAFBF9] rounded-3xl w-full max-w-3xl border border-[#C9A961]/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-5 bg-black/30 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#315F4A] flex items-center justify-center text-[#C9A961]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white font-amiri">
                بنية وهندسة كود أندرويد النظيفة (Clean Architecture)
              </h3>
              <p className="text-xs text-[#C9A961]">
                Kotlin • Jetpack Compose • Material 3 • MVVM • Media3
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-3 bg-black/20 border-b border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-[#315F4A] text-white'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>هيكل المشروع الكامل</span>
          </button>

          <button
            onClick={() => setActiveTab('kotlin_models')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'kotlin_models'
                ? 'bg-[#315F4A] text-white'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>نماذج Domain Models</span>
          </button>

          <button
            onClick={() => setActiveTab('repository')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'repository'
                ? 'bg-[#315F4A] text-white'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>واجهات Repository</span>
          </button>

          <button
            onClick={() => setActiveTab('compose_ui')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'compose_ui'
                ? 'bg-[#315F4A] text-white'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Compose UI Screen</span>
          </button>

          <button
            onClick={() => setActiveTab('audio_engine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'audio_engine'
                ? 'bg-[#315F4A] text-white'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>محرك الصوت Media3</span>
          </button>
        </div>

        {/* Code Content Area */}
        <div className="relative flex-1 p-4 overflow-y-auto bg-black/40 font-mono text-xs text-[#E2E5DF]" dir="ltr">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans flex items-center gap-1.5 transition-colors z-10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الكود</span>
              </>
            )}
          </button>

          <pre className="p-2 whitespace-pre-wrap break-words leading-relaxed">
            {codeSnippets[activeTab]}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-between text-xs text-[#7A847E]">
          <span>هيكل برمجي نظيف متوافق مع معايير Google Android Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
