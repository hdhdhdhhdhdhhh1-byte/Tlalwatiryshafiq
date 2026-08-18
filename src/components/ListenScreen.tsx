import React, { useState } from 'react';
import { Reciter, Recitation, PlayerState } from '../types';
import { Search, UserCheck, Sparkles, Globe, Headphones, Heart, BookOpen, Filter } from 'lucide-react';
import { ReciterCard } from './ReciterCard';
import { COUNTRIES_LIST } from '../data/countries';

interface ListenScreenProps {
  recitations: Recitation[];
  reciters: Reciter[];
  playerState: PlayerState;
  onPlay: (recitation: Recitation) => void;
  onLikeToggle: (recitationId: string) => void;
  onSelectReciter: (reciter: Reciter) => void;
}

export const ListenScreen: React.FC<ListenScreenProps> = ({
  recitations,
  reciters,
  playerState,
  onPlay,
  onLikeToggle,
  onSelectReciter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'most_popular' | 'staff_picks'>('all');

  // Filter reciters based on user search and filters
  const filteredReciters = reciters.filter((reciter) => {
    // Search query match (by name, pseudonym, country or bio)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = reciter.displayName.toLowerCase().includes(q);
      const matchPseudonym = reciter.pseudonym ? reciter.pseudonym.toLowerCase().includes(q) : false;
      const matchCountry = reciter.country.toLowerCase().includes(q);
      const matchBio = reciter.bio ? reciter.bio.toLowerCase().includes(q) : false;
      if (!matchName && !matchPseudonym && !matchCountry && !matchBio) return false;
    }

    // Country match
    if (selectedCountry !== 'all' && !reciter.country.includes(selectedCountry)) {
      return false;
    }

    // Filters
    if (activeFilter === 'verified' && !reciter.verified) return false;
    if (activeFilter === 'staff_picks' && !reciter.isStaffPick) return false;

    return true;
  }).sort((a, b) => {
    if (activeFilter === 'most_popular') {
      return (b.stats?.totalListens || 0) - (a.stats?.totalListens || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-tajawal">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#145273] to-[#1687C7] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-at-top-right from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#FFE082] text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F2C96B]" />
            <span>دليل أصوات القرآن حول العالم</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
            استمع إلى أصوات القراء
          </h2>
          <p className="text-xs sm:text-sm text-[#E7F7FD] max-w-2xl leading-relaxed">
            تصفح بروفايلات القراء المعتمدين، اضغط على أي قارئ لفتح صفحته وسماع جميع تلاواته العذبة ومؤلفاته المسجلة.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#D8E8F2] shadow-xs">
        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قارئ بالاسم أو الدولة أو الرواية..."
            className="w-full pl-4 pr-11 py-3 rounded-2xl bg-[#F6FBFF] border border-[#D8E8F2] text-sm text-[#193B4D] placeholder:text-[#6C8795] focus:outline-hidden focus:border-[#1687C7] focus:ring-2 focus:ring-[#1687C7]/10"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C8795]" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#6C8795] hover:text-[#193B4D] bg-white px-2 py-0.5 rounded-lg border border-[#D8E8F2]"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filter Pills & Country Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-[#1687C7] text-white shadow-2xs'
                  : 'bg-[#F6FBFF] text-[#6C8795] border border-[#D8E8F2] hover:bg-white'
              }`}
            >
              جميع القراء ({reciters.length})
            </button>

            <button
              onClick={() => setActiveFilter('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeFilter === 'verified'
                  ? 'bg-[#1687C7] text-white shadow-2xs'
                  : 'bg-[#F6FBFF] text-[#6C8795] border border-[#D8E8F2] hover:bg-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>المعتمدون فقط</span>
            </button>

            <button
              onClick={() => setActiveFilter('most_popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeFilter === 'most_popular'
                  ? 'bg-[#1687C7] text-white shadow-2xs'
                  : 'bg-[#F6FBFF] text-[#6C8795] border border-[#D8E8F2] hover:bg-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>الأكثر استماعًا</span>
            </button>

            <button
              onClick={() => setActiveFilter('staff_picks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeFilter === 'staff_picks'
                  ? 'bg-[#1687C7] text-white shadow-2xs'
                  : 'bg-[#F6FBFF] text-[#6C8795] border border-[#D8E8F2] hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F2C96B]" />
              <span>مختارات الإدارة</span>
            </button>
          </div>

          {/* Country Filter Dropdown */}
          <div className="min-w-[200px]">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] font-bold focus:outline-hidden focus:border-[#1687C7]"
            >
              <option value="all">🌍 جميع الدول ({COUNTRIES_LIST.length})</option>
              <optgroup label="🌟 الوطن العربي">
                {COUNTRIES_LIST.filter((c) => c.region === 'الوطن العربي').map((c, idx) => (
                  <option key={`listen-arab-${c.code}-${idx}`} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🌍 باقي دول العالم">
                {COUNTRIES_LIST.filter((c) => c.region !== 'الوطن العربي').map((c, idx) => (
                  <option key={`listen-world-${c.code}-${idx}`} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Reciters Profiles Directory Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6C8795]">
            عرض {filteredReciters.length} قارئ
          </span>
          <span className="text-[11px] text-[#1687C7] font-semibold">
            اضغط على القارئ لفتح التلاوات والاستماع
          </span>
        </div>

        {filteredReciters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#D8E8F2] p-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#F6FBFF] border border-[#D8E8F2] flex items-center justify-center mx-auto text-[#6C8795]">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#193B4D]">
              {reciters.length === 0 ? 'لا يوجد قراء حتى الآن' : 'لم يتم العثور على قراء مطابقين'}
            </h3>
            <p className="text-xs text-[#6C8795] max-w-md mx-auto">
              {reciters.length === 0
                ? 'سيظهر القراء المعتمدون هنا بمجرد اعتماد ونشر ملفاتهم التعريفية من قبل الإدارة.'
                : 'جرب البحث باسم آخر أو إزالة محدد الدولة لاستعراض باقي القراء.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReciters.map((reciter, index) => (
              <ReciterCard
                key={reciter.id ? `listen-reciter-${reciter.id}-${index}` : `listen-reciter-idx-${index}`}
                reciter={reciter}
                onClick={onSelectReciter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
