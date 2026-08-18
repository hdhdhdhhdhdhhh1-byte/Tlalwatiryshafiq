package com.tilawatak.ui.player

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tilawatak.ui.components.AudioWaveformVisualizer
import com.tilawatak.ui.components.ErrorState
import com.tilawatak.ui.components.LoadingState
import com.tilawatak.ui.components.formatCount
import com.tilawatak.ui.components.formatDuration
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.GoldLight
import com.tilawatak.ui.theme.LightGray
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecitationPlayerScreen(
    viewModel: PlayerViewModel,
    onNavigateBack: () -> Unit,
    onReciterClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "مشغل التلاوة",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = DeepGreen
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "رجوع",
                            tint = DeepGreen
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                LoadingState(
                    message = "جارٍ تجهيز مشغل الصوت...",
                    modifier = Modifier.padding(paddingValues)
                )
            }
            uiState.errorMessage != null || uiState.recitation == null -> {
                ErrorState(
                    message = uiState.errorMessage ?: "تعذر تشغيل التلاوة",
                    onRetry = { viewModel.loadRecitation() },
                    modifier = Modifier.padding(paddingValues)
                )
            }
            else -> {
                val recitation = uiState.recitation!!
                val playback = uiState.playbackState

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // 1. Reciter & Surah Art Card
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f, fill = false)
                            .clip(RoundedCornerShape(20.dp))
                            .border(1.5.dp, BorderColor, RoundedCornerShape(20.dp)),
                        color = SurfaceWhite,
                        shadowElevation = 2.dp
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(LightGray.copy(alpha = 0.5f), SurfaceWhite)
                                    )
                                )
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                // Emblem / Reciter Avatar
                                Box(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(CircleShape)
                                        .background(
                                            Brush.linearGradient(listOf(PrimaryGreen.copy(alpha = 0.2f), GoldLight))
                                        )
                                        .border(3.dp, Gold, CircleShape)
                                        .clickable { onReciterClick(recitation.reciterId) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = recitation.reciterName.take(1),
                                        style = MaterialTheme.typography.displayLarge.copy(color = DeepGreen)
                                    )
                                }

                                Spacer(modifier = Modifier.height(18.dp))

                                // Surah Name & Ayah
                                Text(
                                    text = "سورة ${recitation.surahNameArabic}",
                                    style = MaterialTheme.typography.displayMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = DeepGreen
                                    ),
                                    textAlign = TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = recitation.ayahRange,
                                    style = MaterialTheme.typography.titleMedium.copy(color = Gold),
                                    textAlign = TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                // Reciter Display Name (Clickable)
                                Row(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { onReciterClick(recitation.reciterId) }
                                        .padding(horizontal = 10.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Person,
                                        contentDescription = null,
                                        tint = PrimaryGreen,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = recitation.reciterName,
                                        style = MaterialTheme.typography.bodyLarge.copy(
                                            fontWeight = FontWeight.SemiBold,
                                            color = PrimaryGreen
                                        )
                                    )
                                }

                                // Riwayah & Origin Badge
                                Spacer(modifier = Modifier.height(4.dp))
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = LightGray,
                                    modifier = Modifier.padding(top = 4.dp)
                                ) {
                                    Text(
                                        text = "برواية ${recitation.riwayah} • ${recitation.reciterCountry}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = SoftGray,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                // Waveform Visualizer
                                AudioWaveformVisualizer(
                                    isPlaying = playback.isPlaying,
                                    modifier = Modifier
                                        .fillMaxWidth(0.7f)
                                        .height(30.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. Playback Speed Selector (0.75x, 1.0x, 1.25x, 1.5x, 2.0x)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val speeds = listOf(0.75f, 1.0f, 1.25f, 1.5f, 2.0f)
                        speeds.forEach { speed ->
                            val isSelected = (playback.playbackSpeed == speed)
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.setPlaybackSpeed(speed) },
                                label = {
                                    Text(
                                        text = "${speed}x",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = PrimaryGreen,
                                    selectedLabelColor = SurfaceWhite,
                                    containerColor = SurfaceWhite,
                                    labelColor = DeepGreen
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    enabled = true,
                                    selected = isSelected,
                                    borderColor = if (isSelected) PrimaryGreen else BorderColor
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // 3. Progress Slider & Timestamps
                    Column(modifier = Modifier.fillMaxWidth()) {
                        val maxDuration = if (playback.totalDurationSeconds > 0) playback.totalDurationSeconds else recitation.durationSeconds
                        var isDragging by remember { mutableStateOf(false) }
                        var dragPosition by remember { mutableStateOf(0f) }

                        Slider(
                            value = if (isDragging) dragPosition else playback.currentPositionSeconds.toFloat(),
                            onValueChange = {
                                isDragging = true
                                dragPosition = it
                            },
                            onValueChangeFinished = {
                                isDragging = false
                                viewModel.seekTo(dragPosition.toLong())
                            },
                            valueRange = 0f..maxDuration.toFloat().coerceAtLeast(1f),
                            colors = SliderDefaults.colors(
                                thumbColor = PrimaryGreen,
                                activeTrackColor = PrimaryGreen,
                                inactiveTrackColor = BorderColor
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = formatDuration(if (isDragging) dragPosition.toLong() else playback.currentPositionSeconds),
                                style = MaterialTheme.typography.labelSmall,
                                color = SoftGray
                            )
                            Text(
                                text = formatDuration(maxDuration),
                                style = MaterialTheme.typography.labelSmall,
                                color = SoftGray
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // 4. Player Controls (Rewind 10s, Play/Pause, Forward 10s)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Rewind 10s
                        IconButton(
                            onClick = { viewModel.seekTo(playback.currentPositionSeconds - 10) },
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Replay10,
                                contentDescription = "تأخير 10 ثوانٍ",
                                tint = DeepGreen,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(20.dp))

                        // Big Play / Pause Button
                        IconButton(
                            onClick = { viewModel.togglePlayPause() },
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(PrimaryGreen)
                                .border(3.dp, Gold, CircleShape)
                        ) {
                            Icon(
                                imageVector = if (playback.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = if (playback.isPlaying) "إيقاف مؤقت" else "تشغيل",
                                tint = SurfaceWhite,
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(20.dp))

                        // Forward 10s
                        IconButton(
                            onClick = { viewModel.seekTo(playback.currentPositionSeconds + 10) },
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Forward10,
                                contentDescription = "تقديم 10 ثوانٍ",
                                tint = DeepGreen,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 5. Actions Footer (Like, Total Listens, Share)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceWhite, RoundedCornerShape(14.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(14.dp))
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Like Button with subtle animation
                        val scale by animateFloatAsState(
                            targetValue = if (recitation.isLiked) 1.25f else 1.0f,
                            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                            label = "PlayerLikeScale"
                        )
                        val iconColor by animateColorAsState(
                            targetValue = if (recitation.isLiked) Color(0xFFE53935) else SoftGray,
                            label = "PlayerLikeColor"
                        )

                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { viewModel.toggleLike() }
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (recitation.isLiked) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder,
                                contentDescription = if (recitation.isLiked) "إلغاء الإعجاب" else "إعجاب",
                                tint = iconColor,
                                modifier = Modifier
                                    .size(24.dp)
                                    .scale(scale)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = formatCount(recitation.likeCount),
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                color = if (recitation.isLiked) Color(0xFFE53935) else DeepGreen
                            )
                        }

                        // Total Listens Count
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Headphones,
                                contentDescription = null,
                                tint = SoftGray,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${formatCount(recitation.listenCount)} استماع",
                                style = MaterialTheme.typography.labelSmall,
                                color = SoftGray
                            )
                        }

                        // Share Action
                        IconButton(onClick = { /* Share action */ }) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "مشاركة التلاوة",
                                tint = DeepGreen
                            )
                        }
                    }
                }
            }
        }
    }
}
