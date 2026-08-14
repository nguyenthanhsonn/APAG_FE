'use client';

import { useEffect } from 'react';
import { X, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import type { BienBanHoiDongFormData } from '@/utils/exportBienBan';
import type { FacultyReportExportFormat } from '@/api/API_Faculty';

export type { BienBanHoiDongFormData, BienBanHoiDongStudentRow } from '@/utils/exportBienBan';

interface Props {
  data: BienBanHoiDongFormData;
  onClose: () => void;
  onPrint: () => void;
  onExport?: (format: FacultyReportExportFormat) => void;
  exportingFormat?: FacultyReportExportFormat | null;
  autoPrint?: boolean;
}

export function BienBanHoiDongPreviewModal({ data, onClose, onPrint, onExport, exportingFormat, autoPrint }: Props) {
  const counts = {
    xuatSac: data.students.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: data.students.filter((s) => s.xepLoai === 'Tốt').length,
    kha: data.students.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: data.students.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: data.students.filter((s) => s.xepLoai === 'Yếu').length,
  };

  // Trigger print after DOM is fully painted
  useEffect(() => {
    if (!autoPrint) return;

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        window.print();
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelAnimationFrame(raf1);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [autoPrint, onClose]);

  // Lock scroll on body when modal is open
  useEffect(() => {
    if (autoPrint) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [autoPrint]);

  return (
    <>
      {/* ── Scoped Print Stylesheet ────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #bien-ban-print-area,
          #bien-ban-print-area * {
            visibility: visible !important;
          }
          #bien-ban-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 20mm 15mm 20mm 25mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
            font-size: 13pt !important;
            line-height: 1.5 !important;
            z-index: 99999 !important;
          }
          .bien-ban-no-print {
            display: none !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* ── Backdrop + Modal Container ────────────────────────────── */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className={`bien-ban-modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4 ${autoPrint ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <div className="w-full max-w-[210mm] flex flex-col">
          {/* Header Bar */}
          <div className="bien-ban-no-print flex items-center justify-between rounded-t-2xl bg-gray-900 px-6 py-3 shadow-lg">
            <span className="text-white font-bold text-base tracking-wide">📄 Xem trước Biên bản họp Hội đồng</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onExport?.('word')}
                disabled={!onExport || exportingFormat !== null}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={15} />
                {exportingFormat === 'word' ? 'Đang xuất...' : 'Xuất Word (.docx)'}
              </button>
              <button
                type="button"
                onClick={() => onExport?.('excel')}
                disabled={!onExport || exportingFormat !== null}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet size={15} />
                {exportingFormat === 'excel' ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
              >
                <Printer size={15} />
                In ấn
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Paper Content */}
          <div
            id="bien-ban-print-area"
            className="w-full bg-white shadow-2xl rounded-b-2xl"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '13px', lineHeight: '1.6', padding: '30mm 20mm 20mm 30mm' }}
          >
            {/* Header 2 cột: Cấp trên & Quốc hiệu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ color: '#111827', lineHeight: '1.32', textAlign: 'center', maxWidth: '360px', minWidth: '300px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'normal', textTransform: 'uppercase' }}>HỌC VIỆN HÀNH CHÍNH</div>
                <div style={{ fontSize: '16px', fontWeight: 'normal', textTransform: 'uppercase' }}>VÀ QUẢN TRỊ CÔNG</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '6px' }}>PHÂN HIỆU HỌC VIỆN</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>TẠI THÀNH PHỐ ĐÀ NẴNG</div>
                <div style={{ fontWeight: 'bold', textAlign: 'center', marginTop: '8px', fontSize: '16px' }}>*</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '16px', lineHeight: '1.3', minWidth: '280px' }}>
                <div style={{ fontStyle: 'italic', fontWeight: 600, marginBottom: '10px' }}>Phụ lục 01</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', borderBottom: '2px solid #000', paddingBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    ĐẢNG CỘNG SẢN VIỆT NAM
                  </div>
                </div>
              </div>
            </div>

            {/* Dòng Khoa (trái) và Ngày tháng (phải) - NGANG HÀNG NHAU */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                <strong>KHOA:</strong> {data.khoa || '................................'}
              </div>
              <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '13px', lineHeight: '1.4' }}>
                Đà Nẵng, ngày {data.ngayHop || '......'} tháng {data.thangHop || '......'} năm 20{data.namHop || '....'}
              </div>
            </div>

            {/* Tiêu đề */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase' }}>
                BIÊN BẢN HỌP HỘI ĐỒNG
              </div>
              <div style={{ fontStyle: 'normal', fontSize: '13px' }}>
                Về việc đánh giá kết quả rèn luyện của sinh viên lớp: <strong>{data.lop}</strong>
              </div>
              <div style={{ fontStyle: 'normal', fontSize: '13px' }}>
                học kỳ: <strong>{data.hocKy}</strong> năm học: <strong>{data.namHoc}</strong>
              </div>
            </div>

            <div style={{ height: '12px' }} />

            {/* I, II, III */}
            <div style={{ marginBottom: '6px' }}>
              <strong>I. Thời gian:</strong> Cuộc họp bắt đầu vào hồi {data.gioBatDau || '.........'} ngày {data.ngayHop || '.......'} tháng {data.thangHop || '.......'} năm 20{data.namHop || '.....'}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <strong>II. Địa điểm:</strong> {data.diaDiem || '................................................................................'}
            </div>
            <div style={{ marginBottom: '4px' }}><strong>III. Thành phần:</strong></div>
            <div style={{ marginBottom: '4px', textAlign: 'justify' }}>
              Thành viên Hội đồng đánh giá kết quả rèn luyện cấp Khoa (QĐ số: <strong>{data.qdSo || '...........'}</strong> ngày: <strong>{data.qdNgay || '......'}</strong> tháng: <strong>{data.qdThang || '......'}</strong> năm: <strong>{data.qdNam || '........'}</strong>)
            </div>
            <div style={{ marginBottom: '4px' }}>
              Tổng số: <strong>{data.tongSoHoiDong || '......'}</strong> người
            </div>
            <div style={{ marginBottom: '4px' }}>
              Số người dự họp: <strong>{data.duHopHoiDong || '......'}</strong> người, vắng họp: <strong>{data.vangHoiDong || '......'}</strong> người, lý do vắng họp: {data.lyDoVangHoiDong || '................................'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              Mời dự: {data.moiDu || '................................................................................'}
            </div>
            <div style={{ marginBottom: '4px' }}>Chủ tọa: {data.chuToa || '................................................................................'}</div>
            <div style={{ marginBottom: '12px' }}>Thư ký: {data.thuKy || '................................................................................'}</div>

            {/* IV */}
            <div style={{ marginBottom: '6px' }}><strong>IV. Nội dung</strong></div>
            <div style={{ marginBottom: '6px', textAlign: 'justify' }}>
              Đánh giá kết quả rèn luyện của sinh viên lớp <strong>{data.lop}</strong> thuộc Khoa <strong>{data.khoa}</strong>, học kỳ <strong>{data.hocKy}</strong> năm học <strong>{data.namHoc}</strong>.
            </div>
            <div style={{ marginBottom: '10px', textAlign: 'justify' }}>
              Căn cứ biên bản họp lớp, ý kiến của các thành viên tham dự cuộc họp, đối chiếu với Quy chế của Bộ Giáo dục Đào tạo và quy định của Học viện, Hội đồng đánh giá kết quả rèn luyện Khoa nhất trí đánh giá kết quả rèn luyện của sinh viên lớp <strong>{data.lop}</strong> như sau:
            </div>

            {/* Bảng sinh viên */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  {['STT', 'Mã số SV', 'Họ và Tên', 'Ngày sinh', 'ĐRL lớp đánh giá', 'ĐRL HĐ Khoa ĐG', 'Xếp loại', 'Ghi chú (kèm theo minh chứng đối với SV xếp loại XS, tốt, TB, yếu, kém)'].map((h) => (
                    <th key={h} style={{ border: '1px solid #333', padding: '4px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.students.length === 0 ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} style={{ height: '24px' }}>
                      {Array.from({ length: 8 }).map((__, ci) => (
                        <td key={ci} style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>
                          {ci === 0 ? idx + 1 : ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  data.students.map((s, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{s.stt}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{s.maSV}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px' }}>{s.hoTen}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{s.ngaySinh}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{s.drlLop > 0 ? s.drlLop : ''}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center', fontWeight: 'bold' }}>{s.drlKhoa > 0 ? s.drlKhoa : ''}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px', textAlign: 'center' }}>{s.xepLoai}</td>
                      <td style={{ border: '1px solid #ccc', padding: '3px 5px' }}>{s.ghiChu}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cuộc họp kết thúc */}
            <div className="print-avoid-break" style={{ marginBottom: '16px' }}>
              Cuộc họp kết thúc vào hồi .... giờ .... phút ngày ... tháng   năm...........
            </div>

            {/* Tổng kết */}
            <div className="print-avoid-break" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '3px', marginLeft: '30px' }}>- Tổng số: <strong>{data.students.length}</strong> sinh viên</div>
              <div style={{ marginBottom: '1px', marginLeft: '50px' }}>Trong đó:</div>
              <div style={{ marginLeft: '70px', marginBottom: '1px' }}>+ Xuất sắc: <strong>{counts.xuatSac}</strong> Sinh viên</div>
              <div style={{ marginLeft: '70px', marginBottom: '1px' }}>+ Tốt:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.tot}</strong> Sinh viên</div>
              <div style={{ marginLeft: '70px', marginBottom: '1px' }}>+ Khá:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.kha}</strong> Sinh viên</div>
              <div style={{ marginLeft: '70px', marginBottom: '1px' }}>+ Trung bình: <strong>{counts.trungBinh}</strong> Sinh viên</div>
              <div style={{ marginLeft: '70px', marginBottom: '12px' }}>+ Yếu:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{counts.yeu}</strong> Sinh viên</div>
            </div>

            {/* Chữ ký */}
            <div className="print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '16px' }}>
              {[
                { title: 'TRƯỞNG KHOA', name: data.truongKhoa },
                { title: 'CHỦ TỊCH HĐ', name: data.chuTichHoiDong },
                { title: 'THƯ KÝ', name: data.tenThuKy },
              ].map((sig) => (
                <div key={sig.title}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{sig.title}</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#555' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: '65px' }} />
                  {sig.name && <div style={{ fontWeight: 'bold' }}>{sig.name}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
