import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { UserProfile } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  Trash2,
  RefreshCw,
  UserCheck,
  Headphones,
  Mic2,
  Edit,
  Ban,
  Unlock,
  X,
  Save,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { CountrySelectField } from '../CountrySelectField';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Selected User Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendPrompt, setShowSuspendPrompt] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUserDetails = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      displayName: user.displayName,
      country: user.country,
      bio: user.bio,
      userType: user.userType,
      email: user.email,
      whatsapp: user.whatsapp,
      avatarUrl: user.avatarUrl
    });
    setIsEditing(false);
    setShowSuspendPrompt(false);
  };

  const handleSaveUserEdits = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminService.updateUser(selectedUser.id, editFormData);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...editFormData } : u))
      );
      setSelectedUser((prev: any) => ({ ...prev, ...editFormData }));
      setIsEditing(false);
      alert('تم تحديث بيانات المستخدم بنجاح');
    } catch (e: any) {
      alert(e?.message || 'تعذر حفظ التعديلات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (isSuspended: boolean) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const reason = isSuspended
        ? suspendReason || 'مخالفة معايير وشروط استخدام منصة تلاوتك للعالم ونشر محتوى مخالف'
        : '';
      await adminService.toggleUserSuspension(selectedUser.id, isSuspended, reason);
      
      const updated = {
        ...selectedUser,
        isSuspended,
        suspendedReason: reason
      };

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? updated : u))
      );
      setSelectedUser(updated);
      setShowSuspendPrompt(false);
      setSuspendReason('');
      alert(isSuspended ? 'تم إيقاف وحظر حساب المستخدم نهائيًا' : 'تم رفع الحظر وإعادة تنشيط الحساب');
    } catch (e: any) {
      alert(e?.message || 'تعذر تغيير حالة الحساب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الملف نهائيًا من قاعدة البيانات؟')) return;
    try {
      await adminService.deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (e: any) {
      alert(e?.message || 'تعذر الحذف');
    }
  };

  const filteredUsers = users.filter((user) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = user.displayName?.toLowerCase().includes(q);
      const matchCountry = user.country?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      const matchInstall = user.installationId?.toLowerCase().includes(q);
      if (!matchName && !matchCountry && !matchEmail && !matchInstall) return false;
    }
    if (filterType === 'completed' && !user.isProfileCompleted) return false;
    if (filterType === 'incomplete' && user.isProfileCompleted) return false;
    if (filterType === 'suspended' && !user.isSuspended) return false;
    if (filterType === 'active' && user.isSuspended) return false;
    if (filterType === 'listeners' && user.userType !== 'LISTENER') return false;
    if (filterType === 'reciters' && user.userType !== 'RECITER' && user.userType !== 'BOTH') return false;
    return true;
  });

  const completedCount = users.filter((u) => u.isProfileCompleted).length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="space-y-6 font-tajawal">
      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#55BFEA]" />
            <span>إدارة المستخدمين والزوار</span>
          </h2>
          <p className="text-xs text-[#A8C2B3] mt-1">
            متابعة الحسابات، فحص تفاصيل المستخدم، تعديل البيانات، وتطبيق الحظر الصارم للمخالفين
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162B22] border border-[#2B493B] text-xs text-[#E8EFEA] hover:bg-[#1E3B2E] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#12231B] border border-[#234235] p-4 rounded-2xl">
          <span className="text-xs text-[#A8C2B3]">إجمالي المستخدمين</span>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
        </div>
        <div className="bg-[#12231B] border border-[#234235] p-4 rounded-2xl">
          <span className="text-xs text-[#A8C2B3]">ملفات مكتملة</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
        </div>
        <div className="bg-[#12231B] border border-[#234235] p-4 rounded-2xl">
          <span className="text-xs text-[#A8C2B3]">زوار بحسابات غير مكتملة</span>
          <div className="text-2xl font-bold text-[#F2C96B] mt-1">{users.length - completedCount}</div>
        </div>
        <div className="bg-[#12231B] border border-[#234235] p-4 rounded-2xl">
          <span className="text-xs text-[#A8C2B3]">حسابات محظورة / موقوفة</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{suspendedCount}</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#12231B] border border-[#234235] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الدولة، أو البريد..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#0A1410] border border-[#234235] text-xs text-white placeholder-[#6E8E7E] focus:outline-hidden focus:border-[#55BFEA]"
          />
          <Search className="w-4 h-4 text-[#6E8E7E] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'active', label: 'نشط' },
            { id: 'suspended', label: 'محظور / موقوف' },
            { id: 'completed', label: 'ملف مكتمل' },
            { id: 'incomplete', label: 'غير مكتمل' },
            { id: 'listeners', label: 'مستمعون' },
            { id: 'reciters', label: 'قراء' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition ${
                filterType === tab.id
                  ? 'bg-[#1687C7] text-white font-medium shadow-xs'
                  : 'bg-[#0A1410] text-[#A8C2B3] border border-[#234235] hover:bg-[#162B22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#12231B] border border-[#234235] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0A1410] border-b border-[#234235] text-[#A8C2B3]">
              <tr>
                <th className="px-4 py-3 font-semibold">المستخدم</th>
                <th className="px-4 py-3 font-semibold">الدولة</th>
                <th className="px-4 py-3 font-semibold">التصنيف</th>
                <th className="px-4 py-3 font-semibold">حالة الحساب</th>
                <th className="px-4 py-3 font-semibold">تاريخ الانضمام</th>
                <th className="px-4 py-3 font-semibold">آخر نشاط</th>
                <th className="px-4 py-3 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234235]/60">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleOpenUserDetails(user)}
                  className="hover:bg-[#162B22]/70 transition cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-[#234235]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#162B22] border border-[#234235] flex items-center justify-center text-[#55BFEA] font-bold text-xs">
                          {user.displayName?.charAt(0) || 'ز'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white group-hover:text-[#55BFEA] transition-colors flex items-center gap-1.5">
                          <span>{user.displayName}</span>
                          {user.isSuspended && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                              محظور
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div className="text-[11px] text-[#A8C2B3] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-[#6E8E7E]" />
                            <span>{user.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[#A8C2B3]">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#6E8E7E]" />
                      <span>{user.country || 'غير محدد'}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {user.userType === 'RECITER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1687C7]/20 text-[#55BFEA] border border-[#1687C7]/30">
                        <Mic2 className="w-3 h-3" />
                        <span>قارئ</span>
                      </span>
                    ) : user.userType === 'BOTH' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-[#F2C96B] border border-amber-500/30">
                        <span>قارئ ومستمع</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#234235] text-[#A8C2B3] border border-[#2B493B]">
                        <Headphones className="w-3 h-3" />
                        <span>مستمع</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        <Ban className="w-3.5 h-3.5" />
                        <span>موقوف ومحظور</span>
                      </span>
                    ) : user.isProfileCompleted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>نشط ومكتمل</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#F2C96B]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>زائر غير مكتمل</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[#A8C2B3]">
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </td>

                  <td className="px-4 py-3 text-[#A8C2B3]">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString('ar-EG') : '-'}
                  </td>

                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenUserDetails(user)}
                        className="p-1.5 rounded-lg text-[#55BFEA] hover:bg-[#1E3B2E] transition"
                        title="عرض وتعديل التفاصيل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#A8C2B3]">
                    لا يوجد مستخدمون يطابقون معايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details & Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#12231B] border border-[#234235] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-white">
            {/* Modal Header */}
            <div className="p-5 bg-[#0A1410] border-b border-[#234235] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#162B22] border border-[#2B493B] flex items-center justify-center text-[#55BFEA]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    ملف المستخدم: {selectedUser.displayName}
                  </h3>
                  <p className="text-xs text-[#A8C2B3]">
                    معرف التثبيت: <code className="text-[#55BFEA] font-mono text-[11px]">{selectedUser.installationId}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-[#162B22] hover:bg-[#234235] text-[#A8C2B3] flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Account Status Alert Banner */}
              {selectedUser.isSuspended ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-rose-300">
                      هذا الحساب محظور وموقوف نهائيًا عن استخدام المنصة
                    </p>
                    <p className="text-rose-200/90">
                      سبب الإيقاف: {selectedUser.suspendedReason || 'مخالفة معايير الاستخدام والنشر'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>الحساب نشط ويتمتع بكامل صلاحيات المنصة</span>
                  </div>
                  <span className="text-[11px] text-emerald-400/80">
                    آخر ظهور: {new Date(selectedUser.lastActiveAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              )}

              {/* Edit Mode vs View Mode */}
              {isEditing ? (
                <div className="space-y-4 bg-[#0A1410] p-4 rounded-2xl border border-[#234235]">
                  <h4 className="font-bold text-xs text-[#55BFEA] flex items-center gap-1.5">
                    <Edit className="w-4 h-4" />
                    <span>تعديل بيانات المستخدم الإدارية</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#A8C2B3] mb-1 font-bold">الاسم الظاهر</label>
                      <input
                        type="text"
                        value={editFormData.displayName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#162B22] border border-[#234235] text-xs text-white"
                      />
                    </div>

                    <div>
                      <CountrySelectField
                        value={editFormData.country || 'العالم الإسلامي'}
                        onChange={(val) => setEditFormData({ ...editFormData, country: val })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#A8C2B3] mb-1 font-bold">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#162B22] border border-[#234235] text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#A8C2B3] mb-1 font-bold">رقم الواتساب</label>
                      <input
                        type="text"
                        value={editFormData.whatsapp || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#162B22] border border-[#234235] text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[#A8C2B3] mb-1 font-bold">نوع المستخدم</label>
                      <select
                        value={editFormData.userType || 'LISTENER'}
                        onChange={(e) => setEditFormData({ ...editFormData, userType: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-[#162B22] border border-[#234235] text-xs text-white"
                      >
                        <option value="LISTENER">مستمع للقرآن الكريم</option>
                        <option value="RECITER">قارئ معتمد</option>
                        <option value="BOTH">قارئ ومستمع</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[#A8C2B3] mb-1 font-bold">النبذة التعريفية</label>
                      <textarea
                        rows={2}
                        value={editFormData.bio || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#162B22] border border-[#234235] text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSaveUserEdits}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-[#1687C7] hover:bg-[#145273] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-[#162B22] hover:bg-[#234235] text-[#A8C2B3] text-xs font-bold transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Profile Overview */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0A1410] border border-[#234235]">
                    {selectedUser.avatarUrl ? (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.displayName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#55BFEA]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#162B22] border-2 border-[#2B493B] flex items-center justify-center text-[#55BFEA] font-bold text-xl">
                        {selectedUser.displayName?.charAt(0) || 'ز'}
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white font-amiri">
                          {selectedUser.displayName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1687C7]/20 text-[#55BFEA] border border-[#1687C7]/30">
                          {selectedUser.userType === 'RECITER' ? 'قارئ' : selectedUser.userType === 'BOTH' ? 'قارئ ومستمع' : 'مستمع'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#A8C2B3]">
                        <Globe className="w-3.5 h-3.5 text-[#55BFEA]" />
                        <span>{selectedUser.country || 'غير محدد'}</span>
                      </div>

                      {selectedUser.bio && (
                        <p className="text-xs text-[#A8C2B3]/90 pt-1 leading-relaxed">
                          "{selectedUser.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Registered Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#0A1410] border border-[#234235]">
                      <span className="text-[#6E8E7E] block mb-0.5">البريد الإلكتروني</span>
                      <span className="text-white font-mono">{selectedUser.email || 'غير مسجل'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A1410] border border-[#234235]">
                      <span className="text-[#6E8E7E] block mb-0.5">رقم الواتساب</span>
                      <span className="text-white font-mono">{selectedUser.whatsapp || 'غير مسجل'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A1410] border border-[#234235]">
                      <span className="text-[#6E8E7E] block mb-0.5">تاريخ التسجيل</span>
                      <span className="text-white">{new Date(selectedUser.createdAt).toLocaleString('ar-EG')}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A1410] border border-[#234235]">
                      <span className="text-[#6E8E7E] block mb-0.5">اكتمال الملف</span>
                      <span className={selectedUser.isProfileCompleted ? 'text-emerald-400' : 'text-[#F2C96B]'}>
                        {selectedUser.isProfileCompleted ? 'مكتمل' : 'زائر مؤقت'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Suspension Reason Prompt */}
              {showSuspendPrompt && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>تأكيد إيقاف وحظر حساب المستخدم نهائيًا</span>
                  </div>
                  <p className="text-xs text-rose-200/80">
                    عند إيقاف الحساب، لن يتمكن صاحب هذا المعرف من فتح أو استخدام تطبيق تلاوتك للعالم لحماية أمان ومصداقية المنصة.
                  </p>
                  <div>
                    <label className="block text-[11px] text-rose-200 mb-1">سبب الحظر (سيظهر للإدارة):</label>
                    <input
                      type="text"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="مثال: نشر محتوى مخالف للآداب، تكرار المخالفات..."
                      className="w-full px-3 py-2 rounded-xl bg-[#0A1410] border border-rose-500/40 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleSuspension(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>تأكيد الحظر النهائي</span>
                    </button>
                    <button
                      onClick={() => setShowSuspendPrompt(false)}
                      className="px-4 py-2 rounded-xl bg-[#162B22] text-[#A8C2B3] text-xs font-bold"
                    >
                      تراجع
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-[#0A1410] border-t border-[#234235] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1687C7] hover:bg-[#145273] text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل البيانات</span>
                  </button>
                )}

                {selectedUser.isSuspended ? (
                  <button
                    onClick={() => handleToggleSuspension(false)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>إلغاء الحظر وإعادة التفعيل</span>
                  </button>
                ) : (
                  !showSuspendPrompt && (
                    <button
                      onClick={() => setShowSuspendPrompt(true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>إيقاف وحظر الحساب</span>
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
