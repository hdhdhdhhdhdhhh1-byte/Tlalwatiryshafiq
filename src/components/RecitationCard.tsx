import React, { useState, useEffect } from 'react';
import { Recitation, PlayerState } from '../types';
import { offlineAudioService } from '../services/OfflineAudioService';
import {
  Play,
  Pause,
  Heart,
  Headphones,
  Clock,
  Radio,
  User,
  Share2,
  Download,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';

interface RecitationCardProps {
  recitation: Recitation;
  playerState: PlayerState;
  onPlay: (recitation: Recitation) => void;
  onLikeToggle: (recitationId: string) => void;
  onReciterClick?: (reciterId: string) => void;
}

export const RecitationCard: React.FC<RecitationCardProps> = ({
  recitation,
  playerState,
  onPlay,
  onLikeToggle,
  onReciterClick
}) => {
  const [isDownloaded, setIsDownloaded] = useState(() =>
    offlineAudioService.isDownloaded(recitation.id)
  );
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setIsDownloaded(offlineAudioService.isDownloaded(recitation.id));
    const unsubscribe = offlineAudioService.subscribe((downloadedIds) => {
      setIsDownloaded(downloadedIds.has(recitation.id));
    });
    return () => {
      unsubscribe();
    };
  }, [recitation.id]);

  const isCurrentPlaying =
    playerState.currentRecitation?.id === recitation.id && playerState.isPlaying;
  const isCurrentSelected = playerState.currentRecitation?.id === recitation.id;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator
        .share({
          title: `${recitation.surahNameArabic} - تلاوتك للعالم`,
          text: `استمع لتلاوة خاشعة من ${recitation.surahNameArabic} للقارئ ${recitation.reciterName}`,
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `تلاوة ${recitation.surahNameArabic} بصوت القارئ ${recitation.reciterName} - منصة تلاوتك للعالم`
      );
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloaded || isDownloading) return;

    setIsDownloading(true);
    try {
      await offlineAudioService.downloadRecitation(recitation);
      setIsDownloaded(true);
    } catch (err) {
      console.warn('Failed to download audio for offline:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
        isCurrentSelected
          ? 'border-[#1687C7] bg-[#E7F7FD]/40 ring-2 ring-[#1687C7]/20'
          : 'border-[#D8E8F2] hover:border-[#55BFEA]'
      }`}
    >
      <div>
        {/* Top Header: Surah, Riwayah, & Reciter */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button Circle */}
            <button
              type="button"
              onClick={() => onPlay(recitation)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-95 shadow-sm shrink-0 ${
                isCurrentPlaying
                  ? 'bg-[#1687C7] text-white ring-4 ring-[#1687C7]/25'
                  : 'bg-[#F6FBFF] border border-[#D8E8F2] text-[#1687C7] hover:bg-[#1687C7] hover:text-white'
              }`}
              title={isCurrentPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
            >
              {isCurrentPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current mr-0.5" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-[#193B4D] font-amiri leading-tight">
                  {recitation.surahNameArabic}
                </h4>
                {recitation.isStaffPick && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2C96B]/20 text-[#145273] border border-[#F2C96B]/40">
                    مختارة
                  </span>
                )}
              </div>

              <p className="text-xs text-[#6C8795] font-tajawal mt-1 flex items-center gap-1.5">
                <span>{recitation.ayahRange || 'كاملة'}</span>
                <span>•</span>
                <span className="text-[#1687C7] font-semibold">{recitation.riwayah}</span>
              </p>
            </div>
          </div>

          {/* Duration Pill */}
          <div className="flex items-center gap-1 text-[11px] text-[#6C8795] bg-[#F6FBFF] px-2.5 py-1 rounded-full border border-[#D8E8F2]">
            <Clock className="w-3 h-3 text-[#6C8795]" />
            <span dir="ltr">{recitation.durationFormatted}</span>
          </div>
        </div>

        {/* Reciter Info */}
        <div
          onClick={() => onReciterClick?.(recitation.reciterId)}
          className="mt-3.5 flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#F6FBFF] border border-[#D8E8F2] cursor-pointer hover:bg-[#E7F7FD] hover:border-[#55BFEA]/50 transition-colors"
        >
          <img
            src={recitation.reciterAvatar}
            alt={recitation.reciterName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-[#D8E8F2]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#193B4D] truncate">
              {recitation.reciterName}
            </p>
            <p className="text-[10px] text-[#6C8795] truncate">
              {recitation.reciterCountry}
            </p>
          </div>
          <span className="text-[10px] text-[#1687C7] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#D8E8F2]">
            الملف
          </span>
        </div>

        {recitation.description && (
          <p className="text-xs text-[#6C8795] mt-2.5 line-clamp-1 italic">
            "{recitation.description}"
          </p>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-4 pt-3 border-t border-[#D8E8F2]/70 flex items-center justify-between">
        {/* Listen Count */}
        <div className="flex items-center gap-1.5 text-xs text-[#6C8795]">
          <Headphones className="w-3.5 h-3.5 text-[#1687C7]" />
          <span>{recitation.listenCount.toLocaleString('ar-EG')} استماع</span>
        </div>

        {/* Action buttons (Download Offline, Share, Like) */}
        <div className="flex items-center gap-1">
          {/* Offline Download button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloaded || isDownloading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDownloaded
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-[#6C8795] hover:text-[#1687C7] hover:bg-[#F6FBFF]'
            }`}
            title={isDownloaded ? 'محفوظة للاستماع دون اتصال' : 'تحميل للاستماع دون اتصال'}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1687C7]" />
            ) : isDownloaded ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 text-[#6C8795] hover:text-[#1687C7] rounded-lg hover:bg-[#F6FBFF] transition-colors"
            title="مشاركة التلاوة"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Like */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle(recitation.id);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              recitation.isLiked
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'text-[#6C8795] hover:bg-[#F6FBFF] border border-transparent'
            }`}
            title="إعجاب بالتلاوة"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                recitation.isLiked ? 'fill-rose-500 text-rose-500' : 'text-[#6C8795]'
              }`}
            />
            <span>{recitation.likeCount.toLocaleString('ar-EG')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
