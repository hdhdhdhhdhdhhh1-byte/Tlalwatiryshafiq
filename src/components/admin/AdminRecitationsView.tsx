import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { SupabaseService } from '../../services/SupabaseService';
import {
  Music,
  PlusCircle,
  Edit,
  Trash2,
  Play,
  Pause,
  Sparkles,
  BookOpen,
  User,
  Radio,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  Upload
} from 'lucide-react';

export function AdminRecitationsView() {
  const [recitations, setRecitations] = useState<any[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReciterFilter, setSelectedReciterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecitation, setEditingRecitation] = useState<any | null>(null);

  // Form State
  const [reciterId, setReciterId] = useState('');
  const [surahName, setSurahName] = useState('الفاتحة');
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(7);
  const [riwayah, setRiwayah] = useState('حفص عن عاصم');
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [audioStoragePath, setAudioStoragePath] = useState('');
  const [externalAudioUrl, setExternalAudioUrl] = useState('');
  const [coverImagePath, setCoverImagePath] = useState('');
  const [description, setDescription] = useState('');
  const [isStaffPick, setIsStaffPick] = useState(false);
  const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Audio Preview
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recs, recsList] = await Promise.all([
        adminService.getAllAdminRecitations(
          selectedReciterFilter === 'all' ? undefined : selectedReciterFilter
        ),
        adminService.getAllAdminReciters()
      ]);
      setRecitations(recs);
      setReciters(recsList);
    } catch (e) {
      console.error('Failed to load recitations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedReciterFilter]);

  const togglePlay = (rec: any) => {
    const url = SupabaseService.resolveAudioUrl(rec);

    if (!url) return;

    if (playingId === rec.id) {
      audioElem?.pause();
      setPlayingId(null);
    } else {
      audioElem?.pause();
      const a = new Audio(url);
      a.onended = () => setPlayingId(null);
      a.onerror = () => setPlayingId(null);
      a.play().catch((err) => {
        console.warn('Recitation preview error:', err);
        setPlayingId(null);
      });
      setAudioElem(a);
      setPlayingId(rec.id);
    }
  };

  const openCreateModal = async () => {
    setEditingRecitation(null);
    let currentReciters = reciters;
    if (!currentReciters || currentReciters.length === 0) {
      try {
        currentReciters = await adminService.getAllAdminReciters();
        setReciters(currentReciters);
      } catch {
        // ignore
      }
    }
    setReciterId(currentReciters[0]?.id || '');
    setSurahName('الفاتحة');
    setSurahNumber(1);
    setAyahStart(1);
    setAyahEnd(7);
    setRiwayah('حفص عن عاصم');
    setDurationSeconds(180);
    setAudioStoragePath('');
    setExternalAudioUrl('');
    setCoverImagePath('');
    setDescription('');
    setIsStaffPick(false);
    setStatus('APPROVED');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: any) => {
    setEditingRecitation(rec);
    setReciterId(rec.reciter_id);
    setSurahName(rec.surah_name);
    setSurahNumber(rec.surah_number);
    setAyahStart(rec.ayah_start);
    setAyahEnd(rec.ayah_end);
    setRiwayah(rec.riwayah);
    setDurationSeconds(rec.duration_seconds || 180);
    setAudioStoragePath(rec.audio_storage_path || '');
    setExternalAudioUrl(rec.external_audio_url || '');
    setCoverImagePath(rec.cover_image_path || '');
    setDescription(rec.description || '');
    setIsStaffPick(rec.is_staff_pick ?? false);
    setStatus(rec.status || 'APPROVED');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reciterId) {
      setFormError('يرجى تحديد القارئ');
      return;
    }
    if (!surahName.trim()) {
      setFormError('يرجى تحديد اسم السورة');
      return;
    }
    if (!audioStoragePath.trim() && !externalAudioUrl.trim()) {
      setFormError('يرجى إدخال مسار ملف الصوت أو الرابط المباشر');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingRecitation) {
        await adminService.updateRecitation(editingRecitation.id, {
          reciterId,
          surahName,
          surahNumber: Number(surahNumber),
          ayahStart: Number(ayahStart),
          ayahEnd: Number(ayahEnd),
          riwayah,
          durationSeconds: Number(durationSeconds),
          audioStoragePath: audioStoragePath.trim(),
          externalAudioUrl: externalAudioUrl.trim() ? externalAudioUrl : null,
          coverImagePath: coverImagePath.trim() ? coverImagePath : null,
          description: description.trim(),
          isStaffPick,
          status
        });
      } else {
        await adminService.createRecitation({
          reciterId,
          surahName,
          surahNumber: Number(surahNumber),
          ayahStart: Number(ayahStart),
          ayahEnd: Number(ayahEnd),
          riwayah,
          durationSeconds: Number(durationSeconds),
          audioStoragePath: audioStoragePath.trim(),
          externalAudioUrl: externalAudioUrl.trim() ? externalAudioUrl : undefined,
          coverImagePath: coverImagePath.trim() ? coverImagePath : undefined,
          description: description.trim() ? description : undefined,
          isStaffPick,
          status
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشلت عملية حفظ التلاوة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (rec: any) => {
    const nextStatus = rec.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    try {
      await adminService.updateRecitation(rec.id, { status: nextStatus });
      setRecitations((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, status: nextStatus } : r))
      );
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleToggleStaffPick = async (rec: any) => {
    try {
      await adminService.updateRecitation(rec.id, {
        isStaffPick: !rec.is_staff_pick
      });
      setRecitations((prev) =>
        prev.map((r) =>
          r.id === rec.id ? { ...r, is_staff_pick: !r.is_staff_pick } : r
        )
      );
    } catch (e) {
      console.error('Failed to toggle staff pick:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التلاوة؟')) return;
    try {
      await adminService.deleteRecitation(id);
      setRecitations((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message || 'فشل حذف التلاوة');
    }
  };

  const filteredRecitations = recitations.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      r.surah_name?.toLowerCase().includes(q) ||
      r.reciters?.display_name?.toLowerCase().includes(q) ||
      r.riwayah?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || r.status === statusFilter.toUpperCase();

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Music className="w-5 h-5 text-[#60A5FA]" />
            <span>إدارة مكتبة التلاوات</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            إضافة وتعديل التلاوات القرآنية، إدارة روابط الصوت، وتحديد اختيارات الإدارة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-[#162720] hover:bg-[#1E372C] text-[#A8C2B3] rounded-xl border border-[#2B493B] transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة تلاوة جديدة</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالسورة أو القارئ..."
            className="w-full bg-[#14241D] border border-[#234235] rounded-xl px-3.5 py-2 pr-9 text-xs text-white placeholder-[#5A7B6C] focus:outline-none focus:border-[#3E745A]"
          />
          <Search className="w-4 h-4 text-[#5A7B6C] absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div>
          <select
            value={selectedReciterFilter}
            onChange={(e) => setSelectedReciterFilter(e.target.value)}
            className="w-full bg-[#14241D] border border-[#234235] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">جميع القراء ({reciters.length})</option>
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.display_name || r.public_name || 'قارئ مسجل'} ({r.country || 'أخرى'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#14241D] border border-[#234235] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">جميع حالات النشر</option>
            <option value="APPROVED">معتمدة ومنشورة</option>
            <option value="PENDING">قيد المراجعة</option>
            <option value="REJECTED">مرفوضة</option>
          </select>
        </div>
      </div>

      {/* Recitations Table / Cards */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#60A5FA]/30 border-t-[#60A5FA] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#8BA496]">جاري تحميل مكتبة التلاوات...</p>
        </div>
      ) : filteredRecitations.length === 0 ? (
        <div className="py-16 px-4 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1A3328] border border-[#2B5742] flex items-center justify-center mx-auto text-[#8BA496]">
            <Music className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F0F5F2]">لا توجد تلاوات حتى الآن</h3>
          <p className="text-xs text-[#8BA496] max-w-sm mx-auto">
            يمكنك نشر تلاوات جديدة للقراء المعتمدين أو قبول الطلبات الواردة.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة تلاوة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecitations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-3 shadow-sm hover:border-[#2E5E49] transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#F0F5F2] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                      <span>سورة {rec.surah_name}</span>
                      <span className="text-xs font-normal text-[#8BA496]">
                        ({rec.ayah_start} - {rec.ayah_end})
                      </span>
                    </h3>
                    <p className="text-xs text-[#A8C2B3] mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#4B8569]" />
                      <span>{rec.reciters?.display_name || 'قارئ مسجل'}</span>
                      <span>•</span>
                      <span>رواية {rec.riwayah}</span>
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      rec.status === 'APPROVED'
                        ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                        : rec.status === 'PENDING'
                        ? 'bg-amber-950/70 border border-amber-800 text-amber-300'
                        : 'bg-rose-950/70 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {rec.status === 'APPROVED'
                      ? 'منشورة عامة'
                      : rec.status === 'PENDING'
                      ? 'قيد المراجعة'
                      : 'مرفوضة'}
                  </span>
                </div>

                {rec.description && (
                  <p className="text-xs text-[#8BA496] line-clamp-2 bg-[#0D1813] p-2 rounded-xl border border-[#1F372C]">
                    {rec.description}
                  </p>
                )}

                {/* Staff pick badge */}
                {rec.is_staff_pick && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded text-[10px] text-[#D4AF37] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>اختيار الإدارة المميز</span>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="space-y-2 pt-2 border-t border-[#1F372C]">
                {/* Audio preview button */}
                <button
                  onClick={() => togglePlay(rec)}
                  className="w-full py-1.5 px-3 bg-[#1A3328] hover:bg-[#224435] border border-[#2B5742] rounded-xl text-xs font-semibold text-[#D4AF37] flex items-center justify-center gap-1.5 transition"
                >
                  {playingId === rec.id ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>إيقاف الصوت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>تشغيل ومعاينة</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(rec)}
                      className={`p-1.5 rounded-lg border transition ${
                        rec.status === 'APPROVED'
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}
                      title={rec.status === 'APPROVED' ? 'إلغاء النشر' : 'نشر التلاوة'}
                    >
                      {rec.status === 'APPROVED' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleToggleStaffPick(rec)}
                      className={`p-1.5 rounded-lg border transition ${
                        rec.is_staff_pick
                          ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}
                      title="تمييز التلاوة"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 bg-[#1A3328] hover:bg-[#224435] border border-[#2B5742] text-[#A8C2B3] hover:text-white rounded-lg transition"
                      title="تعديل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800 text-rose-300 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14241D] border border-[#2B5742] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#234235]">
              <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
                <Music className="w-5 h-5 text-[#60A5FA]" />
                <span>{editingRecitation ? 'تعديل التلاوة' : 'إضافة تلاوة جديدة'}</span>
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8BA496] hover:text-white text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">القارئ *</label>
                <select
                  required
                  value={reciterId}
                  onChange={(e) => setReciterId(e.target.value)}
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">-- اختر القارئ --</option>
                  {reciters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name || r.public_name || 'قارئ مسجل'} ({r.country || 'أخرى'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">اسم السورة *</label>
                  <input
                    type="text"
                    required
                    value={surahName}
                    onChange={(e) => setSurahName(e.target.value)}
                    placeholder="الفاتحة"
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">رقم السورة (1-114)</label>
                  <input
                    type="number"
                    min={1}
                    max={114}
                    value={surahNumber}
                    onChange={(e) => setSurahNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">من الآية</label>
                  <input
                    type="number"
                    min={1}
                    value={ayahStart}
                    onChange={(e) => setAyahStart(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">إلى الآية</label>
                  <input
                    type="number"
                    min={1}
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">الرواية</label>
                  <input
                    type="text"
                    value={riwayah}
                    onChange={(e) => setRiwayah(e.target.value)}
                    placeholder="حفص عن عاصم"
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">رابط الصوت المباشر أو مسار التخزين</label>
                <input
                  type="text"
                  required
                  value={externalAudioUrl || audioStoragePath}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('http')) {
                      setExternalAudioUrl(val);
                      setAudioStoragePath(val.split('/').pop() || 'recitation.mp3');
                    } else {
                      setAudioStoragePath(val);
                    }
                  }}
                  placeholder="https://server8.mp3quran.net/afs/001.mp3 أو recitation-audio/001.mp3"
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">الوصف والملاحظات</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تلاوة خاشعة بصوت مميز..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1F372C]">
                <label className="flex items-center gap-2 p-2 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStaffPick}
                    onChange={(e) => setIsStaffPick(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#D4AF37]"
                  />
                  <span>اختيار الإدارة المميز</span>
                </label>

                <div className="space-y-1">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="APPROVED">نشر عام (APPROVED)</option>
                    <option value="PENDING">قيد المراجعة (PENDING)</option>
                    <option value="REJECTED">مرفوضة (REJECTED)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#234235]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#1A3328] hover:bg-[#224435] text-[#A8C2B3] rounded-xl font-semibold"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingRecitation ? 'حفظ التعديلات' : 'إضافة التلاوة'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
