import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeightRule,
  convertInchesToTwip,
} from 'docx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface BienBanStudentRow {
  stt: number;
  maSV: string;
  hoTen: string;
  ngaySinh: string;
  drlSV: number;
  drlLop: number;
  xepLoai: string;
  bieuQuyet: string;
  ghiChu: string;
}

export interface BienBanFormData {
  khoa: string;
  lop: string;
  diaDanh?: string;
  ngayHop: string; // dd/MM/yyyy
  thang: string;
  nam: string;
  hocKy: string;
  namHoc: string;
  gioKhoi: string;
  gioKetThuc: string;
  diaDiem: string;
  tongSoDuHop: string;
  soVang: string;
  lyDoVang: string;
  chuToa: string;
  thuKy: string;
  tenLopTruong: string;
  students: BienBanStudentRow[];
}

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
  qdSo?: string;
  qdNgay?: string;
  qdThang?: string;
  qdNam?: string;
  tongSoHoiDong?: string;
  duHopHoiDong?: string;
  vangHoiDong?: string;
  lyDoVangHoiDong?: string;
  moiDu?: string;
  chuToa?: string;
  thuKy?: string;
  ngayHop?: string;
  thangHop?: string;
  namHop?: string;
  gioBatDau?: string;
  diaDiem?: string;
  truongKhoa?: string;
  chuTichHoiDong?: string;
  tenThuKy?: string;
  students: BienBanHoiDongStudentRow[];
}

function getClassificaionCounts(students: { xepLoai: string }[]) {
  return {
    xuatSac: students.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: students.filter((s) => s.xepLoai === 'Tốt').length,
    kha: students.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: students.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: students.filter((s) => s.xepLoai === 'Yếu').length,
  };
}

function txt(text: string, bold = false, size = 24, italic = false, underline = false): TextRun {
  return new TextRun({
    text,
    bold,
    size,
    italics: italic,
    font: 'Times New Roman',
    underline: underline ? { type: 'single' } : undefined,
  });
}

function para(
  runs: TextRun[],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  spacingBefore = 0,
  spacingAfter = 80,
  indent?: { left?: number; firstLine?: number },
): Paragraph {
  return new Paragraph({
    children: runs,
    alignment,
    spacing: { before: spacingBefore, after: spacingAfter, line: 276 },
    indent: indent ? { left: indent.left, firstLine: indent.firstLine } : undefined,
  });
}

function cell(text: string, bold = false, colSpan = 1, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [txt(text, bold, 20)], alignment: AlignmentType.CENTER })],
    columnSpan: colSpan,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

const NO_TABLE_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const NO_CELL_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

// ─────────────────────────────────────────────────────────────
// 1. BIÊN BẢN HỌP LỚP (Word & Excel)
// ─────────────────────────────────────────────────────────────

