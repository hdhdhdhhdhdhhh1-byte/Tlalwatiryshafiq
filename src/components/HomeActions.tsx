import React from 'react';
import { Headphones, Mic2, Trophy, Info, Sparkles, ArrowLeft } from 'lucide-react';
import { NavigationTab } from '../types';

interface HomeActionsProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const HomeActions: React.FC<HomeActionsProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'listen-card',
      icon: Headphones,
      tab: 'listen' as NavigationTab,
      title: 'استمع للقراء',
      subtitle: 'اكتشف أصوات القرآن العذبة',
      badge: 'استماع مباشر',
      borderColor: 'hover:border-[#1687C7]',
      glowShadow: 'hover:shadow-[#1687C7]/20',
      iconBg: 'bg-gradient-to-tr from-[#145273] to-[#1687C7] text-white',
      accentColor: 'text-[#1687C7]'
    },
    {
      id: 'submit-card',
      icon: Mic2,
      tab: 'submit' as NavigationTab,
      title: 'انشر تلاوتك',
      subtitle: 'شارك صوتك للمراجعة والاعتماد',
      badge: 'مراجعة وتدقيق',
      borderColor: 'hover:border-[#F2C96B]',
      glowShadow: 'hover:shadow-[#F2C96B]/30',
      iconBg: 'bg-gradient-to-tr from-[#C9A961] to-[#F2C96B] text-[#145273]',
      accentColor: 'text-[#C9A961]'
    },
    {
      id: 'featured-card',
      icon: Trophy,
      tab: 'featured' as NavigationTab,
      title: 'أبرز القراء',
      subtitle: 'لوحة الشرف والتكريمات',
      badge: 'أوسمة معتمدة',
      borderColor: 'hover:border-[#55BFEA]',
      glowShadow: 'hover:shadow-[#55BFEA]/20',
      iconBg: 'bg-gradient-to-tr from-[#1687C7] to-[#55BFEA] text-white',
      accentColor: 'text-[#145273]'
    },
    {
      id: 'about-card',
      icon: Info,
      tab: 'about' as NavigationTab,
      title: 'عن التطبيق',
      subtitle: 'الرؤية وقنوات التواصل',
      badge: 'تواصل ودعم',
      borderColor: 'hover:border-emerald-500',
      glowShadow: 'hover:shadow-emerald-500/20',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
      accentColor: 'text-emerald-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-5 font-tajawal max-w-4xl mx-auto">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            onClick={() => onNavigate(card.tab)}
            className={`cursor-pointer bg-white rounded-3xl p-5 sm:p-6 border border-[#D8E8F2] ${card.borderColor} ${card.glowShadow} shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between aspect-square transform active:scale-95 text-center relative overflow-hidden`}
          >
            {/* Background Shimmer Layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#F6FBFF]/50 to-white pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#E7F7FD] opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-300 pointer-events-none" />

            {/* Top Badge */}
            <div className="flex justify-center relative z-10">
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6FBFF] border border-[#D8E8F2] text-[#6C8795] group-hover:text-[#193B4D] transition-colors">
                {card.badge}
              </span>
            </div>

            {/* Centered Animated & Decorated Icon */}
            <div className="my-auto flex flex-col items-center justify-center relative z-10 space-y-2">
              <div className="relative">
                {/* Decorative rotating ring on hover */}
                <div className="absolute -inset-1.5 rounded-3xl border border-dashed border-[#1687C7]/30 opacity-0 group-hover:opacity-100 group-hover:animate-spin-slow transition-opacity" />

                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${card.iconBg} flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-110 group-hover:shadow-lg`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:rotate-6" />
                </div>
              </div>

              {/* Title & subtitle under the icon */}
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#193B4D] group-hover:text-[#1687C7] transition-colors font-amiri leading-snug">
                  {card.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-[#6C8795] mt-0.5 line-clamp-1">
                  {card.subtitle}
                </p>
              </div>
            </div>

            {/* Bottom action indicator */}
            <div className="pt-2 border-t border-[#D8E8F2]/60 flex items-center justify-center gap-1.5 text-xs font-bold text-[#1687C7] group-hover:text-[#145273] relative z-10">
              <span>تصفح القسم</span>
              <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
