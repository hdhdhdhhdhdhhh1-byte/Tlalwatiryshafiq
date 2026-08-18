import React, { useState, useEffect } from 'react';
import { Radio, BookOpen, Sparkles, Megaphone, Trophy, ChevronRight, ChevronLeft, Calendar, Clock, Award } from 'lucide-react';
import { Announcement, Competition } from '../types';
import { adminService } from '../services/AdminService';

interface HeroSectionProps {
  onExploreClick: () => void;
  onSubmitClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onSubmitClick
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [annoIndex, setAnnoIndex] = useState(0);
  const [compIndex, setCompIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [annoList, compList] = await Promise.all([
          adminService.getAnnouncements(),
          adminService.getCompetitions()
        ]);
        if (isMounted) {
          const publishedAnnos = annoList.filter((a) => a.isPublished);
          const publishedComps = compList.filter((c) => c.isPublished);

          setAnnouncements(publishedAnnos);
          setCompetitions(publishedComps);
        }
      } catch (e) {
        console.warn('Hero section fetch fallback:', e);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentAnnouncement = announcements[annoIndex] || announcements[0];
  const currentCompetition = competitions[compIndex] || competitions[0];

  const hasAnnouncements = announcements.length > 0 && !!currentAnnouncement;
  const hasCompetitions = competitions.length > 0 && !!currentCompetition;
  const hasOverlay = hasAnnouncements || hasCompetitions;

  return (
    <section className="font-tajawal">
      {/* 
        The Big Sky-Blue Box:
        - When overlays exist: sets sufficient padding and overlays the cards directly inside its lower area horizontally (side by side).
        - When no ads/competitions exist: renders naturally as the clean big sky-blue welcome box.
      */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#145273] via-[#1687C7] to-[#55BFEA] text-white p-6 sm:p-8 md:p-10 shadow-xl border border-[#55BFEA]/30 transition-all ${
        hasOverlay ? 'pb-8 sm:pb-10' : ''
      }`}>
        {/* Subtle Background Glow Circles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-8 border-white blur-2xl animate-pulse" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full border-8 border-[#F2C96B] blur-3xl" />
        </div>

        {/* Top & Main Body of the Big Box */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 pb-3">
          {/* Main Typography & Actions */}
          <div className="flex-1 text-center md:text-right space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-[#FFE082] text-xs backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C96B]" />
              <span className="font-semibold">منصة عالمية معتمدة لتلاوات كتاب الله الكريم</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-amiri text-white leading-tight tracking-wide">
              تلاوتك للعالم
            </h1>

            <p className="text-[#FFE082] font-bold text-base sm:text-lg">
              "انشر تلاوتك... واكتشف أصوات القرآن من حول العالم"
            </p>

            <div className="pt-2 border-t border-white/15 space-y-2">
              <p className="text-xs sm:text-sm text-[#E7F7FD] leading-relaxed max-w-xl">
                منصة تجمع أصوات القراء وتتيح لك الاستماع إلى تلاواتهم واكتشاف أصوات جديدة من مختلف أنحاء العالم، مع إمكانية إرسال تلاوتك للمراجعة والاعتماد.
              </p>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#E7F7FD] text-[#145273] font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <Radio className="w-4 h-4 text-[#1687C7]" />
                <span>استمع إلى القراء الآن</span>
              </button>
              <button
                onClick={onSubmitClick}
                className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-sm transition-all flex items-center gap-2 backdrop-blur-xs transform active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#FFE082]" />
                <span>انشر تلاوتك للمراجعة</span>
              </button>
            </div>
          </div>

          {/* Quranic Decorative Emblem */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/10 border border-white/20 p-4 flex flex-col items-center justify-center text-center relative shadow-xl backdrop-blur-md group shrink-0 hover:bg-white/15 transition-all">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-2 shadow-inner group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-[#FFE082]" />
            </div>

            <span className="font-amiri font-bold text-base sm:text-lg text-white">
              القرآن الكريم
            </span>
            <span className="text-[11px] text-[#E7F7FD] mt-1 font-tajawal">
              صوت نقي • وصول عالمي
            </span>
          </div>
        </div>

        {/* 
          Horizontal Side-by-Side Floating Cards In Front of the Lower Part of the Big Box:
          - Always in a single horizontal row (grid-cols-2 side by side / جوار بعض)
          - Right Side: Announcements
          - Left Side: Competitions
          - Overlays and conceals that lower section cleanly
        */}
        {hasOverlay && (
          <div className="relative z-20 mt-5 pt-3 grid grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
            {/* 1. Right Side Card: Announcements (الإعلانات بالاتجاه الأيمن) */}
            {hasAnnouncements ? (
              <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-[#55BFEA] via-[#F2C96B] to-[#1687C7] shadow-xl hover:shadow-2xl transition-all h-full flex flex-col">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#55BFEA] via-[#F2C96B] to-[#1687C7] rounded-2xl blur-xs opacity-60 animate-glow-pulse pointer-events-none" />
                
                <div className="relative bg-[#0A2637]/95 backdrop-blur-md rounded-[14px] p-3 sm:p-4 text-white flex flex-col justify-between flex-1 h-full min-h-[125px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/15 text-[#FFE082] border border-white/20">
                        <Megaphone className="w-3 h-3 text-[#F2C96B]" />
                        <span>إعلان وتنويه</span>
                      </span>

                      {announcements.length > 1 && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setAnnoIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                            className="p-1 rounded-md bg-white/15 hover:bg-white/30 text-white transition active:scale-90"
                            title="السابق"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setAnnoIndex((prev) => (prev + 1) % announcements.length)}
                            className="p-1 rounded-md bg-white/15 hover:bg-white/30 text-white transition active:scale-90"
                            title="التالي"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-white font-amiri line-clamp-1 leading-snug">
                      {currentAnnouncement.title}
                    </h4>

                    <p className="text-[10px] sm:text-[11px] text-[#E7F7FD] line-clamp-2 leading-relaxed">
                      {currentAnnouncement.body}
                    </p>
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-white/15 flex items-center justify-between text-[9px] sm:text-[10px] text-[#E7F7FD]/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#55BFEA]" />
                      <span>{new Date(currentAnnouncement.createdAt).toLocaleDateString('ar-EG')}</span>
                    </span>

                    {announcements.length > 1 && (
                      <span className="text-[9px] text-[#FFE082]">
                        {annoIndex + 1}/{announcements.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : <div />}

            {/* 2. Left Side Card: Competitions (المسابقات بالاتجاه الأيسر) */}
            {hasCompetitions ? (
              <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-[#F2C96B] via-[#55BFEA] to-[#F2C96B] shadow-xl hover:shadow-2xl transition-all h-full flex flex-col">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F2C96B] via-[#55BFEA] to-[#F2C96B] rounded-2xl blur-xs opacity-60 animate-glow-pulse pointer-events-none" />
                
                <div className="relative bg-white/95 backdrop-blur-md rounded-[14px] p-3 sm:p-4 text-[#145273] flex flex-col justify-between flex-1 h-full min-h-[125px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#F2C96B]/20 text-[#145273] border border-[#F2C96B]/40">
                        <Trophy className="w-3 h-3 text-[#1687C7]" />
                        <span>مسابقة قرآنية</span>
                      </span>

                      <span className="text-[9px] sm:text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>جارية</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-[#145273] font-amiri line-clamp-1 leading-snug">
                      {currentCompetition.title}
                    </h4>

                    <p className="text-[10px] sm:text-[11px] text-[#6C8795] line-clamp-2 leading-relaxed">
                      {currentCompetition.description}
                    </p>
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-[#D8E8F2] flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        if (currentCompetition.linkUrl && currentCompetition.linkUrl.startsWith('http')) {
                          window.open(currentCompetition.linkUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          onSubmitClick();
                        }
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-gradient-to-r from-[#145273] to-[#1687C7] hover:from-[#1687C7] hover:to-[#55BFEA] text-white text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Award className="w-3 h-3 text-[#FFE082]" />
                      <span>شارك الآن</span>
                    </button>

                    {competitions.length > 1 && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setCompIndex((prev) => (prev - 1 + competitions.length) % competitions.length)}
                          className="p-1 rounded-md bg-[#F6FBFF] hover:bg-[#E7F7FD] border border-[#D8E8F2] text-[#145273] transition active:scale-90"
                          title="السابق"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setCompIndex((prev) => (prev + 1) % competitions.length)}
                          className="p-1 rounded-md bg-[#F6FBFF] hover:bg-[#E7F7FD] border border-[#D8E8F2] text-[#145273] transition active:scale-90"
                          title="التالي"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : <div />}
          </div>
        )}
      </div>
    </section>
  );
};
