import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import { adminService } from '../services/AdminService';
import {
  Megaphone,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AnnouncementsCarousel: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const list = await adminService.getAnnouncements();
        const published = list.filter((a) => a.isPublished);
        setAnnouncements(published);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Auto-scroll carousel every 6s
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (loading || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#145273] via-[#1687C7] to-[#145273] text-white shadow-xl border border-[#55BFEA]/30">
      {/* Background Image / Overlay */}
      {current.imagePath && (
        <div className="absolute inset-0 z-0">
          <img
            src={current.imagePath}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#145273] via-[#145273]/80 to-[#1687C7]/90" />
        </div>
      )}

      {/* Decorative Aura */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#55BFEA]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#F2C96B]/15 blur-3xl pointer-events-none" />

      {/* Slide Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[260px] sm:min-h-[280px]">
        <div>
          {/* Badge & Meta */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-[#FFE082] border border-white/20">
              <Megaphone className="w-3.5 h-3.5 text-[#F2C96B]" />
              <span>إعلان وتنويه عام</span>
            </span>

            {/* Pagination dots */}
            {announcements.length > 1 && (
              <div className="flex items-center gap-1.5">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentIndex === idx
                        ? 'w-6 bg-[#F2C96B]'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Title & Body */}
          <div className="mt-4 space-y-2 max-w-2xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-amiri leading-snug text-white">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#E7F7FD] leading-relaxed line-clamp-3">
              {current.content}
            </p>
          </div>
        </div>

        {/* Footer info & Controls */}
        <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#E7F7FD]/80">
            <Calendar className="w-3.5 h-3.5 text-[#55BFEA]" />
            <span>{new Date(current.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>

          {/* Arrows */}
          {announcements.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition border border-white/15"
                title="السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition border border-white/15"
                title="التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
