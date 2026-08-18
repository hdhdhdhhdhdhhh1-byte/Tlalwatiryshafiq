import React from 'react';
import { RecitationSubmission, SubmissionStatus } from '../types';
import { X, Clock, CheckCircle2, XCircle, AlertCircle, FileAudio, BookOpen, Shield } from 'lucide-react';

interface SubmissionsListModalProps {
  submissions: RecitationSubmission[];
  onClose: () => void;
  onNewSubmission: () => void;
}

export const SubmissionsListModal: React.FC<SubmissionsListModalProps> = ({
  submissions,
  onClose,
  onNewSubmission
}) => {
  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم اعتماد ونشر التلاوة</span>
          </span>
        );
      case 'approved_unpublished':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>معتمد (قيد النشر)</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>لم يتم اعتماد التلاوة</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAFBF9] rounded-3xl w-full max-w-2xl border border-[#E2E5DF] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E2E5DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#315F4A]/10 text-[#315F4A] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#102A20] font-amiri">
                متابعة طلبات التلاوة المرسلة
              </h3>
              <p className="text-xs text-[#7A847E]">
                حالة التلاوات المرسلة للاعتماد والنشر في تلاوتك للعالم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAFBF9] hover:bg-[#E2E5DF] text-[#102A20] flex items-center justify-center transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E5DF] p-6 space-y-3">
              <FileAudio className="w-10 h-10 text-[#7A847E] mx-auto opacity-50" />
              <h4 className="font-bold text-sm text-[#102A20]">
                لا توجد طلبات تلاوة مسجلة بعد
              </h4>
              <p className="text-xs text-[#7A847E] max-w-sm mx-auto">
                يمكنك إرسال تلاوتك للمراجعة والاعتماد لتنضم إلى قراء المنصة حول العالم.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewSubmission();
                }}
                className="mt-2 px-5 py-2 rounded-xl bg-[#315F4A] text-white text-xs font-semibold hover:bg-[#102A20]"
              >
                إرسال تلاوة الآن
              </button>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E5DF] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[11px] font-mono text-[#7A847E] bg-[#FAFBF9] px-2 py-0.5 rounded border border-[#E2E5DF]" dir="ltr">
                      #{sub.id}
                    </span>
                    <h4 className="font-bold text-base text-[#102A20] font-amiri mt-1">
                      {sub.surahName} ({sub.ayahRange || 'كاملة'})
                    </h4>
                    <p className="text-xs text-[#315F4A] font-medium">
                      القارئ: {sub.displayName} {sub.usePseudonym ? '(اسم مستعار)' : ''} • {sub.country}
                    </p>
                  </div>

                  <div>{getStatusBadge(sub.status)}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#7A847E] bg-[#FAFBF9] p-2.5 rounded-xl border border-[#E2E5DF]/60">
                  <div>
                    <span className="block text-[10px] text-[#7A847E]">الرواية:</span>
                    <span className="font-medium text-[#102A20]">{sub.riwayah}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#7A847E]">الملف الصوتي:</span>
                    <span className="font-medium text-[#102A20] truncate block">{sub.audioFileName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#7A847E]">تاريخ الإرسال:</span>
                    <span className="font-medium text-[#102A20]">
                      {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                {sub.adminNotes && (
                  <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5DF] text-xs text-[#102A20] space-y-1">
                    <span className="font-semibold text-[#315F4A] flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      ملاحظة لجنة المراجعة:
                    </span>
                    <p className="text-[#7A847E] text-[11px] leading-relaxed">
                      {sub.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E2E5DF] flex items-center justify-between text-xs">
          <span className="text-[#7A847E]">
            إجمالي الطلبات: {submissions.length}
          </span>
          <button
            onClick={() => {
              onClose();
              onNewSubmission();
            }}
            className="px-4 py-2 rounded-xl bg-[#315F4A] text-white font-semibold hover:bg-[#102A20] transition-colors"
          >
            + إرسال تلاوة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};
