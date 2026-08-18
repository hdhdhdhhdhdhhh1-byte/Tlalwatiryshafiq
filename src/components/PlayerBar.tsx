import React from 'react';
import { PlayerState, Recitation } from '../types';
import { Play, Pause, SkipForward, SkipBack, Heart, Maximize2, X } from 'lucide-react';
import { AudioService } from '../services/AudioService';

interface PlayerBarProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onLikeToggle: (recitationId: string) => void;
  onExpand: () => void;
  onClose?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  playerState,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onLikeToggle,
  onExpand,
  onClose
}) => {
  const current = playerState.currentRecitation;
  if (!current) return null;

  const progressPercent =
    playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40 font-tajawal" dir="rtl">
      <div className="bg-[#145273] text-white rounded-3xl p-3 sm:p-3.5 shadow-2xl border border-[#55BFEA]/40 backdrop-blur-md">
        {/* Mini progress line on top */}
        <div className="relative w-full h-1.5 bg-white/15 rounded-full mb-2.5 overflow-hidden">
          <div
            className="absolute top-0 right-0 h-full bg-gradient-to-l from-[#55BFEA] to-[#F2C96B] transition-all duration-150 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Recitation Info & Cover */}
          <div
            onClick={onExpand}
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          >
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-white/20">
              <img
                src={current.reciterAvatar}
                alt={current.reciterName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {playerState.isPlaying && (
                <div className="absolute inset-0 bg-[#1687C7]/60 flex items-center justify-center gap-0.5">
                  <div className="w-0.5 bg-white wave-bar-1" />
                  <div className="w-0.5 bg-white wave-bar-3" />
                  <div className="w-0.5 bg-white wave-bar-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate font-amiri leading-tight">
                {current.surahNameArabic}
              </h4>
              <p className="text-xs text-[#FFE082] truncate">
                {current.reciterName} • {current.riwayah}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Time display */}
            <div className="hidden md:flex items-center gap-1 text-xs text-[#E7F7FD]" dir="ltr">
              <span>{AudioService.formatDuration(playerState.currentTime)}</span>
              <span>/</span>
              <span>{AudioService.formatDuration(playerState.duration || current.duration)}</span>
            </div>

            {/* Like */}
            <button
              type="button"
              onClick={() => onLikeToggle(current.id)}
              className={`p-2 rounded-full transition-colors ${
                current.isLiked ? 'text-rose-400' : 'text-white/70 hover:text-white'
              }`}
              title="إعجاب"
            >
              <Heart className={`w-4 h-4 ${current.isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={onPrevious}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="التلاوة السابقة"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-2xl bg-[#55BFEA] hover:bg-[#1687C7] text-[#145273] hover:text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title={playerState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current mr-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={onNext}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="التلاوة التالية"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Expand Modal */}
            <button
              type="button"
              onClick={onExpand}
              className="p-2 text-white/80 hover:text-white transition-colors hidden sm:block"
              title="توسيع المشغل"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close / Dismiss Player */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="إغلاق المشغل"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
