'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar, Eye, Loader2, AlertCircle } from 'lucide-react';
import { API_Student } from '../../api/API_Student';
import EvaluationStatusStepper from '../../components/common/EvaluationStatusStepper';

export const StudentHistory = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL query params on mount
  const initialYear = searchParams.get('year') || 'all';
  const initialSemester = searchParams.get('semester') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [semesterFilter, setSemesterFilter] = useState<string>(initialSemester);
  const [yearFilter, setYearFilter] = useState<string>(initialYear);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const [isChanging, setIsChanging] = useState(false);
  const [pageSize, setPageSize] = useState(4);

  // Dynamic pageSize based on viewport height to fit exactly without scrolling
  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      if (height < 700) {
        setPageSize(2);
      } else if (height < 850) {
        setPageSize(3);
      } else {
        setPageSize(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state changes back to URL query parameters
  const updateUrl = useCallback((year: string, semester: string, page: number) => {
    const params = new URLSearchParams();
    if (year !== 'all') params.set('year', year);
    if (semester !== 'all') params.set('semester', semester);
    if (page > 1) params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  useEffect(() => {
    updateUrl(yearFilter, semesterFilter, currentPage);
  }, [yearFilter, semesterFilter, currentPage, updateUrl]);

  // Sync URL changes back to states (e.g., on back/forward navigation)
  useEffect(() => {
    const year = searchParams.get('year') || 'all';
    const semester = searchParams.get('semester') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    setYearFilter(year);
    setSemesterFilter(semester);
    setCurrentPage(page);
  }, [searchParams]);

  // Fetch evaluations
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken || accessToken === 'mock-access-token') {
          setHistory([
            {
              id: '1',
              status: 'draft',
              studentScore: 85,
              classScore: null,
              finalScore: null,
              rank: 'GOOD',
              submittedAt: null,
              semester: {
                year: 2024,
                semester: 'SEMESTER_1'
              }
            },
            {
              id: '2',
              status: 'finalized',
              studentScore: 88,
              classScore: 88,
              finalScore: 88,
              rank: 'EXCELLENT',
              submittedAt: '2024-05-15T00:00:00.000Z',
              semester: {
                year: 2024,
                semester: 'SEMESTER_2'
              }
            },
            {
              id: '3',
              status: 'finalized',
              studentScore: 82,
              classScore: 82,
              finalScore: 82,
              rank: 'GOOD',
              submittedAt: '2023-12-20T00:00:00.000Z',
              semester: {
                year: 2023,
                semester: 'SEMESTER_1'
              }
            },
            {
              id: '4',
              status: 'finalized',
              studentScore: 79,
              classScore: 79,
              finalScore: 79,
              rank: 'FAIR',
              submittedAt: '2023-05-18T00:00:00.000Z',
              semester: {
                year: 2023,
                semester: 'SEMESTER_2'
              }
            },
            {
              id: '5',
              status: 'finalized',
              studentScore: 75,
              classScore: 75,
              finalScore: 75,
              rank: 'FAIR',
              submittedAt: '2022-12-22T00:00:00.000Z',
              semester: {
                year: 2022,
                semester: 'SEMESTER_1'
              }
            },
            {
              id: '6',
              status: 'finalized',
              studentScore: 91,
              classScore: 91,
              finalScore: 91,
              rank: 'EXCELLENT',
              submittedAt: '2022-05-14T00:00:00.000Z',
              semester: {
                year: 2022,
                semester: 'SEMESTER_2'
              }
            },
            {
              id: '7',
              status: 'finalized',
              studentScore: 84,
              classScore: 84,
              finalScore: 84,
              rank: 'GOOD',
              submittedAt: '2021-12-18T00:00:00.000Z',
              semester: {
                year: 2021,
                semester: 'SEMESTER_1'
              }
            },
            {
              id: '8',
              status: 'finalized',
              studentScore: 68,
              classScore: 68,
              finalScore: 68,
              rank: 'AVERAGE',
              submittedAt: '2021-05-20T00:00:00.000Z',
              semester: {
                year: 2021,
                semester: 'SEMESTER_2'
              }
            },
            {
              id: '9',
              status: 'finalized',
              studentScore: 72,
              classScore: 72,
              finalScore: 72,
              rank: 'FAIR',
              submittedAt: '2020-12-19T00:00:00.000Z',
              semester: {
                year: 2020,
                semester: 'SEMESTER_1'
              }
            },
            {
              id: '10',
              status: 'finalized',
              studentScore: 86,
              classScore: 86,
              finalScore: 86,
              rank: 'GOOD',
              submittedAt: '2020-05-15T00:00:00.000Z',
              semester: {
                year: 2020,
                semester: 'SEMESTER_2'
              }
            }
          ]);
        } else {
          const res = await API_Student.getEvaluations(accessToken);
          const data = res.data || res;
          setHistory(data || []);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Không thể tải danh sách phiếu đánh giá');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter change handlers (resets page to 1)
  const handleSemesterChange = (val: string) => {
    setSemesterFilter(val);
    setCurrentPage(1);
  };

  const handleYearChange = (val: string) => {
    setYearFilter(val);
    setCurrentPage(1);
  };

  const getSemesterCode = (item: any) => {
    const rawSemester = item.semester && typeof item.semester === 'object'
      ? item.semester.semester
      : item.semester;

    if (rawSemester === 'SEMESTER_1' || rawSemester === 'HK1') return 'HK1';
    if (rawSemester === 'SEMESTER_2' || rawSemester === 'HK2') return 'HK2';
    if (rawSemester === 'SUMMER' || rawSemester === 'HKHE') return 'SUMMER';
    return rawSemester || '';
  };

  const getSemesterLabel = (item: any) => {
    const code = getSemesterCode(item);
    if (code === 'HK1') return 'Học kỳ 1';
    if (code === 'HK2') return 'Học kỳ 2';
    if (code === 'SUMMER') return 'Học kỳ hè';
    return 'Học kỳ';
  };

  const getAcademicYear = (item: any) => {
    if (item.semester && typeof item.semester === 'object') {
      if (item.semester.academicYear) return item.semester.academicYear;
      if (typeof item.semester.year === 'number') return `${item.semester.year}-${item.semester.year + 1}`;
      if (item.semester.year) return String(item.semester.year);
    }

    if (item.academicYear) return String(item.academicYear);
    if (typeof item.year === 'number') return `${item.year}-${item.year + 1}`;
    if (item.year) return String(item.year);
    return '';
  };

  const getEvaluationScore = (item: any) => item.totalScore ?? item.finalScore ?? item.classScore ?? item.studentScore ?? 0;

  const getEvaluationRank = (item: any) => item.classification ?? item.rank ?? item.rating ?? null;

  const getAcademicYearStart = (academicYear: string) => {
    const startYear = Number.parseInt(academicYear.split('-')[0] || academicYear, 10);
    return Number.isNaN(startYear) ? 0 : startYear;
  };

  // Simulate a loading indicator during filter or page updates for visual smoothness
  useEffect(() => {
    setIsChanging(true);
    const t = setTimeout(() => setIsChanging(false), 200);
    return () => clearTimeout(t);
  }, [semesterFilter, yearFilter, currentPage, pageSize]);

  // Extract unique academic years dynamically
  const uniqueYears = Array.from(new Set(
    history.map(item => getAcademicYear(item)).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));

  // Filters combined with AND logic
  const filteredHistory = history.filter(item => {
    if (semesterFilter !== 'all') {
      if (getSemesterCode(item) !== semesterFilter) return false;
    }
    if (yearFilter !== 'all') {
      const academicYear = getAcademicYear(item);
      if (academicYear !== yearFilter && String(getAcademicYearStart(academicYear)) !== yearFilter) return false;
    }
    return true;
  });

  // Sorting logic (Year descending, Semester 2 before Semester 1, submission date descending)
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const yearA = getAcademicYearStart(getAcademicYear(a));
    const yearB = getAcademicYearStart(getAcademicYear(b));
    if (yearB !== yearA) return yearB - yearA;

    const semWeight = (s: any) => {
      if (s === 'SUMMER') return 3;
      if (s === 'HK2') return 2;
      if (s === 'HK1') return 1;
      return 0;
    };
    const semA = getSemesterCode(a);
    const semB = getSemesterCode(b);
    if (semWeight(semB) !== semWeight(semA)) {
      return semWeight(semB) - semWeight(semA);
    }

    const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Pagination calculation
  const totalItems = sortedHistory.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedHistory = sortedHistory.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase();
    const badges = {
      draft: { text: 'Nháp', class: 'bg-gray-100 text-gray-700' },
      submitted: { text: 'Đã nộp', class: 'bg-blue-100 text-blue-700' },
      class_approved: { text: 'Lớp/CVHT đã duyệt', class: 'bg-yellow-100 text-yellow-700' },
      finalized: { text: 'Đã phê duyệt', class: 'bg-green-100 text-green-700' },
      rejected: { text: 'Bị trả về', class: 'bg-red-100 text-red-700' },
    };
    return badges[normalizedStatus as keyof typeof badges] || badges.draft;
  };

  const getRankText = (rank: string | null | undefined) => {
    if (!rank) return 'Chưa xếp loại';
    const normalizedRank = String(rank).trim().toUpperCase();
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
    return ranks[normalizedRank as keyof typeof ranks] || rank;
  };

  const getRatingColor = (rank: string | null | undefined) => {
    if (!rank) return 'text-gray-600';
    const r = rank.toUpperCase();
    if (r === 'EXCELLENT' || r === 'XUẤT SẮC') return 'text-green-600';
    if (r === 'GOOD' || r === 'TỐT') return 'text-blue-600';
    if (r === 'FAIR' || r === 'KHÁ') return 'text-purple-600';
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm text-gray-500">Đang tải danh sách phiếu đánh giá...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-5xl mx-auto w-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center gap-3">
          <AlertCircle className="text-red-600" size={40} />
          <h3 className="text-lg font-bold text-red-800">Đã xảy ra lỗi</h3>
          <p className="text-sm text-red-600 max-w-md">{error}</p>
          <button 
            onClick={() => { setLoading(true); setError(''); window.location.reload(); }}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5 max-w-5xl mx-auto w-full flex flex-col min-h-full">
      {/* Vùng trên: Header & Filter Controls Section */}
      <div className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b shrink-0 mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lịch sử đánh giá</h1>
        
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm học</span>
            <select
              value={yearFilter}
              onChange={(e) => handleYearChange(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[32px]"
            >
              <option value="all">Tất cả năm</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Học kỳ</span>
            <select
              value={semesterFilter}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[32px]"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
              <option value="SUMMER">Học kỳ hè</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vùng giữa: Main List Wrapper (Scrollable if item exceeds) */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isChanging ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs text-gray-400">Đang cập nhật danh sách...</p>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center h-full flex flex-col items-center justify-center">
            <Calendar className="mx-auto mb-4 text-gray-300" size={56} />
            <h3 className="text-base font-bold text-gray-900 mb-1">Không có phiếu đánh giá phù hợp</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Vui lòng thử lại bằng cách chọn năm học hoặc học kỳ khác.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
	            {paginatedHistory.map((item) => {
	              const statusBadge = getStatusBadge(item.status);
	              const academicYear = getAcademicYear(item);
	              const semesterLabel = getSemesterLabel(item);
              const totalScore = getEvaluationScore(item);

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 transition hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
	                    <div className="flex items-center gap-3">
	                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
	                        <Calendar className="text-blue-600" size={18} />
	                      </div>
	                      <div>
	                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
	                          {semesterLabel} — Năm học {academicYear}
	                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.submittedAt 
                            ? `Ngày nộp: ${new Date(item.submittedAt).toLocaleDateString('vi-VN')}`
                            : 'Trạng thái: Chưa nộp'}
                        </p>
                      </div>
                    </div>
                    <span className={`self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </div>

	                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-gray-100 items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tổng điểm</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{totalScore}đ</p>
                    </div>
                    <div>
	                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Xếp loại</p>
	                      <p className={`text-xs font-bold mt-0.5 ${getRatingColor(getEvaluationRank(item))}`}>
	                        {getRankText(getEvaluationRank(item))}
	                      </p>
	                    </div>
		                    <div className="flex items-center justify-end col-span-2 sm:col-span-1">
	                      <button
	                        type="button"
	                        onClick={() => router.push(`/student/evaluation?id=${item.id}`)}
	                        className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-300 transition cursor-pointer"
	                      >
	                        <Eye size={12} />
	                        Xem chi tiết
	                      </button>
		                    </div>
	                  </div>
	                  <EvaluationStatusStepper
	                    status={item.status}
	                    statusLabel={item.statusLabel}
	                    steps={item.review?.steps}
	                    compact
	                    className="mt-3 border-t border-gray-100 pt-3"
	                  />
	                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vùng dưới: Pagination Controls (Fixed bottom) */}
      {!isChanging && paginatedHistory.length > 0 && totalPages > 1 && (
        <div className="pt-4 border-t border-gray-100 shrink-0 mt-auto">
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => {
                  if (activePage > 1) {
                    setCurrentPage(activePage - 1);
                  }
                }}
                disabled={activePage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Trang trước
              </button>
              <span className="text-xs text-gray-700 font-semibold self-center">
                Trang {activePage} / {totalPages}
              </span>
              <button
                onClick={() => {
                  if (activePage < totalPages) {
                    setCurrentPage(activePage + 1);
                  }
                }}
                disabled={activePage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Trang sau
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-700">
                  Hiển thị bản ghi <span className="font-bold">{startIndex + 1}</span> đến{' '}
                  <span className="font-bold">{Math.min(startIndex + pageSize, totalItems)}</span> trong tổng số{' '}
                  <span className="font-bold">{totalItems}</span> phiếu
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => {
                      if (activePage > 1) {
                        setCurrentPage(activePage - 1);
                      }
                    }}
                    disabled={activePage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2.5 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="text-xs font-bold px-1 text-gray-700">Trước</span>
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => {
                          setCurrentPage(pNum);
                        }}
                        className={`relative inline-flex items-center px-3.5 py-2 text-xs font-bold cursor-pointer ring-1 ring-inset ring-gray-300 ${
                          activePage === pNum
                            ? 'z-10 bg-blue-600 text-white ring-blue-600'
                            : 'text-gray-900 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      if (activePage < totalPages) {
                        setCurrentPage(activePage + 1);
                      }
                    }}
                    disabled={activePage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2.5 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <span className="text-xs font-bold px-1 text-gray-700">Sau</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
