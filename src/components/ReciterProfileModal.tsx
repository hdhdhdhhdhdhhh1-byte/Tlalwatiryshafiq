import React, { useState, useEffect } from 'react';
import { Reciter, Recitation, PlayerState, ReciterHonor } from '../types';
import { X, CheckCircle2, Globe, Headphones, Heart, BookOpen, Share2, Award, Sparkles } from 'lucide-react';
import { RecitationCard } from './RecitationCard';
import { honorRepository } from '../services/Repositories';

interface ReciterProfileModalProps {
  reciter: Reciter | null;
  recitations: Recitation[];
  playerState: PlayerState;
  onClose: () => void;
  onPlay: (recitation: Recitation) => void;
  onLikeToggle: (recitationId: string) => void;
}

export const ReciterProfileModal: React.FC<ReciterProfileModalProps> = ({
  reciter,
  recitations,
  playerState,
  onClose,
  onPlay,
  onLikeToggle
}) => {
  const [honors, setHonors] = useState<ReciterHonor[]>([]);

  useEffect(() => {
    if (!reciter) return;
    let isMounted = true;
    honorRepository.getReciterHonors(reciter.id).then((data) => {
      if (isMounted) {
        setHonors(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [reciter?.id]);

  if (!reciter) return null;

  const reciterRecitations = recitations.filter((r) => r.reciterId === reciter.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `القارئ ${reciter.displayName} - منصة تلاوتك للعالم`,
        text: `استمع لتلاوات القارئ ${reciter.displayName} من ${reciter.country}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`القارئ ${reciter.displayName} على منصة تلاوتك للعالم`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAFBF9] rounded-3xl w-full max-w-2xl border border-[#E2E5DF] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header with Cover Banner */}
        <div className="relative bg-gradient-to-r from-[#102A20] via-[#1A3F31] to-[#315F4A] p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-xs"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={handleShare}
            className="absolute top-4 left-16 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors backdrop-blur-xs"
            title="مشاركة الملف الشخصي"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-2">
            <div className="relative">
              <img
                src={reciter.avatarUrl}
                alt={reciter.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-md"
              />
              {reciter.verified && (
                <span className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm" title="قارئ موثق ومعتمد">
                  <CheckCircle2 className="w-5 h-5 text-[#315F4A] fill-[#FAFBF9]" />
                </span>
              )}
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold text-[#FAFBF9]">
                  {reciter.displayName}
                </h3>
                {reciter.isAnonymous && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                    اسم مستعار
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-[#F4E8CE] mt-1">
                <Globe className="w-3.5 h-3.5 text-[#C9A961]" />
                <span>{reciter.country}</span>
              </div>

              {reciter.bio && (
                <p className="text-xs text-[#E2E5DF]/80 mt-2.5 leading-relaxed max-w-lg">
                  {reciter.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats Bar in Banner */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/15 text-center">
            <div className="bg-black/20 rounded-xl p-2 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-1 text-[#F4E8CE] text-xs">
                <BookOpen className="w-3.5 h-3.5" />
                <span>التلاوات</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                {reciter.stats.totalRecitations}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-2 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-1 text-[#C9A961] text-xs">
                <Headphones className="w-3.5 h-3.5" />
                <span>الاستماعات</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                {reciter.stats.totalListens.toLocaleString('ar-EG')}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-2 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-1 text-rose-300 text-xs">
                <Heart className="w-3.5 h-3.5" />
                <span>الإعجابات</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                {reciter.stats.totalLikes.toLocaleString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Honors & Badges Section if available */}
        {honors.length > 0 && (
          <div className="p-4 bg-[#FAF7F0] border-b border-[#E8E2D5] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6B1F]">
              <Award className="w-4 h-4 text-[#C9A961]" />
              <span>الأوسمة والشارات التقديرية ({honors.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {honors.map((honor) => (
                <div
                  key={honor.id}
                  className="bg-white border border-[#C9A961]/40 rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2 text-xs"
                  title={honor.citationNote || honor.reward?.description || ''}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A961] shrink-0" />
                  <div>
                    <span className="font-bold text-[#102A20] block">
                      {honor.reward?.title || 'وسام التميز القرآني'}
                    </span>
                    {honor.citationNote && (
                      <span className="text-[10px] text-[#7A847E] line-clamp-1">
                        {honor.citationNote}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reciter's Published Recitations List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base sm:text-lg text-[#102A20] font-amiri">
              تلاوات القارئ المعتمدة ({reciterRecitations.length})
            </h4>
            <span className="text-xs text-[#7A847E]">
              تلاوات خاضعة لمعايير الجودة والتجويد
            </span>
          </div>

          {reciterRecitations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#E2E5DF] p-6">
              <BookOpen className="w-8 h-8 text-[#7A847E] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#102A20]">
                لا توجد تلاوات منشورة حاليًا لهذا القارئ
              </p>
              <p className="text-xs text-[#7A847E] mt-1">
                تتم مراجعة التلاوات الجديدة قبل اعتمادها
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reciterRecitations.map((recitation) => (
                <RecitationCard
                  key={recitation.id}
                  recitation={recitation}
                  playerState={playerState}
                  onPlay={onPlay}
                  onLikeToggle={onLikeToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
