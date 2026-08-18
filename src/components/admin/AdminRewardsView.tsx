import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { RewardDefinition } from '../../types';
import {
  Award,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  Star,
  ShieldCheck,
  Send
} from 'lucide-react';

export function AdminRewardsView() {
  const [rewards, setRewards] = useState<RewardDefinition[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [honors, setHonors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Definition Modal
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<RewardDefinition | null>(null);
  const [defTitle, setDefTitle] = useState('');
  const [defDescription, setDefDescription] = useState('');
  const [defCategory, setDefCategory] = useState<'BADGE' | 'TITLE' | 'MILESTONE' | 'COMMUNITY'>('BADGE');
  const [defIconName, setDefIconName] = useState('award');
  const [defPoints, setDefPoints] = useState(100);

  // Award Honor Modal
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedReciterId, setSelectedReciterId] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [honorTitle, setHonorTitle] = useState('');
  const [honorCitation, setHonorCitation] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [defs, recs, hns] = await Promise.all([
        adminService.getRewardDefinitions(),
        adminService.getAllAdminReciters(),
        adminService.getHonors()
      ]);
      setRewards(defs);
      setReciters(recs);
      setHonors(hns);
    } catch (e) {
      console.error('Failed to load rewards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDefModal = () => {
    setEditingDef(null);
    setDefTitle('');
    setDefDescription('');
    setDefCategory('BADGE');
    setDefIconName('award');
    setDefPoints(100);
    setFormError(null);
    setIsDefModalOpen(true);
  };

  const openAwardModal = () => {
    setSelectedReciterId(reciters[0]?.id || '');
    setSelectedRewardId(rewards[0]?.id || '');
    setHonorTitle('وسام التميز والتجويد المتقن');
    setHonorCitation('تقديراً للأداء الصوتي المتميز والالتزام بقواعد التلاوة الصحيحة.');
    setFormError(null);
    setIsAwardModalOpen(true);
  };

  const handleSaveDef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defTitle.trim()) {
      setFormError('يرجى إدخال اسم الوسام أو التكريم');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingDef) {
        await adminService.updateRewardDefinition(editingDef.id, {
          title: defTitle,
          description: defDescription,
          category: defCategory,
          iconName: defIconName,
          pointsValue: Number(defPoints)
        });
      } else {
        await adminService.createRewardDefinition({
          title: defTitle,
          description: defDescription,
          category: defCategory,
          iconName: defIconName,
          pointsValue: Number(defPoints)
        });
      }

      setIsDefModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشلت العملية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAwardHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReciterId) {
      setFormError('يرجى تحديد القارئ المُكرم');
      return;
    }
    if (!honorTitle.trim()) {
      setFormError('يرجى كتابة عنوان التكريم');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      await adminService.awardHonorToReciter({
        reciterId: selectedReciterId,
        rewardDefinitionId: selectedRewardId || undefined,
        honorTitle,
        citationNote: honorCitation
      });

      setIsAwardModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشلت عملية منح الوسام');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDef = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الوسام؟')) return;
    try {
      await adminService.deleteRewardDefinition(id);
      setRewards((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message || 'فشل حذف الوسام');
    }
  };

  return (
    <div className="space-y-8 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#A78BFA]" />
            <span>الأوسمة والتكريمات الشرفية</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            إدارة شارات التميز القرآني ومنح الأوسمة التقديرية للقراء المجيدين
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
            onClick={openAwardModal}
            className="px-3.5 py-2 bg-[#1E3F30] hover:bg-[#285240] text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-[#3D6E58]"
          >
            <Send className="w-4 h-4" />
            <span>منح وسام لقارئ</span>
          </button>

          <button
            onClick={openCreateDefModal}
            className="px-3.5 py-2 bg-[#2B5742] hover:bg-[#346950] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تعريف وسام جديد</span>
          </button>
        </div>
      </div>

      {/* Section 1: Reward Definitions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>دليل الأوسمة والشارات المعتمدة</span>
        </h2>

        {isLoading ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#A78BFA]/30 border-t-[#A78BFA] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#8BA496]">جاري تحميل قائمة الأوسمة...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="p-6 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center space-y-2">
            <p className="text-xs text-[#8BA496]">لم يتم تعريف أوسمة مخصصة حتى الآن.</p>
            <button
              onClick={openCreateDefModal}
              className="text-xs text-[#34D399] font-bold hover:underline"
            >
              + إضافة أول وسام تكريم
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-2 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-xs text-[#F0F5F2] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span>{reward.title}</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-[#1F372C] text-[#8BA496] text-[10px] rounded">
                      {reward.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8C2B3] leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1F372C] text-[11px]">
                  <span className="text-[#D4AF37] font-semibold">
                    {reward.pointsValue} نقطة تقديرية
                  </span>

                  <button
                    onClick={() => handleDeleteDef(reward.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="حذف الوسام"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Honors Given to Reciters */}
      <div className="space-y-4 pt-4 border-t border-[#234235]">
        <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>سجل التكريمات الممنوحة للقراء ({honors.length})</span>
        </h2>

        {honors.length === 0 ? (
          <div className="p-6 bg-[#14241D]/50 border border-dashed border-[#234235] rounded-2xl text-center text-xs text-[#8BA496]">
            لم يتم منح أوسمة للقراء حتى الآن. استخدم زر "منح وسام لقارئ" لتكريم التلاوات المتميزة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {honors.map((honor) => (
              <div
                key={honor.id}
                className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1F372C] text-[#D4AF37] flex items-center justify-center">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#F0F5F2]">
                        {honor.honor_title}
                      </h4>
                      <p className="text-[11px] text-[#8BA496]">
                        المُكرم: {honor.reciters?.display_name || 'قارئ مسجل'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#6E8E7E]">
                    {new Date(honor.awarded_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {honor.citation_note && (
                  <p className="text-[11px] text-[#A8C2B3] bg-[#0D1813] p-2 rounded-lg border border-[#1F372C]">
                    "{honor.citation_note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Define Reward */}
      {isDefModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14241D] border border-[#2B5742] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#234235]">
              <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#A78BFA]" />
                <span>تعريف وسام شرفي جديد</span>
              </h2>

              <button
                onClick={() => setIsDefModalOpen(false)}
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

            <form onSubmit={handleSaveDef} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">عنوان الوسام *</label>
                <input
                  type="text"
                  required
                  value={defTitle}
                  onChange={(e) => setDefTitle(e.target.value)}
                  placeholder="مثال: وسام الصوت الندي الذهبي"
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">الوصف ومعيار المنح</label>
                <textarea
                  rows={2}
                  value={defDescription}
                  onChange={(e) => setDefDescription(e.target.value)}
                  placeholder="يُمنح للقراء المتميزين في خشوع التلاوة وإتقان التجويد..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">التصنيف</label>
                  <select
                    value={defCategory}
                    onChange={(e) => setDefCategory(e.target.value as any)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="BADGE">شارة (BADGE)</option>
                    <option value="TITLE">لقب شرفي (TITLE)</option>
                    <option value="MILESTONE">إنجاز (MILESTONE)</option>
                    <option value="COMMUNITY">تكريم مجتمعي (COMMUNITY)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-[#A8C2B3]">النقاط التقديرية</label>
                  <input
                    type="number"
                    min={0}
                    value={defPoints}
                    onChange={(e) => setDefPoints(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#234235]">
                <button
                  type="button"
                  onClick={() => setIsDefModalOpen(false)}
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
                      <span>حفظ الوسام</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Award Honor to Reciter */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14241D] border border-[#2B5742] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#234235]">
              <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span>منح وسام تكريم لقارئ</span>
              </h2>

              <button
                onClick={() => setIsAwardModalOpen(false)}
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

            <form onSubmit={handleAwardHonor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">اختر القارئ المُكرم *</label>
                <select
                  required
                  value={selectedReciterId}
                  onChange={(e) => setSelectedReciterId(e.target.value)}
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

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">اختر الوسام (اختياري)</label>
                <select
                  value={selectedRewardId}
                  onChange={(e) => {
                    setSelectedRewardId(e.target.value);
                    const sel = rewards.find((r) => r.id === e.target.value);
                    if (sel) setHonorTitle(sel.title);
                  }}
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">-- وسام مخصص / حر --</option>
                  {rewards.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">عنوان التكريم *</label>
                <input
                  type="text"
                  required
                  value={honorTitle}
                  onChange={(e) => setHonorTitle(e.target.value)}
                  placeholder="مثال: وسام التميز القرآني"
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#A8C2B3]">حيثيات التكريم والثناء</label>
                <textarea
                  rows={3}
                  value={honorCitation}
                  onChange={(e) => setHonorCitation(e.target.value)}
                  placeholder="نظير حسن التلاوة، الخشوع، والأداء القرآني المتقن..."
                  className="w-full bg-[#0D1813] border border-[#264436] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#234235]">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
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
                      <span>منح التكريم للقارئ</span>
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
