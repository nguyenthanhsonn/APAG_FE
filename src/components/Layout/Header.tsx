'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, Menu, User, LockKeyhole, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { API_Student } from '../../api/API_Student';
import type { HeaderProps } from '@/types/common';
import { hasAccessToken } from '@/utils/authToken';

import { useToast } from '@/components/common/ToastProvider';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { NotificationPopover } from './NotificationPopover';

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bell notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const bellOpenRef = useRef(false);

  useEffect(() => {
    bellOpenRef.current = bellOpen;
  }, [bellOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count for bell badge
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    if (!hasAccessToken()) return;
    try {
      const unread = await API_Student.getUnreadCount();
      setUnreadCount((unread as any)?.unreadCount ?? (unread as any)?.data?.unreadCount ?? (unread as any)?.count ?? 0);
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  }, [user]);

  // Fetch notifications for all roles
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    if (!hasAccessToken()) return;
    try {
      const list = await API_Student.getNotifications({ page: 1, limit: 10 });
      const items = Array.isArray((list as any)?.items)
        ? (list as any).items
        : Array.isArray((list as any)?.data?.items)
          ? (list as any).data.items
          : Array.isArray(list)
            ? list
            : [];

      setNotifications(
        items.map((item: any) => ({
          id: item.id,
          title: item.title || 'Thông báo',
          description: item.content || item.description || item.message || '',
          isRead: item.isRead ?? false,
          createdAt: item.createdAt,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch header notifications:', err);
    }
  }, [user]);

  const refreshNotifications = useCallback((data?: any) => {
    fetchUnreadCount();
    fetchNotifications();
    if (data && (data.title || data.message || data.content)) {
      const msg = data.title || 'Bạn có thông báo mới';
      const desc = data.content || data.message || '';
      toast.info(desc ? `${msg}: ${desc}` : msg);
    }
  }, [fetchNotifications, fetchUnreadCount, toast]);

  useNotificationSocket(refreshNotifications);

  useEffect(() => {
    fetchUnreadCount();
    if (bellOpen) {
      fetchNotifications();
    }
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [bellOpen, fetchNotifications, fetchUnreadCount]);

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.isRead) {
        await API_Student.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        await fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API_Student.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      await fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const displayName = user
    ? (user as any).fullName || (user as any).name || (user as any).username || (user as any).email || 'Lớp trưởng'
    : undefined;

  // Fix initials to ignore parentheses / brackets.
  const cleanName = displayName ? displayName.replace(/\s*\([^)]*\)/g, '').trim() : '';
  const initials = cleanName
    ? cleanName.split(' ').filter(Boolean).slice(-2).map((n: string) => n[0]).join('').toUpperCase()
    : 'U';

  const profileHref = user?.role === 'advisor'
    ? '/advisor/profile'
    : user?.role === 'faculty'
    ? '/faculty/profile'
    : user?.role === 'class_leader'
    ? '/class_leader/profile'
    : '/student/profile';
  const changePasswordHref = user?.role === 'admin'
    ? '/admin/change-password'
    : user?.role === 'advisor'
    ? '/advisor/change-password'
    : user?.role === 'class_leader'
    ? '/class_leader/change-password'
    : user?.role === 'faculty'
    ? '/faculty/change-password'
    : '/student/change-password';
  const roleLabel = user?.role === 'admin'
    ? 'Quản trị viên'
    : user?.role === 'advisor'
    ? 'Cố vấn học tập'
    : user?.role === 'class_leader'
    ? 'Lớp trưởng'
    : user?.role === 'faculty'
    ? 'Ban/Khoa'
    : user?.role === 'training_department'
    ? 'Phòng Đào Tạo'
    : 'Sinh viên';

  const dropdownItems = (user?.role === 'admin' || user?.role === 'training_department')
    ? []
    : [
        { label: 'Thông tin cá nhân', href: profileHref, icon: User },
      ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E9ECEF] bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">

        {/* Left: hamburger */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={onMenuClick}
            className="ui-icon-button cursor-pointer text-[#1A1B1E] hover:bg-red-50 hover:text-brand-primary lg:hidden"
          >
            <Menu size={21} />
          </button>
        </div>

        {/* Right side: Bell icon + user dropdown */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bell Notifications */}
            {user.role === 'student' && (
              <div className="relative shrink-0" ref={bellRef}>
                <button
                  type="button"
                  onClick={() => setBellOpen(!bellOpen)}
                  className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl hover:bg-gray-100 text-[#3D4A6B] hover:text-brand-primary transition-all duration-150 select-none active:scale-95"
                  aria-expanded={bellOpen}
                  aria-haspopup="true"
                  aria-label="Thông báo"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in-75">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationPopover
                  isOpen={bellOpen}
                  onClose={() => setBellOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={handleNotificationClick}
                  onMarkAllRead={handleMarkAllRead}
                />
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex cursor-pointer items-center gap-3 bg-transparent hover:bg-gray-50 p-1.5 rounded-xl transition duration-150 focus:outline-none select-none"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-sm font-semibold text-gray-900 leading-tight">
                    {displayName || 'Hội đồng Học viện'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {roleLabel}
                  </span>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white shadow-sm">
                  {initials}
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-[#E9ECEF] bg-white shadow-lg p-1.5 focus:outline-none animate-in fade-in-0 slide-in-from-top-2 duration-150 ease-out z-50">
                  {/* User Profile Header (Mobile only) */}
                  <div className="px-3 py-2 border-b border-[#E9ECEF] sm:hidden">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {displayName || 'Hội đồng Học viện'}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                      {roleLabel}
                    </p>
                  </div>

                  {/* Navigation Items */}
                  {dropdownItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-red-50 hover:text-brand-primary active:scale-[0.98]"
                      >
                        <Icon size={16} strokeWidth={2} className="shrink-0 text-gray-500" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {dropdownItems.length > 0 && <div className="my-1 border-t border-[#E2E8F0]" />}

                  {/* Change Password Link */}
                  <Link
                    href={changePasswordHref}
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-red-50 hover:text-brand-primary active:scale-[0.98]"
                  >
                    <LockKeyhole size={16} strokeWidth={2} className="shrink-0 text-gray-500" />
                    <span>Đổi mật khẩu</span>
                  </Link>

                  <div className="my-1 border-t border-[#E2E8F0]" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                      router.push('/login');
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[#D92D20] transition hover:bg-[#FFF5F5] active:scale-[0.98]"
                  >
                    <LogOut size={16} strokeWidth={2} className="shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </header>
  );
};
