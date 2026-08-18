package com.tilawatak.data

import com.tilawatak.data.local.DefaultAnonymousInstallationIdProvider
import com.tilawatak.data.remote.DataSourceMode
import com.tilawatak.data.remote.SupabaseConfig
import com.tilawatak.data.remote.repository.SupabaseAnnouncementRepository
import com.tilawatak.data.remote.repository.SupabaseCompetitionRepository
import com.tilawatak.data.remote.repository.SupabaseLikeRepository
import com.tilawatak.data.remote.repository.SupabaseListenEventRepository
import com.tilawatak.data.remote.repository.SupabaseRecitationRepository
import com.tilawatak.data.remote.repository.SupabaseReciterRepository
import com.tilawatak.data.remote.repository.SupabaseRewardRepository
import com.tilawatak.data.remote.repository.SupabaseStatisticsRepository
import com.tilawatak.data.remote.repository.SupabaseSubmissionRepository
import com.tilawatak.data.repository.MockAdminAuthRepository
import com.tilawatak.data.repository.MockAdminNotificationRepository
import com.tilawatak.data.repository.MockAdminRepository
import com.tilawatak.data.repository.MockAnnouncementRepository
import com.tilawatak.data.repository.MockCompetitionRepository
import com.tilawatak.data.repository.MockLikeRepository
import com.tilawatak.data.repository.MockListenEventRepository
import com.tilawatak.data.repository.MockRecitationRepository
import com.tilawatak.data.repository.MockReciterRepository
import com.tilawatak.data.repository.MockRewardRepository
import com.tilawatak.data.repository.MockStatisticsRepository
import com.tilawatak.data.repository.MockSubmissionRepository
import com.tilawatak.domain.provider.AnonymousInstallationIdProvider
import com.tilawatak.domain.repository.IAdminAuthRepository
import com.tilawatak.domain.repository.IAdminNotificationRepository
import com.tilawatak.domain.repository.IAdminRepository
import com.tilawatak.domain.repository.IAnnouncementRepository
import com.tilawatak.domain.repository.ICompetitionRepository
import com.tilawatak.domain.repository.ILikeRepository
import com.tilawatak.domain.repository.IListenEventRepository
import com.tilawatak.domain.repository.IRecitationRepository
import com.tilawatak.domain.repository.IReciterRepository
import com.tilawatak.domain.repository.IRewardRepository
import com.tilawatak.domain.repository.IStatisticsRepository
import com.tilawatak.domain.repository.ISubmissionRepository

/**
 * Clean dependency provider supporting seamless switching between
 * DataSourceMode.SUPABASE and DataSourceMode.MOCK.
 * UI continues depending strictly on repository interfaces.
 */
class RepositoryProvider(
    val mode: DataSourceMode = SupabaseConfig.currentMode,
    val installationIdProvider: AnonymousInstallationIdProvider = DefaultAnonymousInstallationIdProvider()
) {
    val installationId: String
        get() = installationIdProvider.getInstallationId()

    // Mock implementations
    private val mockNotificationRepo by lazy { MockAdminNotificationRepository() }
    private val mockReciterRepo by lazy { MockReciterRepository() }
    private val mockRecitationRepo by lazy { MockRecitationRepository() }
    private val mockStatsRepo by lazy { MockStatisticsRepository(mockRecitationRepo, mockReciterRepo) }
    private val mockSubmissionRepo by lazy { MockSubmissionRepository(mockNotificationRepo) }
    private val mockLikeRepo by lazy { MockLikeRepository() }
    private val mockListenEventRepo by lazy { MockListenEventRepository() }
    private val mockAnnouncementRepo by lazy { MockAnnouncementRepository() }
    private val mockCompetitionRepo by lazy { MockCompetitionRepository() }
    private val mockRewardRepo by lazy { MockRewardRepository() }
    private val mockAdminAuthRepo by lazy { MockAdminAuthRepository() }
    private val mockAdminRepo by lazy { MockAdminRepository(mockNotificationRepo) }

    // Supabase Live implementations
    private val supabaseReciterRepo by lazy { SupabaseReciterRepository() }
    private val supabaseRecitationRepo by lazy { SupabaseRecitationRepository(installationId) }
    private val supabaseStatsRepo by lazy { SupabaseStatisticsRepository() }
    private val supabaseSubmissionRepo by lazy { SupabaseSubmissionRepository() }
    private val supabaseLikeRepo by lazy { SupabaseLikeRepository(installationId) }
    private val supabaseListenEventRepo by lazy { SupabaseListenEventRepository(installationId) }
    private val supabaseAnnouncementRepo by lazy { SupabaseAnnouncementRepository() }
    private val supabaseCompetitionRepo by lazy { SupabaseCompetitionRepository() }
    private val supabaseRewardRepo by lazy { SupabaseRewardRepository() }

    val reciterRepository: IReciterRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseReciterRepo else mockReciterRepo

    val recitationRepository: IRecitationRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseRecitationRepo else mockRecitationRepo

    val statisticsRepository: IStatisticsRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseStatsRepo else mockStatsRepo

    val submissionRepository: ISubmissionRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseSubmissionRepo else mockSubmissionRepo

    val likeRepository: ILikeRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseLikeRepo else mockLikeRepo

    val listenEventRepository: IListenEventRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseListenEventRepo else mockListenEventRepo

    val announcementRepository: IAnnouncementRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseAnnouncementRepo else mockAnnouncementRepo

    val competitionRepository: ICompetitionRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseCompetitionRepo else mockCompetitionRepo

    val rewardRepository: IRewardRepository
        get() = if (mode == DataSourceMode.SUPABASE) supabaseRewardRepo else mockRewardRepo

    val adminNotificationRepository: IAdminNotificationRepository
        get() = mockNotificationRepo

    val adminAuthRepository: IAdminAuthRepository
        get() = mockAdminAuthRepo

    val adminRepository: IAdminRepository
        get() = mockAdminRepo
}
