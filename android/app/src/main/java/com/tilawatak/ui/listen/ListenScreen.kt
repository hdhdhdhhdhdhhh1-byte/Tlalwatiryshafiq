package com.tilawatak.ui.listen

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.Reciter
import com.tilawatak.ui.components.EmptyState
import com.tilawatak.ui.components.ErrorState
import com.tilawatak.ui.components.LoadingState
import com.tilawatak.ui.components.RecitationItemCard
import com.tilawatak.ui.components.ReciterCard
import com.tilawatak.ui.components.SectionHeader
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListenScreen(
    viewModel: ListenViewModel,
    onNavigateBack: () -> Unit,
    onReciterClick: (String) -> Unit,
    onRecitationClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "استمع إلى القراء",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = DeepGreen
                            )
                        )
                        Text(
                            text = "اكتشف أصوات القرآن من حول العالم",
                            style = MaterialTheme.typography.labelSmall.copy(color = SoftGray)
                        )
                    }
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Input Field
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = { viewModel.onSearchQueryChanged(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            text = "ابحث عن قارئ أو سورة...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = SoftGray
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = PrimaryGreen
                        )
                    },
                    trailingIcon = {
                        if (uiState.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                                Icon(
                                    imageVector = Icons.Default.Clear,
                                    contentDescription = "مسح البحث",
                                    tint = SoftGray
                                )
                            }
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGreen,
                        unfocusedBorderColor = BorderColor,
                        focusedContainerColor = SurfaceWhite,
                        unfocusedContainerColor = SurfaceWhite
                    ),
                    singleLine = true
                )
            }

            // Tabs / Filter Chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(ListenTab.values()) { tab ->
                    val selected = uiState.activeTab == tab && uiState.searchQuery.isEmpty()
                    FilterChip(
                        selected = selected,
                        onClick = { viewModel.selectTab(tab) },
                        label = {
                            Text(
                                text = tab.title,
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
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
                            selected = selected,
                            borderColor = if (selected) PrimaryGreen else BorderColor
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Main Content Area
            when {
                uiState.isSearching -> {
                    LoadingState(message = "جارٍ البحث...")
                }
                uiState.searchQuery.isNotEmpty() -> {
                    // Search Results
                    if (uiState.searchResults.isEmpty()) {
                        EmptyState(
                            title = "لم نجد نتائج مطابقة",
                            description = "جرب البحث باسم قارئ آخر أو اسم سورة مختلفة.",
                            icon = Icons.Outlined.SearchOff
                        )
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            item {
                                Text(
                                    text = "نتائج البحث (${uiState.searchResults.size})",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = DeepGreen,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                            }
                            items(uiState.searchResults) { recitation ->
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
                uiState.isLoading -> {
                    LoadingState(message = "جارٍ تحميل التلاوات...")
                }
                uiState.errorMessage != null -> {
                    ErrorState(
                        message = uiState.errorMessage ?: "حدث خطأ، حاول مرة أخرى",
                        onRetry = { viewModel.loadDiscoveryData() }
                    )
                }
                else -> {
                    // Normal Browsing View
                    when (uiState.activeTab) {
                        ListenTab.ALL -> {
                            LazyColumn(
                                contentPadding = PaddingValues(bottom = 32.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                // 1. Featured Reciters Row
                                if (uiState.featuredReciters.isNotEmpty()) {
                                    item {
                                        SectionHeader(
                                            title = "🏆 القراء المميزون",
                                            subtitle = "أصوات موثوقة ومختارة"
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

                                // 2. Most Listened Recitations
                                if (uiState.mostListenedRecitations.isNotEmpty()) {
                                    item {
                                        Spacer(modifier = Modifier.height(14.dp))
                                        SectionHeader(
                                            title = "🔥 الأكثر استماعًا",
                                            subtitle = "التلاوات الأعلى رواجًا واستماعًا"
                                        )
                                    }
                                    items(uiState.mostListenedRecitations) { recitation ->
                                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                                            RecitationItemCard(
                                                recitation = recitation,
                                                onPlayClick = { onRecitationClick(recitation.id) },
                                                onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                                onReciterClick = { onReciterClick(recitation.reciterId) }
                                            )
                                        }
                                    }
                                }

                                // 3. Most Liked Recitations
                                if (uiState.mostLikedRecitations.isNotEmpty()) {
                                    item {
                                        Spacer(modifier = Modifier.height(14.dp))
                                        SectionHeader(
                                            title = "❤️ الأكثر إعجابًا",
                                            subtitle = "التلاوات التي نالت أعلى إعجاب المستمعين"
                                        )
                                    }
                                    items(uiState.mostLikedRecitations) { recitation ->
                                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                                            RecitationItemCard(
                                                recitation = recitation,
                                                onPlayClick = { onRecitationClick(recitation.id) },
                                                onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                                onReciterClick = { onReciterClick(recitation.reciterId) }
                                            )
                                        }
                                    }
                                }

                                // 4. Newest Recitations
                                if (uiState.newestRecitations.isNotEmpty()) {
                                    item {
                                        Spacer(modifier = Modifier.height(14.dp))
                                        SectionHeader(
                                            title = "🆕 أحدث التلاوات",
                                            subtitle = "تلاوات أضيفت حديثًا إلى المنصة"
                                        )
                                    }
                                    items(uiState.newestRecitations) { recitation ->
                                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                                            RecitationItemCard(
                                                recitation = recitation,
                                                onPlayClick = { onRecitationClick(recitation.id) },
                                                onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                                onReciterClick = { onReciterClick(recitation.reciterId) }
                                            )
                                        }
                                    }
                                }

                                // 5. Newest Reciters Row
                                if (uiState.newestReciters.isNotEmpty()) {
                                    item {
                                        Spacer(modifier = Modifier.height(14.dp))
                                        SectionHeader(
                                            title = "🆕 القراء الجدد",
                                            subtitle = "أصوات انضمت حديثًا إلى المنصة"
                                        )
                                    }
                                    item {
                                        LazyRow(
                                            contentPadding = PaddingValues(horizontal = 16.dp),
                                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            items(uiState.newestReciters) { reciter ->
                                                ReciterCard(
                                                    reciter = reciter,
                                                    onClick = { onReciterClick(reciter.id) },
                                                    modifier = Modifier.width(175.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        ListenTab.MOST_LISTENED -> {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(uiState.mostListenedRecitations) { recitation ->
                                    RecitationItemCard(
                                        recitation = recitation,
                                        onPlayClick = { onRecitationClick(recitation.id) },
                                        onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                        onReciterClick = { onReciterClick(recitation.reciterId) }
                                    )
                                }
                            }
                        }
                        ListenTab.MOST_LIKED -> {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(uiState.mostLikedRecitations) { recitation ->
                                    RecitationItemCard(
                                        recitation = recitation,
                                        onPlayClick = { onRecitationClick(recitation.id) },
                                        onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                        onReciterClick = { onReciterClick(recitation.reciterId) }
                                    )
                                }
                            }
                        }
                        ListenTab.NEWEST -> {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(uiState.newestRecitations) { recitation ->
                                    RecitationItemCard(
                                        recitation = recitation,
                                        onPlayClick = { onRecitationClick(recitation.id) },
                                        onLikeToggle = { viewModel.toggleLike(recitation.id) },
                                        onReciterClick = { onReciterClick(recitation.reciterId) }
                                    )
                                }
                            }
                        }
                        ListenTab.RECITERS -> {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(uiState.featuredReciters + uiState.newestReciters) { reciter ->
                                    ReciterCard(
                                        reciter = reciter,
                                        onClick = { onReciterClick(reciter.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
