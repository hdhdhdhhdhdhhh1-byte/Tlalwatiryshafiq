import React, { useState } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/UserService';
import { adminService } from '../services/AdminService';
import { CountrySelectField } from './CountrySelectField';
import {
  X,
  User,
  Camera,
  Globe,
  Headphones,
  Mic2,
  Check,
  Mail,
  Phone,
  Sparkles,
  Info
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const currentProfile = userService.getProfile();

  const [displayName, setDisplayName] = useState(
    currentProfile.displayName === 'زائر المنصة' ? '' : currentProfile.displayName
  );
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '');
  const [country, setCountry] = useState(currentProfile.country || 'المملكة العربية السعودية');
  const [userType, setUserType] = useState<'LISTENER' | 'RECITER' | 'BOTH'>(
    currentProfile.userType || 'LISTENER'
  );
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [whatsapp, setWhatsapp] = useState(currentProfile.whatsapp || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
      const fileName = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
      const uploadedUrl = await adminService.uploadFile('profile-images', fileName, file);
      setAvatarUrl(uploadedUrl);
    } catch {
      // Fallback to local object URL if offline
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('يرجى إدخال اسمك الكريم.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await userService.saveProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        country,
        userType,
        bio: bio.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined
      });
      setSuccessMsg(true);
      onSaved?.(saved);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 800);
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ أثناء حفظ الملف');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-tajawal" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#D8E8F2] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#145273] via-[#1687C7] to-[#55BFEA] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-amiri">الملف الشخصي</h3>
              <p className="text-xs text-[#E7F7FD]">
                أكمل بياناتك الشخصية للظهور والتواصل والتفاعل بالمنصة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Info note */}
          <div className="p-3 rounded-2xl bg-[#E7F7FD] border border-[#55BFEA]/40 text-xs text-[#145273] flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#1687C7] shrink-0" />
            <span>
              إكمال الملف الشخصي اختياري، ويمكنك الاستمتاع بجميع تلاوات المنصة في أي وقت.
            </span>
          </div>

          {/* Avatar Picker */}
          <div className="flex flex-col items-center justify-center gap-2 pt-1 pb-2">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-3 border-[#1687C7] shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#F6FBFF] border-2 border-dashed border-[#1687C7]/50 flex items-center justify-center text-[#1687C7]">
                  <User className="w-8 h-8 opacity-60" />
                </div>
              )}
              <label className="absolute bottom-0 left-0 w-7 h-7 rounded-full bg-[#1687C7] hover:bg-[#145273] text-white flex items-center justify-center cursor-pointer shadow-md transition border-2 border-white">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <span className="text-[11px] text-[#6C8795]">
              {isUploading ? 'جارِ رفع الصورة...' : 'اضغط على الكاميرا لاختيار صورة شخصية'}
            </span>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-[#193B4D] mb-1.5">
              الاسم الكريم <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثال: عبد الله بن أحمد أو القارئ محمد"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] placeholder-[#6C8795] focus:outline-hidden focus:border-[#1687C7] focus:ring-2 focus:ring-[#1687C7]/15"
            />
          </div>

          {/* Country Field */}
          <CountrySelectField
            label="الدولة / بلد الإقامة"
            value={country}
            onChange={(val) => setCountry(val)}
            helperText="يمكنك الاختيار من قائمة جميع دول العالم أو كتابة اسم دولتك يدوياً"
          />

          {/* User Type / Role */}
          <div>
            <label className="block text-xs font-bold text-[#193B4D] mb-1.5">
              تصنيفك في المنصة
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserType('LISTENER')}
                className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                  userType === 'LISTENER'
                    ? 'bg-[#1687C7] text-white border-[#1687C7] shadow-sm'
                    : 'bg-[#F6FBFF] text-[#6C8795] border-[#D8E8F2] hover:border-[#1687C7]'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>مستمع</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('RECITER')}
                className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                  userType === 'RECITER'
                    ? 'bg-[#1687C7] text-white border-[#1687C7] shadow-sm'
                    : 'bg-[#F6FBFF] text-[#6C8795] border-[#D8E8F2] hover:border-[#1687C7]'
                }`}
              >
                <Mic2 className="w-4 h-4" />
                <span>قارئ</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('BOTH')}
                className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                  userType === 'BOTH'
                    ? 'bg-[#1687C7] text-white border-[#1687C7] shadow-sm'
                    : 'bg-[#F6FBFF] text-[#6C8795] border-[#D8E8F2] hover:border-[#1687C7]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>كلاهما</span>
              </button>
            </div>
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-bold text-[#193B4D] mb-1.5">
              نبذة تعريفية (اختياري)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة قصيرة عن اهتماماتك أو إجازاتك القرآنية..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] placeholder-[#6C8795] focus:outline-hidden focus:border-[#1687C7]"
            />
          </div>

          {/* Contact Fields (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-[#193B4D] mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#1687C7]" />
                <span>البريد الإلكتروني (اختياري)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] placeholder-[#6C8795] focus:outline-hidden focus:border-[#1687C7]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#193B4D] mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#1687C7]" />
                <span>رقم الواتساب (اختياري)</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+966..."
                className="w-full px-3 py-2 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] placeholder-[#6C8795] focus:outline-hidden focus:border-[#1687C7]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#D8E8F2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8E8F2] text-xs font-semibold text-[#6C8795] hover:bg-[#F6FBFF] transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#1687C7] hover:bg-[#145273] text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {successMsg ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم الحفظ بنجاح</span>
                </>
              ) : (
                <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ البيانات'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
