import React, { useState, useEffect } from 'react';
import { Reciter, Recitation, PlayerState, Competition, Announcement } from '../types';
import {
  Trophy,
  Flame,
  Heart,
  Sparkles,
  Star,
  UserPlus,
  Globe,
  Headphones,
  BookOpen,
  Megaphone,
  Calendar,
  CheckCircle2,
  Users
} from 'lucide-react';
import { ReciterCard } from './ReciterCard';
import { RecitationCard } from './RecitationCard';
import {
  statisticsRepository,
  reciterRepository,
  competitionRepository,
  announcementRepository
} from '../services/Repositories';

interface FeaturedRecitersViewProps {
  reciters: Reciter[];
  recitations: Recitation[];
  playerState: PlayerState;
  onSelectReciter: (reciter: Reciter) => void;
  onPlay: (recitation: Recitation) => void;
  onLikeToggle: (recitationId: string) => void;
}

export const FeaturedRecitersView: React.FC<FeaturedRecitersViewProps> = ({
  reciters,
  recitations,
  playerState,
  onSelectReciter,
  onPlay,
  onLikeToggle
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'listens' | 'likes' | 'staff' | 'new' | 'competitions' | 'announcements'
  >('listens');
  const [currentReciters, setCurrentReciters] = useState<Reciter[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCategoryData() {
      if (activeCategory === 'competitions') {
        const data = await competitionRepository.getPublishedCompetitions();
        if (isMounted) setCompetitions(data);
        return;
      }
      if (activeCategory === 'announcements') {
        const data = await announcementRepository.getPublishedAnnouncements();
        if (isMounted) setAnnouncements(data);
        return;
      }

      let results: Reciter[] = [];
      switch (activeCategory) {
        case 'listens':
          results = await statisticsRepository.getMostListenedReciters(20);
          break;
        case 'likes':
          results = await statisticsRepository.getMostLikedReciters(20);
          break;
        case 'staff':
          results = await reciterRepository.getFeaturedReciters();
          break;
        case 'new':
          results = await reciterRepository.getNewestReciters(20);
          break;
      }
      if (isMounted) {
        setCurrentReciters(results);
      }
    }
    loadCategoryData();
    return () => {
      isMounted = false;
    };
  }, [activeCategory, reciters]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-tajawal">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#145273] via-[#1687C7] to-[#55BFEA] text-white p-6 sm:p-8 rounded-3xl border border-[#55BFEA]/30 shadow-md">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#FFE082] text-xs border border-white/20">
            <Trophy className="w-3.5 h-3.5 text-[#F2C96B]" />
            <span>لوحة الشرف والقراء المعتمدين</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
            دليل القراء والفعاليات القرآنية
          </h2>
          <p className="text-xs sm:text-sm text-[#E7F7FD] leading-relaxed">
            استكشف القراء الأعلى استماعًا، والأكثر إعجابًا، وشارك في المسابقات القرآنية واطلع على أحدث الإعلانات.
          </p>
        </div>
      </div>

      {/* Category Pills Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategory('listens')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'listens'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <Flame className={`w-4 h-4 ${activeCategory === 'listens' ? 'text-[#FFE082]' : 'text-amber-500'}`} />
          <span>الأعلى استماعًا</span>
        </button>

        <button
          onClick={() => setActiveCategory('likes')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'likes'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <Heart className={`w-4 h-4 ${activeCategory === 'likes' ? 'text-rose-200' : 'text-rose-500'}`} />
          <span>الأكثر إعجابًا</span>
        </button>

        <button
          onClick={() => setActiveCategory('staff')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'staff'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <Star className={`w-4 h-4 ${activeCategory === 'staff' ? 'text-[#FFE082]' : 'text-amber-400'}`} />
          <span>اختيار الإدارة</span>
        </button>

        <button
          onClick={() => setActiveCategory('new')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'new'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <UserPlus className={`w-4 h-4 ${activeCategory === 'new' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          <span>القراء الجدد</span>
        </button>

        <button
          onClick={() => setActiveCategory('competitions')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'competitions'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <Trophy className={`w-4 h-4 ${activeCategory === 'competitions' ? 'text-[#FFE082]' : 'text-[#145273]'}`} />
          <span>المسابقات القرآنية</span>
        </button>

        <button
          onClick={() => setActiveCategory('announcements')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeCategory === 'announcements'
              ? 'bg-[#1687C7] text-white shadow-sm'
              : 'bg-white text-[#193B4D] border border-[#D8E8F2] hover:bg-[#F6FBFF]'
          }`}
        >
          <Megaphone className={`w-4 h-4 ${activeCategory === 'announcements' ? 'text-[#FFE082]' : 'text-[#1687C7]'}`} />
          <span>الإعلانات والتعاميم</span>
        </button>
      </div>

      {/* Reciters Category View */}
      {activeCategory !== 'competitions' && activeCategory !== 'announcements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentReciters.map((reciter, index) => (
            <ReciterCard
              key={reciter.id ? `feat-${reciter.id}-${index}` : `feat-idx-${index}`}
              reciter={reciter}
              onClick={onSelectReciter}
            />
          ))}
          {currentReciters.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#6C8795] text-xs">
              لا يوجد قراء ضمن هذا التصنيف حاليًا
            </div>
          )}
        </div>
      )}

      {/* Competitions View */}
      {activeCategory === 'competitions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {competitions.map((comp, index) => (
            <div
              key={comp.id ? `comp-${comp.id}-${index}` : `comp-idx-${index}`}
              className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-2xs hover:shadow-md transition space-y-3"
            >
              {comp.imagePath && (
                <div className="w-full h-40 rounded-2xl overflow-hidden bg-[#E7F7FD]">
                  <img
                    src={comp.imagePath}
                    alt={comp.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-bold text-base text-[#193B4D] font-amiri">{comp.title}</h3>
              <p className="text-xs text-[#6C8795] leading-relaxed">{comp.description}</p>
              <div className="pt-3 border-t border-[#D8E8F2] flex items-center justify-between text-xs text-[#6C8795]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1687C7]" />
                  <span>ينتهي: {new Date(comp.endAt).toLocaleDateString('ar-EG')}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1687C7] text-white">
                  مسابقة رسمية
                </span>
              </div>
            </div>
          ))}
          {competitions.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#6C8795] text-xs">
              لا توجد مسابقات نشطة حاليًا
            </div>
          )}
        </div>
      )}

      {/* Announcements View */}
      {activeCategory === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((anno, index) => (
            <div
              key={anno.id ? `anno-${anno.id}-${index}` : `anno-idx-${index}`}
              className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row gap-4"
            >
              {anno.imagePath && (
                <img
                  src={anno.imagePath}
                  alt={anno.title}
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-48 h-32 rounded-2xl object-cover shrink-0"
                />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#193B4D] font-amiri">{anno.title}</h3>
                  <span className="text-[11px] text-[#6C8795]">
                    {new Date(anno.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-xs text-[#6C8795] leading-relaxed">{anno.content}</p>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="py-12 text-center text-[#6C8795] text-xs">
              لا توجد إعلانات منشورة حاليًا
            </div>
          )}
        </div>
      )}
    </div>
  );
};
