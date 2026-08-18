import React, { useState } from 'react';
import { adminService, AdminAuthDiagnostic } from '../../services/AdminService';
import { Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Sparkles, KeyRound, Terminal } from 'lucide-react';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onBackToApp: () => void;
}

export function AdminLoginScreen({ onSuccess, onBackToApp }: AdminLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<AdminAuthDiagnostic | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setDiagnostic(null);

    try {
      const res = await adminService.login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول، تحقق من البيانات');
        if (res.diagnostic) {
          setDiagnostic(res.diagnostic);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1C16] text-[#E8EFEA] flex flex-col justify-center items-center p-4 font-tajawal select-none" dir="rtl">
      {/* Background ambient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#1A3F31] rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#315F4A] rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md bg-[#162720]/90 border border-[#234235] backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#315F4A] to-[#1E3B2E] border border-[#3D6E58] shadow-inner text-[#D4AF37]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-amiri text-[#F0F5F2] flex items-center justify-center gap-2">
              <span>لوحة تحكم الإدارة</span>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-[#8BA496]">
              تلاوتك للعالم • تسجيل دخول المشرفين والمدققين
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">تنبيه:</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Runtime Diagnostic Panel (Non-sensitive) */}
        {diagnostic && (
          <div className="p-3.5 bg-[#0D1813] border border-[#2E5242] rounded-xl space-y-2 text-xs" dir="ltr">
            <div className="flex items-center gap-1.5 text-[#D4AF37] font-mono text-[11px] font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Runtime Auth Diagnostic</span>
            </div>
            <div className="font-mono text-[11px] text-[#A8C2B3] space-y-1 bg-black/40 p-2.5 rounded-lg border border-[#1A3327]">
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">authHttpStatus:</span>
                <span className="text-white font-semibold">{diagnostic.authHttpStatus ?? 'undefined'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">profileHttpStatus:</span>
                <span className="text-white font-semibold">{diagnostic.profileHttpStatus ?? 'undefined'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">authenticatedUserId:</span>
                <span className="text-[#8AD8B0] break-all">{diagnostic.authenticatedUserId ?? 'null'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">adminProfileId:</span>
                <span className="text-[#8AD8B0] break-all">{diagnostic.adminProfileId ?? 'null'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">adminRole:</span>
                <span className="text-[#D4AF37] font-semibold">{diagnostic.adminRole ?? 'null'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-[#6E8E7E]">isActive:</span>
                <span className={diagnostic.isActive === true || diagnostic.isActive === 'true' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {diagnostic.isActive === null ? 'null' : String(diagnostic.isActive)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6E8E7E]">profilesFoundCount:</span>
                <span className="text-white font-semibold">{diagnostic.profilesFoundCount ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A8C2B3]">
              البريد الإلكتروني الإداري
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tilawatak.org"
                className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#4E685B] focus:outline-none focus:border-[#4B8569] focus:ring-1 focus:ring-[#4B8569] transition"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-[#5A7B6C] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A8C2B3]">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0D1813] border border-[#264436] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-[#4E685B] focus:outline-none focus:border-[#4B8569] focus:ring-1 focus:ring-[#4B8569] transition"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-[#5A7B6C] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#2B5742] to-[#1E3F30] hover:from-[#346950] hover:to-[#244C3A] text-white font-bold text-sm rounded-xl shadow-lg border border-[#3E745A]/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>دخول لوحة التحكم</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-[#1F372C] text-center space-y-3">
          <p className="text-[11px] text-[#6E8E7E] leading-relaxed">
            منطقة مخصصة لإدارة المنصة والمحتوى القرآني فقط. تضمن السياسات الأمنية حظر أي دخول غير مصرح به.
          </p>

          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 text-xs text-[#8BA496] hover:text-[#C4DAD0] transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى تطبيق تلاوتك للعالم</span>
          </button>
        </div>
      </div>
    </div>
  );
}
