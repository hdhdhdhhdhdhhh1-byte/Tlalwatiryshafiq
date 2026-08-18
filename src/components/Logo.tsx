import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  isLight?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  isLight = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-xs',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon Emblem */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <linearGradient id="logoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#55BFEA" />
              <stop offset="60%" stopColor="#1687C7" />
              <stop offset="100%" stopColor="#145273" />
            </linearGradient>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#F2C96B" />
            </linearGradient>
          </defs>

          {/* Rounded Hexagonal / Islamic geometric base */}
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="22"
            fill="url(#logoPrimaryGrad)"
            stroke="#55BFEA"
            strokeWidth="2"
            strokeOpacity="0.4"
          />

          {/* Decorative soundwaves in background */}
          <path
            d="M20 50 Q30 38 40 50 T60 50 T80 50"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
          <path
            d="M16 50 Q30 30 50 50 T84 50"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeOpacity="0.15"
            strokeLinecap="round"
          />

          {/* Open Quran Book (Right & Left pages) */}
          {/* Left Page */}
          <path
            d="M50 68 C42 62 30 62 24 65 L24 38 C30 35 42 35 50 41 Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          {/* Right Page */}
          <path
            d="M50 68 C58 62 70 62 76 65 L76 38 C70 35 58 35 50 41 Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />

          {/* Spine & Center line */}
          <path
            d="M50 41 L50 68"
            stroke="url(#logoGoldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Quranic Verse Accent Lines */}
          <line x1="30" y1="44" x2="44" y2="42" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="30" y1="49" x2="44" y2="47" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="30" y1="54" x2="44" y2="52" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

          <line x1="56" y1="42" x2="70" y2="44" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="56" y1="47" x2="70" y2="49" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="56" y1="52" x2="70" y2="54" stroke="#1687C7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

          {/* Top Crescent / Golden Star Accent */}
          <circle cx="50" cy="27" r="3.5" fill="url(#logoGoldGrad)" />
          <path
            d="M50 20 L51.2 24 L55 25.2 L51.2 26.4 L50 30.2 L48.8 26.4 L45 25.2 L48.8 24 Z"
            fill="url(#logoGoldGrad)"
            transform="scale(0.7) translate(21, 5)"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold font-amiri tracking-tight leading-none ${titleSizes[size]} ${isLight ? 'text-white' : 'text-[#145273]'}`}>
            تلاوتك للعالم
          </div>
          <div className={`font-medium font-tajawal mt-0.5 tracking-normal leading-none ${subtitleSizes[size]} ${isLight ? 'text-[#E7F7FD]' : 'text-[#6C8795]'}`}>
            منصة التلاوات القرآنية المعتمدة
          </div>
        </div>
      )}
    </div>
  );
};
