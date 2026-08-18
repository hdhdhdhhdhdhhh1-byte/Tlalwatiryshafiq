package com.tilawatak.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

private val LightColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    onPrimary = SurfaceWhite,
    primaryContainer = LightGray,
    onPrimaryContainer = DeepGreen,
    secondary = Gold,
    onSecondary = DeepGreen,
    secondaryContainer = GoldLight.copy(alpha = 0.3f),
    onSecondaryContainer = DeepGreen,
    background = BackgroundLight,
    onBackground = DeepGreen,
    surface = SurfaceWhite,
    onSurface = DeepGreen,
    surfaceVariant = LightGray,
    onSurfaceVariant = SoftGray,
    outline = BorderColor,
    error = ErrorRed
)

private val DarkColorScheme = darkColorScheme(
    primary = Gold,
    onPrimary = DeepGreen,
    primaryContainer = DarkSurface,
    onPrimaryContainer = SurfaceWhite,
    secondary = GoldLight,
    onSecondary = DeepGreen,
    background = DeepGreen,
    onBackground = SurfaceWhite,
    surface = DarkSurface,
    onSurface = SurfaceWhite,
    surfaceVariant = DarkSurface,
    onSurfaceVariant = SoftGray,
    outline = BorderColor.copy(alpha = 0.3f),
    error = ErrorRed
)

@Composable
fun TilawatakTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    // Enforce Arabic RTL direction by default across the entire application
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
