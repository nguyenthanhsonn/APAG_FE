'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { API_Admin } from '@/api/API_Admin';
import { toArray, mapEvaluationToFacultyStudent } from '@/utils/facultyEvaluationData';
import { getUserFriendlyError } from '@/utils/errorHelper';
import type { AdminEvaluationItem } from '@/types';
import { BienBanPreviewModal } from '@/components/class_leader/BienBanPreviewModal';
import type { BienBanFormData, BienBanStudentRow } from '@/utils/exportBienBan';

/* ─── helpers ─────────────────────────────────────────────── */
function resolveClassId(user: any): string {
  const first = user?.managedClasses?.[0];
  return first?.classId || first?.id || user?.classId || user?.class?.id || '';
}

function resolveClassName(user: any): string {
  const first = user?.managedClasses?.[0];
  return first?.className || first?.name || first?.classCode || first?.code || '';
}

function resolveKhoa(user: any): string {
  return (
    user?.managedClasses?.[0]?.faculty?.name ||
    user?.managedClasses?.[0]?.facultyName ||
    user?.faculty?.name ||
    user?.facultyName ||
    ''
  );
}

function getScoreSV(item: AdminEvaluationItem): number {
  const val = (item as any).studentScore ?? (item as any).svScore ?? (item as any).totalScore;
  return val !== undefined && val !== null ? Number(val) : 0;
}

function getScoreLop(item: AdminEvaluationItem): number {
  const val = (item as any).classScore ?? (item as any).class_score ?? (item as any).classLeaderScore;
  return val !== undefined && val !== null ? Number(val) : 0;
}

function getBirthDate(item: AdminEvaluationItem): string {
  const raw = (item as any).student?.dateOfBirth || (item as any).student?.birthDate || (item as any).dateOfBirth || '';
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return raw;
  }
}

export function calcXepLoai(score: number): string {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}


