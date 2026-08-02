'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, Award, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Student } from '../../types/student';
import { API_Student } from '../../api/API_Student';
import { WelcomeBanner } from '../../components/student/WelcomeBanner';
import { StatsGrid } from '../../components/student/StatsGrid';
import EvaluationStatusStepper from '../../components/common/EvaluationStatusStepper';

export const StudentDashboard = () => {
  const user = useAuthStore((state) => state.user) as Student;
  const [history, setHistory] = useState<any[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API_Student.getEvaluations();
        const data = res.data || res;
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch dashboard history:', err);
        setHistory([]);
      }
    };
    fetchHistory();
  }, []);

  const normalizeStatus = (status?: string) => String(status || '').toLowerCase();
  const getEvaluationScore = (item: any) => item.totalScore ?? item.finalScore ?? item.classScore ?? item.studentScore ?? 0;
  const getEvaluationRank = (item: any) => item.classification ?? item.rank ?? item.rating ?? null;
  const submittedCount = history.filter((item) => item.status && normalizeStatus(item.status) !== 'draft').length;
  const approvedCount = history.filter((item) => normalizeStatus(item.status) === 'finalized').length;
  const draftCount = history.filter((item) => !item.status || normalizeStatus(item.status) === 'draft').length;
  const averageScore = history.length
    ? Math.round(
        history.reduce((total, item) => total + getEvaluationScore(item), 0) /
          history.length
      )
    : 0;

  const stats = [
    {
      icon: FileText,
      label: 'Phiếu chờ nộp',
      value: draftCount,
      bg: 'bg-red-50',
      iconColor: 'text-brand-primary',
      trend: 'Xem chi tiết thông báo trên thanh tiêu đề',
      trendColor: 'text-brand-primary',
    },
    {
      icon: Clock,
      label: 'Đang xét duyệt',
      value: submittedCount - approvedCount,
      bg: 'bg-brand-secondary/10',
      iconColor: 'text-brand-secondary',
      trend: 'Không có',
      trendColor: 'text-gray-400',
    },
    {
      icon: CheckCircle,
      label: 'Đã hoàn thành',
      value: approvedCount,
      bg: 'bg-emerald-50',
      iconColor: 'text-[#10B981]',
      trend: `${history.length} phiếu đã ghi nhận`,
      trendColor: 'text-[#10B981]',
    },
    {
      icon: Award,
      label: 'Điểm TB',
      value: averageScore,
      bg: 'bg-brand-secondary/10',
      iconColor: 'text-brand-secondary',
      trend: history.length ? 'Tính từ dữ liệu hiện có' : 'Chưa có dữ liệu',
      trendColor: 'text-[#10B981]',
    },
  ];

  const getStatusText = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const statuses = {
      draft: 'Nháp',
      submitted: 'Đã nộp',
      class_approved: 'Lớp/CVHT đã duyệt',
      finalized: 'Đã phê duyệt',
      rejected: 'Bị trả về',
    };
    return statuses[normalizedStatus as keyof typeof statuses] || status;
  };

  const getRankText = (rank: string | null | undefined) => {
    if (!rank) return 'Chưa xếp loại';
    const ranks = {
      EXCELLENT: 'Xuất sắc',
      GOOD: 'Tốt',
      FAIR: 'Khá',
      AVERAGE: 'Trung bình',
      POOR: 'Yếu',
      'Xuất sắc': 'Xuất sắc',
      'Tốt': 'Tốt',
      'Khá': 'Khá',
      'Trung bình': 'Trung bình',
      'Yếu': 'Yếu',
    };
    return ranks[rank as keyof typeof ranks] || rank;
  };

  const getBadgeColors = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === 'finalized') {
      return { bg: 'bg-emerald-50', text: 'text-[#10B981]' };
    }
    if (normalizedStatus === 'submitted') {
      return { bg: 'bg-brand-secondary/10', text: 'text-brand-secondary' };
    }
    if (normalizedStatus === 'class_approved') {
      return { bg: 'bg-yellow-50', text: 'text-[#F59E0B]' };
    }
    if (normalizedStatus === 'rejected') {
      return { bg: 'bg-red-50', text: 'text-[#EF4444]' };
    }
    return { bg: 'bg-gray-50', text: 'text-gray-500' };
  };

  const getRankBadgeColors = (rank: string | null | undefined) => {
    if (!rank) return { bg: 'bg-gray-50', text: 'text-gray-500' };
    const r = rank.toUpperCase();
    if (r === 'EXCELLENT' || r === 'XUẤT SẮC') {
      return { bg: 'bg-emerald-50', text: 'text-[#10B981]' };
    }
    if (r === 'GOOD' || r === 'TỐT') {
      return { bg: 'bg-brand-secondary/10', text: 'text-brand-secondary' };
    }
    if (r === 'FAIR' || r === 'KHÁ') {
      return { bg: 'bg-brand-secondary/10', text: 'text-brand-secondary' };
    }
    return { bg: 'bg-amber-50', text: 'text-[#F59E0B]' };
  };

  // Compile academic years dynamically from evaluations
  const uniqueYears = Array.from(new Set(
    history.map(item => {
      if (item.semester && typeof item.semester === 'object') {
        return item.semester.year.toString();
      }
      return item.academicYear || '';
    }).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));

  // Client-side filtering logic
  const filteredHistory = history.filter(item => {
    // Filter by Semester
    if (semesterFilter !== 'all') {
      const sem = item.semester && typeof item.semester === 'object'
        ? item.semester.semester
        : item.semester;
      if (semesterFilter === 'HK1' && sem !== 'SEMESTER_1' && sem !== 'HK1') return false;
      if (semesterFilter === 'HK2' && sem !== 'SEMESTER_2' && sem !== 'HK2') return false;
    }
    // Filter by Academic Year
    if (yearFilter !== 'all') {
      const y = item.semester && typeof item.semester === 'object'
        ? item.semester.year.toString()
        : item.academicYear;
      if (y !== yearFilter) return false;
    }
    return true;
  });

  const displayName = user
    ? 'fullName' in user && typeof user.fullName === 'string'
      ? user.fullName
      : user.username
    : 'Sinh viên';

  return (
    <div className="p-4 sm:p-5 max-w-6xl mx-auto w-full space-y-5">
      {/* Welcome Banner */}
      <WelcomeBanner displayName={displayName} />

      {/* Quick Stats Grid */}
      <StatsGrid stats={stats} />

      {/* History */}
      <section className="ui-card p-5 flex flex-col">
          <div className="mb-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#1A1B1E] shrink-0">Lịch sử gần đây</h2>
            
            {/* Inline Header Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="h-7 cursor-pointer rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-xs"
              >
                <option value="all">Tất cả kỳ</option>
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-7 cursor-pointer rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-xs"
              >
                <option value="all">Tất cả năm</option>
                {uniqueYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>

              <Link
                href="/student/history"
                className="ml-1 flex items-center gap-0.5 whitespace-nowrap text-xs font-bold text-brand-secondary transition-colors hover:text-brand-primary"
              >
                Xem tất cả <ArrowRightIcon size={12} />
              </Link>
            </div>
          </div>

          {/* Scrollable list with empty state */}
          <div className="divide-y divide-gray-100 overflow-y-auto pr-1 flex-1 max-h-[300px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 italic">
                Không có dữ liệu phù hợp
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const semLabel = item.semester && typeof item.semester === 'object'
                  ? `${item.semester.semester === 'SEMESTER_1' ? 'HK1' : 'HK2'} ${item.semester.year}`
                  : `${item.semester}`;
                const score = getEvaluationScore(item);
                const rank = getEvaluationRank(item);
                const badgeColors = getBadgeColors(item.status);
                const rankColors = getRankBadgeColors(rank);
                const rankText = getRankText(rank);
                const statusText = getStatusText(item.status);

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 animate-fade-in"
                  >
	                    <div className="min-w-0">
	                      <p className="truncate text-xs font-bold text-[#1A1B1E]">{semLabel}</p>
	                      <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColors.bg} ${badgeColors.text}`}>
	                        {statusText}
	                      </span>
	                      <EvaluationStatusStepper
	                        status={item.status}
	                        statusLabel={item.statusLabel}
	                        steps={item.review?.steps}
	                        compact
	                        className="mt-2"
	                      />
	                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold text-[#1A1B1E]">{score}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 ${rankColors.bg} ${rankColors.text}`}>{rankText}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
    </div>
  );
};

export default StudentDashboard;
