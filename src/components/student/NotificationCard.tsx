import { Bell, AlertTriangle, ClipboardList, CheckCircle2 } from 'lucide-react';
import { NotificationCardProps } from '../../types';

function getCardIcon(title: string, desc: string) {
  const text = `${title} ${desc}`.toLowerCase();
  if (
    text.includes('nhắc nhở') ||
    text.includes('chưa nộp') ||
    text.includes('hết hạn') ||
    text.includes('hạn chót')
  ) {
    return {
      Icon: AlertTriangle,
      iconClass: 'bg-amber-100/80 text-amber-600 border border-amber-200/70',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
      label: 'Nhắc nhở',
    };
  }
  if (
    text.includes('đánh giá') ||
    text.includes('mở') ||
    text.includes('phiếu') ||
    text.includes('rèn luyện')
  ) {
    return {
      Icon: ClipboardList,
      iconClass: 'bg-blue-100/80 text-blue-600 border border-blue-200/70',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
      label: 'Đánh giá RL',
    };
  }
  if (text.includes('kết thúc') || text.includes('hoàn thành')) {
    return {
      Icon: CheckCircle2,
      iconClass: 'bg-emerald-100/80 text-emerald-600 border border-emerald-200/70',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      label: 'Thông báo',
    };
  }
  return {
    Icon: Bell,
    iconClass: 'bg-slate-100 text-slate-600 border border-slate-200/70',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200/60',
    label: 'Tin tức',
  };
}

export const NotificationCard = ({ notifications }: NotificationCardProps) => {
  return (
    <section className="ui-card p-5 h-full flex flex-col lg:col-span-2">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-brand-primary">
            <Bell size={16} />
          </div>
          <span>Thông báo & Yêu cầu</span>
        </h2>
        {notifications.length > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            {notifications.length} mục
          </span>
        )}
      </div>

      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[320px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Không có thông báo mới
          </div>
        ) : (
          notifications.map((notif, i) => {
            const meta = getCardIcon(notif.title, notif.description);
            const Icon = meta.Icon;

            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {notif.title}
                  </h4>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 line-clamp-2">
                    {notif.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