/* ─── Score badge ────────────────────────────────────────────── */
function XepLoaiBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    'Xuất sắc': 'bg-violet-100 text-violet-700',
    'Tốt': 'bg-blue-100 text-blue-700',
    'Khá': 'bg-emerald-100 text-emerald-700',
    'Trung bình': 'bg-amber-100 text-amber-700',
    'Yếu': 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${colors[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label || '—'}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function BienBanHopLop() {
  const user = useAuthStore((s) => s.user);
  const classId = resolveClassId(user);
  const className = resolveClassName(user);
  const khoa = resolveKhoa(user);

  /* ─── API state ─── */
  const [apiRows, setApiRows] = useState<AdminEvaluationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bieuQuyet, setBieuQuyet] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});

  /* ─── Form state ─── */
  const today = useMemo(() => new Date(), []);
  const [formData, setFormData] = useState({
    diaDanh: 'Đà Nẵng',
    ngayHop: String(today.getDate()).padStart(2, '0'),
    thang: String(today.getMonth() + 1).padStart(2, '0'),
    nam: String(today.getFullYear()),
    hocKy: '1',
    namHoc: `${today.getFullYear() - 1}-${today.getFullYear()}`,
    gioKhoi: '07:30',
    gioKetThuc: '09:00',
    diaDiem: 'Phòng học của lớp',
    tongSoDuHop: '0',
    soVang: '0',
    lyDoVang: 'Không có',
    chuToa: '',
    thuKy: '',
    tenLopTruong: '',
  });

  useEffect(() => {
    if (user?.fullName) {
      setFormData((p) => ({ ...p, tenLopTruong: user.fullName || '' }));
    }
  }, [user]);

  /* ─── Preview state ─── */
  const [showPreview, setShowPreview] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError('');
    try {
      const result = await API_Admin.getAdminEvaluationList({ classId, limit: 100 });
      const rows = toArray<AdminEvaluationItem>(result);
      setApiRows(rows);
      if (rows.length > 0) {
        const first = rows[0];
        const semesterValue = typeof first.semester === 'object'
          ? first.semester?.semester || first.semester?.name || first.semester?.id
          : first.semester;
        setFormData((p) => ({
          ...p,
          hocKy: semesterValue || p.hocKy,
          namHoc: first.academicYear || p.namHoc,
          tongSoDuHop: String(rows.length),
        }));
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không tải được danh sách sinh viên.'));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { void load(); }, [load]);

  /* ─── Build student rows ─── */
  const studentRows = useMemo<BienBanStudentRow[]>(() =>
    apiRows.map((item, idx) => {
      const mapped = mapEvaluationToFacultyStudent(item);
      const svScore = getScoreSV(item);
      const lopScore = getScoreLop(item);
      return {
        stt: idx + 1,
        maSV: mapped.code,
        hoTen: mapped.name,
        ngaySinh: getBirthDate(item),
        drlSV: svScore,
        drlLop: lopScore,
        xepLoai: lopScore > 0 ? calcXepLoai(lopScore) : '',
        bieuQuyet: bieuQuyet[item.id] ?? '',
        ghiChu: ghiChu[item.id] ?? '',
      };
    }), [apiRows, bieuQuyet, ghiChu]);

  /* ─── Summary counts ─── */
  const counts = useMemo(() => ({
    xuatSac: studentRows.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: studentRows.filter((s) => s.xepLoai === 'Tốt').length,
    kha: studentRows.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: studentRows.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: studentRows.filter((s) => s.xepLoai === 'Yếu').length,
  }), [studentRows]);

  /* ─── Build BienBanFormData ─── */
  const bienBanData = useMemo<BienBanFormData>(() => ({
    khoa,
    lop: className,
    ...formData,
    students: studentRows,
  }), [khoa, className, formData, studentRows]);

  /* ─── Handlers ─── */
  const handleField = (key: string, val: string) => setFormData((p) => ({ ...p, [key]: val }));
  const handlePrint = () => {
    setAutoPrint(true);
    setShowPreview(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
            <FileText className="text-brand-primary" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Biên bản họp lớp</h1>
            <p className="text-xs text-gray-500">Phụ lục số 02 — Kết quả rèn luyện sinh viên</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            <Eye size={15} />
            Xem trước
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            <Printer size={15} />
            In biên bản
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      {/* ── SECTION 1: Biên bản họp lớp theo mẫu giấy tờ ── */}
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-10 text-gray-800 font-sans leading-relaxed">
        {/* Tiêu đề & Quốc hiệu */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm border-b border-gray-100 pb-6 mb-6">
          <div className="space-y-1">
            <p className="font-semibold tracking-wide">
              KHOA: <span className="font-bold text-gray-900">{khoa || '................................'}</span>
            </p>
            <p className="font-semibold tracking-wide">
              LỚP: <span className="font-bold text-gray-900">{className || '................................'}</span>
            </p>
            <p className="text-center font-bold text-gray-400 mt-1">*</p>
          </div>
          <div className="text-center space-y-1 sm:text-right">
            <div className="inline-block border-b-2 border-gray-900 pb-0.5">
              <p className="font-bold uppercase tracking-wider text-gray-900">ĐẢNG CỘNG SẢN VIỆT NAM</p>
            </div>
            <p className="italic text-gray-600 mt-2 flex flex-wrap items-center justify-center sm:justify-end gap-1 text-xs sm:text-sm">
              <input
                type="text"
                value={formData.diaDanh}
                onChange={(e) => handleField('diaDanh', e.target.value)}
                placeholder="Đà Nẵng"
                className="w-20 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-right font-semibold text-gray-900"
              />
              <span>, ngày</span>
              <input
                type="text"
                value={formData.ngayHop}
                onChange={(e) => handleField('ngayHop', e.target.value)}
                placeholder="05"
                className="w-10 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-center font-semibold text-gray-900"
              />
              <span>tháng</span>
              <input
                type="text"
                value={formData.thang}
                onChange={(e) => handleField('thang', e.target.value)}
                placeholder="08"
                className="w-10 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-center font-semibold text-gray-900"
              />
              <span>năm</span>
              <input
                type="text"
                value={formData.nam}
                onChange={(e) => handleField('nam', e.target.value)}
                placeholder="2026"
                className="w-16 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-center font-semibold text-gray-900"
              />
            </p>
          </div>
        </div>

        {/* Tên biên bản */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900">BIÊN BẢN HỌP LỚP</h2>
          <p className="italic text-gray-600 flex flex-wrap items-center justify-center gap-1.5 text-sm sm:text-base">
            <span>Về việc đánh giá kết quả rèn luyện học kỳ</span>
            <input
              type="text"
              value={formData.hocKy}
              onChange={(e) => handleField('hocKy', e.target.value)}
              placeholder="HK1"
              className="w-14 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-center font-bold text-gray-950"
            />
            <span>năm học:</span>
            <input
              type="text"
              value={formData.namHoc}
              onChange={(e) => handleField('namHoc', e.target.value)}
              placeholder="2026-2027"
              className="w-28 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none text-center font-bold text-gray-950"
            />
          </p>
          <div className="w-32 border-b border-dashed border-gray-300 mx-auto mt-2"></div>
        </div>

        {/* Nội dung biên bản */}
        <div className="space-y-4 text-sm sm:text-base">
          {/* I. Thời gian */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-gray-900">I. Thời gian:</span> Cuộc họp bắt đầu vào hồi:{' '}
            <input
              type="text"
              value={formData.gioKhoi}
              onChange={(e) => handleField('gioKhoi', e.target.value)}
              placeholder="07:30"
              className="w-20 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-semibold text-gray-900"
            />{' '}
            ngày{' '}
            <input
              type="text"
              value={formData.ngayHop}
              onChange={(e) => handleField('ngayHop', e.target.value)}
              placeholder="05"
              className="w-12 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-semibold text-gray-900"
            />{' '}
            tháng{' '}
            <input
              type="text"
              value={formData.thang}
              onChange={(e) => handleField('thang', e.target.value)}
              placeholder="08"
              className="w-12 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-semibold text-gray-900"
            />{' '}
            năm{' '}
            <input
              type="text"
              value={formData.nam}
              onChange={(e) => handleField('nam', e.target.value)}
              placeholder="2026"
              className="w-16 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-semibold text-gray-900"
            />
          </div>

          {/* II. Địa điểm */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-900 shrink-0">II. Địa điểm:</span>
            <input
              type="text"
              value={formData.diaDiem}
              onChange={(e) => handleField('diaDiem', e.target.value)}
              placeholder="Nhập địa điểm họp (ví dụ: Phòng H301 hoặc Online Teams)..."
              className="flex-1 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 py-0.5 font-semibold text-gray-900 transition-colors placeholder:text-gray-400 placeholder:font-normal min-w-[200px]"
            />
          </div>

          {/* III. Thành phần */}
          <div className="space-y-2">
            <p className="font-bold text-gray-900">III. Thành phần:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp.</li>
              <li className="flex flex-wrap items-center gap-1.5">
                <span>Tổng số người dự họp:</span>
                <input
                  type="text"
                  value={formData.tongSoDuHop}
                  onChange={(e) => handleField('tongSoDuHop', e.target.value)}
                  className="w-16 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900"
                />{' '}
                <span>người.</span>
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <span>Vắng họp:</span>
                <input
                  type="text"
                  value={formData.soVang}
                  onChange={(e) => handleField('soVang', e.target.value)}
                  className="w-14 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900"
                />{' '}
                người, lý do vắng họp:{' '}
                <input
                  type="text"
                  value={formData.lyDoVang}
                  onChange={(e) => handleField('lyDoVang', e.target.value)}
                  placeholder="Không có hoặc lý do..."
                  className="flex-1 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 text-gray-900 min-w-[180px]"
                />
              </li>
              {/* Chủ tọa */}
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">Chủ tọa:</span>
                <input
                  type="text"
                  value={formData.chuToa}
                  onChange={(e) => handleField('chuToa', e.target.value)}
                  placeholder="Nhập họ tên cố vấn..."
                  className="bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 max-w-[280px] transition-colors placeholder:text-gray-400 placeholder:font-normal"
                />
              </li>
              {/* Thư ký */}
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">Thư ký:</span>
                <input
                  type="text"
                  value={formData.thuKy}
                  onChange={(e) => handleField('thuKy', e.target.value)}
                  placeholder="Nhập họ tên thư ký..."
                  className="bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 max-w-[280px] transition-colors placeholder:text-gray-400 placeholder:font-normal"
                />
              </li>
              {/* Lớp trưởng */}
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-900">Lớp trưởng:</span>
                <input
                  type="text"
                  value={formData.tenLopTruong}
                  onChange={(e) => handleField('tenLopTruong', e.target.value)}
                  placeholder="Nhập họ tên lớp trưởng..."
                  className="bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-2 py-0.5 text-sm font-semibold text-gray-900 flex-1 max-w-[280px] transition-colors placeholder:text-gray-400 placeholder:font-normal"
                />
              </li>
            </ul>
          </div>

          {/* IV. Nội dung */}
          <div className="space-y-2 pt-2">
            <p className="font-bold text-gray-900">IV. Nội dung:</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>Lớp trưởng báo cáo kết quả tổng hợp phiếu đánh giá kết quả rèn luyện của sinh viên trong lớp.</li>
              <li>
                CVHT lớp triển khai các văn bản hướng dẫn đánh giá kết quả rèn luyện, căn cứ vào báo cáo của Ban cán sự
                lớp triển khai các bước trong quy trình đánh giá kết quả rèn luyện của sinh viên trong lớp.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Kết quả rèn luyện của các thành viên trong lớp:</span>
                <p className="italic text-xs text-gray-500 mt-1">
                  Căn cứ phiếu tự đánh giá kết quả rèn luyện của các thành viên trong lớp, ý kiến nhận xét, đánh giá của
                  CVHT lớp, BCS lớp, BCH chi đoàn, BCH chi hội (nếu có), Tổ trưởng các tổ; đối chiếu với quy chế của Bộ
                  Giáo dục và Đào tạo và quy định của Học viện, tập thể lớp nhất trí thông qua kết quả rèn luyện của các
                  thành viên trong lớp như sau:
                </p>
              </li>
            </ol>
          </div>

          {/* Bảng sinh viên trực tiếp trong Biên bản */}
          <div className="pt-2">
            <div className="overflow-x-auto rounded-xl border border-gray-300">
              {loading ? (
                <div className="py-10 text-center text-sm text-gray-400">Đang tải dữ liệu từ hệ thống...</div>
              ) : !classId ? (
                <div className="py-10 text-center text-sm text-gray-400">Tài khoản chưa được gán lớp.</div>
              ) : studentRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Chưa có sinh viên nào trong lớp.</div>
              ) : (
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50 text-xs font-bold text-gray-800 text-center">
                      <th className="py-2 px-2 border-r border-gray-300 w-10">STT</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-24">Mã số SV</th>
                      <th className="py-2 px-2 border-r border-gray-300 text-left">Họ và Tên</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-24">Ngày sinh</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-20">ĐRL SV<br/>tự đánh giá</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-20">ĐRL lớp<br/>đánh giá</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-20">Xếp loại</th>
                      <th className="py-2 px-2 border-r border-gray-300 w-20">Biểu quyết</th>
                      <th className="py-2 px-2 text-left">Ghi chú<br/><span className="text-[10px] font-normal italic text-gray-500">(kèm theo MC đối với SV xếp loại Xuất sắc, tốt, TB, yếu, kém)</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentRows.map((s, idx) => {
                      const itemId = apiRows[idx]?.id ?? String(idx);
                      return (
                        <tr key={itemId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2 px-2 border-r border-gray-200 text-center font-medium text-gray-600">{s.stt}</td>
                          <td className="py-2 px-2 border-r border-gray-200 text-center font-mono font-semibold text-gray-800">{s.maSV}</td>
                          <td className="py-2 px-2 border-r border-gray-200 font-medium text-gray-900">{s.hoTen}</td>
                          <td className="py-2 px-2 border-r border-gray-200 text-center text-xs text-gray-600">{s.ngaySinh}</td>
                          <td className="py-2 px-2 border-r border-gray-200 text-center font-bold text-blue-600">{s.drlSV > 0 ? s.drlSV : '—'}</td>
                          {/* ĐRL lớp — đọc dữ liệu từ class_score do lớp trưởng đánh giá, không chỉnh sửa tại biên bản */}
                          <td className="py-2 px-2 border-r border-gray-200 text-center font-bold text-gray-900">
                            {s.drlLop > 0 ? s.drlLop : '—'}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-200 text-center">
                            <XepLoaiBadge label={s.xepLoai} />
                          </td>
                          {/* Biểu quyết */}
                          <td className="py-2 px-2 border-r border-gray-200 text-center">
                            <input
                              type="text"
                              value={s.bieuQuyet}
                              onChange={(e) => setBieuQuyet((p) => ({ ...p, [itemId]: e.target.value }))}
                              placeholder="100%"
                              className="w-16 h-7 rounded border border-gray-300 px-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </td>
                          {/* Ghi chú */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={s.ghiChu}
                              onChange={(e) => setGhiChu((p) => ({ ...p, [itemId]: e.target.value }))}
                              placeholder="Ghi chú / MC..."
                              className="w-full h-7 rounded border border-gray-300 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Tổng kết phân loại */}
          <div className="pt-2 text-sm text-gray-900 space-y-1 pl-4">
            <p className="font-bold">- Tổng số: <span className="font-bold text-gray-900">{studentRows.length}</span> sinh viên</p>
            <p className="pl-4 font-semibold text-gray-900">Trong đó:</p>
            <div className="pl-8 space-y-1 font-semibold text-xs sm:text-sm text-gray-900">
              <p>+ Xuất sắc: <strong className="font-bold text-gray-900">{counts.xuatSac}</strong> Sinh viên</p>
              <p>+ Tốt: <strong className="font-bold text-gray-900">{counts.tot}</strong> Sinh viên</p>
              <p>+ Khá: <strong className="font-bold text-gray-900">{counts.kha}</strong> Sinh viên</p>
              <p>+ Trung bình: <strong className="font-bold text-gray-900">{counts.trungBinh}</strong> Sinh viên</p>
              <p>+ Yếu: <strong className="font-bold text-gray-900">{counts.yeu}</strong> Sinh viên</p>
            </div>
          </div>

          {/* Cuộc họp kết thúc */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800">
            <span>Cuộc họp kết thúc vào hồi:</span>
            <input
              type="text"
              value={formData.gioKetThuc}
              onChange={(e) => handleField('gioKetThuc', e.target.value)}
              placeholder="09:00"
              className="w-20 bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900"
            />
            <span>giờ, ngày {formData.ngayHop}/{formData.thang}/{formData.nam}</span>
          </div>

          {/* Chữ ký 3 bên ngay trong tờ biên bản */}
          <div className="grid grid-cols-3 gap-4 text-center pt-8 border-t border-gray-100 mt-6">
            <div>
              <p className="font-bold text-gray-900 text-sm uppercase">CỐ VẤN HỌC TẬP</p>
              <p className="text-xs italic text-gray-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center">
                <input
                  type="text"
                  value={formData.chuToa}
                  onChange={(e) => handleField('chuToa', e.target.value)}
                  placeholder="Nhập họ tên Cố vấn..."
                  className="w-full bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm uppercase">LỚP TRƯỞNG</p>
              <p className="text-xs italic text-gray-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center">
                <input
                  type="text"
                  value={formData.tenLopTruong}
                  onChange={(e) => handleField('tenLopTruong', e.target.value)}
                  placeholder="Nhập họ tên Lớp trưởng..."
                  className="w-full bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm uppercase">THƯ KÝ</p>
              <p className="text-xs italic text-gray-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center">
                <input
                  type="text"
                  value={formData.thuKy}
                  onChange={(e) => handleField('thuKy', e.target.value)}
                  placeholder="Nhập họ tên Thư ký..."
                  className="w-full bg-transparent border-b border-dashed border-gray-400 focus:border-brand-primary outline-none px-1 text-center font-bold text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <BienBanPreviewModal
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
