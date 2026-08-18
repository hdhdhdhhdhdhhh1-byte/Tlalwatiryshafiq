import {
  Reciter,
  Recitation,
  RecitationSubmission,
  SubmissionStatus,
  ListenEvent,
  LikeResult,
  Competition,
  Announcement,
  ReciterHonor
} from '../types';
import { SupabaseService, SUPABASE_CONFIG } from './SupabaseService';
import { userService } from './UserService';

export enum DataSourceMode {
  MOCK = 'MOCK',
  SUPABASE = 'SUPABASE'
}

let currentDataSourceMode: DataSourceMode = DataSourceMode.SUPABASE;

export function getDataSourceMode(): DataSourceMode {
  return currentDataSourceMode;
}

export function setDataSourceMode(mode: DataSourceMode) {
  currentDataSourceMode = mode;
}

// ============================================================================
// DOMAIN REPOSITORY INTERFACES (Clean Architecture - Backend Agnostic)
// ============================================================================

/**
 * Repository interface for managing and querying Reciters.
 * Compatible with Kotlin Flow streams and suspend functions.
 */
export interface IReciterRepository {
  getRecitersStream(onUpdate?: (reciters: Reciter[]) => void): () => void;
  getAllReciters(): Promise<Reciter[]>;
  getReciterById(id: string): Promise<Reciter | null>;
  getFeaturedReciters(): Promise<Reciter[]>;
  searchReciters(query: string): Promise<Reciter[]>;
  getNewestReciters(limit?: number): Promise<Reciter[]>;
}

/**
 * Repository interface for managing Recitations, user-specific like states,
 * and listen event ingestion.
 */
export interface IRecitationRepository {
  getRecitationsStream(onUpdate?: (recitations: Recitation[]) => void): () => void;
  getAllRecitations(): Promise<Recitation[]>;
  getRecitationsByReciter(reciterId: string): Promise<Recitation[]>;
  toggleLike(recitationId: string, userId?: string): Promise<LikeResult>;
  recordListenEvent(event: ListenEvent): Promise<void>;
}

/**
 * Repository interface for fetching ranking, discovery, and statistical metrics.
 * Decouples sorting and ranking logic from the UI presentation layer.
 */
export interface IStatisticsRepository {
  getMostListenedRecitations(limit?: number): Promise<Recitation[]>;
  getMostLikedRecitations(limit?: number): Promise<Recitation[]>;
  getMostListenedReciters(limit?: number): Promise<Reciter[]>;
  getMostLikedReciters(limit?: number): Promise<Reciter[]>;
  getNewestRecitations(limit?: number): Promise<Recitation[]>;
}

/**
 * Repository interface for handling recitation submission drafts and moderation status.
 */
export interface ISubmissionRepository {
  submitRecitation(
    submission: Omit<RecitationSubmission, 'id' | 'submittedAt' | 'status'>
  ): Promise<RecitationSubmission>;
  getUserSubmissions(): Promise<RecitationSubmission[]>;
}

// ============================================================================
// HYBRID REPOSITORY IMPLEMENTATION (SUPABASE + CLEAN LOCAL MEMORY)
// ============================================================================

class HybridReciterRepository implements IReciterRepository {
  private reciters: Reciter[] = [];
  private listeners: Set<(reciters: Reciter[]) => void> = new Set();

  getRecitersStream(onUpdate?: (reciters: Reciter[]) => void): () => void {
    if (onUpdate) {
      this.listeners.add(onUpdate);
      this.getAllReciters().then((list) => onUpdate(list));
    }
    return () => {
      if (onUpdate) this.listeners.delete(onUpdate);
    };
  }

