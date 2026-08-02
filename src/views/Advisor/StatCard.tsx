'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  percentage?: string;
  loading?: boolean;
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  percentage,
  loading = false,
}: StatCardProps) {
  return (
    <div className="ui-card flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
      >
        {loading ? <SkeletonPulse className="h-5 w-5 !bg-current opacity-20 rounded" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#868E96]">{label}</p>
        {loading ? (
          <div className="mt-1.5 space-y-1.5">
            <SkeletonPulse className="h-7 w-16" />
            {percentage !== undefined && <SkeletonPulse className="h-3.5 w-20" />}
          </div>
        ) : (
          <>
            <p className="mt-0.5 text-[28px] font-bold leading-none text-[#1A1B1E]">{value}</p>
            {percentage !== undefined && (
              <p className="mt-1 text-xs font-semibold text-[#868E96]">{percentage}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton({
  label,
  icon,
  iconBg,
  iconColor,
  percentage,
}: Omit<StatCardProps, 'value' | 'loading'>) {
  return (
    <StatCard
      label={label}
      value={0}
      icon={icon}
      iconBg={iconBg}
      iconColor={iconColor}
      percentage={percentage}
      loading
    />
  );
}
