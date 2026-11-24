'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Download,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { API_Admin } from '@/api/API_Admin';
import { API_Shared } from '@/api/API_Shared';
import { useToast } from '@/components/common/ToastProvider';
import type { AdminEvaluationItem } from '@/types';
import { getUserFriendlyError } from '@/utils/errorHelper';
import { toArray } from '@/utils/facultyEvaluationData';

const PAGE_SIZE = 10;

function formatTerm(form: AdminEvaluationItem) {
  const semester = typeof form.semester === 'string'
    ? form.semester
    : form.semester?.name ?? form.semester?.semester;
  return [semester, form.academicYear].filter(Boolean).join(' · ') || '—';
}

function formatRankToVietnamese(rank?: string | null): string {
  if (!rank) return '';
  const normalized = rank.trim().toLowerCase();
  if (['excellent', 'xuat_sac', 'xuất sắc'].includes(normalized)) return 'Xuất sắc';
  if (['good', 'tot', 'tốt'].includes(normalized)) return 'Tốt';
  if (['fair', 'kha', 'khá'].includes(normalized)) return 'Khá';
  if (['average', 'trung_binh', 'trung bình', 'mid'].includes(normalized)) return 'Trung bình';
  if (['poor', 'weak', 'yeu', 'yếu'].includes(normalized)) return 'Yếu';
  if (['bad', 'kem', 'kém'].includes(normalized)) return 'Kém';
  return rank;
}

function getClassification(form: AdminEvaluationItem) {
  const rawRank = form.classification || (form as any).rank;
  if (rawRank) {
    const vn = formatRankToVietnamese(rawRank);
    if (vn) return vn;
  }
  const score = typeof form.classScore === 'number'
    ? form.classScore
    : typeof form.finalScore === 'number'
      ? form.finalScore
      : typeof (form as any).studentScore === 'number'
        ? (form as any).studentScore
        : null;
  if (score === null || score === undefined) return '—';
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  if (score >= 35) return 'Yếu';
  return 'Kém';
}

function getRankBadgeClass(rank: string) {
  switch (rank) {
    case 'Xuất sắc':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'Tốt':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Khá':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'Trung bình':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'Yếu':
    case 'Kém':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-600';
  }
}

interface ClassGroup {
  id: string;
  code: string;
  name: string;
  totalStudents: number;
  excellentGoodCount: number;
  items: AdminEvaluationItem[];
}

