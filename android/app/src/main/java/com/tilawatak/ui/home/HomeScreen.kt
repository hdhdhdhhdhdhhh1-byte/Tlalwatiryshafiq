package com.tilawatak.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.ui.components.ErrorState
import com.tilawatak.ui.components.LoadingState
import com.tilawatak.ui.components.RecitationItemCard
import com.tilawatak.ui.components.ReciterCard
import com.tilawatak.ui.components.SectionHeader
import com.tilawatak.ui.theme.AchievementGold
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepBlue
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.GoldLight
import com.tilawatak.ui.theme.LightGray
import com.tilawatak.ui.theme.LightSky
import com.tilawatak.ui.theme.PrimaryBlue
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.PrimarySky
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite
import com.tilawatak.ui.theme.TextPrimary
import com.tilawatak.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigateToListen: () -> Unit,
    onNavigateToSubmit: () -> Unit,
    onNavigateToFeatured: () -> Unit,
    onNavigateToAbout: () -> Unit,
    onReciterClick: (String) -> Unit,
    onRecitationClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    Brush.linearGradient(
                                        listOf(PrimaryGreen, DeepGreen)
                                    )
                                )
                                .border(1.dp, Gold, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.MenuBook,
                                contentDescription = null,
                                tint = Gold,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "تلاوتك للعالم",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = DeepGreen
                                )
                            )
                            Text(
                                text = "منصة قرآنية وقفية عالمية",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = SoftGray,
                                    fontSize = 10.sp
                                )
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToAbout) {
                        Icon(
                            imageVector = Icons.Outlined.Info,
                            contentDescription = "حول المنصة",
                            tint = DeepGreen
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        if (uiState.isLoading) {
            LoadingState(modifier = Modifier.padding(paddingValues))
        } else if (uiState.errorMessage != null) {
            ErrorState(
                message = uiState.errorMessage ?: "",
                onRetry = { viewModel.loadHomeData() },
                modifier = Modifier.padding(paddingValues)
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(bottom = 32.dp)
            ) {
                // 1. Quranic Hero Area
                item {
                    HomeHeroSection(
                        onListenClick = onNavigateToListen,
                        onSubmitClick = onNavigateToSubmit
                    )
                }

                // 2. Announcements Carousel
                if (uiState.announcements.isNotEmpty()) {
                    item {
                        AnnouncementsSection(announcements = uiState.announcements)
                    }
                }

                // 3. Competitions Carousel
                if (uiState.competitions.isNotEmpty()) {
                    item {
                        CompetitionsSection(competitions = uiState.competitions)
                    }
                }

                // 4. Quranic Daily Inspiration & Platform Assurance
                item {
                    QuranicInspirationCard()
                }

                // 5. Three Major Action Cards
                item {
                    ActionCardsSection(
                        onListenClick = onNavigateToListen,
                        onSubmitClick = onNavigateToSubmit,
                        onFeaturedClick = onNavigateToFeatured
                    )
                }

                // 6. Featured Reciters (LazyRow)
                if (uiState.featuredReciters.isNotEmpty()) {
                    item {
                        SectionHeader(
                            title = "أبرز القراء المعتمدين",
                            subtitle = "أصوات مختارة من مختلف الأقطار والروايات",
                            onSeeAllClick = onNavigateToFeatured
                        )
                    }
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.featuredReciters) { reciter ->
                                ReciterCard(
                                    reciter = reciter,
                                    onClick = { onReciterClick(reciter.id) },
                                    modifier = Modifier.width(175.dp)
                                )
                            }
                        }
                    }
                }

                // 7. Latest Honors (لوحة الشرف)
                if (uiState.honors.isNotEmpty()) {
                    item {
                        HonorsSection(honors = uiState.honors)
                    }
                }

                // 8. Top Recitations (LazyColumn items)
                if (uiState.topRecitations.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        SectionHeader(
                            title = "تلاوات مختارة ومعتمدة",
                            subtitle = "خضعت لمراجعة وتدقيق الإدارة المتخصصة",
                            onSeeAllClick = onNavigateToListen
                        )
                    }
                    items(uiState.topRecitations) { recitation ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 5.dp)) {
                            RecitationItemCard(
                                recitation = recitation,
                                onPlayClick = { onRecitationClick(recitation.id) },
                                onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                onReciterClick = { onReciterClick(recitation.reciterId) }
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Visual Quranic Hero Card with Quranic calligraphy and dual CTA
 */
@Composable
fun HomeHeroSection(
    onListenClick: () -> Unit,
    onSubmitClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = DeepGreen),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(PrimaryGreen, DeepGreen)
                    )
                )
                .padding(24.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Quran Icon & Decorative Gold Emblem
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Gold.copy(alpha = 0.18f))
                        .border(1.5.dp, Gold, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.MenuBook,
                        contentDescription = "home_hero",
                        tint = Gold,
                        modifier = Modifier.size(34.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "تلاوتك للعالم",
                    style = MaterialTheme.typography.displayMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Gold,
                        fontSize = 28.sp
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "«وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا»",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = SurfaceWhite,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 17.sp
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "منصة قرآنية لنشر التلاوات العذبة وإبراز أصوات القراء حول العالم",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = SurfaceWhite.copy(alpha = 0.85f),
                        lineHeight = 20.sp
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Start Listening CTA
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable(onClick = onListenClick),
                        color = Gold,
                        contentColor = DeepGreen
                    ) {
                        Row(
                            modifier = Modifier.padding(vertical = 10.dp, horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Headphones,
                                contentDescription = null,
                                tint = DeepGreen,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "استمع الآن",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }

                    // Submit Recitation CTA
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, GoldLight, RoundedCornerShape(12.dp))
                            .clickable(onClick = onSubmitClick),
                        color = PrimaryGreen.copy(alpha = 0.6f),
                        contentColor = SurfaceWhite
                    ) {
                        Row(
                            modifier = Modifier.padding(vertical = 10.dp, horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = null,
                                tint = Gold,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "انشر تلاوتك",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SurfaceWhite
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Inspiration & Platform Assurance Card
 */
@Composable
fun QuranicInspirationCard() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(14.dp),
        color = SurfaceWhite,
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(PrimaryGreen.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = null,
                    tint = PrimaryGreen,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "تدقيق ومراجعة شرعية وصوتية",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = DeepGreen
                    )
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "تخضع كافة التلاوات المنشورة للمراجعة لضمان سلامة الأداء وصحة التجويد.",
                    style = MaterialTheme.typography.bodySmall,
                    color = SoftGray,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

/**
 * Three Major Action Cards
 */
@Composable
fun ActionCardsSection(
    onListenClick: () -> Unit,
    onSubmitClick: () -> Unit,
    onFeaturedClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        ActionCard(
            title = "استمع إلى القراء",
            subtitle = "تصفح التلاوات واستمع إلى مختلف الروايات والأصوات الشجية",
            icon = Icons.Default.Headphones,
            accentColor = PrimaryGreen,
            badgeText = "تصفح سريع",
            onClick = onListenClick
        )
        ActionCard(
            title = "انشر تلاوتك",
            subtitle = "أرسل تسجيلك القرآني للمراجعة والاعتماد لينشر للمسلمين",
            icon = Icons.Default.Mic,
            accentColor = Gold,
            badgeText = "متاح الآن",
            onClick = onSubmitClick
        )
        ActionCard(
            title = "أبرز القراء والتصنيفات",
            subtitle = "تعرف على القراء الأكثر تفاعلًا واستماعًا واختيارات الإدارة",
            icon = Icons.Default.EmojiEvents,
            accentColor = PrimaryGreen,
            badgeText = "المتصدرون",
            onClick = onFeaturedClick
        )
    }
}

@Composable
fun ActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    badgeText: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        color = SurfaceWhite,
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(26.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = DeepGreen
                        )
                    )
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = LightGray
                    ) {
                        Text(
                            text = badgeText,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = SoftGray,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
                    color = SoftGray,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

/**
 * Announcements Carousel Section
 */
@Composable
fun AnnouncementsSection(announcements: List<Announcement>) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        SectionHeader(
            title = "الإعلانات والأنشطة",
            subtitle = "أحدث الأخبار والفعاليات في منصة تلاوتك",
            onSeeAllClick = null
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(announcements) { announcement ->
                AnnouncementCard(announcement = announcement)
            }
        }
    }
}

@Composable
fun AnnouncementCard(announcement: Announcement) {
    Surface(
        modifier = Modifier
            .width(280.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
        color = SurfaceWhite,
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = LightSky
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Campaign,
                            contentDescription = null,
                            tint = PrimaryBlue,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "إعلان رسمي",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = PrimaryBlue,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = announcement.title,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 15.sp
                )
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = announcement.content,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                ),
                maxLines = 3
            )
        }
    }
}