  async getAllReciters(): Promise<Reciter[]> {
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const data = await SupabaseService.fetchPublicReciters();
      if (data && Array.isArray(data)) {
        return data.map((d: any) => ({
          id: d.id,
          displayName: d.display_name || d.public_name || 'قارئ',
          pseudonym: d.pseudonym || undefined,
          isAnonymous: d.use_pseudonym ?? false,
          gender: (d.gender?.toLowerCase() === 'female' ? 'female' : 'male'),
          country: d.country || 'العالم الإسلامي',
          countryCode: d.country_code || 'SA',
          bio: d.bio || '',
          avatarUrl: SupabaseService.resolveImageUrl(d.profile_image_path || d.avatar_url, 'profile-images'),
          verified: !!d.is_verified,
          isStaffPick: !!(d.is_featured || d.is_staff_pick),
          stats: {
            totalRecitations: Number(d.total_recitations) || 0,
            totalListens: Number(d.total_listens) || 0,
            totalLikes: Number(d.total_likes) || 0
          },
          createdAt: d.created_at || new Date().toISOString()
        }));
      }
      return [];
    }
    return [...this.reciters];
  }

  async getReciterById(id: string): Promise<Reciter | null> {
    const list = await this.getAllReciters();
    return list.find((r) => r.id === id) || null;
  }

  async getFeaturedReciters(): Promise<Reciter[]> {
    const list = await this.getAllReciters();
    return list.filter((r) => r.isStaffPick || r.verified);
  }

  async searchReciters(query: string): Promise<Reciter[]> {
    const list = await this.getAllReciters();
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.pseudonym && r.pseudonym.toLowerCase().includes(q))
    );
  }

  async getNewestReciters(limit: number = 10): Promise<Reciter[]> {
    const list = await this.getAllReciters();
    return [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

class HybridRecitationRepository implements IRecitationRepository {
  private recitations: Recitation[] = [];
  private userLikesMap: Map<string, Set<string>> = new Map();
  private recordedEvents: ListenEvent[] = [];
  private listeners: Set<(recitations: Recitation[]) => void> = new Set();

  getRecitationsStream(onUpdate?: (recitations: Recitation[]) => void): () => void {
    if (onUpdate) {
      this.listeners.add(onUpdate);
      this.getAllRecitations().then((list) => onUpdate(list));
    }
    return () => {
      if (onUpdate) this.listeners.delete(onUpdate);
    };
  }

  private notifyListeners() {
    const data = [...this.recitations];
    this.listeners.forEach((listener) => listener(data));
  }

  async getAllRecitations(): Promise<Recitation[]> {
    const installId = typeof window !== 'undefined' ? userService.getInstallationId() : 'user_current';
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const [data, userLikes] = await Promise.all([
        SupabaseService.fetchPublicRecitations(),
        SupabaseService.fetchUserLikes(installId)
      ]);
      if (data && Array.isArray(data)) {
        this.userLikesMap.set(installId, userLikes);
        return data.map((d: any) => ({
          id: d.id,
          reciterId: d.reciter_id,
          reciterName: d.reciter_name || 'قارئ',
          reciterAvatar: SupabaseService.resolveImageUrl(d.reciter_avatar, 'profile-images'),
          reciterCountry: d.reciter_country || '',
          surahNumber: Number(d.surah_number) || 1,
          surahNameArabic: d.surah_name || d.surah_name_arabic || 'سورة',
          surahNameEnglish: d.surah_name_english || '',
          ayahRange: d.ayah_range || 'كاملة',
          riwayah: d.riwayah || 'حفص عن عاصم',
          duration: Number(d.duration_seconds) || 180,
          durationFormatted: `${Math.floor((Number(d.duration_seconds) || 180) / 60).toString().padStart(2, '0')}:${((Number(d.duration_seconds) || 180) % 60).toString().padStart(2, '0')}`,
          audioUrl: SupabaseService.resolveAudioUrl(d),
          coverUrl: d.cover_image_path ? SupabaseService.resolveImageUrl(d.cover_image_path, 'recitation-covers') : undefined,
          listenCount: Number(d.listen_count) || 0,
          likeCount: Number(d.like_count) || 0,
          isLiked: userLikes.has(d.id),
          isStaffPick: !!d.is_staff_pick,
          description: d.description || '',
          createdAt: d.published_at || d.created_at || new Date().toISOString()
        }));
      }
      return [];
    }
    return [...this.recitations];
  }

  /**
   * Reciter profile recitations must be ordered strictly by published_at DESC (newest published first).
   */
  async getRecitationsByReciter(reciterId: string): Promise<Recitation[]> {
    const installId = typeof window !== 'undefined' ? userService.getInstallationId() : 'user_current';
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const [data, userLikes] = await Promise.all([
        SupabaseService.fetchPublicRecitations(reciterId),
        SupabaseService.fetchUserLikes(installId)
      ]);
      if (data && Array.isArray(data)) {
        this.userLikesMap.set(installId, userLikes);
        return data.map((d: any) => ({
          id: d.id,
          reciterId: d.reciter_id,
          reciterName: d.reciter_name || 'قارئ',
          reciterAvatar: SupabaseService.resolveImageUrl(d.reciter_avatar, 'profile-images'),
          reciterCountry: d.reciter_country || '',
          surahNumber: Number(d.surah_number) || 1,
          surahNameArabic: d.surah_name || d.surah_name_arabic || 'سورة',
          surahNameEnglish: d.surah_name_english || '',
          ayahRange: d.ayah_range || 'كاملة',
          riwayah: d.riwayah || 'حفص عن عاصم',
          duration: Number(d.duration_seconds) || 180,
          durationFormatted: `${Math.floor((Number(d.duration_seconds) || 180) / 60).toString().padStart(2, '0')}:${((Number(d.duration_seconds) || 180) % 60).toString().padStart(2, '0')}`,
          audioUrl: SupabaseService.resolveAudioUrl(d),
          coverUrl: d.cover_image_path ? SupabaseService.resolveImageUrl(d.cover_image_path, 'recitation-covers') : undefined,
          listenCount: Number(d.listen_count) || 0,
          likeCount: Number(d.like_count) || 0,
          isLiked: userLikes.has(d.id),
          isStaffPick: !!d.is_staff_pick,
          description: d.description || '',
          createdAt: d.published_at || d.created_at || new Date().toISOString()
        }));
      }
      return [];
    }
    return this.recitations
      .filter((r) => r.reciterId === reciterId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async toggleLike(recitationId: string, userId?: string): Promise<LikeResult> {
    const activeUserId = userId || (typeof window !== 'undefined' ? userService.getInstallationId() : 'user_current');
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const rpcResult = await SupabaseService.toggleLike(recitationId, activeUserId);
      if (rpcResult) {
        const isLiked = !!(rpcResult.is_liked ?? rpcResult.v_new_state);
        const count = Number(rpcResult.total_likes ?? rpcResult.v_count) || 0;
        let userLikes = this.userLikesMap.get(activeUserId);
        if (!userLikes) {
          userLikes = new Set();
          this.userLikesMap.set(activeUserId, userLikes);
        }
        if (isLiked) userLikes.add(recitationId); else userLikes.delete(recitationId);

        const recitation = this.recitations.find((r) => r.id === recitationId);
        if (recitation) {
          recitation.isLiked = isLiked;
          recitation.likeCount = count;
        }
        this.notifyListeners();
        return { isLiked, likeCount: count };
      }
    }

    let userLikes = this.userLikesMap.get(activeUserId);
    if (!userLikes) {
      userLikes = new Set<string>();
      this.userLikesMap.set(activeUserId, userLikes);
    }

    const index = this.recitations.findIndex((r) => r.id === recitationId);
    if (index === -1) {
      return { isLiked: false, likeCount: 0 };
    }

    const recitation = this.recitations[index];
    const isCurrentlyLiked = userLikes.has(recitationId);

    if (isCurrentlyLiked) {
      userLikes.delete(recitationId);
      recitation.likeCount = Math.max(0, recitation.likeCount - 1);
      recitation.isLiked = false;
    } else {
      userLikes.add(recitationId);
      recitation.likeCount += 1;
      recitation.isLiked = true;
    }

    this.notifyListeners();
    return {
      isLiked: recitation.isLiked,
      likeCount: recitation.likeCount
    };
  }

  async recordListenEvent(event: ListenEvent): Promise<void> {
    const validEvent: ListenEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };
    this.recordedEvents.push(validEvent);

    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const installId = typeof window !== 'undefined' ? userService.getInstallationId() : 'user_current';
      await SupabaseService.recordListenEvent(
        event.recitationId,
        installId,
        event.durationSeconds || 5,
        event.completed || false
      );
    }

    const recitation = this.recitations.find((r) => r.id === event.recitationId);
    if (recitation) {
      recitation.listenCount += 1;
      this.notifyListeners();
    }
  }
}

