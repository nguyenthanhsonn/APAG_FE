'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Award,
  Users,
  Building2,
  FileSpreadsheet,
  Download,
  GraduationCap,
  Eye,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { API_Admin, type TrainingDepartmentFacultyStat } from '@/api/API_Admin';
import { useToast } from '@/components/common/ToastProvider';
import { getUserFriendlyError } from '@/utils/errorHelper';

function percent(count: number, total: number) {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : '0%';
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

function getRankFromScore(score: number | string): string {
  if (typeof score !== 'number') return '—';
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  if (score >= 35) return 'Yếu';
  return 'Kém';
}

export function TrainingDeptDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [facultyStats, setFacultyStats] = useState<TrainingDepartmentFacultyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    API_Admin.getTrainingDepartmentOverview()
      .then((report) => {
        if (!ignore) setFacultyStats(report.faculties);
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(getUserFriendlyError(error, 'Không tải được dữ liệu Phòng Đào tạo.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const pendingCount = facultyStats.reduce((total, faculty) => total + faculty.pendingCount, 0);
  const completedCount = facultyStats.reduce((total, faculty) => total + faculty.completedCount, 0);
  const totalForms = pendingCount + completedCount;
  const totalClasses = facultyStats.reduce((total, faculty) => total + faculty.totalClasses, 0);
  const excellentGoodCount = facultyStats.reduce((total, faculty) => total + faculty.excellentGoodCount, 0);

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      // Thử gọi backend report export
      let blob: Blob | null = null;
      try {
        blob = await API_Admin.exportReportExcel();
      } catch (e) {
        console.warn('Backend exportReportExcel not available, generating excel on client:', e);
      }

      if (blob && blob.size > 0) {
        saveAs(blob, `Bao_Cao_Diem_Ren_Luyen_Toan_Truong_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Xuất file Excel thành công!');
        return;
      }

      // Client-side XLSX generation
      const wb = XLSX.utils.book_new();

      // Sheet 1: Thống kê Khoa
      const facultyRows: (string | number)[][] = [
        ['HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG'],
        ['PHÂN HIỆU TẠI THÀNH PHỐ ĐÀ NẴNG - PHÒNG ĐÀO TẠO'],
        [],
        ['BÁO CÁO THỐNG KÊ TIẾN ĐỘ VÀ KẾT QUẢ ĐÁNH GIÁ ĐIỂM RÈN LUYỆN TOÀN TRƯỜNG'],
        [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        ['STT', 'TÊN KHOA', 'SỐ LỚP', 'TỔNG SỐ PHIẾU', 'TỶ LỆ XUẤT SẮC / TỐT'],
      ];

      facultyStats.forEach((fac, idx) => {
        const total = fac.pendingCount + fac.completedCount;
        facultyRows.push([
          idx + 1,
          fac.name,
          fac.totalClasses,
          total,
          percent(fac.excellentGoodCount, total),
        ]);
      });

      facultyRows.push([
        '',
        'TỔNG CỘNG',
        totalClasses,
        totalForms,
        percent(excellentGoodCount, totalForms),
      ]);

      const wsFaculty = XLSX.utils.aoa_to_sheet(facultyRows);
      wsFaculty['!cols'] = [
        { wch: 6 },
        { wch: 35 },
        { wch: 12 },
        { wch: 16 },
        { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, wsFaculty, 'Thong_Ke_Khoa');

      // Sheet 2: Danh sách chi tiết sinh viên toàn trường
      try {
        const evalsRes = await API_Admin.getTrainingDepartmentEvaluations({ limit: 1000 });
        const items = evalsRes.items || [];
        if (items.length > 0) {
          const detailRows: (string | number)[][] = [
            [
              'STT',
              'MÃ SINH VIÊN',
              'HỌ VÀ TÊN',
              'LỚP',
              'KHOA',
              'HỌC KỲ',
              'NĂM HỌC',
              'ĐIỂM SV TỰ CHẤM',
              'ĐIỂM LỚP CHẤM',
              'ĐIỂM KHOA CHẤM',
              'ĐIỂM PĐT CHẤM (ĐIỂM CHÍNH THỨC)',
              'XẾP LOẠI',
            ],
          ];

          items.forEach((item, index) => {
            const selfScore = typeof (item as any).studentScore === 'number'
              ? (item as any).studentScore
              : typeof (item as any).selfScore === 'number'
                ? (item as any).selfScore
                : typeof (item as any).totalScore === 'number'
                  ? (item as any).totalScore
                  : '—';
            const classScore = typeof item.classScore === 'number'
              ? item.classScore
              : '—';
            const facultyScore = (item as any).facultyScore ?? classScore;
            const finalScore = typeof item.finalScore === 'number' ? item.finalScore : classScore;
            const studentCode =
              (item.student as any)?.studentCode ||
              (item.student as any)?.code ||
              '—';
            const semester = typeof item.semester === 'string'
              ? item.semester
              : item.semester?.name ?? item.semester?.semester ?? '—';
            const academicYear = item.academicYear || '—';
            const rank = formatRankToVietnamese(item.classification || (item as any).rank) || getRankFromScore(finalScore);

            detailRows.push([
              index + 1,
              studentCode,
              item.student?.fullName || '—',
              item.class?.code || '—',
              item.faculty?.name || '—',
              semester,
              academicYear,
              selfScore,
              classScore,
              facultyScore,
              finalScore,
              rank,
            ]);
          });

          const wsDetails = XLSX.utils.aoa_to_sheet(detailRows);
          wsDetails['!cols'] = [
            { wch: 6 },
            { wch: 16 },
            { wch: 25 },
            { wch: 14 },
            { wch: 30 },
            { wch: 12 },
            { wch: 14 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 25 },
            { wch: 15 },
          ];
          XLSX.utils.book_append_sheet(wb, wsDetails, 'Danh_Sach_Sinh_Vien');
        }
      } catch (err) {
        console.warn('Could not load student evaluations list for sheet 2:', err);
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(
        new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Bao_Cao_Diem_Ren_Luyen_Toan_Truong_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Error exporting excel', err);
      toast.error('Không thể xuất file Excel. Vui lòng thử lại!');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-secondary">
            <BarChart3 size={16} /> Phòng Đào Tạo
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê Điểm Rèn Luyện Toàn Trường</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tiến độ và xem kết quả đánh giá điểm rèn luyện của các Khoa.
          </p>
        </div>

        <button
          type="button"
          disabled={exporting || loading}
          onClick={handleExportExcel}
          className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 sm:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'Đang xuất báo cáo...' : 'Xuất Báo Cáo Excel'}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Thẻ thống kê 4 cột gọn gàng, không có cột duyệt */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-brand-secondary/10 text-brand-secondary rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số phiếu</p>
            <p className="text-2xl font-bold text-gray-900">{totalForms} Phiếu</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số Khoa/Ban</p>
            <p className="text-2xl font-bold text-gray-900">{facultyStats.length} Khoa</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số lớp</p>
            <p className="text-2xl font-bold text-gray-900">{totalClasses} Lớp</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tỷ lệ Xuất sắc / Tốt</p>
            <p className="text-2xl font-bold text-amber-600">{percent(excellentGoodCount, totalForms)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-brand-secondary" /> Thống kê tiến độ đánh giá theo từng Khoa
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3.5">Tên khoa</th>
                <th className="px-4 py-3.5 text-center">Số lớp</th>
                <th className="px-4 py-3.5 text-center">Tổng phiếu</th>
                <th className="px-4 py-3.5 text-center">Tỷ lệ Xuất sắc/Tốt</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || facultyStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    {loading
                      ? 'Đang tải dữ liệu…'
                      : errorMessage
                        ? 'Không tải được thống kê.'
                        : 'Chưa có phiếu chuyển lên Phòng Đào tạo.'}
                  </td>
                </tr>
              ) : (
                facultyStats.map((faculty) => {
                  const total = faculty.pendingCount + faculty.completedCount;
                  return (
                    <tr key={faculty.id} className="transition-colors hover:bg-brand-secondary/5">
                      <td className="px-4 py-3.5 font-bold text-gray-900">{faculty.name}</td>
                      <td className="px-4 py-3.5 text-center">{faculty.totalClasses}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-gray-900">{total}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-brand-secondary">
                        {percent(faculty.excellentGoodCount, total)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => router.push(`/training_department/faculty/${faculty.id}`)}
                          aria-label={`Xem chi tiết ${faculty.name}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-secondary shadow-2xs transition hover:bg-gray-50 hover:text-red-700"
                        >
                          <Eye size={15} /> Xem chi tiết
                        </button>
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
