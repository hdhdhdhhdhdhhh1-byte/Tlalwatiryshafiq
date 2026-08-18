import React, { useState, useEffect } from 'react';
import { Competition } from '../types';
import { adminService } from '../services/AdminService';
import {
  Trophy,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

interface CompetitionsCarouselProps {
  onParticipate?: () => void;
}

export const CompetitionsCarousel: React.FC<CompetitionsCarouselProps> = ({
  onParticipate
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const list = await adminService.getCompetitions();
        const published = list.filter((c) => c.isPublished);
        setCompetitions(published);
      } catch {
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  if (loading || competitions.length === 0) return null;

  return (
    <div className="space-y-3 font-tajawal">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F2C96B]/20 text-[#145273] border border-[#F2C96B]/40 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#1687C7]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#145273] font-amiri">
              المسابقات والفعاليات القرآنية
            </h3>
            <p className="text-[11px] text-[#6C8795]">
              شارك بتلاوتك وتنافس في مسابقات الترتيل والتجويد
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel List */}
      <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
        {competitions.map((comp) => {
          const isOngoing = new Date(comp.endAt).getTime() > Date.now();
          return (
            <div
              key={comp.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white rounded-3xl p-4 border border-[#D8E8F2] shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Image Cover */}
                {comp.imagePath && (
                  <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 relative bg-[#E7F7FD]">
                    <img
                      src={comp.imagePath}
                      alt={comp.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1687C7] text-white shadow-xs">
                      {isOngoing ? 'مسابقة جارية' : 'انتهت المسابقة'}
                    </div>
                  </div>
                )}

                <h4 className="font-bold text-sm text-[#193B4D] font-amiri line-clamp-2 leading-tight">
                  {comp.title}
                </h4>

                <p className="text-xs text-[#6C8795] mt-1.5 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D8E8F2]/70 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#6C8795]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#1687C7]" />
                    <span>حتى {new Date(comp.endAt).toLocaleDateString('ar-EG')}</span>
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (comp.linkUrl && comp.linkUrl.startsWith('http')) {
                      window.open(comp.linkUrl, '_blank', 'noopener,noreferrer');
                    } else if (onParticipate) {
                      onParticipate();
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-[#1687C7] hover:bg-[#145273] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFE082]" />
                  <span>{comp.linkUrl ? 'رابط المسابقة / شارك الآن' : 'شارك بتلاوتك الآن'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
