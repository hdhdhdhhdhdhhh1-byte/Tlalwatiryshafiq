import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { ALL_WORLD_COUNTRIES } from '../../data/countries';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Globe,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';

export function AdminRecitersView() {
  const [reciters, setReciters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReciter, setEditingReciter] = useState<any | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [usePseudonym, setUsePseudonym] = useState(false);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [country, setCountry] = useState('المملكة العربية السعودية');
  const [bio, setBio] = useState('');
  const [profileImagePath, setProfileImagePath] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadReciters = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllAdminReciters();
      setReciters(data);
    } catch (e) {
      console.error('Failed to load reciters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReciters();
  }, []);

  const openCreateModal = () => {
    setEditingReciter(null);
    setDisplayName('');
    setPseudonym('');
    setUsePseudonym(false);
    setGender('MALE');
    setCountry('المملكة العربية السعودية');
    setBio('');
    setProfileImagePath('');
    setIsVerified(true);
    setIsFeatured(false);
    setIsPublished(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reciter: any) => {
    setEditingReciter(reciter);
    setDisplayName(reciter.display_name || '');
    setPseudonym(reciter.pseudonym || '');
    setUsePseudonym(reciter.use_pseudonym || false);
    setGender(reciter.gender || 'MALE');
    setCountry(reciter.country || 'المملكة العربية السعودية');
    setBio(reciter.bio || '');
    setProfileImagePath(reciter.profile_image_path || '');
    setIsVerified(reciter.is_verified ?? true);
    setIsFeatured(reciter.is_featured ?? false);
    setIsPublished(reciter.is_published ?? true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFormError('يرجى كتابة الاسم المعروض للقارئ');
      return;
    }
    if (!country.trim()) {
      setFormError('يرجى تحديد دولة القارئ');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingReciter) {
        await adminService.updateReciter(editingReciter.id, {
          displayName,
          pseudonym: pseudonym.trim() ? pseudonym : null,
          usePseudonym,
          gender,
          country,
          bio,
          profileImagePath: profileImagePath.trim() ? profileImagePath : null,
          isVerified,
          isFeatured,
          isPublished
        });
      } else {
        await adminService.createReciter({
          displayName,
          pseudonym: pseudonym.trim() ? pseudonym : undefined,
          usePseudonym,
          gender,
          country,
          bio,
          profileImagePath: profileImagePath.trim() ? profileImagePath : undefined,
          isVerified,
          isFeatured,
          isPublished
        });
      }

      setIsModalOpen(false);
      await loadReciters();
    } catch (err: any) {
      setFormError(err?.message || 'فشلت عملية حفظ بيانات القارئ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (reciter: any) => {
    try {
      await adminService.updateReciter(reciter.id, {
        isPublished: !reciter.is_published
      });
      setReciters((prev) =>
        prev.map((r) =>
          r.id === reciter.id ? { ...r, is_published: !r.is_published } : r
        )
      );
    } catch (e) {
      console.error('Failed to toggle publish:', e);
    }
  };

  const handleToggleFeatured = async (reciter: any) => {
    try {
      await adminService.updateReciter(reciter.id, {
        isFeatured: !reciter.is_featured
      });
      setReciters((prev) =>
        prev.map((r) =>
          r.id === reciter.id ? { ...r, is_featured: !r.is_featured } : r
        )
      );
    } catch (e) {
      console.error('Failed to toggle featured:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القارئ وجميع تلاواته المرتبطة به؟')) return;
    try {
      await adminService.deleteReciter(id);
      setReciters((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message || 'فشل حذف القارئ');
    }
  };

  const filteredReciters = reciters.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (r.display_name || r.public_name || '').toLowerCase();
    const pseudo = (r.pseudonym || '').toLowerCase();
    const c = (r.country || '').toLowerCase();
    return name.includes(q) || pseudo.includes(q) || c.includes(q);
  });

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#34D399]" />
            <span>إدارة وتوثيق القراء</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            إضافة وتعديل بيانات القراء، توثيق الحسابات، وتحديد حالة النشر العامة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReciters}
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
            <UserPlus className="w-4 h-4" />
            <span>إضافة قارئ جديد</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث عن قارئ بالاسم أو الدولة..."
          className="w-full bg-[#14241D] border border-[#234235] rounded-xl px-3.5 py-2 pr-9 text-xs text-white placeholder-[#5A7B6C] focus:outline-none focus:border-[#3E745A]"
        />
        <Search className="w-4 h-4 text-[#5A7B6C] absolute right-3 top-2.5 pointer-events-none" />
      </div>

      {/* Reciters Table / Grid */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#34D399]/30 border-t-[#34D399] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#8BA496]">جاري تحميل قائمة القراء من السحابة...</p>
        </div>
      ) : filteredReciters.length === 0 ? (
        <div className="py-16 px-4 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1A3328] border border-[#2B5742] flex items-center justify-center mx-auto text-[#8BA496]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F0F5F2]">لا يوجد قراء حتى الآن</h3>
          <p className="text-xs text-[#8BA496] max-w-sm mx-auto">
            قاعدة البيانات جاهزة لاستقبال ملفات القراء المعتمدين وتلاواتهم.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل القارئ الأول</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReciters.map((reciter) => (
            <div
              key={reciter.id}
              className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-3 shadow-sm hover:border-[#2E5E49] transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {reciter.profile_image_path ? (
                      <img
                        src={reciter.profile_image_path}
                        alt={reciter.display_name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#2B5742]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#1A3328] border border-[#2B5742] flex items-center justify-center text-[#4B8569]">
                        <Users className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-[#F0F5F2]">
                          {reciter.display_name}
                        </h3>
                        {reciter.is_verified && (
                          <ShieldCheck className="w-4 h-4 text-[#34D399]" title="موثق" />
                        )}
                        {reciter.is_featured && (
                          <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" title="مميز" />
                        )}
                      </div>

                      {reciter.pseudonym && (
                        <p className="text-[11px] text-[#A8C2B3]">
                          الاسم المستعار: {reciter.pseudonym}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[#8BA496] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#4B8569]" />
                          <span>{reciter.country}</span>
                        </span>
                        <span>•</span>
                        <span>{reciter.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      reciter.is_published
                        ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {reciter.is_published ? 'منشور عام' : 'مسودة'}
                  </span>
                </div>

                {reciter.bio && (
                  <p className="text-xs text-[#A8C2B3] line-clamp-2 bg-[#0D1813] p-2.5 rounded-xl border border-[#1F372C]">
                    {reciter.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F372C] text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePublish(reciter)}
                    className={`p-1.5 rounded-lg border transition ${
                      reciter.is_published
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    title={reciter.is_published ? 'إلغاء النشر' : 'نشر في التطبيق'}
                  >
                    {reciter.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleFeatured(reciter)}
                    className={`p-1.5 rounded-lg border transition ${
                      reciter.is_featured
                        ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    title="تمييز القارئ"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(reciter)}
                    className="p-1.5 bg-[#1A3328] hover:bg-[#224435] border border-[#2B5742] text-[#A8C2B3] hover:text-white rounded-lg transition"
                    title="تعديل"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(reciter.id)}
                    className="p-1.5 bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800 text-rose-300 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                <Users className="w-5 h-5 text-[#34D399]" />
                <span>{editingReciter ? 'تعديل بيانات القارئ' : 'إضافة قارئ جديد'}</span>
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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">الاسم المعروض *</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: الشيخ عبدالرحمن السديس"
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#4B8569]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">الاسم المستعار (اختياري)</label>
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="اسم الشهرة أو اللقب"
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#4B8569]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="usePseudonymCheckbox"
                  checked={usePseudonym}
                  onChange={(e) => setUsePseudonym(e.target.checked)}
                  className="rounded border-[#2B5742] bg-[#0D1813] text-[#34D399] focus:ring-0"
                />
                <label htmlFor="usePseudonymCheckbox" className="text-[#E8EFEA] cursor-pointer">
                  استخدام الاسم المستعار كاسم علني رئيسي في التطبيق
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">الجنس</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-[#A8C2B3]">الدولة *</label>
                    <span className="text-[11px] text-[#6C8795]">اختر من القائمة أو اكتب يدوياً</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="admin-countries-list"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="اختر أو اكتب اسم الدولة (مثال: مصر، السعودية، كندا...)"
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#55BFEA]"
                  />
                  <datalist id="admin-countries-list">
                    {ALL_WORLD_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">رابط صورة الملف الشخصي</label>
                <input
                  type="url"
                  value={profileImagePath}
                  onChange={(e) => setProfileImagePath(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">السيرة والنبذة التعريفية</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="نبذة عن إجازات القارئ وخبرته في التلاوة..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1F372C]">
                <label className="flex items-center gap-2 p-2 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#34D399]"
                  />
                  <span>قارئ موثق</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#D4AF37]"
                  />
                  <span>قارئ مميز</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#34D399]"
                  />
                  <span>نشر الملف العام</span>
                </label>
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
                      <span>{editingReciter ? 'حفظ التعديلات' : 'إضافة القارئ'}</span>
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
