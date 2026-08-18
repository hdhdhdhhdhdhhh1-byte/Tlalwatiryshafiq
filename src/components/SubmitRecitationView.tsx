import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Upload,
  User,
  Globe,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  X,
  Music,
  Play,
  Pause
} from 'lucide-react';
import { SURAH_LIST, RIWAYAT_OPTIONS } from '../data/quranSurahs';
import { CountrySelectField } from './CountrySelectField';
import { RecitationSubmission } from '../types';
import { SupabaseService } from '../services/SupabaseService';
import { userService } from '../services/UserService';
import { isValidAudioUrl } from '../utils/mediaUtils';

interface SubmitRecitationViewProps {
  onSubmit: (data: Omit<RecitationSubmission, 'id' | 'submittedAt' | 'status'>) => Promise<RecitationSubmission>;
  onViewSubmissions: () => void;
  submissionsCount: number;
}

interface SubmissionDraft {
  step?: 'instructions' | 'form' | 'success';
  displayName?: string;
  usePseudonym?: boolean;
  pseudonym?: string;
  gender?: 'male' | 'female';
  country?: string;
  surahNumber?: number;
  ayahRange?: string;
  riwayah?: string;
  description?: string;
  audioFileName?: string;
  audioFileSizeFormatted?: string;
  audioDuration?: number;
  externalAudioUrl?: string;
  externalImageUrl?: string;
  agreeToTerms?: boolean;
}

