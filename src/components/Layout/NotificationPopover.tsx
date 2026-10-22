'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt?: string;
  type?: string;
}

interface NotificationPopoverProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (notification: NotificationItem) => void;
  onMarkAllRead: () => void;
}

type NotificationCategory = 'reminder' | 'evaluation' | 'completed' | 'general';

function getCategoryInfo(title: string, desc: string): {
  category: NotificationCategory;
  label: string;
  tagClass: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
} {
  const text = `${title} ${desc}`.toLowerCase();

  if (
    text.includes('nhắc nhở') ||
    text.includes('chưa nộp') ||
    text.includes('hạn chót') ||
    text.includes('hết hạn') ||
    text.includes('cảnh báo')
  ) {
    return {
      category: 'reminder',
      label: 'Nhắc nhở',
      tagClass: 'bg-amber-50 text-amber-700 border-amber-200/70',
      iconBg: 'bg-amber-50 border border-amber-200/80',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
    };
  }

  if (
    text.includes('đánh giá') ||
    text.includes('mở') ||
    text.includes('phiếu') ||
    text.includes('rèn luyện')
  ) {
    return {
      category: 'evaluation',
      label: 'Đánh giá RL',
      tagClass: 'bg-blue-50 text-blue-700 border-blue-200/70',
      iconBg: 'bg-blue-50 border border-blue-200/80',
      iconColor: 'text-blue-600',
      Icon: ClipboardList,
    };
  }

  if (
    text.includes('kết thúc') ||
    text.includes('hoàn thành') ||
    text.includes('đã duyệt') ||
    text.includes('thành công')
  ) {
    return {
      category: 'completed',
      label: 'Thông báo',
      tagClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      iconBg: 'bg-emerald-50 border border-emerald-200/80',
      iconColor: 'text-emerald-600',
      Icon: CheckCircle2,
    };
  }

  return {
    category: 'general',
    label: 'Tin tức',
    tagClass: 'bg-slate-50 text-slate-600 border-slate-200/70',
    iconBg: 'bg-slate-50 border border-slate-200/80',
    iconColor: 'text-slate-600',
    Icon: Bell,
  };
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Gần đây';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Gần đây';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatFullDateTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.isRead;
    return true;
  });

  const handleToggleExpand = (item: NotificationItem) => {
    if (!item.isRead) {
      onMarkAsRead(item);
    }
    setExpandedId((prev) => (prev === item.id ? null : item.id));
  };

  const handleGoToEvaluation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    router.push('/student/evaluation');
  };

  const isEvaluationRelated = (title: string, desc: string) => {
    const text = `${title} ${desc}`.toLowerCase();
    return (
      text.includes('đánh giá') ||
      text.includes('rèn luyện') ||
      text.includes('phiếu') ||
      text.includes('kết thúc')
    );
  };

  return (
    <div
      className="absolute right-0 mt-2 w-[380px] sm:w-[420px] max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.06)] focus:outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 ease-out z-50 overflow-hidden flex flex-col"
      style={{ maxHeight: 'calc(100vh - 90px)' }}
    >
      {/* Header */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-brand-primary">
              <Bell size={15} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Thông báo & Yêu cầu</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/70">
                {unreadCount} mới
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-brand-primary transition-colors py-1 px-2 rounded-lg hover:bg-white cursor-pointer active:scale-95"
            >
              <CheckCheck size={13} />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mt-2.5 flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/60 border border-slate-200/40">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 border border-slate-200/60">
              <Inbox size={22} />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-[240px]">
              {activeTab === 'unread'
                ? 'Bạn đã xem hết tất cả thông báo!'
                : 'Mọi thông báo và nhắc nhở học vụ sẽ hiển thị ở đây.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const meta = getCategoryInfo(item.title, item.description);
            const Icon = meta.Icon;
            const timeAgo = formatRelativeTime(item.createdAt);
            const isExpanded = expandedId === item.id;
            const relatesToEvaluation = isEvaluationRelated(item.title, item.description);

            return (
              <div
                key={item.id}
                onClick={() => handleToggleExpand(item)}
                className={`group relative rounded-xl border transition-all cursor-pointer select-none p-3 ${
                  item.isRead
                    ? 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 shadow-xs'
                    : 'bg-blue-50/30 border-blue-100/80 hover:bg-blue-50/60 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon Badge */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} ${meta.iconColor} transition-transform group-hover:scale-105`}
                  >
                    <Icon size={17} />
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    {/* Tag + Time + Unread indicator */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.tagClass}`}
                      >
                        {meta.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock size={10} />
                          {timeAgo}
                        </span>
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 ring-2 ring-blue-100 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      className={`text-xs font-bold leading-snug transition-colors ${
                        isExpanded ? 'text-slate-900' : 'line-clamp-1'
                      } ${item.isRead ? 'text-slate-800 group-hover:text-brand-primary' : 'text-slate-900 group-hover:text-blue-700'}`}
                    >
                      {item.title}
                    </h4>

                    {/* Description: preview or full */}
                    <p
                      className={`mt-1 text-[11px] leading-relaxed text-slate-600 transition-all ${
                        isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Expanded details & Action button */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2 animate-in fade-in-0 duration-150">
                        {item.createdAt && (
                          <div className="text-[10px] text-slate-400">
                            Thời gian gửi: {formatFullDateTime(item.createdAt)}
                          </div>
                        )}

                        {relatesToEvaluation && (
                          <button
                            type="button"
                            onClick={handleGoToEvaluation}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-red-700 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <span>Đi tới Đánh giá rèn luyện</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Toggle Indicator */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                      <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 px-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleGoToEvaluation}
          className="inline-flex items-center gap-1.5 font-bold text-brand-primary hover:text-red-700 transition-colors py-1 cursor-pointer active:scale-95"
        >
          <span>Xem phiếu đánh giá</span>
          <ArrowRight size={13} />
        </button>
        <span className="text-[11px] text-slate-400 font-medium">
          {notifications.length} thông báo
        </span>
      </div>
    </div>
  );
};
