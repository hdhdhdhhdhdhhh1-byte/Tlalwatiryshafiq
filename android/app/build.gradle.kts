import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
}

val localProperties = Properties().apply {
    val rootLocalProperties = rootProject.file("local.properties")
    val projectLocalProperties = project.file("local.properties")
    val parentLocalProperties = rootProject.file("../local.properties")
    when {
        rootLocalProperties.exists() -> load(FileInputStream(rootLocalProperties))
        projectLocalProperties.exists() -> load(FileInputStream(projectLocalProperties))
        parentLocalProperties.exists() -> load(FileInputStream(parentLocalProperties))
    }
}

val configuredSupabaseUrl = localProperties.getProperty("SUPABASE_URL")
    ?: System.getenv("SUPABASE_URL")
    ?: System.getenv("VITE_SUPABASE_URL")
    ?: "https://ixkganrxtkywypvqkqkn.supabase.co"

val configuredSupabaseAnonKey = localProperties.getProperty("SUPABASE_ANON_KEY")
    ?: System.getenv("SUPABASE_ANON_KEY")
    ?: System.getenv("VITE_SUPABASE_ANON_KEY")
    ?: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2dhbnJ4dGt5d3lwdnFrcWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjM3OTYsImV4cCI6MjEwMjI5OTc5Nn0.SPHzwpfZpCpo6vrbKZ5wjiPlQE9e7UTMEbPcZGZ7gRQ"

android {
    namespace = "com.tilawatak.lilalam"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tilawatak.lilalam"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "SUPABASE_URL", "\"$configuredSupabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$configuredSupabaseAnonKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Core Android & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Media3 / ExoPlayer for Quran Audio Playback
    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.session)
    implementation(libs.androidx.media3.ui)

    // Coil for Async Image Loading
    implementation(libs.coil.compose)

    // Dependency Injection (Hilt)
    implementation(libs.hilt.android)
    implementation(libs.androidx.hilt.navigation.compose)
}
