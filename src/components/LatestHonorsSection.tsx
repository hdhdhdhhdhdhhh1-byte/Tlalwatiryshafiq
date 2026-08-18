import React, { useState, useEffect } from 'react';
import { adminService } from '../services/AdminService';
import { Award, Sparkles, CheckCircle2, User, ChevronLeft } from 'lucide-react';

interface LatestHonorsSectionProps {
  onSelectReciter?: (reciterId: string) => void;
}

export const LatestHonorsSection: React.FC<LatestHonorsSectionProps> = ({
  onSelectReciter
}) => {
  const [honors, setHonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHonors = async () => {
      try {
        const list = await adminService.getReciterHonors();
        setHonors(list.slice(0, 4));
      } catch {
        setHonors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHonors();
  }, []);

  if (loading || honors.length === 0) return null;

  return (
    <div className="space-y-3 font-tajawal">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F2C96B]/20 text-[#145273] border border-[#F2C96B]/40 flex items-center justify-center">
            <Award className="w-4 h-4 text-[#1687C7]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#145273] font-amiri">
              أحدث الأوسمة والتشريفات التقديرية
            </h3>
            <p className="text-[11px] text-[#6C8795]">
              تكريم رسمي للقراء المعتمدين والمشاركات القرآنية المتميزة
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Honors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {honors.map((honor) => (
          <div
            key={honor.id}
            onClick={() => honor.reciterId && onSelectReciter?.(honor.reciterId)}
            className="p-4 rounded-3xl bg-white border border-[#D8E8F2] shadow-2xs hover:shadow-md hover:border-[#55BFEA] transition cursor-pointer flex items-start gap-3.5 group"
          >
            {/* Reciter Avatar with Gold badge overlay */}
            <div className="relative shrink-0">
              {honor.reciterAvatar ? (
                <img
                  src={honor.reciterAvatar}
                  alt={honor.reciterName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#F2C96B]"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#E7F7FD] text-[#1687C7] border-2 border-[#F2C96B] flex items-center justify-center font-bold text-sm">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-[#F2C96B] to-[#FFE082] flex items-center justify-center text-[#145273] shadow-xs">
                <Award className="w-3 h-3" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#193B4D] font-amiri group-hover:text-[#1687C7] transition">
                  {honor.reciterName}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#55BFEA]" />
              </div>

              <div className="mt-1 text-xs font-bold text-[#145273] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F2C96B] shrink-0" />
                <span className="truncate">{honor.rewardTitle}</span>
              </div>

              {honor.citationNote && (
                <p className="text-[11px] text-[#6C8795] mt-1 line-clamp-2 leading-relaxed">
                  "{honor.citationNote}"
                </p>
              )}

              <div className="mt-2 text-[10px] text-[#6C8795]">
                {new Date(honor.awardedAt).toLocaleDateString('ar-EG')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
