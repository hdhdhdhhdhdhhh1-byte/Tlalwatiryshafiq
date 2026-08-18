package com.tilawatak.ui.navigation

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Listen : Screen("listen")
    object ReciterProfile : Screen("reciter/{reciterId}") {
        fun createRoute(reciterId: String) = "reciter/$reciterId"
    }
    object Player : Screen("player/{recitationId}") {
        fun createRoute(recitationId: String) = "player/$recitationId"
    }
    object Submit : Screen("submit")
    object Featured : Screen("featured")
    object About : Screen("about")
}
