plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.curio_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.example.curio_app"

        // safer default for modern Flutter + Firebase plugins
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion

        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // ── Flavor Dimensions ────────────────────────────────────────────
    flavorDimensions += "app"

    productFlavors {
        create("user") {
            dimension = "app"
            applicationIdSuffix = ""
            resValue("string", "app_name", "Curio")
        }
        create("admin") {
            dimension = "app"
            applicationIdSuffix = ".admin"
            resValue("string", "app_name", "Curio Admin")
        }
    }

    buildTypes {
        release {
            // TEMP: debug signing (ONLY for testing)
            // Replace later with proper release keystore config
            signingConfig = signingConfigs.getByName("debug")

            isMinifyEnabled = false
            isShrinkResources = false
        }

        debug {
            // debug config stays default
        }
    }
}

flutter {
    source = "../.."
}
