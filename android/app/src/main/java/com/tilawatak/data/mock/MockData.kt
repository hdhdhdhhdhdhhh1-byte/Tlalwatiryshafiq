package com.tilawatak.data.mock

import com.tilawatak.domain.model.Announcement
import com.tilawatak.domain.model.Competition
import com.tilawatak.domain.model.Gender
import com.tilawatak.domain.model.Recitation
import com.tilawatak.domain.model.RecitationSubmission
import com.tilawatak.domain.model.Reciter
import com.tilawatak.domain.model.ReciterHonor
import com.tilawatak.domain.model.ReciterStats
import com.tilawatak.domain.model.RewardDefinition
import com.tilawatak.domain.model.SubmissionStatus

/**
 * Isolated development mock data.
 * Used for offline prototype, Compose previews, and testing without requiring a live database.
 */
object MockData {

    val RECITERS: List<Reciter> = listOf(
        Reciter(
            id = "reciter-1",
            displayName = "القارئ زيد الأندلسي",
            pseudonym = "صوت الأندلس",
            usePseudonym = false,
            gender = Gender.MALE,
            country = "المملكة المغربية",
            bio = "قارئ ومجاز بالقراءات العشر الصغرى، يقرأ برواية ورش عن نافع بأسلوب مغربي أصيل وخاشع.",
            avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = true,
            isPublished = true,
            createdAtEpochMs = 1704067200000L,
            stats = ReciterStats(
                totalRecitations = 3,
                totalListens = 48200,
                totalLikes = 3410
            )
        ),
        Reciter(
            id = "reciter-2",
            displayName = "القارئ يوسف الكناني",
            pseudonym = null,
            usePseudonym = false,
            gender = Gender.MALE,
            country = "جمهورية مصر العربية",
            bio = "إمام وخطيب ومرتل بالقراءات المتواترة، تتلمذ على كبار علماء المقارئ المصرية.",
            avatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = true,
            isPublished = true,
            createdAtEpochMs = 1704153600000L,
            stats = ReciterStats(
                totalRecitations = 3,
                totalListens = 62100,
                totalLikes = 4920
            )
        ),
        Reciter(
            id = "reciter-3",
            displayName = "القارئ عثمان التهامي",
            pseudonym = "بلبل الحجاز",
            usePseudonym = false,
            gender = Gender.MALE,
            country = "المملكة العربية السعودية",
            bio = "ترتيل حجازي هادئ ومتقن برواية حفص عن عاصم، مشارك في العديد من المحافل القرآنية.",
            avatarUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = false,
            isPublished = true,
            createdAtEpochMs = 1704240000000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 31800,
                totalLikes = 2150
            )
        ),
        Reciter(
            id = "reciter-4",
            displayName = "القارئ بلال الموريتاني",
            pseudonym = "نسيم الشناقطة",
            usePseudonym = false,
            gender = Gender.MALE,
            country = "موريتانيا",
            bio = "خريج المحاضر الموريتانية العريقة، يتميز بضبط مخارج الحروف وجودة الأداء الشنقيطي الفريد.",
            avatarUrl = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = true,
            isPublished = true,
            createdAtEpochMs = 1704326400000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 29400,
                totalLikes = 1890
            )
        ),
        Reciter(
            id = "reciter-5",
            displayName = "صوت الفردوس (مستعار)",
            pseudonym = "صوت الفردوس",
            usePseudonym = true,
            gender = Gender.MALE,
            country = "الجزائر",
            bio = "تلاوات قرآنية مسجلة بنية الصدقة الجارية ونشر القرآن الكريم في أنحاء المعمورة.",
            avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            verified = false,
            isStaffPick = false,
            isPublished = true,
            createdAtEpochMs = 1704412800000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 14300,
                totalLikes = 980
            )
        ),
        Reciter(
            id = "reciter-6",
            displayName = "القارئ إلياس الشامي",
            pseudonym = "ريحان الشام",
            usePseudonym = false,
            gender = Gender.MALE,
            country = "الجمهورية العربية السورية",
            bio = "تلاوات ندية بالروايات الشامية الأصيلة مع اهتمام بالوقف والابتداء والترتيل المتأني.",
            avatarUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = false,
            isPublished = true,
            createdAtEpochMs = 1704499200000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 22100,
                totalLikes = 1640
            )
        ),
        Reciter(
            id = "reciter-7",
            displayName = "القارئ نور الدين الإندونيسي",
            pseudonym = null,
            usePseudonym = false,
            gender = Gender.MALE,
            country = "إندونيسيا",
            bio = "صوت شجي ومؤثر من جنوب شرق آسيا، حاصل على جوائز في مسابقات التلاوة الدولية.",
            avatarUrl = "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&auto=format&fit=crop&q=80",
            verified = false,
            isStaffPick = false,
            isPublished = true,
            createdAtEpochMs = 1704585600000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 18700,
                totalLikes = 1420
            )
        ),
        Reciter(
            id = "reciter-8",
            displayName = "القارئ حسان الطرابلسي",
            pseudonym = "نور الهدى",
            usePseudonym = false,
            gender = Gender.MALE,
            country = "ليبيا",
            bio = "مرتل برواية قالون عن نافع، يتميز بعذوبة الصوت والاتزان الصوتي النقي.",
            avatarUrl = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
            verified = true,
            isStaffPick = true,
            isPublished = true,
            createdAtEpochMs = 1704672000000L,
            stats = ReciterStats(
                totalRecitations = 2,
                totalListens = 26500,
                totalLikes = 2100
            )
        )
    )

    val RECITATIONS: List<Recitation> = listOf(
        Recitation(
            id = "rec-1",
            reciterId = "reciter-1",
            reciterName = "القارئ زيد الأندلسي",
            reciterAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "المملكة المغربية",
            surahNumber = 1,
            surahNameArabic = "الفاتحة",
            ayahRange = "كاملة (1-7)",
            ayahStart = 1,
            ayahEnd = 7,
            riwayah = "ورش عن نافع",
            durationSeconds = 85,
            audioUrl = "https://server8.mp3quran.net/afs/001.mp3",
            audioStoragePath = "recitations/reciter-1/001.mp3",
            publishedAtEpochMs = 1704100000000L,
            listenCount = 19400,
            likeCount = 1450,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-2",
            reciterId = "reciter-1",
            reciterName = "القارئ زيد الأندلسي",
            reciterAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "المملكة المغربية",
            surahNumber = 67,
            surahNameArabic = "الملك",
            ayahRange = "كاملة (1-30)",
            ayahStart = 1,
            ayahEnd = 30,
            riwayah = "ورش عن نافع",
            durationSeconds = 340,
            audioUrl = "https://server8.mp3quran.net/afs/067.mp3",
            audioStoragePath = "recitations/reciter-1/067.mp3",
            publishedAtEpochMs = 1704200000000L,
            listenCount = 16800,
            likeCount = 1120,
            isLiked = true,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-3",
            reciterId = "reciter-1",
            reciterName = "القارئ زيد الأندلسي",
            reciterAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "المملكة المغربية",
            surahNumber = 55,
            surahNameArabic = "الرحمن",
            ayahRange = "الآيات (1-40)",
            ayahStart = 1,
            ayahEnd = 40,
            riwayah = "ورش عن نافع",
            durationSeconds = 420,
            audioUrl = "https://server8.mp3quran.net/afs/055.mp3",
            audioStoragePath = "recitations/reciter-1/055.mp3",
            publishedAtEpochMs = 1704300000000L,
            listenCount = 12000,
            likeCount = 840,
            isLiked = true,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-4",
            reciterId = "reciter-2",
            reciterName = "القارئ يوسف الكناني",
            reciterAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "جمهورية مصر العربية",
            surahNumber = 19,
            surahNameArabic = "مريم",
            ayahRange = "الآيات (1-36)",
            ayahStart = 1,
            ayahEnd = 36,
            riwayah = "حفص عن عاصم",
            durationSeconds = 510,
            audioUrl = "https://server8.mp3quran.net/afs/019.mp3",
            audioStoragePath = "recitations/reciter-2/019.mp3",
            publishedAtEpochMs = 1704400000000L,
            listenCount = 28400,
            likeCount = 2390,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-5",
            reciterId = "reciter-2",
            reciterName = "القارئ يوسف الكناني",
            reciterAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "جمهورية مصر العربية",
            surahNumber = 36,
            surahNameArabic = "يس",
            ayahRange = "كاملة (1-83)",
            ayahStart = 1,
            ayahEnd = 83,
            riwayah = "حفص عن عاصم",
            durationSeconds = 610,
            audioUrl = "https://server8.mp3quran.net/afs/036.mp3",
            audioStoragePath = "recitations/reciter-2/036.mp3",
            publishedAtEpochMs = 1704500000000L,
            listenCount = 21200,
            likeCount = 1680,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-6",
            reciterId = "reciter-2",
            reciterName = "القارئ يوسف الكناني",
            reciterAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "جمهورية مصر العربية",
            surahNumber = 18,
            surahNameArabic = "الكهف",
            ayahRange = "الآيات (1-20)",
            ayahStart = 1,
            ayahEnd = 20,
            riwayah = "حفص عن عاصم",
            durationSeconds = 290,
            audioUrl = "https://server8.mp3quran.net/afs/018.mp3",
            audioStoragePath = "recitations/reciter-2/018.mp3",
            publishedAtEpochMs = 1704600000000L,
            listenCount = 12500,
            likeCount = 850,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-7",
            reciterId = "reciter-3",
            reciterName = "القارئ عثمان التهامي",
            reciterAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "المملكة العربية السعودية",
            surahNumber = 56,
            surahNameArabic = "الواقعة",
            ayahRange = "كاملة (1-96)",
            ayahStart = 1,
            ayahEnd = 96,
            riwayah = "حفص عن عاصم",
            durationSeconds = 430,
            audioUrl = "https://server8.mp3quran.net/afs/056.mp3",
            audioStoragePath = "recitations/reciter-3/056.mp3",
            publishedAtEpochMs = 1704700000000L,
            listenCount = 18200,
            likeCount = 1240,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-8",
            reciterId = "reciter-3",
            reciterName = "القارئ عثمان التهامي",
            reciterAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "المملكة العربية السعودية",
            surahNumber = 12,
            surahNameArabic = "يوسف",
            ayahRange = "الآيات (1-30)",
            ayahStart = 1,
            ayahEnd = 30,
            riwayah = "حفص عن عاصم",
            durationSeconds = 540,
            audioUrl = "https://server8.mp3quran.net/afs/012.mp3",
            audioStoragePath = "recitations/reciter-3/012.mp3",
            publishedAtEpochMs = 1704800000000L,
            listenCount = 13600,
            likeCount = 910,
            isLiked = true,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-9",
            reciterId = "reciter-4",
            reciterName = "القارئ بلال الموريتاني",
            reciterAvatar = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "موريتانيا",
            surahNumber = 50,
            surahNameArabic = "ق",
            ayahRange = "كاملة (1-45)",
            ayahStart = 1,
            ayahEnd = 45,
            riwayah = "ورش عن نافع",
            durationSeconds = 380,
            audioUrl = "https://server8.mp3quran.net/afs/050.mp3",
            audioStoragePath = "recitations/reciter-4/050.mp3",
            publishedAtEpochMs = 1704900000000L,
            listenCount = 15900,
            likeCount = 1040,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-10",
            reciterId = "reciter-4",
            reciterName = "القارئ بلال الموريتاني",
            reciterAvatar = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "موريتانيا",
            surahNumber = 49,
            surahNameArabic = "الحجرات",
            ayahRange = "كاملة (1-18)",
            ayahStart = 1,
            ayahEnd = 18,
            riwayah = "ورش عن نافع",
            durationSeconds = 320,
            audioUrl = "https://server8.mp3quran.net/afs/049.mp3",
            audioStoragePath = "recitations/reciter-4/049.mp3",
            publishedAtEpochMs = 1705000000000L,
            listenCount = 13500,
            likeCount = 850,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-11",
            reciterId = "reciter-5",
            reciterName = "صوت الفردوس (مستعار)",
            reciterAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "الجزائر",
            surahNumber = 93,
            surahNameArabic = "الضحى",
            ayahRange = "كاملة (1-11)",
            ayahStart = 1,
            ayahEnd = 11,
            riwayah = "ورش عن نافع",
            durationSeconds = 95,
            audioUrl = "https://server8.mp3quran.net/afs/093.mp3",
            audioStoragePath = "recitations/reciter-5/093.mp3",
            publishedAtEpochMs = 1705100000000L,
            listenCount = 7800,
            likeCount = 560,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-12",
            reciterId = "reciter-5",
            reciterName = "صوت الفردوس (مستعار)",
            reciterAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "الجزائر",
            surahNumber = 94,
            surahNameArabic = "الشرح",
            ayahRange = "كاملة (1-8)",
            ayahStart = 1,
            ayahEnd = 8,
            riwayah = "ورش عن نافع",
            durationSeconds = 70,
            audioUrl = "https://server8.mp3quran.net/afs/094.mp3",
            audioStoragePath = "recitations/reciter-5/094.mp3",
            publishedAtEpochMs = 1705200000000L,
            listenCount = 6500,
            likeCount = 420,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-13",
            reciterId = "reciter-6",
            reciterName = "القارئ إلياس الشامي",
            reciterAvatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "الجمهورية العربية السورية",
            surahNumber = 31,
            surahNameArabic = "لقمان",
            ayahRange = "الآيات (12-19)",
            ayahStart = 12,
            ayahEnd = 19,
            riwayah = "حفص عن عاصم",
            durationSeconds = 240,
            audioUrl = "https://server8.mp3quran.net/afs/031.mp3",
            audioStoragePath = "recitations/reciter-6/031.mp3",
            publishedAtEpochMs = 1705300000000L,
            listenCount = 12900,
            likeCount = 980,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-14",
            reciterId = "reciter-6",
            reciterName = "القارئ إلياس الشامي",
            reciterAvatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "الجمهورية العربية السورية",
            surahNumber = 62,
            surahNameArabic = "الجمعة",
            ayahRange = "كاملة (1-11)",
            ayahStart = 1,
            ayahEnd = 11,
            riwayah = "حفص عن عاصم",
            durationSeconds = 210,
            audioUrl = "https://server8.mp3quran.net/afs/062.mp3",
            audioStoragePath = "recitations/reciter-6/062.mp3",
            publishedAtEpochMs = 1705400000000L,
            listenCount = 9200,
            likeCount = 660,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-15",
            reciterId = "reciter-7",
            reciterName = "القارئ نور الدين الإندونيسي",
            reciterAvatar = "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "إندونيسيا",
            surahNumber = 59,
            surahNameArabic = "الحشر",
            ayahRange = "الآيات (18-24)",
            ayahStart = 18,
            ayahEnd = 24,
            riwayah = "حفص عن عاصم",
            durationSeconds = 210,
            audioUrl = "https://server8.mp3quran.net/afs/059.mp3",
            audioStoragePath = "recitations/reciter-7/059.mp3",
            publishedAtEpochMs = 1705500000000L,
            listenCount = 10400,
            likeCount = 810,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-16",
            reciterId = "reciter-7",
            reciterName = "القارئ نور الدين الإندونيسي",
            reciterAvatar = "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "إندونيسيا",
            surahNumber = 89,
            surahNameArabic = "الفجر",
            ayahRange = "كاملة (1-30)",
            ayahStart = 1,
            ayahEnd = 30,
            riwayah = "حفص عن عاصم",
            durationSeconds = 260,
            audioUrl = "https://server8.mp3quran.net/afs/089.mp3",
            audioStoragePath = "recitations/reciter-7/089.mp3",
            publishedAtEpochMs = 1705600000000L,
            listenCount = 8300,
            likeCount = 610,
            isLiked = false,
            isStaffPick = false
        ),
        Recitation(
            id = "rec-17",
            reciterId = "reciter-8",
            reciterName = "القارئ حسان الطرابلسي",
            reciterAvatar = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "ليبيا",
            surahNumber = 87,
            surahNameArabic = "الأعلى",
            ayahRange = "كاملة (1-19)",
            ayahStart = 1,
            ayahEnd = 19,
            riwayah = "قالون عن نافع",
            durationSeconds = 110,
            audioUrl = "https://server8.mp3quran.net/afs/087.mp3",
            audioStoragePath = "recitations/reciter-8/087.mp3",
            publishedAtEpochMs = 1705700000000L,
            listenCount = 14100,
            likeCount = 1130,
            isLiked = false,
            isStaffPick = true
        ),
        Recitation(
            id = "rec-18",
            reciterId = "reciter-8",
            reciterName = "القارئ حسان الطرابلسي",
            reciterAvatar = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
            reciterCountry = "ليبيا",
            surahNumber = 88,
            surahNameArabic = "الغاشية",
            ayahRange = "كاملة (1-26)",
            ayahStart = 1,
            ayahEnd = 26,
            riwayah = "قالون عن نافع",
            durationSeconds = 150,
            audioUrl = "https://server8.mp3quran.net/afs/088.mp3",
            audioStoragePath = "recitations/reciter-8/088.mp3",
            publishedAtEpochMs = 1705800000000L,
            listenCount = 12400,
            likeCount = 970,
            isLiked = false,
            isStaffPick = true
        )
    )

    val INITIAL_SUBMISSIONS: List<RecitationSubmission> = listOf(
        RecitationSubmission(
            id = "sub-101",
            displayName = "أحمد بن عبد الله السلمي",
            pseudonym = null,
            usePseudonym = false,
            gender = Gender.MALE,
            country = "سلطنة عمان",
            surahNumber = 55,
            surahName = "الرحمن",
            ayahRange = "الآيات (1-25)",
            ayahStart = 1,
            ayahEnd = 25,
            riwayah = "حفص عن عاصم",
            description = "تلاوة هادئة بمقام البيات مع مراعاة أحكام الغنن والمدود بدقة.",
            audioUri = "content://media/external/audio/media/101",
            audioStoragePath = "submissions/sub-101.mp3",
            audioDurationSeconds = 195,
            status = SubmissionStatus.PENDING,
            adminNotes = "الطلب قيد المراجعة والتدقيق الصوتي والتجويدي من قبل لجنة الاستماع."
        )
    )

    val ANNOUNCEMENTS: List<Announcement> = listOf(
        Announcement(
            id = "ann-1",
            title = "افتتاح منصة تلاوتك للعالم رسميًا",
            body = "نرحب بجميع القراء والمستمعين الكرام في المنصة العالمية المفتوحة لنشر التلاوات القرآنية العذبة.",
            publishedAtEpochMs = 1704067200000L
        ),
        Announcement(
            id = "ann-2",
            title = "إطلاق مسابقة أصوات الأندلس والمغرب العربي",
            body = "تعلن إدارة المنصة عن فتح باب التقديم للمسابقة القرآنية بروايتي ورش وقالون عن نافع.",
            publishedAtEpochMs = 1704500000000L
        )
    )

    val COMPETITIONS: List<Competition> = listOf(
        Competition(
            id = "comp-1",
            title = "مسابقة رتل وارتقِ الرمضانية",
            description = "مسابقة لاكتشاف الأصوات الندية في تلاوة جزء عم وتبارك بروايات القرآن الكريم المتواترة.",
            startAtEpochMs = 1709251200000L,
            endAtEpochMs = 1712707200000L
        )
    )

    val REWARDS: List<RewardDefinition> = listOf(
        RewardDefinition(
            id = "rew-1",
            code = "TAJWEED_MASTER",
            title = "وسام الإتقان التجويدي",
            description = "يُمنح للقراء المتميزين بدقة مخارج الحروف والوقف والابتداء المتقن."
        ),
        RewardDefinition(
            id = "rew-2",
            code = "COMMUNITY_STAR",
            title = "وسام محبة المستمعين",
            description = "تكريم للقراء الذين حازت تلاواتهم على تفاعل واستماع واسع من المسلمين حول العالم."
        )
    )

    val RECITER_HONORS: List<ReciterHonor> = listOf(
        ReciterHonor(
            id = "hon-1",
            reciterId = "reciter-1",
            reward = REWARDS[0],
            citationNote = "تقديرًا لجمال الأداء وإتقان رواية ورش عن نافع بأسلوب مغربي أصيل."
        )
    )
}
