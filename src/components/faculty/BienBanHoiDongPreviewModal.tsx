'use client';

import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';

export interface BienBanHoiDongStudentRow {
  stt: number;
  maSV: string;
  hoTen: string;
  ngaySinh: string;
  drlLop: number;
  drlKhoa: number;
  xepLoai: string;
  ghiChu: string;
}

export interface BienBanHoiDongFormData {
  khoa: string;
  lop: string;
  hocKy: string;
  namHoc: string;
  qdSo: string;
  qdNgay: string;
  qdThang: string;
  qdNam: string;
  tongSoHoiDong: string;
  duHopHoiDong: string;
  vangHoiDong: string;
  lyDoVangHoiDong: string;
  moiDu: string;
  chuToa: string;
  thuKy: string;
  ngayHop: string;
  thangHop: string;
  namHop: string;
  gioBatDau: string;
  diaDiem: string;
  truongKhoa: string;
  chuTichHoiDong: string;
  tenThuKy: string;
  students: BienBanHoiDongStudentRow[];
}

interface Props {
  data: BienBanHoiDongFormData;
  onClose: () => void;
  onPrint: () => void;
  autoPrint?: boolean;
}

export function BienBanHoiDongPreviewModal({ data, onClose, onPrint, autoPrint }: Props) {
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

    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        window.print();
      });
    });

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
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
      {/* ── Print CSS ─────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #bien-ban-print-area,
          #bien-ban-print-area * { visibility: visible !important; }
          #bien-ban-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 99999 !important;
            background: #fff !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .bien-ban-modal-overlay {
            display: block !important;
            position: static !important;
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            overflow: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
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
            margin: 20mm 20mm 20mm 30mm;
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                <Printer size={15} />
                In / Xuất PDF
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
            {/* Header 2 cột */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase' }}>
                <div style={{ fontWeight: 'bold' }}>PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ</div>
                <div style={{ fontWeight: 'bold' }}>QUẢN TRỊ CÔNG TẠI TỈNH QUẢNG NAM</div>
                <div><strong>KHOA:</strong> {data.khoa || '................................'}</div>
                <div style={{ fontWeight: 'bold', marginLeft: '60px', marginTop: '2px' }}>*</div>
              </div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                <div>ĐẢNG CỘNG SẢN VIỆT NAM</div>
                <div style={{ fontWeight: 'normal', letterSpacing: '2px' }}>– – – – – – – – –</div>
              </div>
            </div>

            {/* Ngày tháng */}
            <div style={{ textAlign: 'right', fontStyle: 'italic', marginBottom: '12px', marginTop: '8px' }}>
              Quảng Nam, ngày {data.ngayHop || '......'} tháng {data.thangHop || '......'} năm 20{data.namHop || '....'}
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
