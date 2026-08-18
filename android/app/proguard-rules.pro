# Proguard rules for Tilawatak Lil Alam (Release Optimization)

# Kotlin Coroutines
-keepclassmembers class kotlinx.coroutines.** { *; }

# Media3 & ExoPlayer
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Jetpack Compose & Material 3
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Coil Image Loader
-keep class coil.** { *; }
-dontwarn coil.**

# DTOs & Models for JSON Serialization
-keep class com.tilawatak.data.remote.dto.** { *; }
-keepclassmembers class com.tilawatak.data.remote.dto.** { *; }
-keep class com.tilawatak.domain.model.** { *; }
-keepclassmembers class com.tilawatak.domain.model.** { *; }
