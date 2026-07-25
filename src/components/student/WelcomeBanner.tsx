import { WelcomeBannerProps } from '../../types';

export const WelcomeBanner = ({ displayName }: WelcomeBannerProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3D4A6B] to-[#2A3550] p-5 sm:p-6 text-white shadow-sm border border-gray-800/10">
      <div className="relative z-10 max-w-md">
        <h1 className="mt-2.5 text-xl sm:text-2xl font-semibold leading-tight">
          Chào mừng trở lại, {displayName}!
        </h1>
        <p className="mt-1 text-xs text-white/70 leading-relaxed max-w-sm">
          Hệ thống đang mở kỳ Đánh giá kết quả Rèn luyện. Vui lòng hoàn thành phiếu tự đánh giá của bạn trước ngày hạn định.
        </p>
      </div>
      <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-white/5 blur-xl" />
    </div>
  );
};
