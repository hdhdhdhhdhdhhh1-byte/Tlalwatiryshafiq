package com.tilawatak.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.InfiniteRepeatableSpec
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.ErrorRed
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.GoldLight
import com.tilawatak.ui.theme.LightGray
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite
import com.tilawatak.ui.theme.VerifiedBlue

/**
 * Animated Audio Waveform / Equalizer Visualizer
 */
@Composable
fun AudioWaveformVisualizer(
    isPlaying: Boolean,
    modifier: Modifier = Modifier,
    barColor: Color = Gold,
    barCount: Int = 4
) {
    val infiniteTransition = rememberInfiniteTransition(label = "WaveformAnim")
    
    val heights = (0 until barCount).map { index ->
        if (isPlaying) {
            val animDuration = 400 + index * 120
            val fraction by infiniteTransition.animateFloat(
                initialValue = 0.25f,
                targetValue = 1.0f,
                animationSpec = infiniteRepeatable(
                    animation = tween(durationMillis = animDuration, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "barHeight$index"
            )
            fraction
        } else {
            0.3f
        }
    }

    Row(
        modifier = modifier.height(18.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        heights.forEach { fraction ->
            val barHeight = (18 * fraction).coerceAtLeast(4f).dp
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(barHeight)
                    .clip(RoundedCornerShape(2.dp))
                    .background(barColor)
            )
        }
    }
}

/**
 * Reusable Loading State
 */
@Composable
fun LoadingState(
    message: String = "جارٍ التحميل...",
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = PrimaryGreen,
            strokeWidth = 3.dp,
            modifier = Modifier.size(44.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = SoftGray
        )
    }
}

/**
 * Reusable Empty State
 */
@Composable
fun EmptyState(
    title: String = "لا توجد عناصر متاحة",
    description: String = "لم نجد أي محتوى لعرضه في الوقت الحالي.",
    icon: ImageVector = Icons.Outlined.Info,
    onActionClick: (() -> Unit)? = null,
    actionLabel: String? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(LightGray),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = SoftGray,
                modifier = Modifier.size(32.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = DeepGreen,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium,
            color = SoftGray,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        if (onActionClick != null && actionLabel != null) {
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = onActionClick,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(text = actionLabel, color = SurfaceWhite, fontWeight = FontWeight.Bold)
            }
        }
    }
}

/**
 * Reusable Error State
 */
@Composable
fun ErrorState(
    message: String = "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(ErrorRed.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Refresh,
                contentDescription = null,
                tint = ErrorRed,
                modifier = Modifier.size(32.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "تعذر تحميل البيانات",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = DeepGreen
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = SoftGray,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
            shape = RoundedCornerShape(10.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Refresh,
                contentDescription = null,
                tint = SurfaceWhite,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = "إعادة المحاولة", color = SurfaceWhite, fontWeight = FontWeight.Bold)
        }
    }
}

/**
 * Reusable Section Header
 */
@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    onSeeAllClick: (() -> Unit)? = null,
    seeAllLabel: String = "عرض الكل",
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = DeepGreen
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = SoftGray
                )
            }
        }
        if (onSeeAllClick != null) {
            Text(
                text = seeAllLabel,
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = PrimaryGreen
                ),
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(onClick = onSeeAllClick)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

/**
 * Animated Like Button (♡ / ♥)
 */
@Composable
fun LikeButton(
    isLiked: Boolean,
    likeCount: Long,
    onToggleLike: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scale by animateFloatAsState(
        targetValue = if (isLiked) 1.22f else 1.0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "LikeButtonScale"
    )

    val iconColor by animateColorAsState(
        targetValue = if (isLiked) Color(0xFFE53935) else SoftGray,
        label = "LikeButtonColor"
    )

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onToggleLike)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
            contentDescription = if (isLiked) "إلغاء الإعجاب" else "إعجاب",
            tint = iconColor,
            modifier = Modifier
                .size(20.dp)
                .scale(scale)
        )
        if (likeCount > 0) {
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = formatCount(likeCount),
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = if (isLiked) Color(0xFFE53935) else SoftGray
            )
        }
    }
}

/**
 * Reusable Reciter Card
 */
@Composable
fun ReciterCard(
    reciter: Reciter,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    rank: Int? = null
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        color = SurfaceWhite,
        shadowElevation = 1.5.dp
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(contentAlignment = Alignment.TopStart) {
                // Avatar with gold border & initials
                Box(contentAlignment = Alignment.BottomEnd) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        PrimaryGreen.copy(alpha = 0.15f),
                                        GoldLight.copy(alpha = 0.4f)
                                    )
                                )
                            )
                            .border(2.5.dp, if (reciter.verified) VerifiedBlue else Gold, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = reciter.displayName.take(1),
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = DeepGreen,
                                fontSize = 24.sp
                            )
                        )
                    }
                    if (reciter.verified) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "قارئ موثق",
                            tint = VerifiedBlue,
                            modifier = Modifier
                                .size(22.dp)
                                .background(SurfaceWhite, CircleShape)
                        )
                    }
                }

                // Rank Badge if applicable (#1, #2, etc.)
                if (rank != null) {
                    val badgeColor = when (rank) {
                        1 -> Gold
                        2 -> Color(0xFF9E9E9E)
                        3 -> Color(0xFFCD7F32)
                        else -> PrimaryGreen
                    }
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(badgeColor),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "$rank",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = SurfaceWhite,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Display Name
            Text(
                text = reciter.displayName,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = DeepGreen,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )

            // Pseudonym / Title
            if (!reciter.pseudonym.isNullOrBlank() && reciter.pseudonym != reciter.displayName) {
                Text(
                    text = "(${reciter.pseudonym})",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                    color = Gold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center
                )
            }

            // Country
            Text(
                text = reciter.country,
                style = MaterialTheme.typography.labelSmall,
                color = SoftGray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Stats row (Listens, Likes, Recitations count)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(LightGray.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                    .padding(vertical = 6.dp, horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatItem(
                    icon = Icons.Default.Headphones,
                    value = formatCount(reciter.stats.totalListens)
                )
                Box(modifier = Modifier.width(1.dp).height(14.dp).background(BorderColor))
                StatItem(
                    icon = Icons.Default.Favorite,
                    value = formatCount(reciter.stats.totalLikes),
                    tint = Color(0xFFE53935)
                )
                Box(modifier = Modifier.width(1.dp).height(14.dp).background(BorderColor))
                StatItem(
                    icon = Icons.Outlined.Mic,
                    value = "${reciter.stats.totalRecitations}"
                )
            }
        }
    }
}

