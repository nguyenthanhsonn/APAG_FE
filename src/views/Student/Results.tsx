'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, Users, Heart, Award, Loader2, AlertCircle } from 'lucide-react';
import { API_Student } from '../../api/API_Student';
import { ResultBanner } from '../../components/student/ResultBanner';
import { DetailScoresCard } from '../../components/student/DetailScoresCard';
import { ReviewerCommentsCard } from '../../components/student/ReviewerCommentsCard';
import { RankBenefitsCard } from '../../components/student/RankBenefitsCard';

export const StudentResults = () => {
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper score calculation parsers
  const getStudyScoreNum = (level: string, activities: any[]) => {
    let base = 0;
    if (level === 'GTE_9') base = 6;
    else if (level === 'FROM_7_TO_UNDER_9') base = 5;
    else if (level === 'FROM_5_TO_UNDER_7') base = 4;
    else if (level === 'FROM_4_TO_UNDER_5') base = 2;
    else if (level === 'FROM_1_TO_UNDER_4') base = 1;
    
    const actScore = (activities || []).length * 2;
    return Math.min(20, base + actScore);
  };

  const getDisciplineDeduction = (violations: any[]) => {
    return (violations || []).reduce((acc, v) => acc + (v.deductScore || 0), 0);
  };

  const getActScoreNum = (actData: any) => {
    let total = 0;
    const politicalScores: Record<string, number> = {
      GOOD_PARTICIPATION: 5,
      ABSENT_ONCE: 3,
      ABSENT_TWICE: 2,
      ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED: 0,
    };
    total += politicalScores[actData.politicalActivityLevel] ?? 0;
    if (actData.cultureSportLevel === 'FULL_EFFECTIVE_PARTICIPATION') total += 5;
    if (actData.clubActivityLevel === 'FULL_EFFECTIVE_PARTICIPATION') total += 5;
    return Math.min(20, total + (actData.rewardScore || 0));
  };

  const getCommScoreNum = (commData: any) => {
    const lawScores: Record<string, number> = {
      GOOD_WITH_REWARD: 10,
      GOOD: 8,
      AVERAGE: 5,
      VIOLATED: 0,
      EXCELLENT: 10,
      FAIR: 5,
      POOR: 0,
    };
    const relationshipScores: Record<string, number> = {
      GOOD: 5,
      ONE_WARNING: 1,
      TWO_WARNINGS: 0,
      FAIR: 1,
      POOR: 0,
    };

    let total = lawScores[commData.lawComplianceLevel] ?? 0;
    if (commData.volunteerActivityLevel === 'ACTIVE_WITH_REWARD') total += 10;
    total += relationshipScores[commData.communityRelationshipLevel] ?? 0;
    return Math.min(25, total);
  };

  const getRoleScoreNum = (roleData: any) => {
    let total = roleData.normalStudentActivityScore || 0;
    if (roleData.specialAchievementLevel === 'NATIONAL_OR_INTL') total += 10;
    return Math.min(20, total);
  };

  const getRankText = (rank: string | null | undefined) => {
    if (!rank) return 'Chưa xếp loại';
    const ranks: Record<string, string> = {
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
    return ranks[rank.toUpperCase() as keyof typeof ranks] || rank;
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
          const listRes = await API_Student.getMyEvaluations();
          const evaluations = listRes.data || listRes;
          
          // Use the latest evaluation record (first in the list)
          const latestEval = evaluations[0];
          if (latestEval) {
            const detail = await API_Student.getEvaluationDetail(latestEval.id);
            const detailData = (detail.data || detail) as any;
            const studyData = detailData.sections?.study || {};
            const discData = detailData.sections?.discipline || {};
            const actData = detailData.sections?.activity || {};
            const commData = detailData.sections?.community || {};
            const roleData = detailData.sections?.role || {};

            const totalScore = detailData.totalScore ?? latestEval.totalScore ?? detailData.finalScore ?? detailData.classScore ?? detailData.studentScore;
            const classification = detailData.classification ?? latestEval.classification ?? detailData.rank ?? detailData.rating;

            setResultData({
              semester: detailData.semester && typeof detailData.semester === 'object'
                ? detailData.semester.semester === 'SEMESTER_1' ? 'HK1' : 'HK2'
                : detailData.semester || latestEval.semester || '',
              academicYear: detailData.semester && typeof detailData.semester === 'object'
                ? `${detailData.semester.year - 1}-${detailData.semester.year}`
                : detailData.academicYear || latestEval.academicYear || '',
              scores: {
                academic: detailData.sectionScores?.studyScore ?? studyData.score ?? getStudyScoreNum(studyData.regularScoreLevel, studyData.activities || []),
                discipline: detailData.sectionScores?.disciplineScore ?? discData.score ?? Math.max(0, (discData.baseScore || 0) - getDisciplineDeduction(discData.violations || [])),
                politicalSocial: detailData.sectionScores?.activityScore ?? actData.score ?? getActScoreNum(actData),
                community: detailData.sectionScores?.communityScore ?? commData.score ?? getCommScoreNum(commData),
                leadership: detailData.sectionScores?.roleScore ?? roleData.score ?? getRoleScoreNum(roleData),
                total: totalScore ?? 0,
              },
              rating: getRankText(classification),
              reviewerComments: detailData.note || '',
            });
          } else {
            setResultData(null);
          }
      } catch (err) {
        console.error('Failed to load results:', err);
        setResultData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm text-slate-500">Đang tải kết quả đánh giá...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <AlertCircle className="text-amber-500" size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có kết quả</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Hiện chưa có dữ liệu kết quả rèn luyện được phê duyệt của học kỳ này.
          </p>
        </div>
      </div>
    );
  }

  // All progress bars use indigo — shade determined dynamically in DetailScoresCard
  const scoreBreakdown = [
    { label: 'Ý thức học tập',      icon: BookOpen,   score: resultData.scores.academic,       max: 30, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Chấp hành nội quy',   icon: ShieldAlert, score: resultData.scores.discipline,     max: 25, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Hoạt động CT-XH',     icon: Users,       score: resultData.scores.politicalSocial, max: 20, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Ý thức cộng đồng',    icon: Heart,       score: resultData.scores.community,      max: 15, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Vai trò cán bộ',      icon: Award,       score: resultData.scores.leadership,     max: 10, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Kết quả đánh giá</h1>
        <p className="mt-1 text-sm text-slate-500">Xem điểm rèn luyện và nhận xét chính thức từ Hội đồng.</p>
      </div>

      {/* Banner */}
      <ResultBanner
        semester={resultData.semester}
        academicYear={resultData.academicYear}
        rating={resultData.rating}
        totalScore={resultData.scores.total}
        rankBadgeClass={() => ''}
      />

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        {/* Left: Chi tiết điểm */}
        <DetailScoresCard scoreBreakdown={scoreBreakdown} />

        {/* Right: Nhận xét + Lợi ích */}
        <div className="flex flex-col gap-6">
          <ReviewerCommentsCard reviewerComments={resultData.reviewerComments} />
          <RankBenefitsCard rating={resultData.rating} />
        </div>
      </div>
    </div>
  );
};

export default StudentResults;
