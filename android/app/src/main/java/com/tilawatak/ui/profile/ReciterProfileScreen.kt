package com.tilawatak.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tilawatak.domain.model.Reciter
import com.tilawatak.ui.components.EmptyState
import com.tilawatak.ui.components.ErrorState
import com.tilawatak.ui.components.LoadingState
import com.tilawatak.ui.components.RecitationItemCard
import com.tilawatak.ui.components.SectionHeader
import com.tilawatak.ui.components.formatCount
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.GoldLight
import com.tilawatak.ui.theme.LightGray
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite
import com.tilawatak.ui.theme.VerifiedBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReciterProfileScreen(
    viewModel: ReciterProfileViewModel,
    onNavigateBack: () -> Unit,
    onRecitationClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = uiState.reciter?.displayName ?: "الملف التعريفي",
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
                    message = "جارٍ تحميل الملف التعريفي...",
                    modifier = Modifier.padding(paddingValues)
                )
            }
            uiState.errorMessage != null || uiState.reciter == null -> {
                ErrorState(
                    message = uiState.errorMessage ?: "تعذر تحميل بيانات القارئ",
                    onRetry = { viewModel.loadReciterProfile() },
                    modifier = Modifier.padding(paddingValues)
                )
            }
            else -> {
                val reciter = uiState.reciter!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(bottom = 32.dp)
                ) {
                    // Profile Header Area
                    item {
                        ReciterHeaderCard(reciter = reciter)
                    }

                    // Biography Card
                    if (reciter.bio.isNotBlank()) {
                        item {
                            BioCard(bio = reciter.bio)
                        }
                    }

                    // Recitations Section Header
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        SectionHeader(
                            title = "تلاوات القارئ (${uiState.recitations.size})",
                            subtitle = "التلاوات المعتمدة والمنشورة للقارئ"
                        )
                    }

                    // Recitation Items
                    if (uiState.recitations.isEmpty()) {
                        item {
                            EmptyState(
                                title = "لا توجد تلاوات منشورة حاليًا",
                                description = "لم يتم إضافة تلاوات معتمدة لهذا القارئ بعد."
                            )
                        }
                    } else {
                        items(uiState.recitations) { recitation ->
                            Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 5.dp)) {
                                RecitationItemCard(
                                    recitation = recitation,
                                    onPlayClick = { onRecitationClick(recitation.id) },
                                    onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                    onReciterClick = null
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReciterHeaderCard(reciter: Reciter) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp),
        color = SurfaceWhite,
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
        shadowElevation = 1.dp
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar with verified badge
            Box(contentAlignment = Alignment.BottomEnd) {
                Box(
                    modifier = Modifier
                        .size(86.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(PrimaryGreen.copy(alpha = 0.2f), GoldLight))
                        )
                        .border(2.5.dp, if (reciter.verified) VerifiedBlue else Gold, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = reciter.displayName.take(1),
                        style = MaterialTheme.typography.displayMedium.copy(color = DeepGreen)
                    )
                }
                if (reciter.verified) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "قارئ موثق",
                        tint = VerifiedBlue,
                        modifier = Modifier
                            .size(24.dp)
                            .background(SurfaceWhite, CircleShape)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Display Name
            Text(
                text = reciter.displayName,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = DeepGreen
                ),
                textAlign = TextAlign.Center
            )

            // Pseudonym if available
            if (!reciter.pseudonym.isNullOrBlank() && reciter.pseudonym != reciter.displayName) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "الاسم المستعار: ${reciter.pseudonym}",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Gold,
                        fontWeight = FontWeight.Medium
                    ),
                    textAlign = TextAlign.Center
                )
            }

            // Country & Origin
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Public,
                    contentDescription = null,
                    tint = SoftGray,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = reciter.country,
                    style = MaterialTheme.typography.bodyMedium,
                    color = SoftGray
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Aggregated Stats
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(LightGray.copy(alpha = 0.7f), RoundedCornerShape(12.dp))
                    .padding(vertical = 12.dp, horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                ProfileStatColumn(
                    icon = Icons.Default.Headphones,
                    label = "الاستماعات",
                    value = formatCount(reciter.stats.totalListens),
                    tint = PrimaryGreen
                )
                Box(modifier = Modifier.width(1.dp).height(24.dp).background(BorderColor))
                ProfileStatColumn(
                    icon = Icons.Default.Favorite,
                    label = "الإعجابات",
                    value = formatCount(reciter.stats.totalLikes),
                    tint = Color(0xFFE53935)
                )
                Box(modifier = Modifier.width(1.dp).height(24.dp).background(BorderColor))
                ProfileStatColumn(
                    icon = Icons.Outlined.Mic,
                    label = "التلاوات",
                    value = "${reciter.stats.totalRecitations}",
                    tint = Gold
                )
            }
        }
    }
}

@Composable
fun ProfileStatColumn(
    icon: ImageVector,
    label: String,
    value: String,
    tint: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = DeepGreen
            )
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = SoftGray
        )
    }
}

@Composable
fun BioCard(bio: String) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(14.dp),
        color = SurfaceWhite,
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "نبذة عن القارئ",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = DeepGreen
                )
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = bio,
                style = MaterialTheme.typography.bodyMedium,
                color = SoftGray,
                lineHeight = 22.sp
            )
        }
    }
}
