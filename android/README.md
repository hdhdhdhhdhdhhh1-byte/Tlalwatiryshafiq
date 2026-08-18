# مشروع أندرويد الأصلي: تلاوتك للعالم (Tilawatak Lil Alam)

مشروع تطبيق أندرويد أصلي (Native Android) مكتوب بلغة **Kotlin** وباستخدام أحدث تقنيات **Jetpack Compose (Material 3)** ومشغل الصوت القرآني المتقدم **Media3 / ExoPlayer** مع معمارية برمجية نظيفة (Clean Architecture).

---

## 🛠️ متطلبات البناء المحلي (Local Requirements)

- **Android Studio Ladybug (2024.2.1)** أو أحدث
- **Java JDK 17** (Temurin أو OpenJDK)
- **Android SDK 35** (Build Tools 35.0.0)

---

## 🚀 أوامر البناء المحلي (CLI Build Commands)

من داخل مجلد `android/`:

### 1. التحقق من إصدار Gradle
```bash
./gradlew --version
```

### 2. بناء نسخة التطوير التجريبية (Debug APK)
```bash
./gradlew assembleDebug
```
- **مسار الملف الناتج:**
  `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. بناء نسخة الإصدار (Release APK / Bundle)
```bash
# بناء APK للإنتاج
./gradlew assembleRelease

# بناء حزمة متجر جوجل بلاي AAB
./gradlew bundleRelease
```
- **مسار حزمة المتجر الناتجة:**
  `android/app/build/outputs/bundle/release/app-release.aab`

---

## ⚙️ البناء الآلي عبر GitHub Actions (CI/CD)

يحتوي المستودع على خطتي عمل آليتين:

### 1. خطة البناء التلقائي المستمر (`android-build.yml`):
- تعمل تلقائيًا عند كل `push` أو `pull_request` لمجلد `android/`.
- تقوم بتثبيت بيئة JDK 17 و Android SDK وبناء `assembleDebug`.
- ترفع ملف `app-debug.apk` مباشرة إلى قسم **Artifacts** في صفحة Actions.

### 2. خطة الإصدار المباشر (`android-release.yml`):
- يمكن تشغيلها يدويًا عبر **workflow_dispatch** في تبويب Actions.
- تدعم خيارات بناء APK أو AAB أو كلاهما.

---

## 🔐 إعداد أسرار التوقيع الرقمي (GitHub Secrets for Signing)

إذا كنت ترغب في توقيع حزم الإصدار تلقائيًا عبر GitHub Actions، أضف الأسرار التالية في مستودع GitHub (`Settings > Secrets and variables > Actions`):

1. `ANDROID_KEYSTORE_BASE64`: ملف الـ `.jks` أو `.keystore` بعد تحويله إلى نص Base64 (أمر: `base64 -w 0 my-release-key.jks`).
2. `ANDROID_KEYSTORE_PASSWORD`: كلمة مرور ملف الـ Keystore.
3. `ANDROID_KEY_ALIAS`: الاسم المستعار للمفتاح (Key Alias).
4. `ANDROID_KEY_PASSWORD`: كلمة مرور المفتاح الخاص.
