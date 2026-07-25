import { ResultBannerProps } from '../../types';

export const ResultBanner = ({ semester, academicYear, rating, totalScore }: ResultBannerProps) => {
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - totalScore / 100);

  const getRankStyle = (rank: string) => {
    const r = (rank || '').toUpperCase();
    if (r.includes('XUẤT SẮC') || r.includes('EXCELLENT')) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (r.includes('TỐT') || r.includes('GOOD')) return 'text-indigo-500 bg-indigo-50 border-indigo-200';
    if (r.includes('KHÁ') || r.includes('FAIR')) return 'text-indigo-400 bg-indigo-50 border-indigo-200';
    if (r.includes('TRUNG BÌNH') || r.includes('AVERAGE')) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-[#1e2d5a] via-[#243362] to-[#1a2650] p-6 sm:p-8 shadow-sm">
      {/* Subtle decorative blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/3 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: text info */}
        <div className="space-y-4">
          {/* Semester pill */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-medium tracking-wide text-white/70 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
            {semester} · Năm học {academicYear}
          </span>

          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
              Kết quả đánh giá rèn luyện
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              Điểm số chính thức đã được Hội đồng Khoa phê duyệt và xác nhận.
            </p>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRankStyle(rating)}`}>
              Xếp loại: {rating}
            </span>
          </div>
        </div>

        {/* Right: circular score */}
        <div className="mx-auto shrink-0 md:mx-0">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle
                cx="50" cy="50" r="44"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress */}
              <circle
                cx="50" cy="50" r="44"
                stroke="rgba(165,180,252,0.90)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-semibold leading-none tracking-tight text-white">
                {totalScore}
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-white/45">/100 điểm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
