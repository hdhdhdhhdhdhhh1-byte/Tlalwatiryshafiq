import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import {
  BarChart3,
  TrendingUp,
  Headphones,
  Heart,
  Users,
  Globe,
  Award,
  RefreshCw,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-react';

export function AdminStatisticsView() {
  const [recitations, setRecitations] = useState<any[]>([]);
  const [reciters, setReciters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalListens: 0,
    totalLikes: 0,
    totalReciters: 0,
    publishedReciters: 0,
    totalRecitations: 0,
    publishedRecitations: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRecs, allReciters, dashboardStats] = await Promise.all([
        adminService.getAllAdminRecitations(),
        adminService.getAllAdminReciters(),
        adminService.getDashboardStats()
      ]);
      setRecitations(allRecs);
      setReciters(allReciters);
      setStats({
        ...dashboardStats,
        totalReciters: dashboardStats.totalReciters || allReciters.length,
        publishedReciters:
          dashboardStats.publishedReciters ||
          allReciters.filter((r) => r.is_published !== false).length,
        totalRecitations: dashboardStats.totalRecitations || allRecs.length,
        publishedRecitations:
          dashboardStats.publishedRecitations ||
          allRecs.filter((r) => r.status === 'APPROVED').length
      });
    } catch (e) {
      console.error('Failed to load statistics data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Most listened recitations
  const topListened = [...recitations]
    .sort((a, b) => (b.listen_count || 0) - (a.listen_count || 0))
    .slice(0, 5);

  // Most liked recitations
  const topLiked = [...recitations]
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 5);

  // Country breakdown
  const countryCounts: Record<string, number> = {};
  reciters.forEach((r) => {
    const c = r.country || 'أخرى';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const sortedCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6 select-none font-tajawal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#234235]">
        <div>
          <h1 className="text-xl font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#A78BFA]" />
            <span>التقارير والإحصائيات التفاعلية</span>
          </h1>
          <p className="text-xs text-[#8BA496] mt-0.5">
            تحليل تفاعل المستمعين، التلاوات الأكثر استماعاً وإعجاباً، والتوزيع الجغرافي
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2 bg-[#162720] hover:bg-[#1E372C] text-[#A8C2B3] rounded-xl border border-[#2B493B] transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8BA496]">
            <span>إجمالي الاستماعات</span>
            <Headphones className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-2xl font-bold font-amiri text-[#F0F5F2]">
            {stats.totalListens.toLocaleString('ar-EG')}
          </div>
          <p className="text-[10px] text-[#6E8E7E]">عبر البث المباشر في التطبيق</p>
        </div>

        <div className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8BA496]">
            <span>إجمالي التفاعلات والإعجاب</span>
            <Heart className="w-4 h-4 text-[#F43F5E]" />
          </div>
          <div className="text-2xl font-bold font-amiri text-[#F43F5E]">
            {stats.totalLikes.toLocaleString('ar-EG')}
          </div>
          <p className="text-[10px] text-[#6E8E7E]">إعجابات مسجلة في قاعدة البيانات</p>
        </div>

        <div className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8BA496]">
            <span>القراء المعتمدون</span>
            <Users className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="text-2xl font-bold font-amiri text-[#34D399]">
            {stats.publishedReciters.toLocaleString('ar-EG')}
          </div>
          <p className="text-[10px] text-[#6E8E7E]">من إجمالي {stats.totalReciters} قارئ</p>
        </div>

        <div className="p-4 bg-[#14241D] border border-[#234235] rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8BA496]">
            <span>التلاوات المعتمدة</span>
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-amiri text-[#D4AF37]">
            {stats.publishedRecitations.toLocaleString('ar-EG')}
          </div>
          <p className="text-[10px] text-[#6E8E7E]">من إجمالي {stats.totalRecitations} تلاوة</p>
        </div>
      </div>

      {/* Top Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Listened */}
        <div className="p-5 bg-[#14241D] border border-[#234235] rounded-2xl space-y-4">
          <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
            <span>التلاوات الأكثر استماعاً</span>
          </h2>

          {topListened.length === 0 ? (
            <p className="text-xs text-[#8BA496] py-6 text-center">لا توجد بيانات استماع حتى الآن</p>
          ) : (
            <div className="space-y-2.5">
              {topListened.map((rec, idx) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 bg-[#0D1813] border border-[#1F372C] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#1A3328] text-[#D4AF37] font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#F0F5F2]">سورة {rec.surah_name}</h4>
                      <p className="text-[11px] text-[#8BA496]">
                        {rec.reciters?.display_name || 'قارئ معتمد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#A78BFA] font-bold">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{rec.listen_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Liked */}
        <div className="p-5 bg-[#14241D] border border-[#234235] rounded-2xl space-y-4">
          <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#F43F5E]" />
            <span>التلاوات الأكثر تفضيلاً وإعجاباً</span>
          </h2>

          {topLiked.length === 0 ? (
            <p className="text-xs text-[#8BA496] py-6 text-center">لا توجد إعجابات مسجلة بعد</p>
          ) : (
            <div className="space-y-2.5">
              {topLiked.map((rec, idx) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 bg-[#0D1813] border border-[#1F372C] rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#1A3328] text-[#D4AF37] font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-[#F0F5F2]">سورة {rec.surah_name}</h4>
                      <p className="text-[11px] text-[#8BA496]">
                        {rec.reciters?.display_name || 'قارئ معتمد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#F43F5E] font-bold">
                    <Heart className="w-3.5 h-3.5 fill-[#F43F5E]" />
                    <span>{rec.like_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Country Distribution */}
      <div className="p-5 bg-[#14241D] border border-[#234235] rounded-2xl space-y-4">
        <h2 className="text-base font-bold font-amiri text-[#F0F5F2] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#34D399]" />
          <span>توزيع القراء جغرافياً حسب الدولة</span>
        </h2>

        {sortedCountries.length === 0 ? (
          <p className="text-xs text-[#8BA496] py-4 text-center">لا يوجد قراء مسجلون لعرض التوزيع</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {sortedCountries.map(([countryName, count]) => (
              <div
                key={countryName}
                className="p-3 bg-[#0D1813] border border-[#1F372C] rounded-xl space-y-1 text-center"
              >
                <span className="text-xs font-bold text-[#F0F5F2] block truncate">
                  {countryName}
                </span>
                <span className="text-sm font-bold text-[#34D399] font-amiri">
                  {count} قارئ
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
