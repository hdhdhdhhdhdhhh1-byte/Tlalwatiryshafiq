import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { Announcement } from '../../types';
import {
  Megaphone,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

export function AdminAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to load announcements:', e);
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
    setBody('');
    setImagePath('');
    setIsPublished(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setTitle(item.title);
    setBody(item.body);
    setImagePath(item.imagePath || '');
    setIsPublished(item.isPublished);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('يرجى كتابة عنوان الإعلان');
      return;
    }
    if (!body.trim()) {
      setFormError('يرجى كتابة نص ومحتوى الإعلان');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        await adminService.updateAnnouncement(editingItem.id, {
          title,
          body,
          imagePath: imagePath.trim() ? imagePath : null,
          isPublished
        });
      } else {
        await adminService.createAnnouncement({
          title,
          body,
          imagePath: imagePath.trim() ? imagePath : undefined,
          isPublished
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشلت عملية حفظ الإعلان');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (item: Announcement) => {
    try {
      await adminService.updateAnnouncement(item.id, {
        isPublished: !item.isPublished
      });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === item.id ? { ...a, isPublished: !a.isPublished } : a
        )
      );
    } catch (e) {
      console.error('Failed to toggle announcement publish:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await adminService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      alert(e.message || 'فشل حذف الإعلان');
    }
  };

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#F59E0B]" />
            <span>إدارة الإعلانات والأخبار الرسمية</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            نشر التحديثات، التنبيهات الإدارية، وإشعارات المنصة العامة للمستخدمين
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
            <span>إنشاء إعلان جديد</span>
          </button>
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#F59E0B]/30 border-t-[#F59E0B] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#8BA496]">جاري تحميل الإعلانات...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 px-4 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1A3328] border border-[#2B5742] flex items-center justify-center mx-auto text-[#8BA496]">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F0F5F2]">لا توجد إعلانات</h3>
          <p className="text-xs text-[#8BA496] max-w-sm mx-auto">
            يمكنك نشر أخبار المنصة أو التنويهات الخاصة بتحديثات التلاوات.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>نشر إعلان جديد</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-[#14241D] border border-[#234235] rounded-2xl space-y-3 shadow-sm hover:border-[#2E5E49] transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-sm text-[#F0F5F2] flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-[#F59E0B]" />
                    <span>{item.title}</span>
                  </h3>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      item.isPublished
                        ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {item.isPublished ? 'منشور عام' : 'مسودة'}
                  </span>
                </div>

                <p className="text-xs text-[#A8C2B3] leading-relaxed whitespace-pre-line bg-[#0D1813] p-3 rounded-xl border border-[#1F372C]">
                  {item.body}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[#6E8E7E]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تاريخ الإنشاء: {new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1F372C] text-xs">
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    item.isPublished
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {item.isPublished ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>إلغاء النشر</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>نشر في التطبيق</span>
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
                <Megaphone className="w-5 h-5 text-[#F59E0B]" />
                <span>{editingItem ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}</span>
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
                <label className="block font-semibold text-[#A8C2B3]">عنوان الإعلان *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: إطلاق مسابقة تلاوات شهر رمضان المبارك"
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">نص الإعلان *</label>
                <textarea
                  rows={4}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="تفاصيل الإعلان، الشروط، والتوجيهات للمستمعين والقراء..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">رابط الصورة المرفقة (اختياري)</label>
                <input
                  type="url"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 border-t border-[#1F372C]">
                <label className="flex items-center gap-2 p-2.5 bg-[#0D1813] border border-[#1F372C] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-[#2B5742] bg-[#0D1813] text-[#34D399]"
                  />
                  <span>نشر الإعلان مباشرة للمستخدمين في التطبيق</span>
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
                      <span>{editingItem ? 'حفظ التعديلات' : 'نشر الإعلان'}</span>
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
