import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { AdminAuthState, AdminTab } from '../../types';
import { AdminLoginScreen } from './AdminLoginScreen';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminSubmissionsView } from './AdminSubmissionsView';
import { AdminRecitersView } from './AdminRecitersView';
import { AdminRecitationsView } from './AdminRecitationsView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { AdminCompetitionsView } from './AdminCompetitionsView';
import { AdminRewardsView } from './AdminRewardsView';
import { AdminStatisticsView } from './AdminStatisticsView';
import { AdminNotificationsView } from './AdminNotificationsView';
import { AdminUsersView } from './AdminUsersView';
import {
  LayoutDashboard,
  FileCheck,
  Users,
  UserCog,
  BookOpen,
  Megaphone,
  Trophy,
  Award,
  BarChart3,
  Bell,
  LogOut,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

interface AdminControlPanelProps {
  onBackToApp: () => void;
  onClose?: () => void;
  onDataChanged?: () => void;
}

export function AdminControlPanel({ onBackToApp }: AdminControlPanelProps) {
  const [authState, setAuthState] = useState<AdminAuthState>(adminService.getAuthState());
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  useEffect(() => {
    const unsubAuth = adminService.subscribe((state) => {
      setAuthState(state);
    });
    return () => {
      unsubAuth();
    };
  }, []);

  // Fetch pending items and notifications count
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const fetchBadges = async () => {
      try {
        const stats = await adminService.getDashboardStats();
        setPendingCount(stats.pendingSubmissions || 0);

        const notifs = await adminService.getAdminNotifications();
        setUnreadNotificationsCount(notifs.filter((n) => !n.isRead).length);
      } catch (e) {
        // Silently handle
      }
    };

    fetchBadges();
  }, [authState.isAuthenticated, activeTab]);

  if (!authState.isAuthenticated) {
    return (
      <AdminLoginScreen
        onSuccess={() => setActiveTab('dashboard')}
        onBackToApp={onBackToApp}
      />
    );
  }

  const handleLogout = async () => {
    await adminService.logout();
  };

  const navItems: { id: AdminTab; label: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'لوحة القيادة والمؤشرات', icon: LayoutDashboard },
    {
      id: 'submissions',
      label: 'مراجعة طلبات التلاوات',
      icon: FileCheck,
      badge: pendingCount,
      badgeColor: 'bg-[#F2C96B] text-[#145273] font-bold'
    },
    { id: 'reciters', label: 'إدارة ملفات القراء', icon: Users },
    { id: 'recitations', label: 'إدارة التلاوات والتسجيلات', icon: BookOpen },
    { id: 'announcements', label: 'الإعلانات والتعاميم', icon: Megaphone },
    { id: 'competitions', label: 'المسابقات والفعاليات', icon: Trophy },
    { id: 'rewards', label: 'الأوسمة والجوائز التقديرية', icon: Award },
    { id: 'users', label: 'المستخدمون والزوار', icon: UserCog },
    { id: 'statistics', label: 'التقارير والإحصائيات', icon: BarChart3 },
    {
      id: 'notifications',
      label: 'التنبيهات الإدارية',
      icon: Bell,
      badge: unreadNotificationsCount,
      badgeColor: 'bg-[#55BFEA] text-[#145273] font-bold'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07131B] text-[#E8F3FA] flex flex-col font-tajawal select-none" dir="rtl">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B1E2B]/95 backdrop-blur-md border-b border-[#1A3A50] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-[#9BBACD] hover:text-white rounded-xl bg-[#11293B] border border-[#1E435E]"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Admin Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1687C7] to-[#145273] border border-[#55BFEA]/40 flex items-center justify-center text-white font-amiri font-bold text-lg shadow-sm">
              ت
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-[#F6FBFF] font-amiri">
                  لوحة تحكم منصة تلاوتك للعالم
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2C96B]/20 text-[#F2C96B] border border-[#F2C96B]/30">
                  {authState.admin?.role === 'SUPER_ADMIN' ? 'المدير العام' : 'مشرف ومراجع'}
                </span>
              </div>
              <p className="text-[11px] text-[#9BBACD]">
                الإشراف العام • مراجعة القراءات • اعتماد التلاوات
              </p>
            </div>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 rounded-xl bg-[#11293B] hover:bg-[#1A3D57] border border-[#1E435E] text-xs font-semibold text-[#9BBACD] hover:text-white transition flex items-center gap-1.5"
            title="الرجوع إلى تجربة التطبيق العامة"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">العودة للتطبيق</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-semibold text-rose-300 transition flex items-center gap-1.5"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop / Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-30 w-64 bg-[#0A1A24] border-l border-[#1A3A50] flex flex-col justify-between pt-16 md:pt-4 md:static md:translate-x-0 transition-transform duration-200 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          {/* Nav Items */}
          <div className="p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#1687C7] text-white shadow-sm font-bold'
                      : 'text-[#9BBACD] hover:bg-[#11293B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#55BFEA]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                        item.badgeColor || 'bg-[#1687C7] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Footer info */}
          <div className="p-3 border-t border-[#1A3A50] bg-[#07131B]/60 text-[11px] text-[#6C8795] flex items-center justify-between">
            <span>{authState.admin?.fullName || 'مدير المنصة'}</span>
            <span className="text-[10px] text-emerald-400">● متصل</span>
          </div>
        </aside>

        {/* Overlay backdrop for mobile */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboardView onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'submissions' && <AdminSubmissionsView />}
          {activeTab === 'reciters' && <AdminRecitersView />}
          {activeTab === 'recitations' && <AdminRecitationsView />}
          {activeTab === 'announcements' && <AdminAnnouncementsView />}
          {activeTab === 'competitions' && <AdminCompetitionsView />}
          {activeTab === 'rewards' && <AdminRewardsView />}
          {activeTab === 'users' && <AdminUsersView />}
          {activeTab === 'statistics' && <AdminStatisticsView />}
          {activeTab === 'notifications' && <AdminNotificationsView />}
        </main>
      </div>
    </div>
  );
}