/**
 * Competitions Carousel Section
 */
@Composable
fun CompetitionsSection(competitions: List<Competition>) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        SectionHeader(
            title = "المسابقات القرآنية",
            subtitle = "تنافس في حسن التلاوة وإتقان أحكام التجويد",
            onSeeAllClick = null
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(competitions) { comp ->
                CompetitionCard(competition = comp)
            }
        }
    }
}

@Composable
fun CompetitionCard(competition: Competition) {
    Surface(
        modifier = Modifier
            .width(280.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
        color = SurfaceWhite,
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AchievementGold.copy(alpha = 0.15f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = null,
                            tint = DeepBlue,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "مسابقة نشطة",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = DeepBlue,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = competition.title,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 15.sp
                )
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = competition.description,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                ),
                maxLines = 3
            )
        }
    }
}

/**
 * Honors (لوحة الشرف) Section
 */
@Composable
fun HonorsSection(honors: List<ReciterHonor>) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        SectionHeader(
            title = "لوحة الشرف والتكريم",
            subtitle = "أبرز القراء المتميزين والمكرمين في المنصة",
            onSeeAllClick = null
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(honors) { honor ->
                HonorCard(honor = honor)
            }
        }
    }
}

@Composable
fun HonorCard(honor: ReciterHonor) {
    Surface(
        modifier = Modifier
            .width(220.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, AchievementGold.copy(alpha = 0.4f), RoundedCornerShape(16.dp)),
        color = SurfaceWhite,
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(AchievementGold.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = DeepBlue,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = honor.reward.title,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    fontSize = 15.sp
                ),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = honor.reward.description,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = PrimaryBlue,
                    fontSize = 12.sp
                ),
                textAlign = TextAlign.Center
            )
            val citation = honor.citationNote ?: ""
            if (citation.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = citation,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = TextSecondary,
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    ),
                    textAlign = TextAlign.Center,
                    maxLines = 2
                )
            }
        }
    }
}

