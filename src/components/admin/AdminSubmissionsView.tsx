import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/AdminService';
import { SupabaseService } from '../../services/SupabaseService';
import { userService } from '../../services/UserService';
import { RecitationSubmission, SubmissionStatus } from '../../types';
import { isValidAudioUrl } from '../../utils/mediaUtils';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  User,
  Globe,
  BookOpen,
  Volume2,
  AlertCircle,
  RefreshCw,
  Search,
  Trash2,
  EyeOff,
  FileAudio,
  Link as LinkIcon
} from 'lucide-react';

export function AdminSubmissionsView() {
  const [submissions, setSubmissions] = useState<RecitationSubmission[]>([]);
  const [activeFilter, setActiveFilter] = useState<SubmissionStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<RecitationSubmission | null>(null);

  // Review Modal State
  const [reviewMode, setReviewMode] = useState<'approve_publish' | 'approve_unpublished' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [recitersList, setRecitersList] = useState<any[]>([]);
  const [reciterMode, setReciterMode] = useState<'new' | 'existing'>('new');
  const [selectedReciterId, setSelectedReciterId] = useState('');
  const [isStaffPick, setIsStaffPick] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Dedicated Audio Preview State with Interactive Slider
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubmissions(
        activeFilter === 'all' ? undefined : activeFilter
      );
      setSubmissions(data);

      const reciters = await adminService.getAllAdminReciters();
      setRecitersList(reciters);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [activeFilter]);

  // Audio preview cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const toggleAudioPlay = async (submission: RecitationSubmission) => {
    if (playingAudioId === submission.id && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => setAudioErrorId(submission.id));
      } else {
        audioRef.current.pause();
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setAudioErrorId(null);
    setLoadingAudioId(submission.id);

    try {
      const token = adminService.getAuthState().token || undefined;
      const url = await SupabaseService.getPlayableAudioUrl(submission, token);

      if (!url || !SupabaseService.isValidAudioSource(url)) {
        setAudioErrorId(submission.id);
        setLoadingAudioId(null);
        setPlayingAudioId(null);
        return;
      }

      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRef.current = audio;
      setAudioCurrentTime(0);
      setAudioDuration(submission.audioDuration || 0);

      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
      };

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioCurrentTime(0);
      };

      audio.onerror = (e) => {
        console.warn('Audio preview playback error for submission:', submission.id, 'Resolved URL:', url, e);
        setAudioErrorId(submission.id);
        setPlayingAudioId(null);
        setLoadingAudioId(null);
      };

      await audio.play();
      setPlayingAudioId(submission.id);
    } catch (err) {
      console.warn('Playback error:', err);
      setAudioErrorId(submission.id);
      setPlayingAudioId(null);
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleSeekAudio = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const handleOpenReview = (submission: RecitationSubmission, mode: 'approve_publish' | 'approve_unpublished' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewMode(mode);
    setAdminNotes(submission.adminNotes || '');
    setActionError(null);

    const matching = recitersList.find(
      (r) =>
        r.display_name?.toLowerCase() === submission.displayName.toLowerCase() ||
        (submission.pseudonym && r.pseudonym?.toLowerCase() === submission.pseudonym.toLowerCase())
    );
    if (matching) {
      setReciterMode('existing');
      setSelectedReciterId(matching.id);
    } else {
      setReciterMode('new');
      setSelectedReciterId('');
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف طلب التلاوة هذا نهائيًا؟')) return;
    try {
      await adminService.deleteSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (playingAudioId === id && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudioId(null);
      }
    } catch (e: any) {
      alert(e.message || 'فشل حذف الطلب');
    }
  };

  const handleExecuteApproval = async (publishDirectly: boolean) => {
    if (!selectedSubmission) return;
    setIsActionLoading(true);
    setActionError(null);

    try {
      const isNew = reciterMode === 'new';
      const [startAyah, endAyah] = selectedSubmission.ayahRange
        .split('-')
        .map((s) => parseInt(s.trim(), 10) || 1);

      const targetAudioStoragePath = selectedSubmission.audioStoragePath ||
        (selectedSubmission.audioUrl?.includes('/object/public/')
          ? selectedSubmission.audioUrl.split('/object/public/')[1]
          : '');

      const targetExternalAudioUrl = selectedSubmission.externalAudioUrl ||
        (selectedSubmission.audioUrl && !selectedSubmission.audioUrl.includes('/storage/v1/object/')
          ? selectedSubmission.audioUrl
          : undefined);

      await adminService.approveSubmissionAndPublish({
        submission: selectedSubmission,
        reciterId: isNew ? undefined : selectedReciterId,
        createNewReciter: isNew,
        publishDirectly,
        newReciterData: isNew
          ? {
              displayName: selectedSubmission.displayName,
              pseudonym: selectedSubmission.pseudonym,
              usePseudonym: selectedSubmission.usePseudonym,
              gender: selectedSubmission.gender === 'female' ? 'FEMALE' : 'MALE',
              country: selectedSubmission.country,
              bio: `قارئ من ${selectedSubmission.country}`,
              profileImagePath: selectedSubmission.avatarUrl || selectedSubmission.externalImageUrl,
              isVerified: true,
              isFeatured: false,
              isPublished: publishDirectly
            }
          : undefined,
        recitationData: {
          surahName: selectedSubmission.surahName,
          surahNumber: selectedSubmission.surahNumber,
          ayahStart: startAyah || 1,
          ayahEnd: endAyah || 1,
          riwayah: selectedSubmission.riwayah,
          durationSeconds: selectedSubmission.audioDuration || 180,
          audioStoragePath: targetAudioStoragePath,
          externalAudioUrl: targetExternalAudioUrl,
          coverImagePath: selectedSubmission.externalImageUrl,
          description: selectedSubmission.description,
          isStaffPick: publishDirectly ? isStaffPick : false
        },
        adminNotes
      });

      // Dispatch user notification
      const userInstId = (selectedSubmission as any).installationId || (selectedSubmission as any).installation_id;
      if (userInstId) {
        userService.addNotification({
          installationId: userInstId,
          title: publishDirectly
            ? `تهانينا! تم نشر تلاوتك (${selectedSubmission.surahName})`
            : `تم اعتماد تلاوتك (${selectedSubmission.surahName})`,
          body: publishDirectly
            ? `تمت مراجعة تلاوتك واعتمادها ونشرها بنجاح لتكون متاحة لجميع مستمعي المنصة حول العالم.`
            : `تمت مراجعة تلاوتك واعتمادها من قبل لجنة التدقيق بنجاح، وسيتم نشرها في التطبيق قريبًا.`,
          notificationType: 'SUBMISSION_STATUS',
          referenceId: selectedSubmission.id
        });
      }

      setReviewMode(null);
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (e: any) {
      setActionError(e.message || 'فشلت عملية اعتماد التلاوة');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecuteRejection = async () => {
    if (!selectedSubmission) return;
    setIsActionLoading(true);
    setActionError(null);

    try {
      await adminService.updateSubmissionStatus(
        selectedSubmission.id,
        'REJECTED',
        adminNotes
      );

      // Dispatch user notification
      const userInstId = (selectedSubmission as any).installationId || (selectedSubmission as any).installation_id;
      if (userInstId) {
        userService.addNotification({
          installationId: userInstId,
          title: `تحديث بشأن طلب التلاوة: ${selectedSubmission.surahName}`,
          body: adminNotes
            ? `نعتذر، لم يتم اعتماد نشر التلاوة. ملاحظة الإدارة: ${adminNotes}`
            : `نعتذر، لم تستوفِ التلاوة شروط ومعايير الاعتماد الصوتية والتجويدية للمنصة.`,
          notificationType: 'SUBMISSION_STATUS',
          referenceId: selectedSubmission.id
        });
      }

      setReviewMode(null);
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (e: any) {
      setActionError(e.message || 'فشلت عملية رفض الطلب');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return (
      sub.displayName.toLowerCase().includes(q) ||
      (sub.pseudonym && sub.pseudonym.toLowerCase().includes(q)) ||
      sub.surahName.toLowerCase().includes(q) ||
      sub.country.toLowerCase().includes(q)
    );
  });

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#D4AF37]" />
            <span>إدارة ومراجعة طلبات التلاوات</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            تدقيق التلاوات المرفوعة من القراء والتحقق من صحة القراءة والأحكام قبل النشر العام
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          disabled={isLoading}
          className="px-3 py-2 bg-[#162720] hover:bg-[#1E372C] text-[#A8C2B3] hover:text-white rounded-xl border border-[#2B493B] text-xs font-semibold flex items-center gap-1.5 transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#14241D] border border-[#234235] rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'pending'
                ? 'bg-[#2B5742] text-white shadow-sm'
                : 'text-[#8BA496] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>قيد المراجعة</span>
          </button>

          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'approved'
                ? 'bg-[#2B5742] text-white shadow-sm'
                : 'text-[#8BA496] hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>المقبولة والمنشورة</span>
          </button>

          <button
            onClick={() => setActiveFilter('approved_unpublished' as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              (activeFilter as any) === 'approved_unpublished'
                ? 'bg-[#2B5742] text-white shadow-sm'
                : 'text-[#8BA496] hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-sky-400" />
            <span>معتمدة بدون نشر</span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'rejected'
                ? 'bg-[#2B5742] text-white shadow-sm'
                : 'text-[#8BA496] hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>المرفوضة</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#2B5742] text-white shadow-sm'
                : 'text-[#8BA496] hover:text-white'
            }`}
          >
            <span>الكل ({submissions.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، السورة أو البلد..."
            className="w-full bg-[#14241D] border border-[#234235] rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-[#8BA496] focus:outline-none focus:border-[#4B8569]"
          />
          <Search className="w-3.5 h-3.5 text-[#8BA496] absolute left-3 top-3" />
        </div>
      </div>

      {/* Submissions List / Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#2B5742] border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-xs text-[#8BA496]">جاري تحميل طلبات التلاوات...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-[#14241D] border border-[#234235] rounded-2xl space-y-2">
          <FileCheck className="w-10 h-10 text-[#4B8569] mx-auto opacity-50" />
          <p className="text-sm font-semibold text-[#F0F5F2]">لا توجد طلبات تلاوة في هذا القسم</p>
          <p className="text-xs text-[#8BA496]">
            {activeFilter === 'pending'
              ? 'تمت مراجعة جميع الطلبات الواردة'
              : 'لم يتم العثور على أي نتائج تطابق البحث'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSubmissions.map((sub) => {
            const isPlayingThis = playingAudioId === sub.id;
            const isLoadingThis = loadingAudioId === sub.id;
            const hasErrorThis = audioErrorId === sub.id;
            const isStorageUpload = !!(
              sub.audioStoragePath ||
              (sub as any).audio_storage_path ||
              (sub.audioUrl && (sub.audioUrl.includes('sub_') || sub.audioUrl.includes('submission-audio') || sub.audioUrl.includes('/storage/v1/object/'))) ||
              (sub.audioFileName && (sub.audioFileName.endsWith('.mp3') || sub.audioFileName.endsWith('.m4a') || sub.audioFileName.endsWith('.wav')))
            );
            const isExternalUrl = !!(
              sub.externalAudioUrl ||
              (sub.audioUrl && isValidAudioUrl(sub.audioUrl) && !sub.audioUrl.includes('submission-audio'))
            );
            const hasAnyAudioSource = isStorageUpload || isExternalUrl;

            return (
              <div
                key={sub.id}
                className="bg-[#14241D] border border-[#234235] hover:border-[#346950] rounded-2xl p-5 space-y-4 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header: Reciter & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {sub.avatarUrl || sub.externalImageUrl ? (
                        <img
                          src={sub.avatarUrl || sub.externalImageUrl}
                          alt={sub.displayName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-[#2B5742]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#1A3328] border border-[#2B5742] flex items-center justify-center text-[#4B8569]">
                          <User className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#F0F5F2]">
                            {sub.usePseudonym && sub.pseudonym ? sub.pseudonym : sub.displayName}
                          </h3>
                          {sub.usePseudonym && (
                            <span className="px-1.5 py-0.5 bg-[#1A3328] text-[#8BA496] text-[10px] rounded">
                              اسم مستعار ({sub.displayName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8BA496] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#4B8569]" />
                            <span>{sub.country}</span>
                          </span>
                          <span>•</span>
                          <span>{sub.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                        sub.status === 'pending'
                          ? 'bg-amber-950/70 border border-amber-800 text-amber-300'
                          : sub.status === 'approved'
                          ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                          : (sub.status as any) === 'approved_unpublished'
                          ? 'bg-sky-950/70 border border-sky-800 text-sky-300'
                          : 'bg-rose-950/70 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {sub.status === 'pending'
                        ? 'قيد المراجعة'
                        : sub.status === 'approved'
                        ? 'معتمدة ومنشورة'
                        : (sub.status as any) === 'approved_unpublished'
                        ? 'معتمدة بدون نشر'
                        : 'مرفوضة'}
                    </span>
                  </div>

                  {/* Recitation specifics */}
                  <div className="p-3 bg-[#0D1813] border border-[#1F372C] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>سورة {sub.surahName} ({sub.ayahRange})</span>
                      </span>
                      <span className="text-[#8BA496]">رواية {sub.riwayah}</span>
                    </div>

                    {sub.description && (
                      <p className="text-[11px] text-[#A8C2B3] line-clamp-2 italic">
                        "{sub.description}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#1F372C] text-[10px] text-[#6E8E7E]">
                      <span>تاريخ التقديم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}</span>
                      <div className="flex items-center gap-1">
                        {isStorageUpload ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <FileAudio className="w-3 h-3" />
                            <span>ملف صوتي مرفوع</span>
                          </span>
                        ) : isExternalUrl ? (
                          <span className="flex items-center gap-1 text-sky-400">
                            <LinkIcon className="w-3 h-3" />
                            <span>رابط صوتي خارجي</span>
                          </span>
                        ) : (
                          <span>غير محدد</span>
                        )}
                        {sub.audioFileName && <span className="mr-1">({sub.audioFileName})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Admin notes if any */}
                  {sub.adminNotes && (
                    <div className="p-2.5 bg-[#1C2C23] border border-[#2B493B] rounded-lg text-xs text-[#A8C2B3] space-y-1">
                      <span className="font-semibold text-[#D4AF37] block">ملاحظات الإدارة:</span>
                      <p className="text-[11px]">{sub.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions & Interactive Audio Player */}
                <div className="space-y-3 pt-3 border-t border-[#1F372C]">
                  {/* Integrated Audio Preview Player */}
                  {hasAnyAudioSource ? (
                    <div className="p-2.5 bg-[#0D1813] border border-[#2B493B] rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => toggleAudioPlay(sub)}
                          disabled={isLoadingThis}
                          className="px-3 py-1.5 bg-[#2B5742] hover:bg-[#346950] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 disabled:opacity-60"
                        >
                          {isLoadingThis ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>جاري التجهيز...</span>
                            </>
                          ) : isPlayingThis ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>استماع للتلاوة</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2 text-[11px] text-[#D4AF37] font-mono" dir="ltr">
                          <span>{isPlayingThis ? formatSeconds(audioCurrentTime) : '00:00'}</span>
                          <span>/</span>
                          <span>{formatSeconds(isPlayingThis && audioDuration ? audioDuration : sub.audioDuration || 180)}</span>
                        </div>
                      </div>

                      {/* Seek Slider */}
                      {isPlayingThis && (
                        <div className="space-y-1 pt-1">
                          <input
                            type="range"
                            min={0}
                            max={audioDuration || sub.audioDuration || 180}
                            value={audioCurrentTime}
                            onChange={(e) => handleSeekAudio(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-[#1F372C] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>
                      )}

                      {hasErrorThis && (
                        <div className="p-2 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center gap-2 text-[11px] text-rose-300 font-semibold mt-1">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>تعذر تشغيل الملف الصوتي المرفوع أو الرابط غير صالح.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded-xl text-center text-[11px] text-rose-300">
                      لا يوجد ملف صوتي صالح مسجل لهذا الطلب.
                    </div>
                  )}

                  {/* Admin moderation & deletion buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {sub.status === 'pending' ? (
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <button
                          onClick={() => handleOpenReview(sub, 'approve_publish')}
                          className="py-2 px-2.5 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>اعتماد ونشر</span>
                        </button>

                        <button
                          onClick={() => handleOpenReview(sub, 'reject')}
                          className="py-2 px-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض الطلب</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <button
                          onClick={() => handleOpenReview(sub, 'approve_publish')}
                          className="w-full py-1.5 px-3 bg-[#1A3328] hover:bg-[#224435] border border-[#2B5742] text-[#D4AF37] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تعديل حالة الطلب</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteSubmission(sub.id)}
                      className="p-2 bg-[#1A2621] hover:bg-rose-950/60 hover:border-rose-800 border border-[#2B493B] text-[#8BA496] hover:text-rose-300 rounded-xl text-xs transition"
                      title="حذف طلب التلاوة نهائيًا"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Approval Modal */}
      {reviewMode && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14241D] border border-[#2B5742] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#234235]">
              <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
                {reviewMode === 'approve_publish' || reviewMode === 'approve_unpublished' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>اعتماد التلاوة ومراجعة النشر</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>رفض طلب التلاوة</span>
                  </>
                )}
              </h2>

              <button
                onClick={() => setReviewMode(null)}
                className="text-[#8BA496] hover:text-white text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Approval Details */}
            {(reviewMode === 'approve_publish' || reviewMode === 'approve_unpublished') && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#0D1813] border border-[#1F372C] rounded-xl space-y-1">
                  <div className="font-bold text-[#F0F5F2]">
                    سورة {selectedSubmission.surahName} ({selectedSubmission.ayahRange})
                  </div>
                  <div className="text-[#8BA496]">
                    بصوت: {selectedSubmission.displayName} • {selectedSubmission.country}
                  </div>
                </div>

                {/* Reciter linking options */}
                <div className="space-y-2">
                  <label className="block font-semibold text-[#A8C2B3]">
                    ربط التلاوة بملف القارئ:
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReciterMode('new')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        reciterMode === 'new'
                          ? 'bg-[#2B5742] border-[#3E745A] text-white'
                          : 'bg-[#1A3328] border-[#234235] text-[#8BA496]'
                      }`}
                    >
                      إنشاء ملف قارئ جديد
                    </button>

                    <button
                      type="button"
                      onClick={() => setReciterMode('existing')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        reciterMode === 'existing'
                          ? 'bg-[#2B5742] border-[#3E745A] text-white'
                          : 'bg-[#1A3328] border-[#234235] text-[#8BA496]'
                      }`}
                    >
                      ربط بقارئ مسجل مسبقاً
                    </button>
                  </div>

                  {reciterMode === 'existing' && (
                    <div className="space-y-1 pt-1">
                      <select
                        value={selectedReciterId}
                        onChange={(e) => setSelectedReciterId(e.target.value)}
                        className="w-full bg-[#0D1813] border border-[#2B493B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">-- اختر القارئ من القائمة --</option>
                        {recitersList.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.display_name || r.public_name || 'قارئ مسجل'} ({r.country || 'أخرى'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Staff pick option */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="staffPickCheckbox"
                    checked={isStaffPick}
                    onChange={(e) => setIsStaffPick(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#D4AF37] focus:ring-0"
                  />
                  <label htmlFor="staffPickCheckbox" className="text-xs text-[#E8EFEA] cursor-pointer">
                    تمييز التلاوة ضمن "تلاوات مختارة ومعتمدة" في الصفحة الرئيسية
                  </label>
                </div>

                {/* Admin notes */}
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">
                    ملاحظات الإدارة والتدقيق (اختياري):
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="تمت المراجعة والتأكد من سلامة التلاوة والأحكام..."
                    className="w-full bg-[#0D1813] border border-[#2B493B] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Rejection Details */}
            {reviewMode === 'reject' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#8BA496]">
                  يرجى توضيح سبب الرفض (مثال: جودة الصوت، أخطاء في التجويد، أو نقص في البيانات):
                </p>

                <textarea
                  rows={3}
                  required
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="سبب الرفض للتوثيق الداخلي وإشعار صاحب التلاوة..."
                  className="w-full bg-[#0D1813] border border-[#2B493B] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#234235]">
              <button
                type="button"
                onClick={() => setReviewMode(null)}
                className="px-4 py-2 bg-[#1A3328] hover:bg-[#224435] text-[#A8C2B3] rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>

              {reviewMode === 'reject' ? (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleExecuteRejection}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>تأكيد الرفض</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isActionLoading || (reciterMode === 'existing' && !selectedReciterId)}
                    onClick={() => handleExecuteApproval(false)}
                    className="px-3.5 py-2 bg-[#1C362A] hover:bg-[#264A3A] border border-[#2B5742] text-[#A8C2B3] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>اعتماد بدون نشر</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading || (reciterMode === 'existing' && !selectedReciterId)}
                    onClick={() => handleExecuteApproval(true)}
                    className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>اعتماد ونشر مباشر</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