const getSavedDraft = (): SubmissionDraft => {
  try {
    const raw = sessionStorage.getItem('telawat_submission_draft');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
};

export const SubmitRecitationView: React.FC<SubmitRecitationViewProps> = ({
  onSubmit,
  onViewSubmissions,
  submissionsCount
}) => {
  const initialDraft = getSavedDraft();

  // Step state: 'instructions' | 'form' | 'success'
  const [step, setStep] = useState<'instructions' | 'form' | 'success'>(
    initialDraft.step && initialDraft.step !== 'success' ? initialDraft.step : 'instructions'
  );

  // Form states initialized with persistent draft
  const [displayName, setDisplayName] = useState(initialDraft.displayName || '');
  const [usePseudonym, setUsePseudonym] = useState(initialDraft.usePseudonym || false);
  const [pseudonym, setPseudonym] = useState(initialDraft.pseudonym || '');
  const [gender, setGender] = useState<'male' | 'female'>(initialDraft.gender || 'male');
  const [country, setCountry] = useState(initialDraft.country || 'المملكة العربية السعودية');
  const [surahNumber, setSurahNumber] = useState(initialDraft.surahNumber || 1);
  const [ayahRange, setAyahRange] = useState(initialDraft.ayahRange || '١ - ٧ (كاملة)');
  const [riwayah, setRiwayah] = useState(initialDraft.riwayah || 'حفص عن عاصم');
  const [description, setDescription] = useState(initialDraft.description || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState(initialDraft.audioFileName || '');
  const [audioFileSizeFormatted, setAudioFileSizeFormatted] = useState(initialDraft.audioFileSizeFormatted || '');
  const [audioDuration, setAudioDuration] = useState(initialDraft.audioDuration || 180);
  const [externalAudioUrl, setExternalAudioUrl] = useState(initialDraft.externalAudioUrl || '');
  const [externalImageUrl, setExternalImageUrl] = useState(initialDraft.externalImageUrl || '');
  const [agreeToTerms, setAgreeToTerms] = useState(initialDraft.agreeToTerms || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [lastSubmittedId, setLastSubmittedId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Persist draft to sessionStorage
  useEffect(() => {
    if (step === 'success') {
      try {
        sessionStorage.removeItem('telawat_submission_draft');
      } catch {}
      return;
    }

    try {
      const draft: SubmissionDraft = {
        step,
        displayName,
        usePseudonym,
        pseudonym,
        gender,
        country,
        surahNumber,
        ayahRange,
        riwayah,
        description,
        audioFileName,
        audioFileSizeFormatted,
        audioDuration,
        externalAudioUrl,
        externalImageUrl,
        agreeToTerms
      };
      sessionStorage.setItem('telawat_submission_draft', JSON.stringify(draft));
    } catch {}
  }, [
    step,
    displayName,
    usePseudonym,
    pseudonym,
    gender,
    country,
    surahNumber,
    ayahRange,
    riwayah,
    description,
    audioFileName,
    audioFileSizeFormatted,
    audioDuration,
    externalAudioUrl,
    externalImageUrl,
    agreeToTerms
  ]);

  const selectedSurah = SURAH_LIST.find((s) => s.number === surahNumber) || SURAH_LIST[0];

  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up preview audio on unmount or file change
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [previewAudioUrl]);

  const togglePlayPreview = () => {
    if (!previewAudioUrl && !externalAudioUrl) return;
    const targetSrc = previewAudioUrl || externalAudioUrl;

    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(targetSrc);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current.onerror = () => {
        setIsPlayingPreview(false);
        setErrorMessage('تعذر تشغيل الملف الصوتي المحدد للمعاينة.');
      };
    } else {
      previewAudioRef.current.src = targetSrc;
    }

    previewAudioRef.current.play().then(() => {
      setIsPlayingPreview(true);
    }).catch(() => {
      setIsPlayingPreview(false);
      setErrorMessage('تعذر بدء تشغيل المعاينة الصوتية.');
    });
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/aac', 'audio/webm'];
    const hasAudioExtension = /\.(mp3|wav|m4a|ogg|aac|webm)$/i.test(file.name);
    if (!file.type.startsWith('audio/') && !validAudioTypes.includes(file.type) && !hasAudioExtension) {
      setErrorMessage('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي حقيقي (MP3, WAV, M4A, OGG).');
      return;
    }

    // Validate file size (max 100MB)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage('حجم الملف الصوتي كبير جداً. الحد الأقصى المسموح به هو 100 ميجابايت.');
      return;
    }

    // Stop existing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewAudioUrl(objectUrl);

    // Valid file selected
    setAudioFile(file);
    setAudioFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setAudioFileSizeFormatted(`${sizeMb} ميجابايت`);

    // Detect actual audio duration via HTMLAudioElement safely
    try {
      const tempAudio = new Audio();
      tempAudio.preload = 'metadata';
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
          setAudioDuration(Math.round(tempAudio.duration));
        }
      };
      tempAudio.onerror = () => {
        // Fallback without crashing
        setAudioDuration(180);
      };
      tempAudio.src = objectUrl;
    } catch {
      setAudioDuration(180);
    }
  };

  const handleRemoveAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }
    setAudioFile(null);
    setAudioFileName('');
    setAudioFileSizeFormatted('');
    setAudioDuration(180);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim() && !usePseudonym) {
      setErrorMessage('يرجى كتابة الاسم المعروض.');
      return;
    }
    if (usePseudonym && !pseudonym.trim()) {
      setErrorMessage('يرجى كتابة الاسم المستعار أو إلغاء تفعيله.');
      return;
    }
    if (!audioFile && !audioFileName && !externalAudioUrl.trim()) {
      setErrorMessage('يرجى اختيار ملف صوتي للتلاوة أو إضافة رابط خارجي للصوت.');
      return;
    }
    if (externalAudioUrl.trim() && !isValidAudioUrl(externalAudioUrl.trim())) {
      setErrorMessage('رابط الصوت الخارجي غير صالح أو لا يشير إلى ملف صوتي مباشر مدعوم.');
      return;
    }
    if (!agreeToTerms) {
      setErrorMessage('يجب الموافقة على شروط وضوابط النشر والمراجعة.');
      return;
    }

    setIsSubmitting(true);
    let uploadedStoragePath: string | null = null;
    let uploadedPublicUrl: string | null = null;

    try {
      // Step 1: Upload actual binary audio file if selected
      if (audioFile) {
        setUploadStatusText('جاري رفع الملف الصوتي إلى مساحة التخزين...');
        const uploadRes = await SupabaseService.uploadSubmissionAudio(audioFile, audioFile.name);
        
        if (!uploadRes) {
          throw new Error('تعذر رفع الملف الصوتي. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
        }

        uploadedStoragePath = uploadRes.storagePath;
        uploadedPublicUrl = uploadRes.publicUrl;
      }

      // Step 2: Save submission record to Database
      setUploadStatusText('جاري حفظ بيانات التلاوة وطلب النشر...');
      const result = await onSubmit({
        displayName: usePseudonym && pseudonym ? pseudonym : displayName,
        pseudonym: usePseudonym ? pseudonym : undefined,
        usePseudonym,
        gender,
        country,
        surahNumber: selectedSurah.number,
        surahName: `سورة ${selectedSurah.nameArabic}`,
        ayahRange,
        riwayah,
        description,
        audioFileName: audioFileName || 'recording_submission.mp3',
        audioDuration,
        audioStoragePath: uploadedStoragePath || undefined,
        audioUrl: uploadedPublicUrl || undefined,
        externalAudioUrl: externalAudioUrl.trim() || undefined,
        externalImageUrl: externalImageUrl.trim() || undefined,
        agreeToTerms: true
      });

      setLastSubmittedId(result.id);

      // Register real user notification
      userService.addNotification({
        installationId: userService.getInstallationId(),
        title: `تم استلام طلب تلاوتك: سورة ${selectedSurah.nameArabic}`,
        body: 'تم إرسال تلاوتك إلى لجنة المراجعة والاعتماد بنجاح. ستصلك إشعار بالنتيجة هنا فور اكتمال التدقيق.',
        notificationType: 'SUBMISSION_STATUS',
        referenceId: result.id
      });

      setStep('success');
    } catch (err: any) {
      console.error('Submission failed:', err);
      // Clean up orphaned uploaded storage file if saving to DB failed
      if (uploadedStoragePath) {
        try {
          await SupabaseService.deleteStorageFile(uploadedStoragePath);
        } catch (cleanupErr) {
          console.warn('Could not cleanup orphan storage file:', cleanupErr);
        }
      }
      setErrorMessage(
        err?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#102A20]">
            انشر تلاوتك
          </h2>
          <p className="text-xs sm:text-sm text-[#7A847E] font-tajawal mt-1">
            شارك تلاوتك مع ملايين المسلمين حول العالم عبر منصة معتمدة
          </p>
        </div>

        {submissionsCount > 0 && (
          <button
            onClick={onViewSubmissions}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E5DF] text-[#315F4A] hover:bg-[#315F4A]/5 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Clock className="w-4 h-4 text-[#C9A961]" />
            <span>طلباتي السابقة ({submissionsCount})</span>
          </button>
        )}
      </div>

      {/* PHASE 1: Instructional Page */}
      {step === 'instructions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E5DF] shadow-sm space-y-6">
          {/* Main Slogan Banner */}
          <div className="bg-gradient-to-l from-[#102A20] to-[#315F4A] text-white p-6 rounded-2xl border border-[#C9A961]/40 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A961]/20 text-[#F4E8CE] text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A961]" />
                <span>فرصة للأصوات القرآنية الندية</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#FAFBF9]">
                شارك تلاوتك مع العالم
              </h3>
              <p className="text-xs sm:text-sm text-[#E2E5DF] leading-relaxed max-w-xl">
                يمكنك إرسال تلاوتك للمراجعة، وبعد اعتمادها من الإدارة ستظهر داخل التطبيق وتصبح متاحة للاستماع من مختلف بلدان العالم.
              </p>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-[#102A20] flex items-center gap-2 font-amiri">
              <Shield className="w-5 h-5 text-[#315F4A]" />
              <span>شروط وضوابط قبول التلاوات:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#102A20]">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>يجب أن تكون التلاوة للقرآن الكريم حصراً وبترتيل صحيح.</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>يجب أن يكون التسجيل واضحًا ونقيًا وخاليًا من الضوضاء والتشويش.</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>يجب أن تكون التلاوة من تسجيل صاحب الطلب نفسه.</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>لا ترسل أي محتوى غير متعلق بالقرآن الكريم.</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>سيتم مراجعة التلاوة والتدقيق التجويدي قبل نشرها رسمياً.</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF]">
                <CheckCircle2 className="w-4 h-4 text-[#315F4A] shrink-0 mt-0.5" />
                <span>يمكنك استخدام اسمك الحقيقي أو اسم مستعار حسب رغبتك.</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 rounded-xl bg-[#C9A961]/10 border border-[#C9A961]/30 text-xs text-[#8c6f2a] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#C9A961]" />
            <p className="leading-relaxed">
              <strong>حماية الخصوصية:</strong> الملف الشخصي العام يعرض الاسم المعروض أو المستعار فقط، ولا يتم نشر أي بيانات شخصية خاصة دون إذنك.
            </p>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setStep('form')}
              className="px-8 py-3.5 rounded-2xl bg-[#315F4A] hover:bg-[#102A20] text-white font-bold text-base transition-all shadow-md flex items-center gap-3 active:scale-98"
            >
              <span>ابدأ إرسال تلاوتك الآن</span>
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Submission Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E5DF] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E5DF] pb-4">
            <h3 className="font-bold text-lg text-[#102A20] font-amiri">
              نموذج إرسال التلاوة للمراجعة
            </h3>
            <button
              type="button"
              onClick={() => setStep('instructions')}
              className="text-xs text-[#7A847E] hover:text-[#102A20]"
            >
              ← العودة للتعليمات
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Reciter Identity */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#315F4A] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>بيانات القارئ والملف الشخصي</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                  الاسم المعروض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: القارئ عبدالله الأحمد"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs sm:text-sm text-[#102A20] focus:outline-hidden focus:border-[#315F4A] focus:ring-1 focus:ring-[#315F4A]"
                  disabled={usePseudonym}
                />
              </div>

              <CountrySelectField
                label="الدولة / بلد الإقامة (اختياري)"
                value={country}
                onChange={(val) => setCountry(val)}
                helperText="اختر دولتك من قائمة دول العالم أو اكتبها يدوياً"
              />
            </div>

            {/* Pseudonym Toggle */}
            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#102A20]">
                <input
                  type="checkbox"
                  checked={usePseudonym}
                  onChange={(e) => setUsePseudonym(e.target.checked)}
                  className="rounded border-[#E2E5DF] text-[#315F4A] focus:ring-[#315F4A]"
                />
                <span>استخدام اسم مستعار (لعدم إظهار الاسم الحقيقي)</span>
              </label>

              {usePseudonym && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="مثال: صوت خاشع، محب القرآن، نداء السماء"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E5DF] text-xs text-[#102A20] focus:outline-hidden focus:border-[#315F4A]"
                  />
                  <p className="text-[11px] text-[#7A847E] mt-1">
                    سيظهر هذا الاسم المستعار في ملفك وقوائم الاستماع.
                  </p>
                </div>
              )}
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                نوع الملف الشخصي:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-[#102A20] cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                    className="text-[#315F4A]"
                  />
                  <span>ذكر</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#102A20] cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                    className="text-[#315F4A]"
                  />
                  <span>أنثى</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Recitation Metadata */}
          <div className="space-y-4 pt-4 border-t border-[#E2E5DF]">
            <h4 className="text-sm font-bold text-[#315F4A] flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>بيانات التلاوة والسورة</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                  اسم السورة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={surahNumber}
                  onChange={(e) => setSurahNumber(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs sm:text-sm text-[#102A20] focus:outline-hidden focus:border-[#315F4A]"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.nameArabic} ({s.revelationType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                  رقم الآية أو نطاق الآيات
                </label>
                <input
                  type="text"
                  value={ayahRange}
                  onChange={(e) => setAyahRange(e.target.value)}
                  placeholder="مثال: ١ - ٢٠ أو كاملة"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs sm:text-sm text-[#102A20] focus:outline-hidden focus:border-[#315F4A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                  الرواية
                </label>
                <select
                  value={riwayah}
                  onChange={(e) => setRiwayah(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs sm:text-sm text-[#102A20] focus:outline-hidden focus:border-[#315F4A]"
                >
                  {RIWAYAT_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A20] mb-1.5">
                وصف مختصر للتلاوة (اختياري)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أضف وصفًا لطبيعة التلاوة (مثال: تلاوة خاشعة من صلاة التراويح، ترتيل هادئ)..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs sm:text-sm text-[#102A20] focus:outline-hidden focus:border-[#315F4A]"
              />
            </div>
          </div>

          {/* Section 3: Audio File Upload */}
          <div className="space-y-4 pt-4 border-t border-[#E2E5DF]">
            <h4 className="text-sm font-bold text-[#315F4A] flex items-center gap-2">
              <FileAudio className="w-4 h-4" />
              <span>ملف الصوت والتسجيل</span>
            </h4>

            <div className="rounded-2xl border-2 border-dashed border-[#E2E5DF] hover:border-[#315F4A] p-6 text-center bg-[#FAFBF9] transition-colors relative">
              {audioFile || audioFileName ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#E2E5DF]">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-10 h-10 rounded-full bg-[#315F4A]/10 text-[#315F4A] flex items-center justify-center shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#102A20] truncate max-w-[220px] sm:max-w-xs" dir="ltr">
                        {audioFileName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#7A847E] mt-0.5">
                        {audioFileSizeFormatted && <span>{audioFileSizeFormatted}</span>}
                        {audioFileSizeFormatted && <span>•</span>}
                        <span>
                          المدة: {Math.floor(audioDuration / 60)} دقيقة و {audioDuration % 60} ثانية
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {previewAudioUrl && (
                      <button
                        type="button"
                        onClick={togglePlayPreview}
                        className="px-3 py-1.5 rounded-lg bg-[#315F4A] hover:bg-[#254A39] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        {isPlayingPreview ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>إيقاف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>معاينة الصوت</span>
                          </>
                        )}
                      </button>
                    )}
                    <label className="px-3 py-1.5 rounded-lg border border-[#E2E5DF] hover:bg-[#FAFBF9] text-[#102A20] text-xs font-semibold cursor-pointer transition-colors">
                      تغيير الملف
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                        onChange={handleAudioSelect}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="إزالة الملف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer space-y-2 py-4">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-[#315F4A]/10 text-[#315F4A] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#102A20]">
                      انقر لاختيار ملف التلاوة (MP3, WAV, M4A, OGG)
                    </p>
                    <p className="text-[11px] text-[#7A847E] mt-1">
                      الحد الأقصى لحجم الملف: 100 ميجابايت
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Optional External Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#7A847E] mb-1">
                  رابط خارجي للصوت (اختياري - كخيار بديل)
                </label>
                <input
                  type="url"
                  value={externalAudioUrl}
                  onChange={(e) => setExternalAudioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAFBF9] border border-[#E2E5DF] text-xs text-[#102A20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A847E] mb-1">
                  رابط صورة الغلاف أو الملف (اختياري)
                </label>
                <input
                  type="url"
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAFBF9] border border-[#E2E5DF] text-xs text-[#102A20]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Terms Agreement */}
          <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E2E5DF] space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#102A20]">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#E2E5DF] text-[#315F4A] focus:ring-[#315F4A]"
              />
              <span className="leading-relaxed">
                أقر بأن هذا التسجيل خاص بي وبصوتي، وأنه تلاوة صحيحة للقرآن الكريم، وأوافق على خضوعها لمراجعة وتدقيق إدارة منصة تلاوتك للعالم قبل نشرها.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('instructions')}
              className="px-5 py-2.5 rounded-xl border border-[#E2E5DF] text-xs text-[#7A847E] hover:bg-[#FAFBF9]"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-[#315F4A] hover:bg-[#102A20] text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الإرسال للمراجعة...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>إرسال للمراجعة</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* PHASE 3: Success Confirmation */}
      {step === 'success' && (
        <div className="bg-white rounded-3xl p-8 border border-[#E2E5DF] shadow-md text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#315F4A]/10 text-[#315F4A] flex items-center justify-center mx-auto ring-8 ring-[#315F4A]/5">
            <CheckCircle2 className="w-10 h-10 text-[#315F4A]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A961]/20 text-[#8c6f2a] text-xs font-bold">
              <span>حالة الطلب: قيد المراجعة</span>
            </div>
            <h3 className="text-2xl font-bold font-amiri text-[#102A20]">
              تم استلام تلاوتكم بنجاح
            </h3>
            <p className="text-xs sm:text-sm text-[#7A847E] max-w-md mx-auto leading-relaxed">
              بارك الله فيكم. تم تسجيل طلبكم برقم <span className="font-mono font-bold text-[#102A20]" dir="ltr">#{lastSubmittedId}</span> وهو الآن معروض على لجنة التدقيق والتجويد.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs text-[#102A20] max-w-md mx-auto space-y-1.5 text-right">
            <p className="font-semibold text-[#315F4A]">ماذا سيحدث بعد ذلك؟</p>
            <p className="text-[#7A847E] leading-relaxed">
              ١. مراجعة نقاء الصوت وسلامة الأحكام التجويدية.
              <br />
              ٢. عند الاعتماد تظهر تلاوتك مباشرة في قائمة القراء والصفحة الرئيسية.
              <br />
              ٣. يمكنك متابعة حالة طلبك في أي وقت من زر "طلباتي".
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onViewSubmissions}
              className="px-6 py-2.5 rounded-xl bg-[#315F4A] text-white text-xs font-bold hover:bg-[#102A20] transition-colors shadow-sm"
            >
              عرض حالة طلباتي
            </button>

            <button
              onClick={() => {
                setStep('form');
                setAudioFileName('');
                setDisplayName('');
                setPseudonym('');
                setAgreeToTerms(false);
              }}
              className="px-6 py-2.5 rounded-xl border border-[#E2E5DF] text-[#102A20] text-xs font-semibold hover:bg-[#FAFBF9]"
            >
              إرسال تلاوة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
