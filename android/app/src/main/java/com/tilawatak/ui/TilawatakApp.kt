package com.tilawatak.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.Headphones
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tilawatak.audio.IAudioPlayerService
import com.tilawatak.data.local.DefaultAnonymousInstallationIdProvider
import com.tilawatak.domain.provider.AnonymousInstallationIdProvider
import com.tilawatak.domain.repository.IAnnouncementRepository
import com.tilawatak.domain.repository.ICompetitionRepository
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IRewardRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import com.tilawatak.domain.repository.ISubmissionRepository
import com.tilawatak.ui.about.AboutScreen
import com.tilawatak.ui.components.MiniPlayerBar
import com.tilawatak.ui.featured.FeaturedRecitersScreen
import com.tilawatak.ui.featured.FeaturedRecitersViewModel
import com.tilawatak.ui.home.HomeScreen
import com.tilawatak.ui.home.HomeViewModel
import com.tilawatak.ui.listen.ListenScreen
import com.tilawatak.ui.listen.ListenViewModel
import com.tilawatak.ui.navigation.Screen
import com.tilawatak.ui.player.PlayerViewModel
import com.tilawatak.ui.player.RecitationPlayerScreen
import com.tilawatak.ui.profile.ReciterProfileScreen
import com.tilawatak.ui.profile.ReciterProfileViewModel
import com.tilawatak.ui.submit.SubmissionViewModel
import com.tilawatak.ui.submit.SubmitRecitationScreen
import com.tilawatak.ui.theme.DeepGreen
import com.tilawatak.ui.theme.Gold
import com.tilawatak.ui.theme.PrimaryGreen
import com.tilawatak.ui.theme.SoftGray
import com.tilawatak.ui.theme.SurfaceWhite
import com.tilawatak.ui.theme.TilawatakTheme
import kotlinx.coroutines.launch

