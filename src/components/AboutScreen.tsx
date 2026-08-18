import React, { useState } from 'react';
import { BookOpen, Shield, Globe, Heart, Mail, MessageSquare, Phone, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import { NavigationTab } from '../types';

interface AboutScreenProps {
  onNavigate?: (tab: NavigationTab) => void;
  onOpenArchitecture?: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const contactEmail = 'shafiqalwatiry@gmail.com';
  const contactPhone = '770015679';

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-tajawal">
      {/* Top Banner with Platform Mission */}
      <div className="bg-gradient-to-r from-[#145273] via-[#1687C7] to-[#55BFEA] text-white p-6 sm:p-8 rounded-3xl border border-[#55BFEA]/30 shadow-md text-center space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto text-[#FFE082] shadow-inner">
          <BookOpen className="w-9 h-9 text-[#FFE082]" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-amiri text-white">
          تلاوتك للعالم
        </h2>
        <p className="text-[#FFE082] font-bold text-base sm:text-lg">
          "انشر تلاوتك... واكتشف أصوات القرآن من حول العالم"
        </p>
        <p className="text-xs sm:text-sm text-[#E7F7FD] max-w-2xl mx-auto leading-relaxed pt-2">
          منصة قرآنية عالمية رائدة تجمع أصوات القراء والمواهب في تلاوة كتاب الله الكريم من شتى بقاع الأرض، وتتيح الاستماع إلى تلاوات عذبة بمختلف الروايات المتواترة مع إمكانية إرسال التلاوات للمراجعة والاعتماد الرسمي.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#E7F7FD] text-[#1687C7] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#193B4D] font-amiri">
            خدمة كتاب الله الكريم
          </h3>
          <p className="text-xs text-[#6C8795] leading-relaxed">
            الهدف الأسمى للمنصة هو نشر القرآن الكريم بتلاوات خاشعة وصحيحة التجويد، بعيداً عن الطابع التجاري أو الترفيهي المبتذل.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#E7F7FD] text-[#1687C7] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#193B4D] font-amiri">
            التدقيق والمراجعة قبل النشر
          </h3>
          <p className="text-xs text-[#6C8795] leading-relaxed">
            تخضع جميع التلاوات المرسلة لتقييم دقيق من لجنة مختصة للتأكد من سلامة الأحكام التجويدية ونقاء الصوت قبل اعتمادها ونشرها.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#E7F7FD] text-[#1687C7] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#193B4D] font-amiri">
            وصول عالمي ومتعدد الروايات
          </h3>
          <p className="text-xs text-[#6C8795] leading-relaxed">
            احتضان التلاوات بمختلف الروايات القرآنية المتواترة (حفص، ورش، قالون، الدوري...) ومن مختلف بلدان وقارات العالم الإسلامي.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#D8E8F2] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#E7F7FD] text-[#1687C7] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#193B4D] font-amiri">
            حفظ الخصوصية والأسماء المستعارة
          </h3>
          <p className="text-xs text-[#6C8795] leading-relaxed">
            إتاحة الخيار للقراء بالمشاركة بأسمائهم الصريحة أو المستعارة ابتغاء الأجر، مع حماية تامة لبياناتهم ومعلومات الاتصال الخاصة.
          </p>
        </div>
      </div>

      {/* Contact Us Section with Direct Buttons & Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8E8F2] shadow-xs space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F7FD] text-[#1687C7] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F2C96B]" />
            <span>قنوات التواصل المباشر</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#193B4D]">
            تواصل معنا
          </h3>
          <p className="text-xs text-[#6C8795] max-w-md mx-auto">
            يسعدنا استقبال استفساراتكم واقتراحاتكم والملاحظات المتعلقة بالتلاوات والمنصة عبر القنوات التالية:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Email Contact Card */}
          <div className="bg-[#F6FBFF] rounded-2xl p-4 border border-[#D8E8F2] flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E8F2] text-[#1687C7] flex items-center justify-center shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-[#6C8795] block font-bold">البريد الإلكتروني</span>
                <span className="text-sm font-bold text-[#193B4D] select-all font-mono" dir="ltr">
                  {contactEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#D8E8F2]/60">
              <a
                href={`mailto:${contactEmail}`}
                className="flex-1 py-2 px-3 rounded-xl bg-[#1687C7] hover:bg-[#145273] text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>إرسال بريد</span>
              </a>
              <button
                onClick={() => handleCopy(contactEmail, 'email')}
                className="py-2 px-3 rounded-xl bg-white hover:bg-[#E7F7FD] border border-[#D8E8F2] text-[#193B4D] text-xs font-bold transition flex items-center justify-center gap-1"
                title="نسخ البريد"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6C8795]" />}
                <span>{copiedEmail ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp / Phone Contact Card */}
          <div className="bg-[#F6FBFF] rounded-2xl p-4 border border-[#D8E8F2] flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E8F2] text-emerald-600 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-[#6C8795] block font-bold">واتساب والهاتف</span>
                <span className="text-sm font-bold text-[#193B4D] select-all font-mono" dir="ltr">
                  {contactPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#D8E8F2]/60">
              <a
                href={`https://wa.me/967770015679`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>محادثة واتساب</span>
              </a>
              <button
                onClick={() => handleCopy(contactPhone, 'phone')}
                className="py-2 px-3 rounded-xl bg-white hover:bg-[#E7F7FD] border border-[#D8E8F2] text-[#193B4D] text-xs font-bold transition flex items-center justify-center gap-1"
                title="نسخ الرقم"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6C8795]" />}
                <span>{copiedPhone ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
