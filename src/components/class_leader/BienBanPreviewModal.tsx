'use client';

import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import type { BienBanFormData } from '@/utils/exportBienBan';

interface BienBanPreviewModalProps {
  data: BienBanFormData;
  onClose: () => void;
  onPrint: () => void;
  autoPrint?: boolean;
}

export function BienBanPreviewModal({ data, onClose, onPrint, autoPrint }: BienBanPreviewModalProps) {
  const counts = {
    xuatSac: data.students.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: data.students.filter((s) => s.xepLoai === 'Tốt').length,
    kha: data.students.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: data.students.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: data.students.filter((s) => s.xepLoai === 'Yếu').length,
  };

  // Trigger print only after the DOM is fully painted (double rAF).
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

  // Lock scroll on body when modal is open (only if not autoprinting silently)
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
          #bien-ban-print-area * {
            visibility: visible !important;
            font-family: "Times New Roman", Times, serif !important;
          }
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
          /* Strip overlay styling on print so parent elements don't block/hide content */
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
            <span className="text-white font-bold text-base tracking-wide">📄 Xem trước Biên bản họp lớp</span>
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
              <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG</div>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG TẠI THÀNH PHỐ ĐÀ NẴNG</div>
                <div style={{ marginTop: '2px' }}><strong>KHOA:</strong> {data.khoa || '................................'}</div>
                <div><strong>LỚP:</strong> {data.lop || '................................'}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', width: '100%', marginTop: '2px' }}>*</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', lineHeight: '1.4' }}>
                <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>Phụ lục 01</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', borderBottom: '1.5px solid #000', paddingBottom: '2px', fontWeight: 'bold' }}>
                    ĐẢNG CỘNG SẢN VIỆT NAM
                  </div>
                </div>
                <div style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', marginTop: '4px', textAlign: 'right' }}>
                  {data.diaDanh || 'Đà Nẵng'}, ngày {data.ngayHop || '......'} tháng {data.thang || '......'} năm {data.nam || '20....'}
                </div>
              </div>
            </div>

            {/* Tiêu đề */}
            <div style={{ textAlign: 'center', marginBottom: '16px', marginTop: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase' }}>
                BIÊN BẢN HỌP LỚP {data.lop}
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '13px' }}>
                Về việc đánh giá kết quả rèn luyện học kỳ {data.hocKy} năm học: {data.namHoc}
              </div>
            </div>

            {/* I, II, III */}
            <div style={{ marginBottom: '6px' }}>
              <strong>I. Thời gian:</strong> Cuộc họp bắt đầu vào hồi: <strong>{data.gioKhoi || '........'}</strong> ngày: <strong>{data.ngayHop}/{data.thang}/{data.nam}</strong>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <strong>II. Địa điểm:</strong> {data.diaDiem || '........................................................................................................'}
            </div>
            <div style={{ marginBottom: '4px' }}><strong>III. Thành phần:</strong></div>
            <div style={{ marginBottom: '4px', marginLeft: '12px' }}>
              Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp
            </div>
            <div style={{ marginBottom: '4px', marginLeft: '12px' }}>
              Tổng số người dự họp: <strong>{data.tongSoDuHop}</strong> người
            </div>
            <div style={{ marginBottom: '4px', marginLeft: '12px' }}>
              Vắng họp: <strong>{data.soVang}</strong> người, lý do vắng họp: {data.lyDoVang || '...................................................................'}
            </div>
            <div style={{ marginBottom: '4px', marginLeft: '12px' }}>Chủ tọa: <strong>{data.chuToa || '........................................................................................................'}</strong></div>
            <div style={{ marginBottom: '4px', marginLeft: '12px' }}>Thư ký: <strong>{data.thuKy || '........................................................................................................'}</strong></div>
            <div style={{ marginBottom: '8px', marginLeft: '12px' }}>Lớp trưởng: <strong>{data.tenLopTruong || '........................................................................................................'}</strong></div>

            {/* IV */}
            <div style={{ marginBottom: '6px' }}><strong>IV. Nội dung</strong></div>
            <div style={{ marginLeft: '16px', marginBottom: '6px' }}>
              1. Lớp trưởng báo cáo kết quả tổng hợp phiếu đánh giá kết quả rèn luyện của sinh viên trong lớp
            </div>
            <div style={{ marginLeft: '16px', marginBottom: '6px', textAlign: 'justify' }}>
              2. CVHT lớp triển khai các văn bản hướng dẫn đánh giá kết quả rèn luyện, căn cứ vào báo cáo của Ban cán sự lớp triển khai các bước trong quy trình đánh giá kết quả rèn luyện của sinh viên trong lớp.
            </div>
            <div style={{ marginLeft: '16px', marginBottom: '4px' }}>
              3. Kết quả rèn luyện của các thành viên trong lớp:
            </div>
            <div style={{ marginLeft: '16px', marginBottom: '10px', textAlign: 'justify', lineHeight: '1.5' }}>
              Căn cứ phiếu tự đánh giá kết quả rèn luyện của các thành viên trong lớp, ý kiến nhận xét, đánh giá của CVHT lớp, BCS lớp, BCH chi đoàn, BCH chi hội (nếu có), Tổ trưởng các tổ; đối chiếu với quy chế của Bộ Giáo dục và Đào tạo và quy định của Học viện, tập thể lớp nhất trí thông qua kết quả rèn luyện của các thành viên trong lớp như sau:
            </div>

            {/* Bảng sinh viên */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '35px', fontWeight: 'bold' }}>STT</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '85px', fontWeight: 'bold' }}>Mã số SV</th>
                  <th style={{ border: '1px solid #333', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>Họ và Tên</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '80px', fontWeight: 'bold' }}>Ngày sinh</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '65px', fontWeight: 'bold' }}>ĐRL SV tự đánh giá</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '65px', fontWeight: 'bold' }}>ĐRL lớp đánh giá</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '75px', fontWeight: 'bold' }}>Xếp loại</th>
                  <th style={{ border: '1px solid #333', padding: '5px 4px', textAlign: 'center', width: '70px', fontWeight: 'bold' }}>Biểu quyết</th>
                  <th style={{ border: '1px solid #333', padding: '5px 6px', textAlign: 'left', fontWeight: 'bold' }}>Ghi chú<br/><span style={{ fontWeight: 'normal', fontSize: '9px', fontStyle: 'italic' }}>(kèm theo MC đối với SV xếp loại Xuất sắc, tốt, TB, yếu, kém)</span></th>
                </tr>
              </thead>
              <tbody>
                {data.students.length === 0 ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} style={{ height: '26px' }}>
                      {Array.from({ length: 9 }).map((__, ci) => (
                        <td key={ci} style={{ border: '1px solid #333', padding: '3px 4px', textAlign: 'center' }}>
                          {ci === 0 ? idx + 1 : ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  data.students.map((s, i) => (
                    <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.stt}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.maSV}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{s.hoTen}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.ngaySinh}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.drlSV > 0 ? s.drlSV : ''}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center', fontWeight: 'bold' }}>{s.drlLop > 0 ? s.drlLop : ''}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.xepLoai}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 3px', textAlign: 'center' }}>{s.bieuQuyet}</td>
                      <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{s.ghiChu}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Tổng kết */}
            <div className="print-avoid-break" style={{ marginBottom: '12px', fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold' }}>Tổng số:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{data.students.length}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sinh viên</div>
              <div>Trong đó:&nbsp;&nbsp;Xuất sắc:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{counts.xuatSac}</strong>&nbsp;&nbsp;Sinh viên</div>
              <div style={{ marginLeft: '62px' }}>Tốt:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{counts.tot}</strong>&nbsp;&nbsp;Sinh viên</div>
              <div style={{ marginLeft: '62px' }}>Khá:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{counts.kha}</strong>&nbsp;&nbsp;Sinh viên</div>
              <div style={{ marginLeft: '62px' }}>Trung bình:&nbsp;&nbsp;&nbsp;<strong>{counts.trungBinh}</strong>&nbsp;&nbsp;Sinh viên</div>
              <div style={{ marginLeft: '62px' }}>Yếu:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>{counts.yeu}</strong>&nbsp;&nbsp;Sinh viên</div>
            </div>

            {/* Kết thúc */}
            <div className="print-avoid-break" style={{ marginBottom: '24px', marginTop: '12px' }}>
              Cuộc họp kết thúc vào hồi {data.gioKetThuc ? <strong>{data.gioKetThuc}</strong> : '.........'} giờ ......... phút, ngày {data.ngayHop ? <strong>{data.ngayHop}</strong> : '.......'} tháng {data.thang ? <strong>{data.thang}</strong> : '....'} năm {data.nam ? <strong>{data.nam}</strong> : '20....'}
            </div>

            {/* Chữ ký 3 bên */}
            <div className="print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '16px' }}>
              {[
                { title: 'CỐ VẤN HỌC TẬP', name: data.chuToa },
                { title: 'LỚP TRƯỞNG', name: data.tenLopTruong },
                { title: 'THƯ KÝ', name: data.thuKy },
              ].map((sig) => (
                <div key={sig.title}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{sig.title}</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#555' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: '64px' }} />
                  {sig.name && <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{sig.name}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
