import React, { useState, useEffect } from 'react';
import { UserNotification } from '../types';
import { userService } from '../services/UserService';
import {
  X,
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Megaphone,
  Trophy,
  Award,
  Clock,
  ExternalLink
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    const unsub = userService.subscribeNotifications((list) => {
      setNotifications(list);
    });
    if (isOpen) {
      userService.fetchRemoteNotifications();
    }
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    userService.markAllNotificationsAsRead();
  };

  const handleItemClick = (n: UserNotification) => {
    if (!n.isRead) {
      userService.markNotificationAsRead(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUBMISSION_STATUS':
        return <CheckCircle2 className="w-5 h-5 text-[#55BFEA]" />;
      case 'ANNOUNCEMENT':
      case 'SYSTEM_BROADCAST':
        return <Megaphone className="w-5 h-5 text-[#1687C7]" />;
      case 'COMPETITION':
        return <Trophy className="w-5 h-5 text-[#F2C96B]" />;
      case 'HONOR_AWARDED':
        return <Award className="w-5 h-5 text-[#F2C96B]" />;
      default:
        return <Bell className="w-5 h-5 text-[#1687C7]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-tajawal" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#D8E8F2] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#145273] via-[#1687C7] to-[#55BFEA] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-amiri">الإشعارات والتنبيهات</h3>
              <p className="text-xs text-[#E7F7FD]">
                متابعة حالة طلبات تلاواتك وأحدث الإعلانات والمسابقات
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

        {/* Action bar */}
        <div className="p-3 bg-[#F6FBFF] border-b border-[#D8E8F2] flex items-center justify-between text-xs">
          <span className="text-[#6C8795] font-medium">
            عدد التنبيهات: {notifications.length}
          </span>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-[#1687C7] hover:text-[#145273] font-bold flex items-center gap-1 transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>تحديد الكل كمقروء</span>
            </button>
          )}
        </div>

        {/* List of Notifications */}
        <div className="p-4 overflow-y-auto divide-y divide-[#D8E8F2]/60 space-y-2 flex-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 rounded-2xl transition cursor-pointer flex items-start gap-3 ${
                notif.isRead
                  ? 'bg-white hover:bg-[#F6FBFF]'
                  : 'bg-[#E7F7FD]/60 border border-[#55BFEA]/30 hover:bg-[#E7F7FD]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] flex items-center justify-center shrink-0 shadow-xs">
                {getIcon(notif.notificationType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-[#193B4D] truncate">
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#1687C7] shrink-0" />
                  )}
                </div>

                <p className="text-xs text-[#6C8795] mt-1 leading-relaxed">
                  {notif.body}
                </p>

                {notif.rejectionReason && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <span className="font-bold block">ملاحظات الإدارة / سبب عدم الاعتماد:</span>
                    <span className="mt-0.5 block">{notif.rejectionReason}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#6C8795]">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notif.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-[#6C8795] text-xs">
              <Bell className="w-8 h-8 mx-auto text-[#D8E8F2] mb-2" />
              <span>لا توجد إشعارات جديدة حاليًا</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#D8E8F2] bg-[#F6FBFF] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1687C7] text-white text-xs font-bold hover:bg-[#145273] transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
