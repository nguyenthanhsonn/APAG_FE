'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Printer,
  RefreshCw,
  Info,
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
  return Number((item as any).studentScore ?? (item as any).totalScore ?? (item as any).svScore ?? 0);
}

function getScoreLop(item: AdminEvaluationItem): number {
  return Number((item as any).classScore ?? (item as any).finalScore ?? (item as any).classLeaderScore ?? 0);
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

  /* ─── Overridable drlLop per row ─── */
  const [drlLopOverride, setDrlLopOverride] = useState<Record<string, number>>({});
  const [bieuQuyet, setBieuQuyet] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});

  /* ─── Form state ─── */
  const today = useMemo(() => new Date(), []);
  const [formData, setFormData] = useState({
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
      const lopScoreDefault = getScoreLop(item) || mapped.score;
      const lopScore = drlLopOverride[item.id] !== undefined ? drlLopOverride[item.id] : lopScoreDefault;
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
    }), [apiRows, drlLopOverride, bieuQuyet, ghiChu]);

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
            <p className="font-bold uppercase tracking-wider text-gray-900">ĐẢNG CỘNG SẢN VIỆT NAM</p>
            <div className="w-24 h-0.5 bg-gray-900 mx-auto sm:mr-0 my-1"></div>
            <p className="italic text-gray-500 mt-2">
              Quảng Nam, ngày <span className="font-semibold text-gray-900">{formData.ngayHop}</span> tháng <span className="font-semibold text-gray-900">{formData.thang}</span> năm <span className="font-semibold text-gray-900">{formData.nam}</span>
            </p>
          </div>
        </div>

        {/* Tên biên bản */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900">BIÊN BẢN HỌP LỚP</h2>
          <p className="italic text-gray-600">
            Về việc đánh giá kết quả rèn luyện học kỳ <span className="font-semibold text-gray-950">{formData.hocKy}</span> năm học: <span className="font-semibold text-gray-950">{formData.namHoc}</span>
          </p>
          <div className="w-32 border-b border-dashed border-gray-300 mx-auto mt-2"></div>
        </div>

        {/* Nội dung biên bản */}
        <div className="space-y-4 text-sm sm:text-base">
          {/* I. Thời gian */}
          <p>
            <span className="font-bold text-gray-900">I. Thời gian:</span> Cuộc họp bắt đầu vào hồi:{' '}
            <span className="font-semibold text-gray-900">{formData.gioKhoi}</span> ngày{' '}
            <span className="font-semibold text-gray-900">{formData.ngayHop}</span> tháng{' '}
            <span className="font-semibold text-gray-900">{formData.thang}</span> năm{' '}
            <span className="font-semibold text-gray-900">{formData.nam}</span>
          </p>

          {/* II. Địa điểm */}
          <p>
            <span className="font-bold text-gray-900">II. Địa điểm:</span>{' '}
            <span className="font-semibold text-gray-900">{formData.diaDiem || 'Phòng học của lớp'}</span>
          </p>

          {/* III. Thành phần */}
          <div className="space-y-2">
            <p className="font-bold text-gray-900">III. Thành phần:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp.</li>
              <li>
                Tổng số người dự họp:{' '}
                <span className="font-bold text-gray-900">{formData.tongSoDuHop || studentRows.length}</span> /{' '}
                <span className="font-bold text-gray-900">{studentRows.length}</span> người.
              </li>
              <li>
                Vắng họp: <span className="font-bold text-gray-900">{formData.soVang}</span> người, lý do vắng họp:{' '}
                <span className="font-bold text-gray-900">{formData.lyDoVang || 'Không có'}</span>.
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
        </div>
      </div>

      {/* ── SECTION 2: Bảng sinh viên ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-gray-800">Danh sách kết quả rèn luyện</p>
            <p className="text-xs text-gray-500 mt-0.5">ĐRL lớp đánh giá có thể chỉnh sửa trực tiếp. Xếp loại tính tự động.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
            <Info size={13} className="text-blue-400 shrink-0" />
            <span>Cột <strong>Biểu quyết</strong> và <strong>Ghi chú</strong> nhập trực tiếp vào ô</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center text-sm text-gray-400">Đang tải dữ liệu từ hệ thống...</div>
          ) : !classId ? (
            <div className="py-14 text-center text-sm text-gray-400">Tài khoản chưa được gán lớp.</div>
          ) : studentRows.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-400">Chưa có sinh viên nào trong lớp.</div>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <th className="py-3 px-3 text-center w-10">STT</th>
                  <th className="py-3 px-3">Mã số SV</th>
                  <th className="py-3 px-3">Họ và Tên</th>
                  <th className="py-3 px-3 text-center">Ngày sinh</th>
                  <th className="py-3 px-3 text-center">ĐRL SV<br/>tự đánh giá</th>
                  <th className="py-3 px-3 text-center">ĐRL lớp<br/>đánh giá</th>
                  <th className="py-3 px-3 text-center">Xếp loại</th>
                  <th className="py-3 px-3 text-center">Biểu quyết</th>
                  <th className="py-3 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentRows.map((s, idx) => {
                  const itemId = apiRows[idx]?.id ?? String(idx);
                  return (
                    <tr key={itemId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-gray-500 text-xs font-semibold">{s.stt}</td>
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-gray-700">{s.maSV}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{s.hoTen}</td>
                      <td className="py-2.5 px-3 text-center text-xs text-gray-600">{s.ngaySinh}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-600">{s.drlSV > 0 ? s.drlSV : '—'}</td>
                      {/* ĐRL lớp — editable */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={s.drlLop || ''}
                          onChange={(e) => {
                            const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setDrlLopOverride((p) => ({ ...p, [itemId]: v }));
                          }}
                          className="w-16 h-7 rounded-lg border border-gray-300 px-1.5 text-center text-sm font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <XepLoaiBadge label={s.xepLoai} />
                      </td>
                      {/* Biểu quyết */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={s.bieuQuyet}
                          onChange={(e) => setBieuQuyet((p) => ({ ...p, [itemId]: e.target.value }))}
                          placeholder="VD: 100%"
                          className="w-20 h-7 rounded-lg border border-gray-300 px-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </td>
                      {/* Ghi chú */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={s.ghiChu}
                          onChange={(e) => setGhiChu((p) => ({ ...p, [itemId]: e.target.value }))}
                          placeholder="Ghi chú / MC..."
                          className="w-full h-7 rounded-lg border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary stats */}
        {studentRows.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-gray-700">Tổng: {studentRows.length} SV —</span>
            {[
              { label: 'Xuất sắc', count: counts.xuatSac, color: 'text-violet-700 bg-violet-50 border-violet-100' },
              { label: 'Tốt', count: counts.tot, color: 'text-blue-700 bg-blue-50 border-blue-100' },
              { label: 'Khá', count: counts.kha, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
              { label: 'Trung bình', count: counts.trungBinh, color: 'text-amber-700 bg-amber-50 border-amber-100' },
              { label: 'Yếu', count: counts.yeu, color: 'text-rose-700 bg-rose-50 border-rose-100' },
            ].map(({ label, count, color }) => (
              <span key={label} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                {label}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}
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
