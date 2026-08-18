import React from 'react';
import { Home, Headphones, Mic, Trophy, Info } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as NavigationTab, label: 'الرئيسية', icon: Home },
    { id: 'listen' as NavigationTab, label: 'استمع للقراء', icon: Headphones },
    { id: 'submit' as NavigationTab, label: 'انشر تلاوتك', icon: Mic, highlight: true },
    { id: 'featured' as NavigationTab, label: 'أبرز القراء', icon: Trophy },
    { id: 'about' as NavigationTab, label: 'عن التطبيق', icon: Info }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#F6FBFF]/95 backdrop-blur-md border-t border-[#D8E8F2] py-1.5 px-2 sm:px-4 shadow-lg font-tajawal" dir="rtl">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 group relative px-1"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2 border-white ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#1687C7] to-[#55BFEA] text-white ring-4 ring-[#1687C7]/20'
                      : 'bg-[#1687C7] text-white hover:bg-[#145273]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight transition-colors ${
                    isActive ? 'text-[#1687C7]' : 'text-[#6C8795]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all duration-150 flex-1 max-w-[70px] ${
                isActive ? 'text-[#1687C7]' : 'text-[#6C8795] hover:text-[#193B4D]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#E7F7FD] text-[#1687C7]' : ''
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-all whitespace-nowrap ${
                  isActive ? 'font-bold text-[#1687C7]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
