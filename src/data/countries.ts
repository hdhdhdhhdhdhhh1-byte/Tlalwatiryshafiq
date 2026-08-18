export interface CountryItem {
  name: string;
  code: string;
  flag: string;
  region?: string;
}

export const ALL_WORLD_COUNTRIES: CountryItem[] = [
  // 1. الدول العربية (Arab League)
  { name: 'المملكة العربية السعودية', code: 'SA', flag: '🇸🇦', region: 'الوطن العربي' },
  { name: 'مصر', code: 'EG', flag: '🇪🇬', region: 'الوطن العربي' },
  { name: 'المغرب', code: 'MA', flag: '🇲🇦', region: 'الوطن العربي' },
  { name: 'الجزائر', code: 'DZ', flag: '🇩🇿', region: 'الوطن العربي' },
  { name: 'اليمن', code: 'YE', flag: '🇾🇪', region: 'الوطن العربي' },
  { name: 'الأردن', code: 'JO', flag: '🇯🇴', region: 'الوطن العربي' },
  { name: 'فلسطين', code: 'PS', flag: '🇵🇸', region: 'الوطن العربي' },
  { name: 'العراق', code: 'IQ', flag: '🇮🇶', region: 'الوطن العربي' },
  { name: 'سوريا', code: 'SY', flag: '🇸🇾', region: 'الوطن العربي' },
  { name: 'السودان', code: 'SD', flag: '🇸🇩', region: 'الوطن العربي' },
  { name: 'تونس', code: 'TN', flag: '🇹🇳', region: 'الوطن العربي' },
  { name: 'ليبيا', code: 'LY', flag: '🇱🇾', region: 'الوطن العربي' },
  { name: 'الإمارات العربية المتحدة', code: 'AE', flag: '🇦🇪', region: 'الوطن العربي' },
  { name: 'سلطنة عمان', code: 'OM', flag: '🇴🇲', region: 'الوطن العربي' },
  { name: 'الكويت', code: 'KW', flag: '🇰🇼', region: 'الوطن العربي' },
  { name: 'قطر', code: 'QA', flag: '🇶🇦', region: 'الوطن العربي' },
  { name: 'البحرين', code: 'BH', flag: '🇧🇭', region: 'الوطن العربي' },
  { name: 'لبنان', code: 'LB', flag: '🇱🇧', region: 'الوطن العربي' },
  { name: 'موريتانيا', code: 'MR', flag: '🇲🇷', region: 'الوطن العربي' },
  { name: 'الصومال', code: 'SO', flag: '🇸🇴', region: 'الوطن العربي' },
  { name: 'جيبوتي', code: 'DJ', flag: '🇩🇯', region: 'الوطن العربي' },
  { name: 'جزر القمر', code: 'KM', flag: '🇰🇲', region: 'الوطن العربي' },

  // 2. دول العالم الإسلامي وآسيا (Asia & Islamic Countries)
  { name: 'إندونيسيا', code: 'ID', flag: '🇮🇩', region: 'آسيا' },
  { name: 'تركيا', code: 'TR', flag: '🇹🇷', region: 'آسيا' },
  { name: 'ماليزيا', code: 'MY', flag: '🇲🇾', region: 'آسيا' },
  { name: 'باكستان', code: 'PK', flag: '🇵🇰', region: 'آسيا' },
  { name: 'بنغلاديش', code: 'BD', flag: '🇧🇩', region: 'آسيا' },
  { name: 'إيران', code: 'IR', flag: '🇮🇷', region: 'آسيا' },
  { name: 'أفغانستان', code: 'AF', flag: '🇦🇫', region: 'آسيا' },
  { name: 'أوزبكستان', code: 'UZ', flag: '🇺🇿', region: 'آسيا' },
  { name: 'كازاخستان', code: 'KZ', flag: '🇰🇿', region: 'آسيا' },
  { name: 'قرغيزستان', code: 'KG', flag: '🇰🇬', region: 'آسيا' },
  { name: 'طاجيكستان', code: 'TJ', flag: '🇹🇯', region: 'آسيا' },
  { name: 'تركمانستان', code: 'TM', flag: '🇹🇲', region: 'آسيا' },
  { name: 'أذربيجان', code: 'AZ', flag: '🇦🇿', region: 'آسيا' },
  { name: 'الهند', code: 'IN', flag: '🇮🇳', region: 'آسيا' },
  { name: 'الصين', code: 'CN', flag: '🇨🇳', region: 'آسيا' },
  { name: 'اليابان', code: 'JP', flag: '🇯🇵', region: 'آسيا' },
  { name: 'كوريا الجنوبية', code: 'KR', flag: '🇰🇷', region: 'آسيا' },
  { name: 'بروناي', code: 'BN', flag: '🇧🇳', region: 'آسيا' },
  { name: 'الفلبين', code: 'PH', flag: '🇵🇭', region: 'آسيا' },
  { name: 'تايلاند', code: 'TH', flag: '🇹🇭', region: 'آسيا' },
  { name: 'فيتنام', code: 'VN', flag: '🇻🇳', region: 'آسيا' },
  { name: 'سنغافورة', code: 'SG', flag: '🇸🇬', region: 'آسيا' },
  { name: 'سريلانكا', code: 'LK', flag: '🇱🇰', region: 'آسيا' },
  { name: 'جزر المالديف', code: 'MV', flag: '🇲🇻', region: 'آسيا' },
  { name: 'نيبال', code: 'NP', flag: '🇳🇵', region: 'آسيا' },
  { name: 'ميانمار', code: 'MM', flag: '🇲🇲', region: 'آسيا' },
  { name: 'كمبوديا', code: 'KH', flag: '🇰🇭', region: 'آسيا' },

  // 3. دول إفريقيا (Africa)
  { name: 'نيجيريا', code: 'NG', flag: '🇳🇬', region: 'إفريقيا' },
  { name: 'السنغال', code: 'SN', flag: '🇸🇳', region: 'إفريقيا' },
  { name: 'مالي', code: 'ML', flag: '🇲🇱', region: 'إفريقيا' },
  { name: 'النيجر', code: 'NE', flag: '🇳🇪', region: 'إفريقيا' },
  { name: 'تشاد', code: 'TD', flag: '🇹🇩', region: 'إفريقيا' },
  { name: 'غينيا', code: 'GN', flag: '🇬🇳', region: 'إفريقيا' },
  { name: 'ساحل العاج', code: 'CI', flag: '🇨🇮', region: 'إفريقيا' },
  { name: 'غانا', code: 'GH', flag: '🇬🇭', region: 'إفريقيا' },
  { name: 'الكاميرون', code: 'CM', flag: '🇨🇲', region: 'إفريقيا' },
  { name: 'كينيا', code: 'KE', flag: '🇰🇪', region: 'إفريقيا' },
  { name: 'تنزانيا', code: 'TZ', flag: '🇹🇿', region: 'إفريقيا' },
  { name: 'أوغندا', code: 'UG', flag: '🇺🇬', region: 'إفريقيا' },
  { name: 'إثيوبيا', code: 'ET', flag: '🇪🇹', region: 'إفريقيا' },
  { name: 'إريتريا', code: 'ER', flag: '🇪🇷', region: 'إفريقيا' },
  { name: 'جنوب إفريقيا', code: 'ZA', flag: '🇿🇦', region: 'إفريقيا' },
  { name: 'بوركينا فاسو', code: 'BF', flag: '🇧🇫', region: 'إفريقيا' },
  { name: 'غامبيا', code: 'GM', flag: '🇬🇲', region: 'إفريقيا' },
  { name: 'سيراليون', code: 'SL', flag: '🇸🇱', region: 'إفريقيا' },
  { name: 'توغو', code: 'TG', flag: '🇹🇬', region: 'إفريقيا' },
  { name: 'بنين', code: 'BJ', flag: '🇧🇯', region: 'إفريقيا' },
  { name: 'موزمبيق', code: 'MZ', flag: '🇲🇿', region: 'إفريقيا' },
  { name: 'مدغشقر', code: 'MG', flag: '🇲🇬', region: 'إفريقيا' },
  { name: 'موريشيوس', code: 'MU', flag: '🇲🇺', region: 'إفريقيا' },

  // 4. دول أوروبا (Europe)
  { name: 'المملكة المتحدة', code: 'GB', flag: '🇬🇧', region: 'أوروبا' },
  { name: 'ألمانيا', code: 'DE', flag: '🇩🇪', region: 'أوروبا' },
  { name: 'فرنسا', code: 'FR', flag: '🇫🇷', region: 'أوروبا' },
  { name: 'روسيا', code: 'RU', flag: '🇷🇺', region: 'أوروبا' },
  { name: 'البوسنة والهرسك', code: 'BA', flag: '🇧🇦', region: 'أوروبا' },
  { name: 'ألبانيا', code: 'AL', flag: '🇦🇱', region: 'أوروبا' },
  { name: 'كوسوفو', code: 'XK', flag: '🇽🇰', region: 'أوروبا' },
  { name: 'مقدونيا الشمالية', code: 'MK', flag: '🇲🇰', region: 'أوروبا' },
  { name: 'هولندا', code: 'NL', flag: '🇳🇱', region: 'أوروبا' },
  { name: 'بلجيكا', code: 'BE', flag: '🇧🇪', region: 'أوروبا' },
  { name: 'السويد', code: 'SE', flag: '🇸🇪', region: 'أوروبا' },
  { name: 'النرويج', code: 'NO', flag: '🇳🇴', region: 'أوروبا' },
  { name: 'الدنمارك', code: 'DK', flag: '🇩🇰', region: 'أوروبا' },
  { name: 'فنلندا', code: 'FI', flag: '🇫🇮', region: 'أوروبا' },
  { name: 'إسبانيا', code: 'ES', flag: '🇪🇸', region: 'أوروبا' },
  { name: 'إيطاليا', code: 'IT', flag: '🇮🇹', region: 'أوروبا' },
  { name: 'سويسرا', code: 'CH', flag: '🇨🇭', region: 'أوروبا' },
  { name: 'النمسا', code: 'AT', flag: '🇦🇹', region: 'أوروبا' },
  { name: 'أوكرانيا', code: 'UA', flag: '🇺🇦', region: 'أوروبا' },
  { name: 'بولندا', code: 'PL', flag: '🇵🇱', region: 'أوروبا' },
  { name: 'اليونان', code: 'GR', flag: '🇬🇷', region: 'أوروبا' },
  { name: 'البرتغال', code: 'PT', flag: '🇵🇹', region: 'أوروبا' },
  { name: 'أيرلندا', code: 'IE', flag: '🇮🇪', region: 'أوروبا' },
  { name: 'رومانيا', code: 'RO', flag: '🇷🇴', region: 'أوروبا' },
  { name: 'بلغاريا', code: 'BG', flag: '🇧🇬', region: 'أوروبا' },
  { name: 'صربيا', code: 'RS', flag: '🇷🇸', region: 'أوروبا' },
  { name: 'الجبل الأسود', code: 'ME', flag: '🇲🇪', region: 'أوروبا' },
  { name: 'جورجيا', code: 'GE', flag: '🇬🇪', region: 'أوروبا' },

  // 5. الأمريكتان وأستراليا (Americas & Oceania)
  { name: 'الولايات المتحدة الأمريكية', code: 'US', flag: '🇺🇸', region: 'الأمريكتان' },
  { name: 'كندا', code: 'CA', flag: '🇨🇦', region: 'الأمريكتان' },
  { name: 'أستراليا', code: 'AU', flag: '🇦🇺', region: 'أوقيانوسيا' },
  { name: 'نيوزيلندا', code: 'NZ', flag: '🇳🇿', region: 'أوقيانوسيا' },
  { name: 'البرازيل', code: 'BR', flag: '🇧🇷', region: 'الأمريكتان' },
  { name: 'الأرجنتين', code: 'AR', flag: '🇦🇷', region: 'الأمريكتان' },
  { name: 'المكسيك', code: 'MX', flag: '🇲🇽', region: 'الأمريكتان' },
  { name: 'تشيلي', code: 'CL', flag: '🇨🇱', region: 'الأمريكتان' },
  { name: 'كولومبيا', code: 'CO', flag: '🇨🇴', region: 'الأمريكتان' },
  { name: 'فنزويلا', code: 'VE', flag: '🇻🇪', region: 'الأمريكتان' },
  { name: 'سورينام', code: 'SR', flag: '🇸🇷', region: 'الأمريكتان' },
  { name: 'غيانا', code: 'GY', flag: '🇬🇾', region: 'الأمريكتان' },
  { name: 'ترينيداد وتوباغو', code: 'TT', flag: '🇹🇹', region: 'الأمريكتان' },
  { name: 'بنما', code: 'PA', flag: '🇵🇦', region: 'الأمريكتان' },
  { name: 'كوبا', code: 'CU', flag: '🇨🇺', region: 'الأمريكتان' }
];

export const COUNTRIES_LIST = ALL_WORLD_COUNTRIES;

/**
 * Finds country flag emoji from country name
 */
export function getCountryFlag(countryName: string): string {
  if (!countryName) return '🌍';
  const found = ALL_WORLD_COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase() || countryName.includes(c.name) || c.name.includes(countryName)
  );
  return found ? found.flag : '🌍';
}
