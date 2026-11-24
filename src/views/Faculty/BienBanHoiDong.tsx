'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Printer,
  RefreshCw,
  ArrowLeft,
  Building2,
  Users,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { API_Shared } from '@/api/API_Shared';
import { API_Faculty, type FacultyReportExportFormat } from '@/api/API_Faculty';
import { getUserFriendlyError } from '@/utils/errorHelper';
import {
  resolveFacultyId,
  toArray,
} from '@/utils/facultyEvaluationData';
import { BienBanHoiDongPreviewModal } from '@/components/faculty/BienBanHoiDongPreviewModal';
import {
  type BienBanHoiDongFormData,
  type BienBanHoiDongStudentRow,
} from '@/utils/exportBienBan';
import { useToast } from '@/components/common/ToastProvider';

/* ─── helpers ─────────────────────────────────────────────── */
function getFileNameFromDisposition(disposition?: string, fallback = 'bien-ban-hop-khoa') {
  const utf8FileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8FileName) {
    try {
      return decodeURIComponent(utf8FileName);
    } catch {
      return utf8FileName;
    }
  }

  return disposition?.match(/filename="?([^"]+)"?/i)?.[1] ?? fallback;
}

function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export function calcXepLoai(score: number): string {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

export function cleanNote(note?: string | null): string {
  if (!note) return '';
  const trimmed = note.trim();
  if (
    trimmed === '—' ||
    trimmed === '-' ||
    trimmed === '--' ||
    trimmed.startsWith('[KIỂM THỬ]') ||
    trimmed.toLowerCase().includes('dữ liệu mẫu') ||
    trimmed.toLowerCase().includes('mô phỏng')
  ) {
    return '';
  }
  return trimmed;
}

interface ClassItem {
  id: string;
  className: string;
  classCode: string;
  approvedCount: number;
  submittedCount: number;
  totalStudents: number;
}

export function BienBanHoiDongView() {
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const facultyId = resolveFacultyId(user);

  /* ─── Classes State ─── */
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  /* ─── Loading / Error ─── */
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  /* ─── Direct Export State (từ bảng danh sách) ─── */
  const [exportingClassId, setExportingClassId] = useState<string | null>(null);
  const [exportingClassFormat, setExportingClassFormat] = useState<FacultyReportExportFormat | null>(null);

  /* ─── Form Data & Row State ─── */
  const [report, setReport] = useState<Awaited<ReturnType<typeof API_Shared.getFacultyCouncilReview>> | null>(null);
  const [reportRefresh, setReportRefresh] = useState(0);
  const [formData, setFormData] = useState({
    qdSo: '',
    qdNgay: '',
    qdThang: '',
    qdNam: '',
    tongSoHoiDong: '',
    duHopHoiDong: '',
    vangHoiDong: '',
    lyDoVangHoiDong: '',
    moiDu: '',
    chuToa: '',
    thuKy: '',
    ngayHop: '',
    thangHop: '',
    namHop: '',
    gioBatDau: '08:00',
    diaDiem: 'Phòng họp Khoa',
    truongKhoa: '',
    chuTichHoiDong: '',
    tenThuKy: '',
    hocKy: '',
    namHoc: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<FacultyReportExportFormat | null>(null);

  /* ─── Resolve Managed Faculty ─── */
  const managedFaculty =
    (user as any)?.managedFaculty ||
    (user as any)?.managedFaculties?.[0] ||
    (user as any)?.faculty;
  const managedFacultyName = managedFaculty?.facultyName || managedFaculty?.name || 'Khoa được phân công';

  /* ─── Pre-populate current dates and names ─── */
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = String(today.getFullYear()).slice(-2);

    setFormData((p) => ({
      ...p,
      ngayHop: dd,
      thangHop: mm,
      namHop: yyyy,
      qdNgay: dd,
      qdThang: mm,
      qdNam: today.getFullYear().toString(),
      chuToa: (user as any)?.fullName || (user as any)?.name || (user as any)?.username || '',
      chuTichHoiDong: (user as any)?.fullName || (user as any)?.name || (user as any)?.username || '',
    }));
  }, [user]);

  /* ─── Load list of classes ─── */
  const loadClasses = useCallback(async () => {
    if (!facultyId) return;
    setLoadingClasses(true);
    setError('');
    try {
      let items: any[] = [];
      try {
        const statsResult = await API_Shared.getFacultyClassStats(facultyId);
        items = toArray<any>(statsResult);
      } catch {
        const majorsResult = await API_Shared.getFacultyMajors(facultyId, { page: 1, limit: 100 });
        const majors = toArray<any>(majorsResult);
        const classesByMajor = await Promise.all(
          majors.map((major) =>
            API_Shared.getMajorClasses(major.id, { page: 1, limit: 100 }),
          ),
        );
        items = classesByMajor.flatMap((result) => toArray<any>(result));
      }

      const cleanClasses: ClassItem[] = items
        .map((c) => ({
          id: String(c.id || c.classId || c._id || c.code || ''),
          className: c.className || c.name || c.classCode || c.code || 'Lớp chưa xác định',
          classCode: c.classCode || c.code || '',
          approvedCount: Number(c.approvedCount) || 0,
          submittedCount: Number(c.submittedCount) || 0,
          totalStudents: Number(c.totalStudents ?? c.studentCount) || 0,
        }))
        .filter((c) => Boolean(c.id));

      setClasses(cleanClasses);
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không tải được danh sách lớp.'));
    } finally {
      setLoadingClasses(false);
    }
  }, [facultyId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  /* ─── Load detail student review when a class is selected ─── */
  useEffect(() => {
    if (!selectedClassId || !facultyId) return;
    let ignore = false;
    setLoadingStudents(true);
    setReport(null);
    setError('');

    API_Shared.getFacultyCouncilReview(facultyId, selectedClassId)
      .then((result) => {
        if (ignore) return;
        setReport(result);
        setFormData((previous) => ({
          ...previous,
          hocKy: { HK1: '1', HK2: '2', SUMMER: 'Hè' }[result.semester.code] || '1',
          namHoc: result.semester.academicYear,
          tongSoHoiDong: previous.tongSoHoiDong || '5',
          duHopHoiDong: previous.duHopHoiDong || '5',
          vangHoiDong: previous.vangHoiDong || '0',
          lyDoVangHoiDong: previous.lyDoVangHoiDong || 'Không có',
        }));
      })
      .catch((err) => {
        if (!ignore) setError(getUserFriendlyError(err, 'Không tải được dữ liệu biên bản của lớp.'));
      })
      .finally(() => {
        if (!ignore) setLoadingStudents(false);
      });

    return () => { ignore = true; };
  }, [selectedClassId, facultyId, reportRefresh]);

  const studentRows = useMemo<BienBanHoiDongStudentRow[]>(() => {
    if (report?.classId !== selectedClassId) return [];
    return report.items.map((student) => ({
      stt: student.stt,
      maSV: (student.studentCode || '').trim(),
      hoTen: student.fullName,
      ngaySinh: student.dateOfBirth,
      drlLop: student.classScore ?? 0,
      drlKhoa: student.facultyScore ?? 0,
      xepLoai: student.classification,
      ghiChu: cleanNote(student.note),
    }));
  }, [report, selectedClassId]);

  const canUseReport = !loadingStudents && studentRows.length > 0;

  /* ─── Counts ─── */
  const counts = useMemo(() => ({
    xuatSac: studentRows.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: studentRows.filter((s) => s.xepLoai === 'Tốt').length,
    kha: studentRows.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: studentRows.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: studentRows.filter((s) => s.xepLoai === 'Yếu').length,
  }), [studentRows]);

  /* ─── Selected Class Name ─── */
  const selectedClassName = useMemo(() => {
    const c = classes.find((item) => item.id === selectedClassId);
    return c?.className || '................................';
  }, [classes, selectedClassId]);

  /* ─── Build BienBanHoiDongFormData ─── */
  const bienBanData = useMemo<BienBanHoiDongFormData>(() => ({
    khoa: managedFacultyName,
    lop: selectedClassName,
    ...formData,
    students: studentRows,
  }), [managedFacultyName, selectedClassName, formData, studentRows]);

  const exportPayload = useMemo(() => ({
    ...bienBanData,
    facultyId,
    classId: selectedClassId,
    facultyName: managedFacultyName,
    className: selectedClassName,
    semester: formData.hocKy,
    academicYear: formData.namHoc,
    decisionNo: formData.qdSo,
    decisionDay: formData.qdNgay,
    decisionMonth: formData.qdThang,
    decisionYear: formData.qdNam,
    councilTotal: formData.tongSoHoiDong,
    councilPresent: formData.duHopHoiDong,
    councilAbsent: formData.vangHoiDong,
    absentReason: formData.lyDoVangHoiDong,
    invited: formData.moiDu,
    chairperson: formData.chuToa,
    secretary: formData.thuKy,
    meetingDay: formData.ngayHop,
    meetingMonth: formData.thangHop,
    meetingYear: formData.namHop,
    startTime: formData.gioBatDau,
    location: formData.diaDiem,
    dean: formData.truongKhoa,
    councilChairman: formData.chuTichHoiDong,
    signerSecretary: formData.tenThuKy,
    students: studentRows.map((student) => {
      const drlLop = Math.round(Number(student.drlLop) || 0);
      const drlKhoa = Math.round(Number(student.drlKhoa) || 0);
      const score = drlKhoa > 0 ? drlKhoa : (drlLop > 0 ? drlLop : 0);
      const validRanks = ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'];
      const xepLoai = validRanks.includes(student.xepLoai)
        ? student.xepLoai
        : (score > 0 ? calcXepLoai(score) : 'Yếu');

      return {
        stt: Number(student.stt) || 1,
        maSV: String(student.maSV || '').trim(),
        hoTen: String(student.hoTen || ''),
        ngaySinh: String(student.ngaySinh || '—'),
        drlLop,
        drlKhoa,
        xepLoai,
        ghiChu: cleanNote(student.ghiChu),
      };
    }),
  }), [bienBanData, facultyId, formData, managedFacultyName, selectedClassId, selectedClassName, studentRows]);

  /* ─── Handlers ─── */
  const handleField = (key: string, val: string) => setFormData((p) => ({ ...p, [key]: val }));
  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format: FacultyReportExportFormat) => {
    if (!canUseReport) return;

    setExportingFormat(format);
    setError('');
    try {
      const res = await API_Faculty.exportBienBanHopKhoa(format, exportPayload);
      const ext = format === 'word' ? 'docx' : 'xlsx';
      const fallback = `bien-ban-hop-khoa-${selectedClassName}.${ext}`;
      const fileName = getFileNameFromDisposition(res.headers['content-disposition'], fallback);
      downloadBlob(res.data, fileName);
      toast.success(`Đã tải file ${format === 'word' ? 'Word' : 'Excel'} biên bản họp khoa.`);
    } catch (err: any) {
      const message = getUserFriendlyError(err, `Không thể xuất file ${format === 'word' ? 'Word' : 'Excel'}.`);
      setError(message);
      toast.error(message);
    } finally {
      setExportingFormat(null);
    }
  };

  /* ─── Direct Export cho từng lớp từ Bảng danh sách ─── */
  const handleDirectExportClass = async (classItem: ClassItem, format: FacultyReportExportFormat) => {
    if (!facultyId) return;
    setExportingClassId(classItem.id);
    setExportingClassFormat(format);
    try {
      const reviewData = await API_Shared.getFacultyCouncilReview(facultyId, classItem.id);
      const rows = reviewData.items.map((student) => {
        const drlLop = Math.round(Number(student.classScore) || 0);
        const drlKhoa = Math.round(Number(student.facultyScore) || 0);
        const score = drlKhoa > 0 ? drlKhoa : (drlLop > 0 ? drlLop : 0);
        const validRanks = ['Xuất sắc', 'Tốt', 'Khá', 'Trung bình', 'Yếu'];
        const xepLoai = validRanks.includes(student.classification)
          ? student.classification
          : (score > 0 ? calcXepLoai(score) : 'Yếu');

        return {
          stt: Number(student.stt) || 1,
          maSV: String(student.studentCode || '').trim(),
          hoTen: String(student.fullName || ''),
          ngaySinh: String(student.dateOfBirth || '—'),
          drlLop,
          drlKhoa,
          xepLoai,
          ghiChu: cleanNote(student.note),
        };
      });

      const payload = {
        facultyId,
        classId: classItem.id,
        facultyName: managedFacultyName,
        className: classItem.className,
        semester: { HK1: '1', HK2: '2', SUMMER: 'Hè' }[reviewData.semester.code] || '1',
        academicYear: reviewData.semester.academicYear || formData.namHoc,
        decisionNo: formData.qdSo,
        decisionDay: formData.qdNgay,
        decisionMonth: formData.qdThang,
        decisionYear: formData.qdNam,
        councilTotal: formData.tongSoHoiDong || '5',
        councilPresent: formData.duHopHoiDong || '5',
        councilAbsent: formData.vangHoiDong || '0',
        absentReason: formData.lyDoVangHoiDong || 'Không có',
        invited: formData.moiDu,
        chairperson: formData.chuToa,
        secretary: formData.thuKy,
        meetingDay: formData.ngayHop,
        meetingMonth: formData.thangHop,
        meetingYear: formData.namHop,
        startTime: formData.gioBatDau,
        location: formData.diaDiem,
        dean: formData.truongKhoa,
        councilChairman: formData.chuTichHoiDong,
        signerSecretary: formData.tenThuKy,
        students: rows,
      };

      const res = await API_Faculty.exportBienBanHopKhoa(format, payload);
      const ext = format === 'word' ? 'docx' : 'xlsx';
      const fallback = `bien-ban-hop-khoa-${classItem.className}.${ext}`;
      const fileName = getFileNameFromDisposition(res.headers['content-disposition'], fallback);
      downloadBlob(res.data, fileName);
      toast.success(`Đã xuất file ${format === 'word' ? 'Word' : 'Excel'} lớp ${classItem.className}.`);
    } catch (err: any) {
      const message = getUserFriendlyError(err, `Không thể xuất file ${format === 'word' ? 'Word' : 'Excel'} cho lớp ${classItem.className}.`);
      toast.error(message);
    } finally {
      setExportingClassId(null);
      setExportingClassFormat(null);
    }
  };

  /* ─── Lọc danh sách lớp ─── */
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        c.className.toLowerCase().includes(term) ||
        c.classCode.toLowerCase().includes(term)
      );
    });
  }, [classes, searchTerm]);

  /* ─── Thống kê tổng quan ─── */
  const summaryStats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((acc, c) => acc + c.totalStudents, 0);
    const totalApproved = classes.reduce((acc, c) => acc + c.approvedCount, 0);
    return { totalClasses, totalStudents, totalApproved };
  }, [classes]);

  if (!facultyId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tài khoản chưa được gán khoa</h2>
        <p className="text-sm text-gray-500">Không thể lập biên bản khi tài khoản chưa được phân công quản lý khoa.</p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
   * VIEW 1: DANH SÁCH TẤT CẢ CÁC LỚP THUỘC KHOA (PHƯƠNG ÁN 1)
   * ═══════════════════════════════════════════════════════════════════ */
  if (!selectedClassId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Biên bản họp Hội đồng khoa</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Khoa <strong>{managedFacultyName}</strong> — Danh sách biên bản rèn luyện theo từng lớp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadClasses()}
            disabled={loadingClasses}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingClasses ? 'animate-spin text-brand-primary' : ''} />
            Làm mới danh sách
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
        )}

        {/* Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng số lớp</p>
              <p className="text-2xl font-black text-gray-900">{summaryStats.totalClasses} <span className="text-sm font-normal text-gray-500">lớp</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng số sinh viên</p>
              <p className="text-2xl font-black text-gray-900">{summaryStats.totalStudents} <span className="text-sm font-normal text-gray-500">sinh viên</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã hoàn thành ĐRL</p>
              <p className="text-2xl font-black text-green-600">{summaryStats.totalApproved} <span className="text-sm font-normal text-gray-500">sinh viên</span></p>
            </div>
          </div>
        </div>

        {/* Bảng danh sách các lớp */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Thanh công cụ tìm kiếm */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên lớp, mã lớp..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Hiển thị <strong>{filteredClasses.length}</strong> / {classes.length} lớp
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <th className="p-3.5 text-center w-12">STT</th>
                  <th className="p-3.5 w-36">Mã lớp</th>
                  <th className="p-3.5">Tên lớp</th>
                  <th className="p-3.5 text-center w-28">Sĩ số</th>
                  <th className="p-3.5 text-center w-36">Đã duyệt (Khoa)</th>
                  <th className="p-3.5 text-center w-44">Trạng thái biên bản</th>
                  <th className="p-3.5 text-center w-80">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingClasses ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin text-brand-primary" />
                        <span>Đang tải danh sách các lớp thuộc Khoa...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      {classes.length === 0 ? 'Khoa chưa có lớp nào được phân công.' : 'Không tìm thấy lớp phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((item, index) => {
                    const isExportingWord = exportingClassId === item.id && exportingClassFormat === 'word';
                    const isExportingExcel = exportingClassId === item.id && exportingClassFormat === 'excel';
                    const hasData = item.approvedCount > 0 || item.totalStudents > 0;

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition">
                        <td className="p-3.5 text-center text-gray-500 font-semibold">{index + 1}</td>
                        <td className="p-3.5 font-mono font-bold text-gray-800">{item.classCode || '—'}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-900 block">{item.className}</span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-gray-700">
                          {item.totalStudents} SV
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            {item.approvedCount} / {item.totalStudents} SV
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {hasData ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 size={12} className="text-blue-500" />
                              Sẵn sàng biên bản
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                              <Clock size={12} />
                              Chờ nộp dữ liệu
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Nút Xem biên bản */}
                            <button
                              type="button"
                              onClick={() => setSelectedClassId(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-sm cursor-pointer"
                              title={`Xem biên bản họp khoa của lớp ${item.className}`}
                            >
                              <Eye size={13} />
                              Xem biên bản
                            </button>

                            {/* Nút Xuất Word */}
                            <button
                              type="button"
                              onClick={() => void handleDirectExportClass(item, 'word')}
                              disabled={isExportingWord || isExportingExcel}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
                              title="Tải file Word biên bản của lớp này"
                            >
                              {isExportingWord ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <FileText size={13} />
                              )}
                              Word
                            </button>

                            {/* Nút Xuất Excel */}
                            <button
                              type="button"
                              onClick={() => void handleDirectExportClass(item, 'excel')}
                              disabled={isExportingWord || isExportingExcel}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                              title="Tải file Excel biên bản của lớp này"
                            >
                              {isExportingExcel ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <FileSpreadsheet size={13} />
                              )}
                              Excel
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
   * VIEW 2: CHI TIẾT BIÊN BẢN HỌP KHOA CỦA LỚP ĐƯỢC CHỌN
   * ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* ── Top Bar với nút Quay lại danh sách lớp & công cụ xuất ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedClassId('')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách lớp
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Biên bản lớp:</span>
              <span className="text-brand-primary">{selectedClassName}</span>
            </h1>
            <p className="text-xs text-gray-500">Khoa: {managedFacultyName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown chuyển nhanh lớp */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs font-semibold text-gray-500">Đổi lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses || classes.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:border-brand-primary focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.classCode ? `${c.classCode} – ${c.className}` : c.className}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setReportRefresh((current) => current + 1)}
            disabled={loadingStudents || !selectedClassId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingStudents ? 'animate-spin text-brand-primary' : ''} />
            Tải lại
          </button>

          {/* Xuất Word */}
          <button
            type="button"
            onClick={() => void handleExport('word')}
            disabled={!canUseReport || exportingFormat !== null}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FileText size={14} />
            {exportingFormat === 'word' ? 'Đang xuất Word...' : 'Xuất Word'}
          </button>

          {/* Xuất Excel */}
          <button
            type="button"
            onClick={() => void handleExport('excel')}
            disabled={!canUseReport || exportingFormat !== null}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            {exportingFormat === 'excel' ? 'Đang xuất Excel...' : 'Xuất Excel'}
          </button>

          {/* Xem trước */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!canUseReport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-gray-700 transition disabled:opacity-50"
          >
            <Eye size={14} />
            Xem trước
          </button>

          {/* In */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={!canUseReport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-gray-600 transition disabled:opacity-50"
          >
            <Printer size={14} />
            In biên bản
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {/* Scoped Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #bien-ban-hoi-dong-paper,
          #bien-ban-hoi-dong-paper * {
            visibility: visible !important;
          }
          #bien-ban-hoi-dong-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            z-index: 9999 !important;
          }
          #bien-ban-hoi-dong-paper input {
            border: none !important;
            background: transparent !important;
            outline: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}} />

      {/* ── SECTION: Form Tờ A4 Biên bản họp Hội đồng ── */}
      <div id="bien-ban-hoi-dong-paper" className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-10 text-gray-800 font-sans leading-relaxed">
        {/* Tiêu đề & Quốc hiệu */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between sm:items-start">
            <div className="flex max-w-[430px] flex-col items-center leading-tight text-center text-gray-900 sm:min-w-[320px]">
              <p className="font-normal text-base uppercase text-gray-900 sm:text-lg">
                HỌC VIỆN HÀNH CHÍNH
              </p>
              <p className="font-normal text-base uppercase text-gray-900 sm:text-lg">
                VÀ QUẢN TRỊ CÔNG
              </p>
              <p className="mt-2 font-bold text-base uppercase text-gray-900 sm:text-lg">
                PHÂN HIỆU HỌC VIỆN
              </p>
              <p className="font-bold text-base uppercase text-gray-900 sm:text-lg">
                HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
              </p>
              <p className="font-bold text-base uppercase text-gray-900 sm:text-lg">
                TẠI THÀNH PHỐ ĐÀ NẴNG
              </p>
              <p className="mt-2 text-center text-lg font-bold text-gray-900">*</p>
            </div>

            <div className="flex flex-col items-end text-right sm:min-w-[300px]">
              <p className="text-lg font-semibold italic text-gray-900">Phụ lục 01</p>
              <div className="mt-3 inline-block border-b-2 border-gray-900 pb-0.5">
                <p className="text-lg font-bold uppercase tracking-wide text-gray-900">ĐẢNG CỘNG SẢN VIỆT NAM</p>
              </div>
            </div>
          </div>

          {/* Dòng Khoa (trái) và Ngày tháng (phải) - NGANG HÀNG NHAU */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="font-semibold tracking-wide">KHOA:</span>
              <span className="font-bold text-gray-900">{managedFacultyName}</span>
            </div>
            <div className="italic text-gray-500 text-right">
              Đà Nẵng, ngày <input type="text" value={formData.ngayHop} onChange={(e) => handleField('ngayHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> tháng <input type="text" value={formData.thangHop} onChange={(e) => handleField('thangHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> năm 20<input type="text" value={formData.namHop} onChange={(e) => handleField('namHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
            </div>
          </div>
        </div>

        {/* Tên biên bản */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900">BIÊN BẢN HỌP HỘI ĐỒNG</h2>
          <div className="flex flex-wrap justify-center items-center gap-1.5 italic text-gray-600 text-sm">
            <span>Về việc đánh giá kết quả rèn luyện của sinh viên lớp:</span>
            <span className="font-semibold text-gray-950">{selectedClassName}</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-1.5 italic text-gray-600 text-sm">
            <span>Học kỳ:</span>
            <input type="text" value={report?.classId === selectedClassId ? formData.hocKy : ''} readOnly className="w-12 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
            <span>Năm học:</span>
            <input type="text" value={report?.classId === selectedClassId ? formData.namHoc : ''} readOnly className="w-24 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
          </div>
          <div className="w-32 border-b border-dashed border-gray-300 mx-auto mt-2"></div>
        </div>

        {/* Nội dung biên bản */}
        <div className="space-y-4 text-sm sm:text-base">
          {/* I. Thời gian */}
          <p>
            <span className="font-bold text-gray-900">I. Thời gian:</span> Cuộc họp bắt đầu vào hồi:{' '}
            <input type="text" value={formData.gioBatDau} onChange={(e) => handleField('gioBatDau', e.target.value)} className="w-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> ngày{' '}
            <input type="text" value={formData.ngayHop} onChange={(e) => handleField('ngayHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> tháng{' '}
            <input type="text" value={formData.thangHop} onChange={(e) => handleField('thangHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> năm 20
            <input type="text" value={formData.namHop} onChange={(e) => handleField('namHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
          </p>

          {/* II. Địa điểm */}
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-900">II. Địa điểm:</span>
            <input
              type="text"
              value={formData.diaDiem}
              onChange={(e) => handleField('diaDiem', e.target.value)}
              placeholder="Nhập địa điểm..."
              className="bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 transition-colors placeholder:text-gray-400 placeholder:font-normal"
            />
          </p>

          {/* III. Thành phần */}
          <div className="space-y-2">
            <p className="font-bold text-gray-900">III. Thành phần:</p>
            <div className="pl-4 space-y-3 text-gray-700 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Thành viên Hội đồng đánh giá kết quả rèn luyện cấp Khoa (QĐ số:</span>
                <input type="text" value={formData.qdSo} onChange={(e) => handleField('qdSo', e.target.value)} placeholder="Số QĐ..." className="w-28 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>ngày</span>
                <input type="text" value={formData.qdNgay} onChange={(e) => handleField('qdNgay', e.target.value)} placeholder="Ngày" className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>tháng</span>
                <input type="text" value={formData.qdThang} onChange={(e) => handleField('qdThang', e.target.value)} placeholder="Tháng" className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>năm</span>
                <input type="text" value={formData.qdNam} onChange={(e) => handleField('qdNam', e.target.value)} placeholder="Năm" className="w-12 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span>Tổng số:</span>
                <input type="text" value={formData.tongSoHoiDong} onChange={(e) => handleField('tongSoHoiDong', e.target.value)} placeholder="Số người..." className="w-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>người</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span>Số người dự họp:</span>
                <input type="text" value={formData.duHopHoiDong} onChange={(e) => handleField('duHopHoiDong', e.target.value)} placeholder="Dự họp..." className="w-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>người, vắng họp:</span>
                <input type="text" value={formData.vangHoiDong} onChange={(e) => handleField('vangHoiDong', e.target.value)} placeholder="Vắng..." className="w-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
                <span>người, lý do vắng họp:</span>
                <input type="text" value={formData.lyDoVangHoiDong} onChange={(e) => handleField('lyDoVangHoiDong', e.target.value)} placeholder="Lý do vắng..." className="bg-transparent border-b border-dashed border-gray-400 outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 min-w-[200px] focus:border-brand-primary" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span>Mời dự:</span>
                <input type="text" value={formData.moiDu} onChange={(e) => handleField('moiDu', e.target.value)} placeholder="Mời tham gia..." className="bg-transparent border-b border-dashed border-gray-400 outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 focus:border-brand-primary" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span>Chủ tọa:</span>
                <input type="text" value={formData.chuToa} onChange={(e) => handleField('chuToa', e.target.value)} placeholder="Họ tên chủ tọa..." className="bg-transparent border-b border-dashed border-gray-400 outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 max-w-[320px] focus:border-brand-primary" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span>Thư ký:</span>
                <input type="text" value={formData.thuKy} onChange={(e) => handleField('thuKy', e.target.value)} placeholder="Họ tên thư ký..." className="bg-transparent border-b border-dashed border-gray-400 outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 max-w-[320px] focus:border-brand-primary" />
              </div>
            </div>
          </div>

          {/* IV. Nội dung */}
          <div className="space-y-2 pt-2">
            <p className="font-bold text-gray-900">IV. Nội dung:</p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Đánh giá kết quả rèn luyện của sinh viên lớp <strong>{selectedClassName}</strong> thuộc Khoa <strong>{managedFacultyName}</strong>, học kỳ <strong>{formData.hocKy}</strong> năm học <strong>{formData.namHoc}</strong>.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Căn cứ biên bản họp lớp, ý kiến của các thành viên tham dự cuộc họp, đối chiếu với Quy chế của Bộ Giáo dục Đào tạo và quy định của Học viện, Hội đồng đánh giá kết quả rèn luyện Khoa nhất trí đánh giá kết quả rèn luyện của sinh viên lớp <strong>{selectedClassName}</strong> như sau:
            </p>
          </div>
        </div>

        {/* Bảng sinh viên */}
        <div className="overflow-x-auto my-6 border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-800 text-center">
                <th className="p-2 border-r border-gray-200 w-10">STT</th>
                <th className="p-2 border-r border-gray-200 whitespace-nowrap min-w-[130px]">Mã số SV</th>
                <th className="p-2 border-r border-gray-200">Họ và Tên</th>
                <th className="p-2 border-r border-gray-200 w-24">Ngày sinh</th>
                <th className="p-2 border-r border-gray-200 w-24">ĐRL lớp ĐG</th>
                <th className="p-2 border-r border-gray-200 w-24">ĐRL HĐ Khoa ĐG</th>
                <th className="p-2 border-r border-gray-200 w-24">Xếp loại</th>
                <th className="p-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {loadingStudents ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-400">Đang tải danh sách sinh viên...</td>
                </tr>
              ) : studentRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-400">{report ? 'Lớp được chọn chưa có danh sách sinh viên trong biên bản.' : 'Chưa tải được dữ liệu biên bản.'}</td>
                </tr>
              ) : (
                studentRows.map((s) => (
                  <tr key={s.stt} className="border-b border-gray-200 text-center">
                    <td className="p-2 border-r border-gray-200">{s.stt}</td>
                    <td className="p-2 border-r border-gray-200 font-mono font-medium whitespace-nowrap">{s.maSV}</td>
                    <td className="p-2 border-r border-gray-200 text-left font-medium text-gray-900">{s.hoTen}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">{s.ngaySinh || '—'}</td>
                    <td className="p-2 border-r border-gray-200">{s.drlLop > 0 ? s.drlLop : '—'}</td>
                    <td className="p-2 border-r border-gray-200 font-bold text-brand-primary">{s.drlKhoa > 0 ? s.drlKhoa : '—'}</td>
                    <td className="p-2 border-r border-gray-200 font-semibold">{s.xepLoai || '—'}</td>
                    <td className="p-2 text-left italic text-gray-500">{s.ghiChu}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tổng kết & Bảng thống kê phân loại */}
        <div className="my-6 border-b border-gray-100 pb-6 text-sm text-gray-800">
          <p className="font-semibold mb-2">
            - Tổng số: <strong>{studentRows.length}</strong> sinh viên. Thống kê kết quả phân loại rèn luyện cụ thể như sau:
          </p>

          <div className="overflow-x-auto max-w-xl my-3">
            <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-gray-800 text-center">
                  <th className="border border-gray-300 p-2 w-12">STT</th>
                  <th className="border border-gray-300 p-2 text-left">Phân loại rèn luyện</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Số lượng (SV)</th>
                  <th className="border border-gray-300 p-2 w-28 text-center">Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">1</td>
                  <td className="border border-gray-300 p-2 font-medium">Xuất sắc (90 ÷ 100 điểm)</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{counts.xuatSac}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold text-brand-primary">
                    {studentRows.length > 0 ? `${((counts.xuatSac / studentRows.length) * 100).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">2</td>
                  <td className="border border-gray-300 p-2 font-medium">Tốt (80 ÷ 89 điểm)</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{counts.tot}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold text-brand-primary">
                    {studentRows.length > 0 ? `${((counts.tot / studentRows.length) * 100).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">3</td>
                  <td className="border border-gray-300 p-2 font-medium">Khá (65 ÷ 79 điểm)</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{counts.kha}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold text-brand-primary">
                    {studentRows.length > 0 ? `${((counts.kha / studentRows.length) * 100).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">4</td>
                  <td className="border border-gray-300 p-2 font-medium">Trung bình (50 ÷ 64 điểm)</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{counts.trungBinh}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold text-brand-primary">
                    {studentRows.length > 0 ? `${((counts.trungBinh / studentRows.length) * 100).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">5</td>
                  <td className="border border-gray-300 p-2 font-medium">Yếu (Dưới 50 điểm)</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{counts.yeu}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold text-brand-primary">
                    {studentRows.length > 0 ? `${((counts.yeu / studentRows.length) * 100).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
                <tr className="bg-gray-50/80 font-bold">
                  <td className="border border-gray-300 p-2 text-center" colSpan={2}>Tổng cộng</td>
                  <td className="border border-gray-300 p-2 text-center font-black text-gray-900">{studentRows.length}</td>
                  <td className="border border-gray-300 p-2 text-center font-black text-gray-900">
                    {studentRows.length > 0 ? '100%' : '0%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chữ ký */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm font-semibold text-gray-900 mt-10">
          <div className="flex flex-col items-center">
            <p>TRƯỞNG KHOA</p>
            <p className="font-normal text-xs text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
            <input
              type="text"
              value={formData.truongKhoa}
              onChange={(e) => handleField('truongKhoa', e.target.value)}
              placeholder="Họ tên Trưởng Khoa..."
              className="mt-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-sm text-center font-bold text-gray-950 w-full max-w-[180px] focus:border-brand-primary"
            />
          </div>

          <div className="flex flex-col items-center">
            <p>CHỦ TỊCH HĐ</p>
            <p className="font-normal text-xs text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
            <input
              type="text"
              value={formData.chuTichHoiDong}
              onChange={(e) => handleField('chuTichHoiDong', e.target.value)}
              placeholder="Họ tên Chủ tịch HĐ..."
              className="mt-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-sm text-center font-bold text-gray-950 w-full max-w-[180px] focus:border-brand-primary"
            />
          </div>

          <div className="flex flex-col items-center">
            <p>THƯ KÝ</p>
            <p className="font-normal text-xs text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
            <input
              type="text"
              value={formData.tenThuKy}
              onChange={(e) => handleField('tenThuKy', e.target.value)}
              placeholder="Họ tên Thư ký..."
              className="mt-16 bg-transparent border-b border-dashed border-gray-400 outline-none text-sm text-center font-bold text-gray-950 w-full max-w-[180px] focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <BienBanHoiDongPreviewModal
          data={bienBanData}
          onClose={() => {
            setShowPreview(false);
            setAutoPrint(false);
          }}
          onPrint={() => window.print()}
          onExport={(format) => void handleExport(format)}
          exportingFormat={exportingFormat}
          autoPrint={autoPrint}
        />
      )}
    </div>
  );
}

export default BienBanHoiDongView;
