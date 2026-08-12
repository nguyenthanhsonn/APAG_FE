'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { API_Shared } from '@/api/API_Shared';
import { API_Admin } from '@/api/API_Admin';
import { getUserFriendlyError } from '@/utils/errorHelper';
import {
  resolveFacultyId,
  toArray,
} from '@/utils/facultyEvaluationData';
import { BienBanHoiDongPreviewModal } from '@/components/faculty/BienBanHoiDongPreviewModal';
import type { BienBanHoiDongFormData, BienBanHoiDongStudentRow } from '@/components/faculty/BienBanHoiDongPreviewModal';

/* ─── helpers ─────────────────────────────────────────────── */
function getBirthDate(raw: any): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return String(raw);
  }
}

export function calcXepLoai(score: number): string {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

export function BienBanHoiDongView() {
  const user = useAuthStore((state) => state.user);
  const facultyId = resolveFacultyId(user);

  /* ─── Dropdown Classes State ─── */
  const [classes, setClasses] = useState<Array<{ id: string; className: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  /* ─── Loading / Error ─── */
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  /* ─── Form Data & Row State ─── */
  const [classStudents, setClassStudents] = useState<any[]>([]); // holds class students list
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

  /* ─── Load dropdown list of classes ─── */
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

      const cleanClasses = items.map((c) => ({
        id: c.id,
        className: c.className || c.name || c.classCode || c.code || 'Lớp chưa xác định',
      }));
      setClasses(cleanClasses);
      if (cleanClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(cleanClasses[0].id);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không tải được danh sách lớp.'));
    } finally {
      setLoadingClasses(false);
    }
  }, [facultyId, selectedClassId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  /* ─── Load students of selected class ─── */
  const loadClassDetail = useCallback(async () => {
    if (!selectedClassId || !facultyId) return;
    setLoadingStudents(true);
    setError('');
    try {
      let items: any[] = [];
      try {
        const res = await API_Shared.getFacultyCouncilReview(facultyId, selectedClassId);
        items = res?.items || [];
      } catch (e) {
        console.warn('getFacultyCouncilReview failed, using fallback APIs:', e);
      }

      if (items.length === 0) {
        const [studentsRes, evalsRes] = await Promise.all([
          API_Shared.getClassStudents(selectedClassId).catch(() => []),
          API_Admin.getFacultyEvaluations(facultyId, { classId: selectedClassId, limit: 100 }).catch(() => []),
        ]);
        const classStudentsList = toArray<any>(studentsRes);
        const evalsList = toArray<any>(evalsRes);
        const evalsByStudentId = new Map(evalsList.map((e: any) => [e.studentId || e.student?.id || e.id, e]));

        items = classStudentsList.map((st: any, idx: number) => {
          const stId = st.studentId || st.userId || st.id;
          const ev = evalsByStudentId.get(stId);
          return {
            stt: idx + 1,
            studentId: stId,
            studentCode: st.studentCode || st.code || st.username || '—',
            fullName: st.fullName || st.name || '—',
            dateOfBirth: st.dateOfBirth || st.student?.dateOfBirth || '',
            evaluationId: ev?.id || null,
            status: ev?.status || 'draft',
            classScore: ev?.classScore ?? ev?.finalScore ?? ev?.studentScore ?? 0,
            facultyScore: ev?.finalScore ?? ev?.classScore ?? 0,
            classification: ev?.classification || ev?.rank || '',
            note: ev?.note || '',
          };
        });
      }

      setClassStudents(items);
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không tải được sinh viên lớp được chọn.'));
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, facultyId]);

  useEffect(() => {
    void loadClassDetail();
  }, [loadClassDetail]);

  /* ─── Map students to minutes student rows ─── */
  const studentRows = useMemo<BienBanHoiDongStudentRow[]>(() => {
    return classStudents.map((student, idx) => {
      const drlLop = Number(student.classScore ?? 0);
      const drlKhoa = Number(student.facultyScore ?? student.classScore ?? 0);
      const birthDateRaw = student.dateOfBirth || '';
      const birthDate = birthDateRaw ? getBirthDate(birthDateRaw) : '';
      const xepLoai = student.classification || (drlKhoa > 0 ? calcXepLoai(drlKhoa) : '—');
      const ghiChu = student.note || '';

      return {
        stt: student.stt || idx + 1,
        maSV: student.studentCode || student.code || '—',
        hoTen: student.fullName || student.name || 'Sinh viên chưa xác định',
        ngaySinh: birthDate,
        drlLop,
        drlKhoa,
        xepLoai,
        ghiChu,
      };
    });
  }, [classStudents]);

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

  /* ─── Handlers ─── */
  const handleField = (key: string, val: string) => setFormData((p) => ({ ...p, [key]: val }));
  const handlePrint = () => {
    setAutoPrint(true);
    setShowPreview(true);
  };

  if (!facultyId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tài khoản chưa được gán khoa</h2>
        <p className="text-sm text-gray-500">Không thể lập biên bản khi tài khoản chưa được phân công quản lý khoa.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
            <FileText className="text-brand-primary" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Biên bản họp Hội đồng khoa</h1>
            <p className="text-xs text-gray-500">Kết quả rèn luyện cấp Khoa theo lớp</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Selector Dropdown */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm font-semibold text-gray-600">Chọn lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses || classes.length === 0}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold focus:border-brand-primary focus:outline-none"
            >
              {classes.length === 0 ? (
                <option value="">Đang tải lớp...</option>
              ) : (
                classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadClassDetail()}
            disabled={loadingStudents || !selectedClassId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingStudents ? 'animate-spin' : ''} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={loadingStudents || !selectedClassId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-50"
          >
            <Eye size={15} />
            Xem trước
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loadingStudents || !selectedClassId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            <Printer size={15} />
            In biên bản
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {/* ── SECTION: Form input layout giống ClassLeader ── */}
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-10 text-gray-800 font-sans leading-relaxed">
        {/* Tiêu đề & Quốc hiệu */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm border-b border-gray-100 pb-6 mb-6">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-bold text-gray-900 leading-tight uppercase">
              HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
            </p>
            <p className="font-bold text-gray-900 leading-tight uppercase">
              PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG TẠI THÀNH PHỐ ĐÀ NẴNG
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="font-semibold tracking-wide">KHOA:</span>
              <span className="font-bold text-gray-900">{managedFacultyName}</span>
            </div>
            <p className="text-center font-bold text-gray-400 mt-1">*</p>
          </div>
          <div className="text-center space-y-1 sm:text-right flex flex-col items-center sm:items-end">
            <p className="italic font-normal text-xs sm:text-sm text-gray-800 self-end">Phụ lục 01</p>
            <div className="inline-block border-b-2 border-gray-900 pb-0.5">
              <p className="font-bold uppercase tracking-wider text-gray-900">ĐẢNG CỘNG SẢN VIỆT NAM</p>
            </div>
            <p className="italic text-gray-500 mt-2">
              Đà Nẵng, ngày <input type="text" value={formData.ngayHop} onChange={(e) => handleField('ngayHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> tháng <input type="text" value={formData.thangHop} onChange={(e) => handleField('thangHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" /> năm 20<input type="text" value={formData.namHop} onChange={(e) => handleField('namHop', e.target.value)} className="w-8 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
            </p>
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
            <input type="text" value={formData.hocKy} onChange={(e) => handleField('hocKy', e.target.value)} className="w-12 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
            <span>Năm học:</span>
            <input type="text" value={formData.namHoc} onChange={(e) => handleField('namHoc', e.target.value)} className="w-24 bg-transparent border-b border-dashed border-gray-400 outline-none text-center font-semibold text-gray-900 focus:border-brand-primary" />
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
                <th className="p-2 border-r border-gray-200 w-24">Mã số SV</th>
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
                  <td colSpan={8} className="p-4 text-center text-gray-400">Không có dữ liệu sinh viên.</td>
                </tr>
              ) : (
                studentRows.map((s) => (
                  <tr key={s.stt} className="border-b border-gray-200 text-center">
                    <td className="p-2 border-r border-gray-200">{s.stt}</td>
                    <td className="p-2 border-r border-gray-200 font-mono font-medium">{s.maSV}</td>
                    <td className="p-2 border-r border-gray-200 text-left font-medium text-gray-900">{s.hoTen}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">{s.ngaySinh || '—'}</td>
                    <td className="p-2 border-r border-gray-200">{s.drlLop > 0 ? s.drlLop : '—'}</td>
                    <td className="p-2 border-r border-gray-200 font-bold text-brand-primary">{s.drlKhoa > 0 ? s.drlKhoa : '—'}</td>
                    <td className="p-2 border-r border-gray-200 font-semibold">{s.xepLoai || '—'}</td>
                    <td className="p-2 text-left italic text-gray-500">{s.ghiChu || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tổng kết */}
        <div className="text-sm space-y-1 my-6 border-b border-gray-100 pb-6 pl-4 text-gray-700">
          <div>- Tổng số: <strong>{studentRows.length}</strong> sinh viên</div>
          <div className="pl-4">Trong đó:</div>
          <div className="pl-8">+ Xuất sắc: <strong>{counts.xuatSac}</strong> Sinh viên</div>
          <div className="pl-8">+ Tốt:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.tot}</strong> Sinh viên</div>
          <div className="pl-8">+ Khá:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.kha}</strong> Sinh viên</div>
          <div className="pl-8">+ Trung bình: <strong>{counts.trungBinh}</strong> Sinh viên</div>
          <div className="pl-8">+ Yếu:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.yeu}</strong> Sinh viên</div>
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
          autoPrint={autoPrint}
        />
      )}
    </div>
  );
}