class HybridStatisticsRepository implements IStatisticsRepository {
  private recitationRepo: IRecitationRepository;
  private reciterRepo: IReciterRepository;

  constructor(recitationRepo: IRecitationRepository, reciterRepo: IReciterRepository) {
    this.recitationRepo = recitationRepo;
    this.reciterRepo = reciterRepo;
  }

  async getMostListenedRecitations(limit: number = 10): Promise<Recitation[]> {
    const all = await this.recitationRepo.getAllRecitations();
    return [...all].sort((a, b) => b.listenCount - a.listenCount).slice(0, limit);
  }

  async getMostLikedRecitations(limit: number = 10): Promise<Recitation[]> {
    const all = await this.recitationRepo.getAllRecitations();
    return [...all].sort((a, b) => b.likeCount - a.likeCount).slice(0, limit);
  }

  async getMostListenedReciters(limit: number = 10): Promise<Reciter[]> {
    const all = await this.reciterRepo.getAllReciters();
    return [...all].sort((a, b) => b.stats.totalListens - a.stats.totalListens).slice(0, limit);
  }

  async getMostLikedReciters(limit: number = 10): Promise<Reciter[]> {
    const all = await this.reciterRepo.getAllReciters();
    return [...all].sort((a, b) => b.stats.totalLikes - a.stats.totalLikes).slice(0, limit);
  }