export async function exportBienBanDocx(data: BienBanFormData) {
  const counts = getClassificaionCounts(data.students);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('HỌC VIỆN HÀNH CHÍNH', false, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('VÀ QUẢN TRỊ CÔNG', false, 20)], AlignmentType.CENTER, 0, 20),
              para([txt('PHÂN HIỆU HỌC VIỆN', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('TẠI THÀNH PHỐ ĐÀ NẴNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('*', true, 20)], AlignmentType.CENTER, 0, 40),
            ],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('Phụ lục 01', false, 20, true)], AlignmentType.RIGHT, 0, 10),
              para([txt('ĐẢNG CỘNG SẢN VIỆT NAM', true, 20, false, true)], AlignmentType.RIGHT, 0, 20),
            ],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt(`KHOA: ${data.khoa || '................................'}`, true, 22)], AlignmentType.LEFT, 0, 10),
              para([txt(`LỚP: ${data.lop || '................................'}`, true, 22)], AlignmentType.LEFT, 0, 10),
            ],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para(
                [txt(`${data.diaDanh || 'Đà Nẵng'}, ngày ${data.ngayHop || '...'} tháng ${data.thang || '...'} năm ${data.nam || '20...'}`, false, 22, true)],
                AlignmentType.RIGHT,
                0,
                10,
              ),
            ],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
    ],
  });

  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: convertInchesToTwip(0.4), rule: HeightRule.ATLEAST },
    children: [
      cell('STT', true, 1, 400),
      cell('Mã số SV', true, 1, 900),
      cell('Họ và Tên', true, 1, 1800),
      cell('Ngày sinh', true, 1, 800),
      cell('ĐRL SV tự đánh giá', true, 1, 900),
      cell('ĐRL lớp đánh giá', true, 1, 900),
      cell('Xếp loại', true, 1, 700),
      cell('Biểu quyết', true, 1, 700),
      cell('Ghi chú', true, 1, 1200),
    ],
  });

  const dataRows = data.students.map(
    (s) =>
      new TableRow({
        children: [
          cell(String(s.stt)),
          cell(s.maSV),
          cell(s.hoTen),
          cell(s.ngaySinh),
          cell(s.drlSV > 0 ? String(s.drlSV) : ''),
          cell(s.drlLop > 0 ? String(s.drlLop) : ''),
          cell(s.xepLoai),
          cell(s.bieuQuyet),
          cell(s.ghiChu),
        ],
      }),
  );

  const studentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('CỐ VẤN HỌC TẬP', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('LỚP TRƯỞNG', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('THƯ KÝ', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
      new TableRow({
        height: { value: convertInchesToTwip(1.2), rule: HeightRule.ATLEAST },
        children: [
          new TableCell({ children: [para([txt(data.chuToa)], AlignmentType.CENTER)], borders: NO_CELL_BORDERS }),
          new TableCell({ children: [para([txt(data.tenLopTruong)], AlignmentType.CENTER)], borders: NO_CELL_BORDERS }),
          new TableCell({ children: [para([txt(data.thuKy)], AlignmentType.CENTER)], borders: NO_CELL_BORDERS }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
            margin: {
              top: convertInchesToTwip(0.79),
              bottom: convertInchesToTwip(0.79),
              left: convertInchesToTwip(1.18),
              right: convertInchesToTwip(0.79),
            },
          },
        },
        children: [
          headerTable,
          para([], AlignmentType.CENTER, 0, 100),
          para([txt(`BIÊN BẢN HỌP LỚP ${data.lop}`, true, 26)], AlignmentType.CENTER, 100, 80),
          para(
            [txt(`Về việc đánh giá kết quả rèn luyện học kỳ ${data.hocKy} năm học: ${data.namHoc}`, false, 24, true)],
            AlignmentType.CENTER,
            0,
            200,
          ),
          para([txt(`I. Thời gian: Cuộc họp bắt đầu vào hồi: ${data.gioKhoi} ngày: ${data.ngayHop}/${data.thang}/${data.nam}`, false)]),
          para([txt(`II. Địa điểm: ${data.diaDiem}`, false)]),
          para([txt('III. Thành phần:', false)]),
          para(
            [txt('Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para([txt(`Tổng số người dự họp: ${data.tongSoDuHop} người`, false)]),
          para([txt(`Vắng họp: ${data.soVang} người, lý do vắng họp: ${data.lyDoVang}`, false)]),
          para([txt(`Chủ tọa: ${data.chuToa}`, false)]),
          para([txt(`Thư ký: ${data.thuKy}`, false)]),
          para([txt(`Lớp trưởng: ${data.tenLopTruong}`, false)]),
          para([]),
          para([txt('IV. Nội dung', false)]),
          para(
            [txt('1. Lớp trưởng báo cáo kết quả tổng hợp phiếu đánh giá kết quả rèn luyện của sinh viên trong lớp', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('2. CVHT lớp triển khai các văn bản hướng dẫn đánh giá kết quả rèn luyện, căn cứ vào báo cáo của Ban cán sự lớp triển khai các bước trong quy trình đánh giá kết quả rèn luyện của sinh viên trong lớp.', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('3. Kết quả rèn luyện của các thành viên trong lớp:', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('Căn cứ phiếu tự đánh giá kết quả rèn luyện của các thành viên trong lớp, ý kiến nhận xét, đánh giá của CVHT lớp, BCS lớp, BCH chi đoàn, BCH chi hội (nếu có), Tổ trưởng các tổ; đối chiếu với quy chế của Bộ Giáo dục và Đào tạo và quy định của Học viện, tập thể lớp nhất trí thông qua kết quả rèn luyện của các thành viên trong lớp như sau:', false)],
            AlignmentType.LEFT,
            0,
            160,
            { left: convertInchesToTwip(0.3) },
          ),
          studentTable,
              para([txt(`- Tổng số: ${data.students.length} sinh viên`, false)], AlignmentType.LEFT, 80, 40, { left: convertInchesToTwip(0.4) }),
          para([txt('Trong đó:', false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.6) }),
          para([txt(`+ Xuất sắc: ${counts.xuatSac} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Tốt:         ${counts.tot} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Khá:         ${counts.kha} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Trung bình:  ${counts.trungBinh} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Yếu:         ${counts.yeu} Sinh viên`, false)], AlignmentType.LEFT, 0, 120, { left: convertInchesToTwip(0.8) }),
          para(
            [txt('Cuộc họp kết thúc vào hồi.........giờ..........phút, ngày.......tháng.... năm', false)],
            AlignmentType.LEFT,
            0,
            200,
            { left: convertInchesToTwip(0.3) },
          ),
          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BienBan_HopLop_${(data.lop || 'lop').replace(/\s+/g, '_')}.docx`);
}

export function exportBienBanExcel(data: BienBanFormData) {
  const counts = getClassificaionCounts(data.students);
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['HỌC VIỆN HÀNH CHÍNH', '', '', 'Phụ lục 01', '', '', '', ''],
    ['VÀ QUẢN TRỊ CÔNG', '', '', 'ĐẢNG CỘNG SẢN VIỆT NAM', '', '', '', ''],
    ['PHÂN HIỆU HỌC VIỆN', '', '', '', '', '', '', ''],
    ['HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', '', '', '', '', '', '', ''],
    ['TẠI THÀNH PHỐ ĐÀ NẴNG', '', '', '', '', '', '', ''],
    ['*', '', '', '', '', '', '', ''],
    [],
    [`KHOA: ${data.khoa || '................................'}`, '', '', `${data.diaDanh || 'Đà Nẵng'}, ngày ${data.ngayHop || '......'} tháng ${data.thang || '.....'} năm ${data.nam || '20....'}`, '', '', '', ''],
    [`LỚP: ${data.lop || '................................'}`, '', '', '', '', '', '', ''],
    [],
    [`BIÊN BẢN HỌP LỚP ${data.lop || ''}`],
    [`Về việc đánh giá kết quả rèn luyện học kỳ ${data.hocKy || '.........'} năm học ${data.namHoc || '..........'}`],
    ['----------'],
    [],
    [`I. Thời gian: Cuộc họp bắt đầu vào hồi ${data.gioKhoi || '07:30'} đến ${data.gioKetThuc || '09:00'}, ngày ${data.ngayHop || '......'}/${data.thang || '.....'}/${data.nam || '....'}`],
    [`II. Địa điểm: ${data.diaDiem || 'Phòng học của lớp'}`],
    ['III. Thành phần:'],
    ['Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp'],
    [`Tổng số người dự họp: ${data.tongSoDuHop || data.students.length} người, vắng họp: ${data.soVang || '0'} người, lý do vắng họp: ${data.lyDoVang || 'Không có'}`],
    [`Chủ tọa: ${data.chuToa || ''}`],
    [`Thư ký: ${data.thuKy || ''}`],
    [`Lớp trưởng: ${data.tenLopTruong || ''}`],
    [],
    ['IV. Nội dung'],
    ['1. Lớp trưởng báo cáo kết quả tổng hợp phiếu đánh giá kết quả rèn luyện của sinh viên trong lớp.'],
    ['2. CVHT lớp triển khai các văn bản hướng dẫn đánh giá kết quả rèn luyện, căn cứ vào báo cáo của Ban cán sự lớp triển khai các bước trong quy trình đánh giá kết quả rèn luyện của sinh viên trong lớp.'],
    [`3. Căn cứ phiếu tự đánh giá kết quả rèn luyện của các thành viên trong lớp, ý kiến nhận xét, đánh giá của CVHT lớp, BCS lớp, BCH chi đoàn... đối chiếu với quy chế của Bộ Giáo dục và Đào tạo và quy định của Học viện, tập thể lớp nhất trí thông qua kết quả rèn luyện của các thành viên trong lớp ${data.lop || ''} như sau:`],
    [],
    // Row 28-29 Header
    ['STT', 'Mã số SV', 'Họ và Tên', 'Ngày sinh', 'ĐRL SV tự đánh giá', 'ĐRL lớp đánh giá', 'Xếp loại', 'Ghi chú (kèm theo minh chứng đối với những SV xếp loại: loại XS, tốt, TB, Yếu, kém)'],
    ['', '', '', '', '', '', '', ''],
    ...data.students.map((s) => [
      s.stt,
      s.maSV,
      s.hoTen,
      s.ngaySinh,
      s.drlSV > 0 ? s.drlSV : '',
      s.drlLop > 0 ? s.drlLop : '',
      s.xepLoai,
      s.ghiChu || s.bieuQuyet || '',
    ]),
    [],
    [`- Tổng số: ${data.students.length} sinh viên`],
    [`+ Xuất sắc: ${counts.xuatSac} sinh viên`],
    [`+ Tốt: ${counts.tot} sinh viên`],
    [`+ Khá: ${counts.kha} sinh viên`],
    [`+ Trung bình: ${counts.trungBinh} sinh viên`],
    [`+ Yếu: ${counts.yeu} sinh viên`],
    [],
    ['', 'CỐ VẤN HỌC TẬP', '', 'LỚP TRƯỞNG', '', '', 'THƯ KÝ', ''],
    ['', '(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', ''],
    [],
    [],
    ['', data.chuToa || '', '', data.tenLopTruong || '', '', '', data.thuKy || '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 35 },
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 0, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 7 } },
    { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } },
    { s: { r: 12, c: 0 }, e: { r: 12, c: 7 } },
    { s: { r: 13, c: 0 }, e: { r: 13, c: 7 } },
    { s: { r: 14, c: 0 }, e: { r: 14, c: 7 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 7 } },
    { s: { r: 16, c: 0 }, e: { r: 16, c: 7 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 7 } },
    { s: { r: 19, c: 0 }, e: { r: 19, c: 7 } },
    { s: { r: 20, c: 0 }, e: { r: 20, c: 7 } },
    { s: { r: 21, c: 0 }, e: { r: 21, c: 7 } },
    { s: { r: 22, c: 0 }, e: { r: 22, c: 7 } },
    // Table Header merges
    { s: { r: 24, c: 0 }, e: { r: 25, c: 0 } },
    { s: { r: 24, c: 1 }, e: { r: 25, c: 1 } },
    { s: { r: 24, c: 2 }, e: { r: 25, c: 2 } },
    { s: { r: 24, c: 3 }, e: { r: 25, c: 3 } },
    { s: { r: 24, c: 4 }, e: { r: 25, c: 4 } },
    { s: { r: 24, c: 5 }, e: { r: 25, c: 5 } },
    { s: { r: 24, c: 6 }, e: { r: 25, c: 6 } },
    { s: { r: 24, c: 7 }, e: { r: 25, c: 7 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bien_Ban_Hop_Lop');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `BienBan_HopLop_${(data.lop || 'lop').replace(/\s+/g, '_')}.xlsx`
  );
}

// ─────────────────────────────────────────────────────────────
// 2. BIÊN BẢN HỌP HỘI ĐỒNG (Word & Excel)
// ─────────────────────────────────────────────────────────────

export async function exportBienBanHoiDongDocx(data: BienBanHoiDongFormData) {
  const counts = getClassificaionCounts(data.students);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('HỌC VIỆN HÀNH CHÍNH', false, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('VÀ QUẢN TRỊ CÔNG', false, 20)], AlignmentType.CENTER, 0, 20),
              para([txt('PHÂN HIỆU HỌC VIỆN', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('TẠI THÀNH PHỐ ĐÀ NẴNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('*', true, 20)], AlignmentType.CENTER, 0, 40),
            ],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('Phụ lục 01', false, 20, true)], AlignmentType.RIGHT, 0, 10),
              para([txt('ĐẢNG CỘNG SẢN VIỆT NAM', true, 20, false, true)], AlignmentType.RIGHT, 0, 20),
            ],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt(`KHOA: ${data.khoa || '................................'}`, true, 22)], AlignmentType.LEFT, 0, 10),
            ],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para(
                [txt(`Đà Nẵng, ngày ${data.ngayHop || '...'} tháng ${data.thangHop || '...'} năm 20${data.namHop || '..'}`, false, 22, true)],
                AlignmentType.RIGHT,
                0,
                10,
              ),
            ],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
    ],
  });

  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: convertInchesToTwip(0.4), rule: HeightRule.ATLEAST },
    children: [
      cell('STT', true, 1, 400),
      cell('Mã số SV', true, 1, 1000),
      cell('Họ và Tên', true, 1, 2000),
      cell('Ngày sinh', true, 1, 900),
      cell('ĐRL lớp đánh giá', true, 1, 1000),
      cell('ĐRL khoa đánh giá', true, 1, 1000),
      cell('Xếp loại', true, 1, 800),
      cell('Ghi chú', true, 1, 1400),
    ],
  });

  const dataRows = data.students.map(
    (s) =>
      new TableRow({
        children: [
          cell(String(s.stt)),
          cell(s.maSV),
          cell(s.hoTen),
          cell(s.ngaySinh),
          cell(s.drlLop > 0 ? String(s.drlLop) : ''),
          cell(s.drlKhoa > 0 ? String(s.drlKhoa) : ''),
          cell(s.xepLoai),
          cell(s.ghiChu),
        ],
      }),
  );

  const studentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('THƯ KÝ', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 20, true)], AlignmentType.CENTER),
              para([], AlignmentType.CENTER, 0, 500),
              para([txt(data.tenThuKy || data.thuKy || '', true)], AlignmentType.CENTER),
            ],
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('CHỦ TỊCH HỘI ĐỒNG', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 20, true)], AlignmentType.CENTER),
              para([], AlignmentType.CENTER, 0, 500),
              para([txt(data.chuTichHoiDong || data.truongKhoa || '', true)], AlignmentType.CENTER),
            ],
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
            margin: {
              top: convertInchesToTwip(0.79),
              bottom: convertInchesToTwip(0.79),
              left: convertInchesToTwip(1.18),
              right: convertInchesToTwip(0.79),
            },
          },
        },
        children: [
          headerTable,
          para([], AlignmentType.CENTER, 0, 100),
          para([txt(`BIÊN BẢN HỌP HỘI ĐỒNG`, true, 26)], AlignmentType.CENTER, 100, 80),
          para(
            [txt(`Về việc đánh giá kết quả rèn luyện của sinh viên lớp: ${data.lop}`, false, 24, true)],
            AlignmentType.CENTER,
            0,
            200,
          ),
          para([txt(`I. Thời gian, địa điểm: Bắt đầu vào hồi ${data.gioBatDau || '...'} tại ${data.diaDiem || '...'}`)]),
          para([txt(`II. Thành phần Hội đồng: Có mặt ${data.duHopHoiDong || '...'} / ${data.tongSoHoiDong || '...'} thành viên`)]),
          para([txt(`- Chủ tọa: ${data.chuToa || ''}`)]),
          para([txt(`- Thư ký: ${data.thuKy || ''}`)]),
          para([]),
          para([txt('III. Nội dung:', true)]),
          para([txt('Hội đồng đã xem xét và nhất trí thông qua kết quả rèn luyện của sinh viên như sau:')]),
          studentTable,
          para([]),
          para([txt(`- Tổng số: ${data.students.length} sinh viên`, false)], AlignmentType.LEFT, 80, 40),
          para([txt(`+ Xuất sắc: ${counts.xuatSac} Sinh viên`, false)], AlignmentType.LEFT, 0, 40),
          para([txt(`+ Tốt:         ${counts.tot} Sinh viên`, false)], AlignmentType.LEFT, 0, 40),
          para([txt(`+ Khá:         ${counts.kha} Sinh viên`, false)], AlignmentType.LEFT, 0, 40),
          para([txt(`+ Trung bình:  ${counts.trungBinh} Sinh viên`, false)], AlignmentType.LEFT, 0, 40),
          para([txt(`+ Yếu:         ${counts.yeu} Sinh viên`, false)], AlignmentType.LEFT, 0, 120),
          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BienBan_HoiDong_${(data.lop || 'lop').replace(/\s+/g, '_')}.docx`);
}

export function exportBienBanHoiDongExcel(data: BienBanHoiDongFormData) {
  const counts = getClassificaionCounts(data.students);
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['HỌC VIỆN HÀNH CHÍNH', '', '', 'Phụ lục 01', '', '', '', ''],
    ['VÀ QUẢN TRỊ CÔNG', '', '', 'ĐẢNG CỘNG SẢN VIỆT NAM', '', '', '', ''],
    ['PHÂN HIỆU HỌC VIỆN', '', '', '', '', '', '', ''],
    ['HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', '', '', '', '', '', '', ''],
    ['TẠI THÀNH PHỐ ĐÀ NẴNG', '', '', '', '', '', '', ''],
    ['*', '', '', '', '', '', '', ''],
    [],
    [`KHOA: ${data.khoa || '................................'}`, '', '', `Đà Nẵng, ngày ${data.ngayHop || '......'} tháng ${data.thangHop || '.....'} năm 20${data.namHop || '....'}`, '', '', '', ''],
    // Row 6 (Index 5)
    ['BIÊN BẢN HỌP HỘI ĐỒNG', '', '', '', '', '', '', ''],
    // Row 7 (Index 6)
    [`Về việc đánh giá kết quả rèn luyện của sinh viên lớp ${data.lop || '................................'}`, '', '', '', '', '', '', ''],
    // Row 8 (Index 7)
    [`học kỳ: ${data.hocKy || '.........'} năm học: ${data.namHoc || '..........'}`, '', '', '', '', '', '', ''],
    // Row 9 (Index 8)
    ['----------', '', '', '', '', '', '', ''],
    // Row 10 (Index 9)
    [`I. Thời gian: Cuộc họp bắt đầu vào hồi ${data.gioBatDau || '..........'} ngày ${data.ngayHop || '......'}/${data.thangHop || '.....'}/20${data.namHop || '....'}`, '', '', '', '', '', '', ''],
    // Row 11 (Index 10)
    [`II. Địa điểm: ${data.diaDiem || '....................................................................'}`, '', '', '', '', '', '', ''],
    // Row 12 (Index 11)
    ['III. Thành phần:', '', '', '', '', '', '', ''],
    // Row 13 (Index 12)
    [`Thành viên Hội đồng đánh giá kết quả rèn luyện cấp Khoa (QĐ số ${data.qdSo || '.........'} ngày ${data.qdNgay || '......'}`, '', '', '', '', '', '', ''],
    // Row 14 (Index 13)
    [`tháng ${data.qdThang || '.....'} năm ${data.qdNam || '........'})`, '', '', '', '', '', '', ''],
    // Row 15 (Index 14)
    [`Tổng số: ${data.tongSoHoiDong || '..........'} người`, '', '', '', '', '', '', ''],
    // Row 16 (Index 15)
    [`Số người dự họp: ${data.duHopHoiDong || '..........'} người, vắng họp: ${data.vangHoiDong || '..........'}, lý do vắng họp: ${data.lyDoVangHoiDong || '..........'}`, '', '', '', '', '', '', ''],
    // Row 17 (Index 16)
    [`Mời dự: ${data.moiDu || '....................................................................'}`, '', '', '', '', '', '', ''],
    // Row 18 (Index 17)
    [`Chủ tọa: ${data.chuToa || '....................................................................'}`, '', '', '', '', '', '', ''],
    // Row 19 (Index 18)
    [`Thư ký: ${data.thuKy || '....................................................................'}`, '', '', '', '', '', '', ''],
    // Row 20 (Index 19)
    ['IV. Nội dung', '', '', '', '', '', '', ''],
    // Row 21 (Index 20)
    [`Đánh giá kết quả rèn luyện của sinh viên lớp ${data.lop || '..........'} thuộc Khoa ${data.khoa || '....................'},`, '', '', '', '', '', '', ''],
    // Row 22 (Index 21)
    [`học kỳ: ${data.hocKy || '.........'} năm học: ${data.namHoc || '..........'}`, '', '', '', '', '', '', ''],
    // Row 23 (Index 22)
    ['Căn cứ biên bản họp lớp, ý kiến của các thành viên tham dự cuộc họp, đối chiếu với', '', '', '', '', '', '', ''],
    // Row 24 (Index 23)
    ['Quy chế của Bộ Giáo dục Đào tạo và quy định của Học viện, Hội đồng đánh giá kết quả', '', '', '', '', '', '', ''],
    // Row 25 (Index 24)
    [`rèn luyện Khoa nhất trí đánh giá kết quả rèn luyện của sinh viên lớp ${data.lop || '....................'}`, '', '', '', '', '', '', ''],
    // Row 26 (Index 25)
    ['như sau:', '', '', '', '', '', '', ''],
    // Row 27 (Index 26)
    ['', '', '', '', '', '', '', ''],
    // Row 28 (Index 27) - Header Top
    ['STT', 'Mã số SV', 'Họ và Tên', 'Ngày sinh', 'ĐRL lớp đánh giá', 'ĐRL HĐ Khoa ĐG', 'Xếp loại', 'Ghi chú (kèm theo minh chứng đối với những SV xếp loại: loại XS, tốt, TB, Yếu, kém)'],
    // Row 29 (Index 28) - Header Bottom (Merged with 28)
    ['', '', '', '', '', '', '', ''],
    // Row 30+ (Index 29+) - Student Rows
    ...data.students.map((s) => [
      s.stt,
      s.maSV,
      s.hoTen,
      s.ngaySinh,
      s.drlLop > 0 ? s.drlLop : '',
      s.drlKhoa > 0 ? s.drlKhoa : '',
      s.xepLoai,
      s.ghiChu,
    ]),
    [],
    [`- Tổng số: ${data.students.length} sinh viên`],
    [`+ Xuất sắc: ${counts.xuatSac} sinh viên`],
    [`+ Tốt: ${counts.tot} sinh viên`],
    [`+ Khá: ${counts.kha} sinh viên`],
    [`+ Trung bình: ${counts.trungBinh} sinh viên`],
    [`+ Yếu: ${counts.yeu} sinh viên`],
    [],
    ['', 'THƯ KÝ', '', '', '', 'CHỦ TỊCH HỘI ĐỒNG', '', ''],
    ['', '(Ký và ghi rõ họ tên)', '', '', '', '(Ký và ghi rõ họ tên)', '', ''],
    [],
    [],
    ['', data.tenThuKy || data.thuKy || '', '', '', '', data.chuTichHoiDong || data.truongKhoa || '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },  // A - STT
    { wch: 15 }, // B - Mã số SV
    { wch: 28 }, // C - Họ và Tên
    { wch: 14 }, // D - Ngày sinh
    { wch: 14 }, // E - ĐRL lớp đánh giá
    { wch: 14 }, // F - ĐRL HĐ Khoa ĐG
    { wch: 14 }, // G - Xếp loại
    { wch: 35 }, // H - Ghi chú
  ];

  ws['!merges'] = [
    // Header Row 1-2
    { s: { r: 0, c: 0 }, e: { r: 1, c: 2 } }, // A1:C2 PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH...
    { s: { r: 0, c: 3 }, e: { r: 0, c: 7 } }, // D1:H1 ĐẢNG CỘNG SẢN VIỆT NAM
    // Row 3
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // A3:C3 KHOA:...
    { s: { r: 2, c: 3 }, e: { r: 2, c: 7 } }, // D3:H3 Đà Nẵng, ngày...
    // Row 4
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // A4:C4 *
    // Row 6-9 Title
    { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }, // A6:H6 BIÊN BẢN HỌP HỘI ĐỒNG
    { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } }, // A7:H7 Về việc đánh giá...
    { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } }, // A8:H8 học kỳ... năm học...
    { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } }, // A9:H9 ----------
    // Row 10-26 Sections
    { s: { r: 9, c: 0 }, e: { r: 9, c: 7 } },   // A10:H10 I. Thời gian...
    { s: { r: 10, c: 0 }, e: { r: 10, c: 7 } }, // A11:H11 II. Địa điểm...
    { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } }, // A12:H12 III. Thành phần...
    { s: { r: 12, c: 0 }, e: { r: 12, c: 7 } }, // A13:H13 Thành viên HĐ...
    { s: { r: 13, c: 0 }, e: { r: 13, c: 7 } }, // A14:H14 tháng... năm...
    { s: { r: 14, c: 0 }, e: { r: 14, c: 7 } }, // A15:H15 Tổng số...
    { s: { r: 15, c: 0 }, e: { r: 15, c: 7 } }, // A16:H16 Số người dự họp...
    { s: { r: 16, c: 0 }, e: { r: 16, c: 7 } }, // A17:H17 Mời dự...
    { s: { r: 17, c: 0 }, e: { r: 17, c: 7 } }, // A18:H18 Chủ tọa...
    { s: { r: 18, c: 0 }, e: { r: 18, c: 7 } }, // A19:H19 Thư ký...
    { s: { r: 19, c: 0 }, e: { r: 19, c: 7 } }, // A20:H20 IV. Nội dung
    { s: { r: 20, c: 0 }, e: { r: 20, c: 7 } }, // A21:H21 Đánh giá kết quả...
    { s: { r: 21, c: 0 }, e: { r: 21, c: 7 } }, // A22:H22 học kỳ... năm học...
    { s: { r: 22, c: 0 }, e: { r: 22, c: 7 } }, // A23:H23 Căn cứ biên bản...
    { s: { r: 23, c: 0 }, e: { r: 23, c: 7 } }, // A24:H24 Quy chế...
    { s: { r: 24, c: 0 }, e: { r: 24, c: 7 } }, // A25:H25 rèn luyện Khoa...
    { s: { r: 25, c: 0 }, e: { r: 25, c: 7 } }, // A26:H26 như sau:
    // Row 28-29 Table Header
    { s: { r: 27, c: 0 }, e: { r: 28, c: 0 } }, // A28:A29 STT
    { s: { r: 27, c: 1 }, e: { r: 28, c: 1 } }, // B28:B29 Mã số SV
    { s: { r: 27, c: 2 }, e: { r: 28, c: 2 } }, // C28:C29 Họ và Tên
    { s: { r: 27, c: 3 }, e: { r: 28, c: 3 } }, // D28:D29 Ngày sinh
    { s: { r: 27, c: 4 }, e: { r: 28, c: 4 } }, // E28:E29 ĐRL lớp đánh giá
    { s: { r: 27, c: 5 }, e: { r: 28, c: 5 } }, // F28:F29 ĐRL HĐ Khoa ĐG
    { s: { r: 27, c: 6 }, e: { r: 28, c: 6 } }, // G28:G29 Xếp loại
    { s: { r: 27, c: 7 }, e: { r: 28, c: 7 } }, // H28:H29 Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bien_Ban_Hoi_Dong');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `BienBan_HoiDong_${(data.lop || 'lop').replace(/\s+/g, '_')}.xlsx`
  );
}