@Composable
private fun StatItem(
    icon: ImageVector,
    value: String,
    tint: Color = SoftGray
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(12.dp)
        )
        Spacer(modifier = Modifier.width(3.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            ),
            color = DeepGreen
        )
    }
}

/**
 * Reusable Recitation Item Card with Playing Equalizer State
 */
@Composable
fun RecitationItemCard(
    recitation: Recitation,
    onPlayClick: () -> Unit,
    onLikeToggle: () -> Unit,
    onReciterClick: (() -> Unit)? = null,
    isPlaying: Boolean = false,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isPlaying) PrimaryGreen else BorderColor

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(if (isPlaying) 1.5.dp else 1.dp, borderColor, RoundedCornerShape(14.dp)),
        color = if (isPlaying) PrimaryGreen.copy(alpha = 0.04f) else SurfaceWhite,
        shadowElevation = if (isPlaying) 2.dp else 1.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Play Button with waveform if active
            IconButton(
                onClick = onPlayClick,
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(if (isPlaying) Gold else PrimaryGreen)
            ) {
                if (isPlaying) {
                    Icon(
                        imageVector = Icons.Default.Pause,
                        contentDescription = "إيقاف مؤقت",
                        tint = DeepGreen,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "تشغيل التلاوة",
                        tint = SurfaceWhite,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Recitation Metadata
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clickable(enabled = onReciterClick != null, onClick = { onReciterClick?.invoke() })
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "سورة ${recitation.surahNameArabic}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = DeepGreen
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = GoldLight.copy(alpha = 0.35f)
                    ) {
                        Text(
                            text = recitation.ayahRange,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = DeepGreen,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    if (isPlaying) {
                        Spacer(modifier = Modifier.width(8.dp))
                        AudioWaveformVisualizer(isPlaying = true, barColor = PrimaryGreen)
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "${recitation.reciterName} • ${recitation.riwayah}",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                    color = SoftGray,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Headphones,
                        contentDescription = null,
                        tint = SoftGray,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = formatCount(recitation.listenCount),
                        style = MaterialTheme.typography.labelSmall,
                        color = SoftGray
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = formatDuration(recitation.durationSeconds),
                        style = MaterialTheme.typography.labelSmall,
                        color = SoftGray
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = recitation.reciterCountry,
                        style = MaterialTheme.typography.labelSmall,
                        color = SoftGray
                    )
                }
            }

            // Like interaction
            LikeButton(
                isLiked = recitation.isLiked,
                likeCount = recitation.likeCount,
                onToggleLike = onLikeToggle
            )
        }
    }
}

/**
 * Persistent Mini Player Bar (shown at the bottom when an audio track is active)
 */
@Composable
fun MiniPlayerBar(
    recitation: Recitation,
    isPlaying: Boolean,
    currentPositionSeconds: Long,
    totalDurationSeconds: Long,
    onTogglePlay: () -> Unit,
    onExpand: () -> Unit,
    onLikeToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val progress = if (totalDurationSeconds > 0) {
        (currentPositionSeconds.toFloat() / totalDurationSeconds.toFloat()).coerceIn(0f, 1f)
    } else 0f

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            .clickable(onClick = onExpand),
        color = SurfaceWhite
    ) {
        Column {
            // Linear Progress Indicator
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp),
                color = Gold,
                trackColor = LightGray
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Play / Pause Icon Button
                IconButton(
                    onClick = onTogglePlay,
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(PrimaryGreen)
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "إيقاف مؤقت" else "تشغيل",
                        tint = SurfaceWhite,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Title & Reciter
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "سورة ${recitation.surahNameArabic}",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = DeepGreen,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "(${recitation.ayahRange})",
                            style = MaterialTheme.typography.labelSmall,
                            color = Gold
                        )
                        if (isPlaying) {
                            Spacer(modifier = Modifier.width(6.dp))
                            AudioWaveformVisualizer(isPlaying = true, barColor = PrimaryGreen)
                        }
                    }
                    Text(
                        text = "${recitation.reciterName} • ${formatDuration(currentPositionSeconds)} / ${formatDuration(totalDurationSeconds)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = SoftGray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Like Button
                LikeButton(
                    isLiked = recitation.isLiked,
                    likeCount = recitation.likeCount,
                    onToggleLike = onLikeToggle
                )
            }
        }
    }
}

/**
 * Format helper for counts (e.g. 1.2k, 45k)
 */
fun formatCount(count: Long): String {
    return when {
        count >= 1_000_000 -> String.format("%.1fM", count / 1_000_000.0)
        count >= 1_000 -> String.format("%.1fk", count / 1_000.0)
        else -> count.toString()
    }
}

/**
 * Format helper for seconds to mm:ss
 */
fun formatDuration(seconds: Long): String {
    val m = seconds / 60
    val s = seconds % 60
    return String.format("%02d:%02d", m, s)
}
