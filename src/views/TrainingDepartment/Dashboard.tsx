'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Award,
  Users,
  Building2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { API_Admin } from '@/api/API_Admin';
import type { AdminEvaluationItem } from '@/types';
import { toArray } from '@/utils/facultyEvaluationData';

type FacultyStat = {
  id: string;
  name: string;
  totalClasses: number;
  totalStudents: number;
  completedCount: number;
  excellentRate: string;
};

function getFacultyId(item: any): string {
  return item.facultyId || item.faculty?.id || item.class?.major?.facultyId || item.class?.major?.faculty?.id || 'unknown';
}

function getFacultyName(item: any): string {
  return item.facultyName || item.faculty?.name || item.class?.major?.faculty?.name || 'Khoa chưa xác định';
}

function getClassId(item: any): string {
  return item.classId || item.class?.id || 'unknown';
}

function isExcellentOrGood(item: any): boolean {
  const value = String(item.classification || item.rankLabel || item.rank || '').toLowerCase();
  return value.includes('excellent') || value.includes('xuất sắc') || value.includes('good') || value.includes('tốt');
}

function buildFacultyStats(evaluations: AdminEvaluationItem[]): FacultyStat[] {
  const grouped = new Map<string, { name: string; classes: Set<string>; total: number; completed: number; excellentGood: number }>();

  evaluations.forEach((item) => {
    const id = getFacultyId(item);
    const record = grouped.get(id) || { name: getFacultyName(item), classes: new Set<string>(), total: 0, completed: 0, excellentGood: 0 };
    record.classes.add(getClassId(item));
    record.total += 1;
    if (['faculty_approved', 'finalized'].includes(String((item as any).status))) record.completed += 1;
    if (isExcellentOrGood(item)) record.excellentGood += 1;
    grouped.set(id, record);
  });

  return Array.from(grouped.entries()).map(([id, item]) => ({
    id,
    name: item.name,
    totalClasses: item.classes.size,
    totalStudents: item.total,
    completedCount: item.completed,
    excellentRate: item.total > 0 ? `${Math.round((item.excellentGood / item.total) * 100)}%` : '0%',
  }));
}

export function TrainingDeptDashboard() {
  const [evaluations, setEvaluations] = useState<AdminEvaluationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEvaluations = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await API_Admin.getTrainingDepartmentEvaluations({ limit: 500 });
      setEvaluations(toArray<AdminEvaluationItem>(result));
    } catch (err: any) {
      setEvaluations([]);
      setErrorMessage(err?.userMessage || err?.message || 'Không tải được dữ liệu Phòng Đào tạo từ API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvaluations();
  }, [loadEvaluations]);

  const facultyStats = useMemo(() => buildFacultyStats(evaluations), [evaluations]);
  const totalStudents = evaluations.length;
  const completedCount = evaluations.filter((item: any) => ['faculty_approved', 'finalized'].includes(String(item.status))).length;
  const excellentGoodCount = evaluations.filter(isExcellentOrGood).length;
  const excellentGoodRate = totalStudents > 0 ? `${Math.round((excellentGoodCount / totalStudents) * 100)}%` : '0%';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <BarChart3 size={16} /> Phòng Đào Tạo
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê Điểm Rèn Luyện Toàn Trường</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu được lấy trực tiếp từ API Phòng Đào tạo.</p>
        </div>

        <button type="button" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <Download size={16} /> Xuất Báo Cáo Excel
        </button>
      </div>

      {errorMessage && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div><div><p className="text-xs text-gray-500 font-medium">Tổng số phiếu</p><p className="text-2xl font-bold text-gray-900">{totalStudents} Phiếu</p></div></div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={24} /></div><div><p className="text-xs text-gray-500 font-medium">Đã hoàn thành đánh giá</p><p className="text-2xl font-bold text-emerald-600">{completedCount} Phiếu</p></div></div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Award size={24} /></div><div><p className="text-xs text-gray-500 font-medium">Tỷ lệ Xuất sắc / Tốt</p><p className="text-2xl font-bold text-amber-600">{excellentGoodRate}</p></div></div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building2 size={24} /></div><div><p className="text-xs text-gray-500 font-medium">Tổng số Khoa/Ban</p><p className="text-2xl font-bold text-blue-600">{facultyStats.length} Khoa</p></div></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><FileSpreadsheet size={18} className="text-indigo-600" /> Thống kê tiến độ đánh giá theo từng Khoa</h2>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">Dữ liệu API</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase"><th className="py-3.5 px-4">Tên Khoa</th><th className="py-3.5 px-4 text-center">Số Lớp</th><th className="py-3.5 px-4 text-center">Tổng phiếu</th><th className="py-3.5 px-4 text-center">Phiếu đã duyệt</th><th className="py-3.5 px-4 text-center">Tỷ lệ Xuất sắc/Tốt</th><th className="py-3.5 px-4 text-right">Trạng thái</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Đang tải dữ liệu...</td></tr> : facultyStats.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Không có dữ liệu thống kê từ API.</td></tr> : facultyStats.map((f) => (
                <tr key={f.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{f.name}</td><td className="py-3.5 px-4 text-center font-medium">{f.totalClasses} Lớp</td><td className="py-3.5 px-4 text-center font-medium">{f.totalStudents} Phiếu</td><td className="py-3.5 px-4 text-center font-semibold text-emerald-600">{f.completedCount} Phiếu</td><td className="py-3.5 px-4 text-center font-semibold text-indigo-600">{f.excellentRate}</td><td className="py-3.5 px-4 text-right"><span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"><CheckCircle2 size={12} /> Theo API</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
