package com.tilawatak.ui.featured

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tilawatak.ui.components.EmptyState
import com.tilawatak.ui.components.ErrorState
import com.tilawatak.ui.components.LoadingState
import com.tilawatak.ui.components.ReciterCard
import com.tilawatak.ui.theme.BorderColor
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeaturedRecitersScreen(
    viewModel: FeaturedRecitersViewModel,
    onNavigateBack: () -> Unit,
    onReciterClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "أبرز القراء",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = DeepGreen
                            )
                        )
                        Text(
                            text = "ترتيب القراء بحسب التفاعل والاستماعات",
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
            // Category Filter Tabs
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(FeaturedCategory.values()) { cat ->
                    val selected = uiState.activeCategory == cat
                    FilterChip(
                        selected = selected,
                        onClick = { viewModel.selectCategory(cat) },
                        label = {
                            Text(
                                text = cat.title,
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

            when {
                uiState.isLoading -> {
                    LoadingState(message = "جارٍ تصنيف القراء...")
                }
                uiState.errorMessage != null -> {
                    ErrorState(
                        message = uiState.errorMessage ?: "حدث خطأ أثناء تحميل القراء",
                        onRetry = { viewModel.loadReciters(uiState.activeCategory) }
                    )
                }
                uiState.reciters.isEmpty() -> {
                    EmptyState(
                        title = "لا يوجد قراء في هذا التصنيف",
                        description = "لم نجد أي قراء مسجلين في هذا القسم حاليًا."
                    )
                }
                else -> {
                    // Responsive Grid of Reciters (Adaptive for phone & tablet)
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 160.dp),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(uiState.reciters) { reciter ->
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
