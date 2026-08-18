import React, { useState } from 'react';
import { PlayerState, Recitation } from '../types';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Share2,
  Gauge,
  Info,
  Sparkles,
  Headphones,
  BookOpen
} from 'lucide-react';
import { AudioService, audioService } from '../services/AudioService';

interface FullPlayerModalProps {
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onLikeToggle: (recitationId: string) => void;
  onReciterClick?: (reciterId: string) => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  playerState,
  onClose,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onLikeToggle,
  onReciterClick
}) => {
  const current = playerState.currentRecitation;
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<'player' | 'details'>('player');

  if (!current) return null;

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
  const maxDuration = playerState.duration || current.duration || 100;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${current.surahNameArabic} - القارئ ${current.reciterName}`,
          text: `استمع لتلاوة خاشعة من ${current.surahNameArabic} للقارئ ${current.reciterName} عبر منصة تلاوتك للعالم`,
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `استمع لتلاوة ${current.surahNameArabic} بصوت ${current.reciterName} على تلاوتك للعالم`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07131B]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-tajawal" dir="rtl">
      <div className="bg-[#0B1E2B] text-white rounded-3xl w-full max-w-lg border border-[#1E435E] shadow-2xl p-6 relative flex flex-col justify-between my-auto max-h-[92vh]">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between border-b border-[#1A3A50] pb-4 mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="تصغير"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-xs text-[#55BFEA] font-semibold tracking-wide">
              مشغل القرآن الكريم
            </span>
            <h3 className="text-sm font-bold text-white font-amiri">
              تلاوتك للعالم • Tilawatak
            </h3>
          </div>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="مشاركة التلاوة"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Player vs Recitation Details */}
        <div className="flex items-center justify-center gap-2 mb-4 bg-white/5 p-1 rounded-2xl border border-[#1A3A50]">
          <button
            onClick={() => setInfoTab('player')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              infoTab === 'player'
                ? 'bg-[#1687C7] text-white shadow-xs'
                : 'text-[#9BBACD] hover:text-white'
            }`}
          >
            المشغل الصوتي
          </button>
          <button
            onClick={() => setInfoTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              infoTab === 'details'
                ? 'bg-[#1687C7] text-white shadow-xs'
                : 'text-[#9BBACD] hover:text-white'
            }`}
          >
            بيانات التلاوة والقارئ
          </button>
        </div>

        {infoTab === 'player' ? (
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {/* Album Cover */}
            <div className="relative mx-auto w-52 h-52 sm:w-60 sm:h-60 rounded-3xl overflow-hidden shadow-2xl border-2 border-[#55BFEA]/40 group">
              <img
                src={current.coverUrl || current.reciterAvatar}
                alt={current.surahNameArabic}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2B]/90 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[11px] text-[#55BFEA] font-semibold">
                  {current.riwayah}
                </span>
                <span className="text-lg font-bold text-white font-amiri">
                  {current.surahNameArabic}
                </span>
              </div>
            </div>

            {/* Title & Reciter Meta */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
                {current.surahNameArabic}
              </h2>
              <div
                onClick={() => {
                  onClose();
                  onReciterClick?.(current.reciterId);
                }}
                className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-[#55BFEA] hover:underline font-semibold"
              >
                <span>القارئ: {current.reciterName}</span>
                <span className="text-xs text-white/60">({current.reciterCountry})</span>
              </div>
              <p className="text-xs text-[#9BBACD]">
                الآيات: {current.ayahRange || 'كاملة'}
              </p>
            </div>

            {/* Seek Bar & Timers */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={maxDuration}
                  step={1}
                  value={playerState.currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#55BFEA]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#9BBACD] font-mono" dir="ltr">
                <span>{AudioService.formatDuration(playerState.currentTime)}</span>
                <span>{AudioService.formatDuration(maxDuration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              {/* Like Button */}
              <button
                onClick={() => onLikeToggle(current.id)}
                className={`p-3 rounded-2xl transition-all active:scale-95 ${
                  current.isLiked
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-white/10 text-white/80 hover:text-white'
                }`}
                title="إعجاب بالتلاوة"
              >
                <Heart className={`w-5 h-5 ${current.isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Previous */}
              <button
                onClick={onPrevious}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
                title="التلاوة السابقة"
              >
                <SkipForward className="w-5 h-5 rotate-180" />
              </button>

              {/* Big Play/Pause Button */}
              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-3xl bg-[#1687C7] hover:bg-[#55BFEA] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-[#1687C7]/30"
                title={playerState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current mr-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
                title="التلاوة التالية"
              >
                <SkipBack className="w-5 h-5 rotate-180" />
              </button>

              {/* Playback Speed selector */}
              <div className="relative">
                <button
                  onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                  className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1"
                  title="سرعة التلاوة"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#55BFEA]" />
                  <span>{playerState.playbackSpeed}x</span>
                </button>

                {speedMenuOpen && (
                  <div className="absolute bottom-12 left-0 bg-[#07131B] border border-[#1E435E] rounded-2xl p-1 shadow-xl z-50 flex flex-col gap-1 min-w-[70px]">
                    {speeds.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          audioService.setSpeed(s);
                          setSpeedMenuOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-center transition-colors ${
                          playerState.playbackSpeed === s
                            ? 'bg-[#1687C7] text-white'
                            : 'text-[#9BBACD] hover:bg-white/10'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Recitation Details Tab */
          <div className="p-4 space-y-4 bg-white/5 rounded-3xl border border-[#1A3A50] overflow-y-auto flex-1">
            <h4 className="font-bold text-base text-[#55BFEA] font-amiri flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>بطاقة التلاوة والاعتماد</span>
            </h4>

            <div className="space-y-2.5 text-xs text-[#E7F7FD]">
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">السورة:</span>
                <span className="font-bold font-amiri text-sm">{current.surahNameArabic}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">القارئ:</span>
                <span className="font-semibold">{current.reciterName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">الرواية:</span>
                <span className="text-[#55BFEA] font-semibold">{current.riwayah}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">الآيات المسجلة:</span>
                <span>{current.ayahRange || 'كاملة'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">مرات الاستماع:</span>
                <span>{current.listenCount.toLocaleString('ar-EG')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#9BBACD]">الإعجابات:</span>
                <span>{current.likeCount.toLocaleString('ar-EG')}</span>
              </div>

              {current.description && (
                <div className="pt-2">
                  <span className="text-[#9BBACD] block mb-1">وصف التسجيل:</span>
                  <p className="text-[#E7F7FD] bg-white/5 p-2.5 rounded-2xl leading-relaxed text-xs">
                    {current.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-[#1687C7]/20 border border-[#1687C7]/40 text-xs text-[#E7F7FD] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#55BFEA]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>حالة الجودة والاعتماد</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                تلاوة معتمدة ومطابقة لأحكام التجويد والترتيل الصحيح من قبل اللجنة المختصة بمنصة تلاوتك للعالم.
              </p>
            </div>
          </div>
        )}

        {/* Footer info note */}
        <div className="mt-4 pt-3 border-t border-[#1A3A50] text-center text-[10px] text-[#6C8795]">
          مشغل تلاوتك للعالم • جودة صوتية عالية واستماع دون اتصال
        </div>
      </div>
    </div>
  );
};
