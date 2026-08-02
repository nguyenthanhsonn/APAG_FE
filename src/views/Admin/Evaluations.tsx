'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, Eye, Loader2, Search, ShieldCheck } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import EvaluationStatusStepper from '../../components/common/EvaluationStatusStepper';
import { useToast } from '../../components/common/ToastProvider';
import type { AdminClass, AdminFaculty, AdminSemester, EvaluationRow, PagedResult } from '../../types';
import { getUserFriendlyError, toArray } from '../../utils/adminData';

const normalizeStatus = (status?: string) => String(status || '').toLowerCase();

const statusConfig = {
  draft: { label: 'Đang điền', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Chờ lớp duyệt', className: 'bg-yellow-100 text-yellow-700' },
  class_approved: { label: 'Chờ quản trị viên phê duyệt', className: 'bg-blue-100 text-blue-700' },
  finalized: { label: 'Đã hoàn tất', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Bị trả về', className: 'bg-red-100 text-red-700' },
} as const;

const rankConfig = {
  excellent: { label: 'Xuất sắc', className: 'bg-emerald-100 text-emerald-700' },
  good: { label: 'Tốt', className: 'bg-blue-100 text-blue-700' },
  fair: { label: 'Khá', className: 'bg-purple-100 text-purple-700' },
  average: { label: 'Trung bình', className: 'bg-amber-100 text-amber-700' },
  weak: { label: 'Yếu', className: 'bg-orange-100 text-orange-700' },
  poor: { label: 'Kém', className: 'bg-red-100 text-red-700' },
} as const;

function getRankMeta(rank?: string | null) {
  const normalized = String(rank || '').trim().toLowerCase();
  const legacyMap: Record<string, keyof typeof rankConfig> = {
    excellent: 'excellent',
    'xuất sắc': 'excellent',
    good: 'good',
    'tốt': 'good',
    fair: 'fair',
    'khá': 'fair',
    average: 'average',
    'trung bình': 'average',
    weak: 'weak',
    'yếu': 'weak',
    poor: 'poor',
    'kém': 'poor',
  };
  const key = legacyMap[normalized];

  return key ? rankConfig[key] : { label: rank || 'Chưa xếp loại', className: 'bg-gray-100 text-gray-700' };
}

function unwrapPaged<T>(response: any): PagedResult<T> {
  const data = response?.data || response;
  const container = Array.isArray(data) ? { items: data } : data;
  const items = toArray<T>(container);

  return {
    items,
    page: Number(container?.page || 1),
    limit: Number(container?.limit || items.length || 20),
    total: Number(container?.total ?? items.length),
  };
}

function mapEvaluationRow(item: any): EvaluationRow {
  const student = item.student || item.user || item.studentUser || {};
  const classInfo = item.class || item.studentClass || item.classInfo || item.student?.class || {};
  const faculty = item.faculty || classInfo.faculty || {};
  const classScore = item.classScore ?? item.review?.classScore ?? null;
  const rawStatus = item.status || 'class_approved';
  const status = classScore !== null && normalizeStatus(rawStatus) === 'submitted' ? 'class_approved' : rawStatus;

  return {
    ...item,
    id: item.id,
    studentId: item.studentId || item.student?.id || '',
    studentName: item.studentName || student.fullName || item.fullName || '—',
    className: item.className || classInfo.code || classInfo.name || item.classCode || '—',
    classId: item.classId || classInfo.id || classInfo.classId,
    facultyId: item.facultyId || faculty.id || faculty.facultyId,
    classScore: classScore === null ? null : Number(classScore),
    finalScore: item.finalScore ?? null,
    classification: item.classification ?? item.rank ?? null,
    semester: item.semester,
    academicYear: item.academicYear,
    status,
    statusLabel: status === 'class_approved' ? 'Chờ quản trị viên phê duyệt' : item.statusLabel,
  };
}

function getSemesterLabel(semester: AdminSemester) {
  const semesterName = semester.semesterName || semester.name || semester.semester;
  return `${semesterName} ${semester.academicYear}`.trim();
}

export function AdminEvaluations() {
  const toast = useToast();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [faculties, setFaculties] = useState<AdminFaculty[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [semesters, setSemesters] = useState<AdminSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [keyword, setKeyword] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [classId, setClassId] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRow | null>(null);
  const [confirmMode, setConfirmMode] = useState<'selected' | 'all' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const selectedSemester = useMemo(
    () => semesters.find((item) => item.id === semesterFilter),
    [semesterFilter, semesters]
  );

  const loadFilters = useCallback(async () => {
    try {
      const [facultyResult, classResult, semesterResult] = await Promise.all([
        API_Admin.getMetadataFaculties(),
        API_Admin.getClasses(),
        API_Admin.getSemesters({ page: 1, limit: 100 }),
      ]);

      setFaculties(toArray<AdminFaculty>(facultyResult as any));
      setClasses(toArray<AdminClass>(classResult as any));
      setSemesters(toArray<AdminSemester>(semesterResult as any));
    } catch {
      toast.error('Không tải được bộ lọc khoa/lớp/học kỳ.');
    }
  }, [toast]);

  const loadEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await API_Admin.getAdminEvaluations({
        page,
        limit: pageSize,
        keyword: keyword.trim() || undefined,
        facultyId: facultyId || undefined,
        classId: classId || undefined,
        semester: selectedSemester?.semester,
        academicYear: selectedSemester?.academicYear,
      });
      const paged = unwrapPaged<any>(response);
      setEvaluations(paged.items.map(mapEvaluationRow));
      setTotalFiltered(paged.total);
      setSelectedIds([]);
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách phiếu chờ duyệt. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  }, [classId, facultyId, keyword, page, pageSize, selectedSemester]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [classId, facultyId, keyword, pageSize, semesterFilter]);

  const classesInFaculty = useMemo(
    () => classes.filter((item) => !facultyId || item.facultyId === facultyId || item.faculty?.id === facultyId || item.major?.facultyId === facultyId),
    [classes, facultyId]
  );

  const visibleRows = evaluations;

  const selectedRows = useMemo(
    () => visibleRows.filter((item) => selectedIds.includes(item.id)),
    [selectedIds, visibleRows]
  );

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const approveAllCount = totalFiltered;
  const allVisibleSelected = visibleRows.length > 0 && selectedIds.length === visibleRows.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < visibleRows.length;

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleRows.map((item) => item.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openFinalizeModal = (evaluation: EvaluationRow) => {
    setSelectedEvaluation(evaluation);
  };

  const closeFinalizeModal = () => {
    if (submitting) return;
    setSelectedEvaluation(null);
  };

  const finalizeSelectedEvaluations = async (rows: EvaluationRow[]) => {
    if (rows.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phiếu cần phê duyệt.');
      return;
    }

    try {
      setSubmitting(true);
      await API_Admin.bulkFinalizeEvaluations({ evaluationIds: rows.map((item) => item.id) });
      toast.success(`Đã phê duyệt ${rows.length} phiếu đánh giá.`);
      setConfirmMode(null);
      await loadEvaluations();
    } catch (err) {
      toast.error(getUserFriendlyError(err, 'Không thể phê duyệt hàng loạt. Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedEvaluation) return;

    try {
      setSubmitting(true);
      await API_Admin.finalizeEvaluation(selectedEvaluation.id, {});
      toast.success('Đã phê duyệt phiếu đánh giá.');
      closeFinalizeModal();
      await loadEvaluations();
    } catch (err) {
      toast.error(getUserFriendlyError(err, 'Không thể phê duyệt phiếu. Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBulk = async () => {
    if (confirmMode === 'selected') {
      await finalizeSelectedEvaluations(selectedRows);
      return;
    }

    try {
      setSubmitting(true);
      await API_Admin.finalizeEvaluationsByFilter({
        semesterId: semesterFilter || undefined,
        facultyId: facultyId || undefined,
        classId: classId || undefined,
        confirmLargeAction: approveAllCount > 500 ? true : undefined,
      });
      toast.success(`Đã phê duyệt ${approveAllCount.toLocaleString('vi-VN')} phiếu đánh giá.`);
      setConfirmMode(null);
      await loadEvaluations();
    } catch (err) {
      toast.error(getUserFriendlyError(err, 'Không thể phê duyệt toàn bộ danh sách đang lọc.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Duyệt đánh giá rèn luyện</h1>
          <p className="mt-1 text-sm font-medium text-[#868E96]">Các phiếu đã được Lớp/CVHT duyệt và đang chờ quản trị viên phê duyệt cuối.</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BarChart3 size={20} /></span>
            <div>
              <p className="text-xs font-bold uppercase text-[#868E96]">Tổng</p>
              <p className="text-2xl font-bold text-[#1A1B1E]">{totalFiltered.toLocaleString('vi-VN')}</p>
              <p className="text-xs font-semibold text-[#868E96]">phiếu chờ duyệt</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_220px_220px_240px] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" size={18} />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm sinh viên, lớp..."
              className="h-11 w-full rounded-xl border border-[#DEE2E6] bg-white py-2.5 pl-10 pr-3 text-sm text-[#1A1B1E] outline-none focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/20"
            />
          </div>

          <select
            value={facultyId}
            onChange={(event) => {
              setFacultyId(event.target.value);
              setClassId('');
            }}
            className="h-11 rounded-xl border border-[#DEE2E6] bg-white px-3 text-sm font-semibold text-[#495057] outline-none focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/20"
          >
            <option value="">Tất cả khoa</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="h-11 rounded-xl border border-[#DEE2E6] bg-white px-3 text-sm font-semibold text-[#495057] outline-none focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/20"
          >
            <option value="">Tất cả lớp</option>
            {classesInFaculty.map((item) => (
              <option key={item.id} value={item.id}>{item.code || item.name}</option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            className="h-11 rounded-xl border border-[#DEE2E6] bg-white px-3 text-sm font-semibold text-[#495057] outline-none focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/20"
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>{getSemesterLabel(semester)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-[#495057]">Đã chọn: <span className="text-[#0B3A82]">{selectedIds.length}</span></p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setConfirmMode('selected')}
            disabled={selectedIds.length === 0 || submitting}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0B3A82] px-4 text-sm font-bold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Phê duyệt đã chọn
          </button>
          <button
            type="button"
            onClick={() => setConfirmMode('all')}
            disabled={approveAllCount === 0 || submitting}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Phê duyệt tất cả {approveAllCount.toLocaleString('vi-VN')} phiếu
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex min-h-[420px] flex-col rounded-xl border border-[#E9ECEF] bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-2.5 p-6">
            <Loader2 className="animate-spin text-[#3B5BDB]" size={34} />
            <p className="text-sm font-semibold text-[#868E96]">Đang tải danh sách phiếu chờ duyệt...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              <label className="flex items-center gap-2 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-3 text-sm font-bold text-[#495057]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(node) => {
                    if (node) node.indeterminate = isIndeterminate;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[#CED4DA]"
                />
                Chọn tất cả phiếu đang hiển thị
              </label>

              {visibleRows.map((row) => {
                const config = statusConfig[normalizeStatus(row.status) as keyof typeof statusConfig] || statusConfig.class_approved;
                const rank = getRankMeta(row.classification);

                return (
                  <div key={row.id} className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="mt-1 h-4 w-4 rounded border-[#CED4DA]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-[#1A1B1E]">{row.studentName}</p>
                        <p className="mt-1 font-mono text-sm font-bold text-[#3B5BDB]">{row.className}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}>{config.label}</span>
                    </div>

	                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#F8F9FA] p-3">
                        <p className="text-xs font-bold uppercase text-[#868E96]">Điểm lớp</p>
                        <p className="mt-1 text-xl font-bold text-[#0B3A82]">{row.classScore ?? '—'}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8F9FA] p-3">
                        <p className="text-xs font-bold uppercase text-[#868E96]">Xếp loại</p>
                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${rank.className}`}>{rank.label}</span>
                      </div>
	                    </div>
	                    <EvaluationStatusStepper status={row.status} statusLabel={row.statusLabel} compact className="mt-4" />

	                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openFinalizeModal(row)}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#DEE2E6] bg-white px-3 text-sm font-bold text-[#495057] transition hover:bg-[#F8F9FA]"
                      >
                        <Eye size={15} />
                        Xem
                      </button>
                      <button
                        type="button"
                        onClick={() => openFinalizeModal(row)}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0B3A82] px-3 text-sm font-bold text-white transition hover:bg-[#104E92]"
                      >
                        <CheckCircle2 size={15} />
                        Duyệt
                      </button>
                    </div>
                  </div>
                );
              })}

              {visibleRows.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#DEE2E6] px-4 py-12 text-center text-sm font-semibold text-[#868E96]">
                  Không có phiếu nào đang chờ quản trị viên phê duyệt
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA]">
                    <th className="w-12 border-b border-[#E9ECEF] px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(node) => {
                          if (node) node.indeterminate = isIndeterminate;
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[#CED4DA]"
                      />
                    </th>
                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Sinh viên</th>
                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Lớp</th>
                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Điểm (Lớp duyệt)</th>
                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Xếp loại</th>
	                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Trạng thái</th>
	                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Tiến trình</th>
	                    <th className="border-b border-[#E9ECEF] px-4 py-4 text-left font-bold text-[#495057]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
	                  {visibleRows.map((row) => {
	                    const config = statusConfig[normalizeStatus(row.status) as keyof typeof statusConfig] || statusConfig.class_approved;
	                    const rank = getRankMeta(row.classification);

	                    return (
                      <tr key={row.id} className="transition hover:bg-[#F8F9FA]">
                        <td className="border-b border-[#E9ECEF] px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleSelectRow(row.id)}
                            className="h-4 w-4 rounded border-[#CED4DA]"
                          />
                        </td>
                        <td className="border-b border-[#E9ECEF] px-4 py-4 font-bold text-[#1A1B1E]">{row.studentName}</td>
                        <td className="border-b border-[#E9ECEF] px-4 py-4 font-mono text-sm font-bold text-[#3B5BDB]">{row.className}</td>
                        <td className="border-b border-[#E9ECEF] px-4 py-4 font-bold text-[#1A1B1E]">{row.classScore ?? '—'}</td>
	                        <td className="border-b border-[#E9ECEF] px-4 py-4">
	                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${rank.className}`}>{rank.label}</span>
	                        </td>
	                        <td className="border-b border-[#E9ECEF] px-4 py-4">
	                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${config.className}`}>{config.label}</span>
	                        </td>
	                        <td className="border-b border-[#E9ECEF] px-4 py-4">
	                          <EvaluationStatusStepper status={row.status} statusLabel={row.statusLabel} compact />
	                        </td>
	                        <td className="border-b border-[#E9ECEF] px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openFinalizeModal(row)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-xs font-bold text-[#495057] transition hover:bg-[#F8F9FA]"
                            >
                              <Eye size={14} />
                              Xem
                            </button>
                            <button
                              type="button"
                              onClick={() => openFinalizeModal(row)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0B3A82] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#104E92]"
                            >
                              <CheckCircle2 size={14} />
                              Duyệt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {visibleRows.length === 0 && (
                    <tr>
	                      <td colSpan={8} className="border-b border-[#E9ECEF] px-4 py-16 text-center text-sm font-semibold text-[#868E96]">
                        Không có phiếu nào đang chờ quản trị viên phê duyệt
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-[#F1F3F5] px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-[#DEE2E6] bg-white px-3 text-sm font-semibold text-[#495057] md:h-9 md:w-auto"
              >
                <option value={20}>Hiển thị 20/trang</option>
                <option value={50}>Hiển thị 50/trang</option>
              </select>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:flex md:justify-center">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  className="h-10 rounded-lg border border-[#DEE2E6] px-3 text-sm font-bold text-[#495057] disabled:cursor-not-allowed disabled:opacity-40 md:h-9"
                >
                  Trước
                </button>
                <span className="rounded-lg border border-[#DEE2E6] px-3 py-2 text-center text-sm font-bold text-[#1A1B1E]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="h-10 rounded-lg border border-[#DEE2E6] px-3 text-sm font-bold text-[#495057] disabled:cursor-not-allowed disabled:opacity-40 md:h-9"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[#1A1B1E]">Phê duyệt phiếu đánh giá</h2>
            <p className="mt-1 text-sm font-medium text-[#868E96]">{selectedEvaluation.studentName} - {selectedEvaluation.className}</p>

	            <div className="mt-5 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
	              <p className="text-xs font-bold uppercase text-[#868E96]">Điểm lớp đã duyệt</p>
	              <p className="mt-1 text-3xl font-bold text-[#0B3A82]">{selectedEvaluation.classScore ?? '—'}</p>
	              <p className="mt-2 text-sm font-semibold text-[#495057]">
	                Xếp loại:{' '}
	                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getRankMeta(selectedEvaluation.classification).className}`}>
	                  {getRankMeta(selectedEvaluation.classification).label}
	                </span>
	              </p>
	            </div>
	            <EvaluationStatusStepper
	              status={selectedEvaluation.status}
	              statusLabel={selectedEvaluation.statusLabel}
	              className="mt-4 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] p-4"
	            />
	            <p className="mt-3 text-sm font-medium text-[#868E96]">Admin chỉ xác nhận điểm đã được Lớp/CVHT duyệt và chuyển phiếu sang trạng thái hoàn tất.</p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeFinalizeModal}
                disabled={submitting}
                className="h-10 cursor-pointer rounded-lg border border-[#DEE2E6] bg-white px-4 text-sm font-semibold text-[#495057] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={submitting}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0B3A82] px-4 text-sm font-semibold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="animate-spin" size={15} />}
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[#1A1B1E]">Xác nhận phê duyệt hàng loạt</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#495057]">
              Bạn sắp phê duyệt {confirmMode === 'selected' ? selectedRows.length.toLocaleString('vi-VN') : approveAllCount.toLocaleString('vi-VN')} phiếu đánh giá. Hành động này không thể hoàn tác. Tiếp tục?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmMode(null)}
                disabled={submitting}
                className="h-10 cursor-pointer rounded-lg border border-[#DEE2E6] bg-white px-4 text-sm font-semibold text-[#495057] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBulk}
                disabled={submitting}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="animate-spin" size={15} />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEvaluations;