  async getNewestRecitations(limit: number = 10): Promise<Recitation[]> {
    const all = await this.recitationRepo.getAllRecitations();
    return [...all]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

class HybridSubmissionRepository implements ISubmissionRepository {
  private submissions: RecitationSubmission[] = [];
  private listeners: Set<(subs: RecitationSubmission[]) => void> = new Set();

  async getUserSubmissions(): Promise<RecitationSubmission[]> {
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const installId = typeof window !== 'undefined' ? userService.getInstallationId() : undefined;
      if (installId) {
        try {
          const res = await fetch(
            `${SUPABASE_CONFIG.restBaseUrl}/recitation_submissions?installation_id=eq.${encodeURIComponent(installId)}&order=created_at.desc`,
            {
              headers: {
                apikey: SUPABASE_CONFIG.anonKey,
                Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`
              }
            }
          );
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
              const remoteMapped: RecitationSubmission[] = rows.map((r: any) => ({
                id: r.id,
                displayName: r.display_name,
                pseudonym: r.pseudonym || undefined,
                usePseudonym: !!r.use_pseudonym,
                gender: r.gender?.toLowerCase() === 'female' ? 'female' : 'male',
                country: r.country || 'العالم الإسلامي',
                avatarUrl: r.profile_image_path ? SupabaseService.resolveImageUrl(r.profile_image_path, 'profile-images') : undefined,
                surahNumber: r.surah_number,
                surahName: r.surah_name,
                ayahRange: r.ayah_start === r.ayah_end ? `${r.ayah_start}` : `${r.ayah_start} - ${r.ayah_end}`,
                riwayah: r.riwayah,
                description: r.description || '',
                audioFileName: r.audio_storage_path?.split('/').pop() || 'audio.mp3',
                audioDuration: 0,
                audioStoragePath: r.audio_storage_path,
                audioUrl: SupabaseService.resolveAudioUrl(r),
                externalAudioUrl: r.external_audio_url,
                externalImageUrl: r.profile_image_path,
                agreeToTerms: true,
                submittedAt: r.created_at,
                status: (
                  r.status === 'APPROVED' ? 'approved' :
                  r.status === 'APPROVED_UNPUBLISHED' ? 'approved_unpublished' :
                  r.status === 'REJECTED' ? 'rejected' : 'pending'
                ) as SubmissionStatus,
                adminNotes: r.admin_notes
              }));

              // Merge non-duplicate local items
              const nonDuplicateLocal = this.submissions.filter(
                (loc) => !remoteMapped.some((rem) => rem.id === loc.id)
              );
              this.submissions = [...remoteMapped, ...nonDuplicateLocal];
              return this.submissions;
            }
          }
        } catch (e) {
          console.warn('Error fetching user submissions from Supabase:', e);
        }
      }
    }
    return [...this.submissions];
  }

  async submitRecitation(
    data: Omit<RecitationSubmission, 'id' | 'submittedAt' | 'status'>
  ): Promise<RecitationSubmission> {
    const submissionId = `sub-${Date.now()}`;
    const newSubmission: RecitationSubmission = {
      ...data,
      id: submissionId,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      adminNotes: 'تم استلام طلبكم وهو قيد المراجعة والتدقيق الصوتي والتجويدي من قبل الإدارة.'
    };

    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      let ayahStart = 1;
      let ayahEnd = 1;
      if (data.ayahRange) {
        const nums = data.ayahRange.match(/\d+/g);
        if (nums && nums.length >= 2) {
          ayahStart = parseInt(nums[0], 10) || 1;
          ayahEnd = parseInt(nums[1], 10) || ayahStart;
        } else if (nums && nums.length === 1) {
          ayahStart = parseInt(nums[0], 10) || 1;
          ayahEnd = ayahStart;
        }
      }

      const storagePath = data.audioStoragePath || '';
      const installId = typeof window !== 'undefined' ? userService.getInstallationId() : undefined;

      const submitRes = await SupabaseService.submitRecitation({
        display_name: data.displayName,
        pseudonym: data.pseudonym || null,
        use_pseudonym: !!data.usePseudonym,
        gender: data.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
        country: data.country || 'العالم الإسلامي',
        profile_image_path: data.externalImageUrl || data.avatarUrl || null,
        surah_number: data.surahNumber,
        surah_name: data.surahName,
        ayah_start: ayahStart,
        ayah_end: ayahEnd,
        riwayah: data.riwayah || 'حفص عن عاصم',
        description: data.description || '',
        audio_storage_path: storagePath,
        external_audio_url: data.externalAudioUrl || null,
        installation_id: installId,
        status: 'PENDING'
      });

      if (submitRes?.id) {
        newSubmission.id = submitRes.id;
      }
    }

    this.submissions.unshift(newSubmission);
    this.listeners.forEach((listener) => listener([...this.submissions]));
    return newSubmission;
  }
}

export interface ICompetitionRepository {
  getPublishedCompetitions(): Promise<Competition[]>;
}

export interface IAnnouncementRepository {
  getPublishedAnnouncements(): Promise<Announcement[]>;
}

export interface IHonorRepository {
  getReciterHonors(reciterId?: string): Promise<ReciterHonor[]>;
}

class HybridCompetitionRepository implements ICompetitionRepository {
  async getPublishedCompetitions(): Promise<Competition[]> {
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const data = await SupabaseService.fetchPublicCompetitions();
      if (data && Array.isArray(data)) return data;
    }
    return [];
  }
}

class HybridAnnouncementRepository implements IAnnouncementRepository {
  async getPublishedAnnouncements(): Promise<Announcement[]> {
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const data = await SupabaseService.fetchPublicAnnouncements();
      if (data && Array.isArray(data)) return data;
    }
    return [];
  }
}

class HybridHonorRepository implements IHonorRepository {
  async getReciterHonors(reciterId?: string): Promise<ReciterHonor[]> {
    if (currentDataSourceMode === DataSourceMode.SUPABASE) {
      const data = await SupabaseService.fetchPublicReciterHonors(reciterId);
      if (data && Array.isArray(data)) return data;
    }
    return [];
  }
}

// ============================================================================
// SINGLETON REPOSITORY INSTANCES (Dependency Injection)
// ============================================================================

export const reciterRepository: IReciterRepository = new HybridReciterRepository();
export const recitationRepository: IRecitationRepository = new HybridRecitationRepository();
export const statisticsRepository: IStatisticsRepository = new HybridStatisticsRepository(
  recitationRepository,
  reciterRepository
);
export const submissionRepository: ISubmissionRepository = new HybridSubmissionRepository();
export const competitionRepository: ICompetitionRepository = new HybridCompetitionRepository();
export const announcementRepository: IAnnouncementRepository = new HybridAnnouncementRepository();
export const honorRepository: IHonorRepository = new HybridHonorRepository();

