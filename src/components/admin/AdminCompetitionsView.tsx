import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { Competition } from '../../types';
import {
  Trophy,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Calendar,
  Gift
} from 'lucide-react';

export function AdminCompetitionsView() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Competition | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rewardSummary, setRewardSummary] = useState('');
  const [terms, setTerms] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getCompetitions();
      setCompetitions(data);
    } catch (e) {
      console.error('Failed to load competitions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setStartDate(now.toISOString().split('T')[0]);
    setEndDate(nextMonth.toISOString().split('T')[0]);
    setRewardSummary('وسام التميز القرآني وتكريم شرفي للمراكز الأولى');
    setTerms('الالتزام بأحكام التجويد، جودة التسجيل الصوتي، أن تكون التلاوة بصوت القارئ المسجل.');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Competition) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setStartDate(new Date(item.startAt).toISOString().split('T')[0]);
    setEndDate(new Date(item.endAt).toISOString().split('T')[0]);
    setRewardSummary('');
    setTerms('');
    setIsActive(item.isPublished);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('يرجى كتابة عنوان المسابقة');
      return;
    }
    if (!description.trim()) {
      setFormError('يرجى كتابة وصف المسابقة');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await adminService.updateCompetition(editingItem.id, {
          title,
          description,
          startAt: new Date(startDate).toISOString(),
          endAt: new Date(endDate).toISOString(),
          isPublished: isActive
        });
      } else {
        await adminService.createCompetition({
          title,
          description,
          startAt: new Date(startDate).toISOString(),
          endAt: new Date(endDate).toISOString(),
          isPublished: isActive
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشلت عملية حفظ المسابقة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: Competition) => {
    try {
      await adminService.updateCompetition(item.id, {
        isPublished: !item.isPublished
      });
      setCompetitions((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isPublished: !c.isPublished } : c))
      );
    } catch (e) {
      console.error('Failed to toggle competition status:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المسابقة؟')) return;
    try {
      await adminService.deleteCompetition(id);
      setCompetitions((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message || 'فشل حذف المسابقة');
    }
  };

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FBBF24]" />
            <span>إدارة المسابقات والتحديات القرآنية</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            تنظيم المسابقات التنافسية لتحفيز القراء وأصحاب الأصوات الندية
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
            <span>إطلاق مسابقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Competitions List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FBBF24]/30 border-t-[#FBBF24] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#8BA496]">جاري تحميل المسابقات...</p>
        </div>
      ) : competitions.length === 0 ? (
        <div className="py-16 px-4 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1A3328] border border-[#2B5742] flex items-center justify-center mx-auto text-[#8BA496]">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F0F5F2]">لا توجد مسابقات</h3>
          <p className="text-xs text-[#8BA496] max-w-sm mx-auto">
            يمكنك إطلاق مسابقات تلاوة دورية لحث القراء على إرسال تلاواتهم العذبة.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إطلاق مسابقة جديدة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitions.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-[#14241D] border border-[#234235] rounded-2xl space-y-3 shadow-sm hover:border-[#2E5E49] transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-sm text-[#F0F5F2] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#FBBF24]" />
                    <span>{item.title}</span>
                  </h3>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      item.isPublished
                        ? 'bg-amber-950/70 border border-amber-800 text-amber-300'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {item.isPublished ? 'مسابقة منشورة' : 'مسودة / معلقة'}
                  </span>
                </div>

                <p className="text-xs text-[#A8C2B3] leading-relaxed bg-[#0D1813] p-3 rounded-xl border border-[#1F372C]">
                  {item.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#6E8E7E]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>من: {new Date(item.startAt).toLocaleDateString('ar-EG')}</span>
                  </span>
                  <span>-</span>
                  <span>إلى: {new Date(item.endAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1F372C] text-xs">
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    item.isPublished
                      ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {item.isPublished ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>إيقاف النشر</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>نشر المسابقة</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 bg-[#1A3328] hover:bg-[#224435] border border-[#2B5742] text-[#A8C2B3] hover:text-white rounded-lg transition"
                    title="تعديل"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
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
                <Trophy className="w-5 h-5 text-[#FBBF24]" />
                <span>{editingItem ? 'تعديل المسابقة' : 'إطلاق مسابقة قرآنية جديدة'}</span>
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
                <label className="block font-semibold text-[#A8C2B3]">عنوان المسابقة *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مسابقة أصوات قرآنية ندية - شهر رمضان"
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">الوصف والتفاصيل *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="الهدف من المسابقة، المستهدفون، ومعايير التحكيم..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">تاريخ البداية</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">تاريخ النهاية</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">الجوائز والتكريمات</label>
                <input
                  type="text"
                  value={rewardSummary}
                  onChange={(e) => setRewardSummary(e.target.value)}
                  placeholder="أوسمة شرفية، إبراز التلاوات، شهادات تقدير..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">الشروط والأحكام</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="الشروط الفنية والشرعية للمشاركة..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1F372C]">
                <label className="flex items-center gap-2 p-2.5 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#FBBF24]"
                  />
                  <span>تفعيل المسابقة وإتاحة المشاركة للمستخدمين</span>
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
                      <span>{editingItem ? 'حفظ التعديلات' : 'إطلاق المسابقة'}</span>
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