export function FacultyEvaluationPageView({ facultyId }: { facultyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdFromQuery = searchParams.get('classId');
  const toast = useToast();

  const [facultyName, setFacultyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allEvaluations, setAllEvaluations] = useState<AdminEvaluationItem[]>([]);
  const [extraClassStats, setExtraClassStats] = useState<any[]>([]);

  /* ─── State cấp độ: đang xem lớp nào ─── */
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classIdFromQuery);
  const [studentPage, setStudentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (classIdFromQuery) {
      setSelectedClassId(classIdFromQuery);
    }
  }, [classIdFromQuery]);

  const handleSelectClass = (classId: string | null) => {
    setSelectedClassId(classId);
    if (classId) {
      router.replace(`/training_department/faculty/${facultyId}?classId=${classId}`);
    } else {
      router.replace(`/training_department/faculty/${facultyId}`);
    }
  };

  // 1. Fetch overview để lấy tên Khoa
  useEffect(() => {
    let ignore = false;
    API_Admin.getTrainingDepartmentOverview()
      .then((report) => {
        if (ignore) return;
        const matched = report.faculties.find((f) => f.id === facultyId);
        if (matched) {
          setFacultyName(matched.name);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [facultyId]);

  // 2. Fetch toàn bộ phiếu của Khoa & thống kê lớp
  const loadData = useCallback(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    Promise.all([
      API_Admin.getTrainingDepartmentEvaluations({
        facultyId,
        page: 1,
        limit: 1000,
      }),
      API_Shared.getFacultyClassStats(facultyId).catch(() => ({ items: [] })),
    ])
      .then(([evalResponse, statsResponse]) => {
        if (ignore) return;
        setAllEvaluations(evalResponse.items || []);
        setExtraClassStats(toArray<any>(statsResponse));
        if (!facultyName && evalResponse.items?.[0]?.faculty?.name) {
          setFacultyName(evalResponse.items[0].faculty.name);
        }
      })
      .catch((failure) => {
        if (ignore) return;
        setError(getUserFriendlyError(failure, 'Không tải được dữ liệu phiếu của khoa.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [facultyId, facultyName]);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  // Lắng nghe sự kiện xác nhận điểm để tự động cập nhật lại danh sách
  useEffect(() => {
    const handleConfirmed = () => {
      loadData();
    };
    window.addEventListener('evaluation_confirmed', handleConfirmed);
    return () => {
      window.removeEventListener('evaluation_confirmed', handleConfirmed);
    };
  }, [loadData]);

  // 3. Gom nhóm dữ liệu theo từng Lớp
  const classGroups = useMemo<ClassGroup[]>(() => {
    const map = new Map<string, ClassGroup>();

    // Đưa các lớp từ thống kê trước (nếu có)
    extraClassStats.forEach((st) => {
      const cid = String(st.id || st.classId || st.code || '');
      if (cid) {
        map.set(cid, {
          id: cid,
          code: st.classCode || st.code || cid,
          name: st.className || st.name || st.classCode || 'Lớp chưa xác định',
          totalStudents: Number(st.totalStudents ?? st.studentCount) || 0,
          excellentGoodCount: 0,
          items: [],
        });
      }
    });

    // Gom dữ liệu sinh viên vào từng lớp
    allEvaluations.forEach((item) => {
      const cid = String(item.class?.id || (item as any).classId || item.class?.code || 'unknown');
      const ccode = String(item.class?.code || (item.class as any)?.classCode || cid);
      const cname = String(item.class?.name || (item.class as any)?.className || ccode);

      let group = map.get(cid);
      if (!group) {
        // Thử tìm theo classCode
        const existingKey = Array.from(map.keys()).find((k) => map.get(k)?.code === ccode);
        if (existingKey) {
          group = map.get(existingKey)!;
        } else {
          group = {
            id: cid,
            code: ccode,
            name: cname,
            totalStudents: 0,
            excellentGoodCount: 0,
            items: [],
          };
          map.set(cid, group);
        }
      }

      group.items.push(item);
      const rank = getClassification(item);
      if (['Xuất sắc', 'Tốt'].includes(rank)) {
        group.excellentGoodCount += 1;
      }
    });

    // Cập nhật lại totalStudents nếu items > totalStudents
    Array.from(map.values()).forEach((g) => {
      if (g.items.length > g.totalStudents) {
        g.totalStudents = g.items.length;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [allEvaluations, extraClassStats]);

  // Lớp đang được chọn
  const activeClass = useMemo(() => {
    if (!selectedClassId) return null;
    return classGroups.find((g) => g.id === selectedClassId) || null;
  }, [classGroups, selectedClassId]);

  // Danh sách sinh viên của lớp đang chọn (đã phân trang)
  const activeClassStudents = useMemo(() => {
    if (!activeClass) return [];
    return activeClass.items;
  }, [activeClass]);

  const totalClassStudents = activeClassStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalClassStudents / PAGE_SIZE));
  const pagedStudents = useMemo(() => {
    const start = (studentPage - 1) * PAGE_SIZE;
    return activeClassStudents.slice(start, start + PAGE_SIZE);
  }, [activeClassStudents, studentPage]);

  // Reset trang khi đổi lớp
  useEffect(() => {
    setStudentPage(1);
  }, [selectedClassId]);

  // Lọc danh sách lớp theo ô tìm kiếm
  const filteredClassGroups = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return classGroups;
    return classGroups.filter(
      (c) => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    );
  }, [classGroups, searchTerm]);

  // Thống kê toàn khoa
  const facultyTotalStudents = allEvaluations.length;
  const facultyExcellentGood = allEvaluations.filter((item) =>
    ['Xuất sắc', 'Tốt'].includes(getClassification(item))
  ).length;

  /* ─── Xuất Excel cho toàn Khoa ─── */
  const handleExportFacultyExcel = () => {
    if (allEvaluations.length === 0) {
      toast.info('Khoa này chưa có dữ liệu phiếu để xuất Excel.');
      return;
    }
    exportEvaluationsToExcel(
      allEvaluations,
      `Diem_Ren_Luyen_Khoa_${(facultyName || 'Khoa').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      `DANH SÁCH KẾT QUẢ ĐÁNH GIÁ ĐIỂM RÈN LUYỆN - ${facultyName || 'KHOA'}`.toUpperCase()
    );
  };

  /* ─── Xuất Excel cho riêng một Lớp ─── */
  const handleExportClassExcel = (classItem: ClassGroup) => {
    if (classItem.items.length === 0) {
      toast.info(`Lớp ${classItem.code} chưa có dữ liệu sinh viên để xuất Excel.`);
      return;
    }
    exportEvaluationsToExcel(
      classItem.items,
      `Diem_Ren_Luyen_Lop_${classItem.code}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      `DANH SÁCH ĐIỂM RÈN LUYỆN LỚP ${classItem.code} (${classItem.name}) - KHOA ${facultyName || ''}`.toUpperCase()
    );
  };

  const exportEvaluationsToExcel = (
    items: AdminEvaluationItem[],
    fileName: string,
    titleHeader: string
  ) => {
    try {
      setExporting(true);
      const wb = XLSX.utils.book_new();
      const rows: (string | number)[][] = [
        ['HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG'],
        ['PHÂN HIỆU TẠI THÀNH PHỐ ĐÀ NẴNG - PHÒNG ĐÀO TẠO'],
        [],
        [titleHeader],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Tổng số: ${items.length} sinh viên`],
        [],
        [
          'STT',
          'MÃ SINH VIÊN',
          'HỌ VÀ TÊN',
          'LỚP',
          'HỌC KỲ',
          'NĂM HỌC',
          'ĐIỂM SV TỰ ĐÁNH GIÁ',
          'ĐIỂM LỚP ĐÁNH GIÁ',
          'ĐIỂM KHOA ĐÁNH GIÁ',
          'ĐIỂM PĐT ĐÁNH GIÁ',
          'XẾP LOẠI',
        ],
      ];

      items.forEach((item, idx) => {
        const selfScore =
          typeof (item as any).studentScore === 'number'
            ? (item as any).studentScore
            : typeof (item as any).selfScore === 'number'
            ? (item as any).selfScore
            : typeof (item as any).totalScore === 'number'
            ? (item as any).totalScore
            : '—';
        const classScore = typeof item.classScore === 'number' ? item.classScore : '—';
        const facultyScore = (item as any).facultyScore ?? classScore;
        const finalScore = typeof item.finalScore === 'number' ? item.finalScore : classScore;
        const studentCode =
          (item.student as any)?.studentCode || (item.student as any)?.code || '—';
        const semester =
          typeof item.semester === 'string'
            ? item.semester
            : item.semester?.name ?? item.semester?.semester ?? '—';
        const academicYear = item.academicYear || '—';
        const rank = getClassification(item);

        rows.push([
          idx + 1,
          studentCode,
          item.student?.fullName || '—',
          item.class?.code || '—',
          semester,
          academicYear,
          selfScore,
          classScore,
          facultyScore,
          finalScore,
          rank,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 28 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Ket_Qua_Ren_Luyen');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(
        new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName
      );
      toast.success('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Lỗi xuất excel', err);
      toast.error('Không thể xuất file Excel. Vui lòng thử lại!');
    } finally {
      setExporting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
   * CẤP 2: DANH SÁCH CÁC LỚP THUỘC KHOA
   * ═══════════════════════════════════════════════════════════════════ */
  if (!selectedClassId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Nút quay lại & Header Khoa */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push('/training_department')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:underline cursor-pointer w-fit transition-all"
          >
            <ArrowLeft size={16} /> Quay lại Báo cáo & Thống kê
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-secondary">
                <Building2 size={16} /> {facultyName || 'Khoa'}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Danh Sách Các Lớp Thuộc Khoa
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Chọn một lớp bên dưới để xem chi tiết bảng điểm đánh giá rèn luyện của sinh viên lớp đó.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700">
                <Users size={16} className="text-brand-secondary" />
                <span>Tổng: {facultyTotalStudents} sinh viên</span>
              </div>

              <button
                type="button"
                disabled={exporting || loading || facultyTotalStudents === 0}
                onClick={handleExportFacultyExcel}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? 'Đang xuất...' : 'Xuất Excel Toàn Khoa'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Thẻ thống kê 3 cột */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng số lớp thuộc Khoa</p>
              <p className="text-2xl font-bold text-gray-900">{classGroups.length} Lớp</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng sinh viên toàn Khoa</p>
              <p className="text-2xl font-bold text-gray-900">{facultyTotalStudents} SV</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tỷ lệ Xuất sắc / Tốt</p>
              <p className="text-2xl font-bold text-amber-600">
                {facultyTotalStudents > 0
                  ? `${Math.round((facultyExcellentGood / facultyTotalStudents) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Bảng danh sách các lớp */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-secondary" /> Danh sách các lớp ({classGroups.length})
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã lớp, tên lớp..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-center w-12">STT</th>
                  <th className="px-4 py-3 w-36">Mã lớp</th>
                  <th className="px-4 py-3">Tên lớp</th>
                  <th className="px-4 py-3 text-center w-32">Sĩ số (SV)</th>
                  <th className="px-4 py-3 text-center w-40">Tỷ lệ Xuất sắc/Tốt</th>
                  <th className="px-4 py-3 text-center w-64">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin text-brand-primary" />
                        <span>Đang tải danh sách các lớp thuộc Khoa...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClassGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      {classGroups.length === 0 ? 'Khoa chưa có lớp nào.' : 'Không tìm thấy lớp phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  filteredClassGroups.map((group, index) => {
                    const ratio =
                      group.items.length > 0
                        ? `${Math.round((group.excellentGoodCount / group.items.length) * 100)}%`
                        : '0%';

                    return (
                      <tr key={group.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-3.5 text-center text-gray-500 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-800">{group.code}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{group.name}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                          {group.totalStudents} SV
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {ratio} ({group.excellentGoodCount} SV)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Nút Xem chi tiết lớp */}
                            <button
                              type="button"
                              onClick={() => handleSelectClass(group.id)}
                              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xs"
                            >
                              <Eye size={14} /> Xem chi tiết
                            </button>

                            {/* Nút Xuất Excel Lớp */}
                            <button
                              type="button"
                              onClick={() => handleExportClassExcel(group)}
                              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-xs"
                              title={`Xuất Excel danh sách lớp ${group.code}`}
                            >
                              <Download size={13} /> Xuất Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
   * CẤP 3: BẢNG ĐIỂM ĐÁNH GIÁ SINH VIÊN CỦA LỚP ĐƯỢC CHỌN
   * ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header & Nút Quay lại danh sách lớp */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSelectClass(null)}
          className="group inline-flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600 transition hover:text-brand-secondary"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại danh sách lớp
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-secondary">
              <Building2 size={14} />
              <span>{facultyName || 'Khoa'}</span>
              <span className="text-gray-300">•</span>
              <GraduationCap size={14} />
              <span>Mã lớp: <strong className="font-mono text-gray-900">{activeClass?.code}</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Bảng Điểm Rèn Luyện — {activeClass?.name?.toLowerCase().startsWith('lớp') ? activeClass.name : `Lớp ${activeClass?.name || activeClass?.code || ''}`}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <Users size={12} /> {totalClassStudents} sinh viên
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            {/* Dropdown đổi nhanh lớp */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Đổi lớp:</span>
              <select
                value={selectedClassId || ''}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:border-brand-primary focus:outline-none cursor-pointer"
              >
                {classGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} — {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Xuất Excel */}
            {activeClass && (
              <button
                type="button"
                disabled={exporting || totalClassStudents === 0}
                onClick={() => handleExportClassExcel(activeClass)}
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Xuất Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Main Table Sinh viên của Lớp */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-brand-secondary" /> Bảng điểm sinh viên lớp {activeClass?.code}
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Tổng cộng: <strong>{totalClassStudents}</strong> sinh viên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-center w-12">STT</th>
                <th className="px-4 py-3">Mã SV</th>
                <th className="px-4 py-3">Sinh viên</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Học kỳ</th>
                <th className="px-4 py-3 text-center">Điểm SV tự đánh giá</th>
                <th className="px-4 py-3 text-center">Điểm lớp đánh giá</th>
                <th className="px-4 py-3 text-center">Điểm Khoa đánh giá</th>
                <th className="px-4 py-3 text-center">Điểm PĐT đánh giá</th>
                <th className="px-4 py-3 text-center">Xếp loại</th>
                <th className="px-4 py-3 text-center w-36 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    Lớp này chưa có phiếu đánh giá nào được chuyển lên.
                  </td>
                </tr>
              ) : (
                pagedStudents.map((form, index) => {
                  const rowIndex = (studentPage - 1) * PAGE_SIZE + index + 1;
                  const selfScore =
                    typeof (form as any).studentScore === 'number'
                      ? (form as any).studentScore
                      : typeof (form as any).selfScore === 'number'
                      ? (form as any).selfScore
                      : typeof (form as any).totalScore === 'number'
                      ? (form as any).totalScore
                      : '—';
                  const classScore = typeof form.classScore === 'number' ? form.classScore : '—';
                  const facultyScore = (form as any).facultyScore ?? classScore;
                  const finalScore = typeof form.finalScore === 'number' ? form.finalScore : classScore;
                  const classId = form.class?.id || (form as any).classId || activeClass?.id || 'class';
                  const studentCode =
                    (form.student as any)?.studentCode || (form.student as any)?.code || '—';
                  const rank = getClassification(form);

                  return (
                    <tr key={form.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">{rowIndex}</td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-700 whitespace-nowrap">
                        {studentCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{form.student?.fullName ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{form.class?.code ?? activeClass?.code ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatTerm(form)}</td>
                      <td className="px-4 py-3 text-center font-bold text-gray-900">{selfScore}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600">{classScore}</td>
                      <td className="px-4 py-3 text-center font-bold text-purple-600">{facultyScore}</td>
                      <td className="px-4 py-3 text-center font-bold text-teal-600">{finalScore}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRankBadgeClass(rank)}`}>
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => router.push(`/training_department/${classId}/${form.id}`)}
                          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xs active:scale-95"
                        >
                          <Eye size={14} /> Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalClassStudents > 0 && (
          <nav aria-label="Phân trang phiếu đánh giá lớp" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
            <span className="text-xs text-gray-500">
              Hiển thị {(studentPage - 1) * PAGE_SIZE + 1}–{Math.min(studentPage * PAGE_SIZE, totalClassStudents)} trong tổng số {totalClassStudents} sinh viên
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={studentPage <= 1}
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Trước
              </button>
              <span className="text-xs font-medium text-gray-600">
                Trang {studentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={studentPage >= totalPages}
                onClick={() => setStudentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Sau
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

export default FacultyEvaluationPageView;