data class BottomNavItem(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

@Composable
fun TilawatakApp(
    reciterRepository: IReciterRepository,
    recitationRepository: IRecitationRepository,
    statisticsRepository: IStatisticsRepository,
    submissionRepository: ISubmissionRepository,
    audioPlayerService: IAudioPlayerService,
    announcementRepository: IAnnouncementRepository? = null,
    competitionRepository: ICompetitionRepository? = null,
    rewardRepository: IRewardRepository? = null,
    installationIdProvider: AnonymousInstallationIdProvider = remember { DefaultAnonymousInstallationIdProvider() }
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val coroutineScope = rememberCoroutineScope()
    val anonymousId = remember { installationIdProvider.getInstallationId() }

    val playbackState by audioPlayerService.playbackState.collectAsState()

    val navItems = listOf(
        BottomNavItem(
            route = Screen.Home.route,
            title = "الرئيسية",
            selectedIcon = Icons.Filled.Home,
            unselectedIcon = Icons.Outlined.Home
        ),
        BottomNavItem(
            route = Screen.Listen.route,
            title = "استمع للقراء",
            selectedIcon = Icons.Filled.Headphones,
            unselectedIcon = Icons.Outlined.Headphones
        ),
        BottomNavItem(
            route = Screen.Submit.route,
            title = "انشر التلاوة",
            selectedIcon = Icons.Filled.Mic,
            unselectedIcon = Icons.Outlined.Mic
        ),
        BottomNavItem(
            route = Screen.Featured.route,
            title = "أبرز القراء",
            selectedIcon = Icons.Filled.EmojiEvents,
            unselectedIcon = Icons.Outlined.EmojiEvents
        ),
        BottomNavItem(
            route = Screen.About.route,
            title = "عن التطبيق",
            selectedIcon = Icons.Filled.Info,
            unselectedIcon = Icons.Outlined.Info
        )
    )

    // Hide bottom navigation on full player screen to provide immersive experience
    val showBottomBar = currentRoute != Screen.Player.route

    TilawatakTheme {
        Scaffold(
            bottomBar = {
                if (showBottomBar) {
                    Column {
                        // Persistent Mini Player docked above BottomNav when audio track is loaded
                        AnimatedVisibility(
                            visible = playbackState.currentRecitation != null,
                            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
                        ) {
                            playbackState.currentRecitation?.let { rec ->
                                MiniPlayerBar(
                                    recitation = rec,
                                    isPlaying = playbackState.isPlaying,
                                    currentPositionSeconds = playbackState.currentPositionSeconds,
                                    totalDurationSeconds = playbackState.totalDurationSeconds,
                                    onTogglePlay = { audioPlayerService.togglePlayPause() },
                                    onExpand = {
                                        navController.navigate(Screen.Player.createRoute(rec.id))
                                    },
                                    onLikeToggle = {
                                        coroutineScope.launch {
                                            recitationRepository.toggleLike(rec.id, anonymousId)
                                        }
                                    }
                                )
                            }
                        }

                        // Material 3 Bottom Navigation Bar
                        NavigationBar(
                            containerColor = SurfaceWhite,
                            tonalElevation = 8.dp
                        ) {
                            navItems.forEach { item ->
                                val selected = currentRoute == item.route
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = {
                                        if (currentRoute != item.route) {
                                            navController.navigate(item.route) {
                                                popUpTo(navController.graph.findStartDestination().id) {
                                                    saveState = true
                                                }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        }
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                            contentDescription = item.title
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = item.title,
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                fontSize = 11.sp,
                                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                                            )
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = DeepGreen,
                                        selectedTextColor = DeepGreen,
                                        indicatorColor = Gold.copy(alpha = 0.25f),
                                        unselectedIconColor = SoftGray,
                                        unselectedTextColor = SoftGray
                                    )
                                )
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                NavHost(
                    navController = navController,
                    startDestination = Screen.Home.route,
                    enterTransition = { fadeIn(animationSpec = tween(250)) },
                    exitTransition = { fadeOut(animationSpec = tween(250)) },
                    popEnterTransition = { fadeIn(animationSpec = tween(250)) },
                    popExitTransition = { fadeOut(animationSpec = tween(250)) }
                ) {
                    // 1. Home Screen
                    composable(Screen.Home.route) {
                        val homeViewModel = remember {
                            HomeViewModel(
                                reciterRepository = reciterRepository,
                                recitationRepository = recitationRepository,
                                statisticsRepository = statisticsRepository,
                                announcementRepository = announcementRepository,
                                competitionRepository = competitionRepository,
                                rewardRepository = rewardRepository
                            )
                        }
                        HomeScreen(
                            viewModel = homeViewModel,
                            onNavigateToListen = { navController.navigate(Screen.Listen.route) },
                            onNavigateToSubmit = { navController.navigate(Screen.Submit.route) },
                            onNavigateToFeatured = { navController.navigate(Screen.Featured.route) },
                            onNavigateToAbout = { navController.navigate(Screen.About.route) },
                            onReciterClick = { reciterId ->
                                navController.navigate(Screen.ReciterProfile.createRoute(reciterId))
                            },
                            onRecitationClick = { recitationId ->
                                navController.navigate(Screen.Player.createRoute(recitationId))
                            }
                        )
                    }

                    // 2. Listen To Reciters Screen
                    composable(Screen.Listen.route) {
                        val listenViewModel = remember {
                            ListenViewModel(reciterRepository, recitationRepository, statisticsRepository)
                        }
                        ListenScreen(
                            viewModel = listenViewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onReciterClick = { reciterId ->
                                navController.navigate(Screen.ReciterProfile.createRoute(reciterId))
                            },
                            onRecitationClick = { recitationId ->
                                navController.navigate(Screen.Player.createRoute(recitationId))
                            }
                        )
                    }

                    // 3. Reciter Profile Screen
                    composable(
                        route = Screen.ReciterProfile.route,
                        arguments = listOf(navArgument("reciterId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val reciterId = backStackEntry.arguments?.getString("reciterId") ?: ""
                        val profileViewModel = remember(reciterId) {
                            ReciterProfileViewModel(reciterId, reciterRepository, recitationRepository)
                        }
                        ReciterProfileScreen(
                            viewModel = profileViewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onRecitationClick = { recitationId ->
                                navController.navigate(Screen.Player.createRoute(recitationId))
                            }
                        )
                    }

                    // 4. Recitation Player Screen
                    composable(
                        route = Screen.Player.route,
                        arguments = listOf(navArgument("recitationId") { type = NavType.StringType })
                    ) { backStackEntry ->
                        val recitationId = backStackEntry.arguments?.getString("recitationId") ?: ""
                        val playerViewModel = remember(recitationId) {
                            PlayerViewModel(recitationId, recitationRepository, audioPlayerService)
                        }
                        RecitationPlayerScreen(
                            viewModel = playerViewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onReciterClick = { reciterId ->
                                navController.navigate(Screen.ReciterProfile.createRoute(reciterId))
                            }
                        )
                    }

                    // 5. Submit Recitation Screen
                    composable(Screen.Submit.route) {
                        val submissionViewModel = remember {
                            SubmissionViewModel(submissionRepository)
                        }
                        SubmitRecitationScreen(
                            viewModel = submissionViewModel,
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }

                    // 6. Featured Reciters Screen
                    composable(Screen.Featured.route) {
                        val featuredViewModel = remember {
                            FeaturedRecitersViewModel(reciterRepository, statisticsRepository)
                        }
                        FeaturedRecitersScreen(
                            viewModel = featuredViewModel,
                            onNavigateBack = { navController.popBackStack() },
                            onReciterClick = { reciterId ->
                                navController.navigate(Screen.ReciterProfile.createRoute(reciterId))
                            }
                        )
                    }

                    // 7. About Screen
                    composable(Screen.About.route) {
                        AboutScreen(
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}
